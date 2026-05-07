import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppData, Employee, LocationData } from './types';
import { loadAppData, saveAppData } from './storage';

const horseColors = ['#6b211a', '#881337', '#92400e', '#7a5230', '#4f3322', '#14532d', '#7c0a02', '#a91f1f'];
const weekCount = 12;
const weekLabels = Array.from({ length: weekCount }, (_, index) => `Week ${index + 1}`);
const AdminPassword = 'Safilo2026';

function createEmployee(name: string, index: number): Employee {
  return {
    id: crypto.randomUUID(),
    name,
    color: horseColors[index % horseColors.length],
    salesByWeek: Array(weekCount).fill(0)
  };
}

function createLocation(name: string): LocationData {
  return {
    id: crypto.randomUUID(),
    name,
    employees: []
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getEmployeeTotal(employee: Employee) {
  return employee.salesByWeek.reduce((sum, value) => sum + value, 0);
}

export default function App() {
  const [data, setData] = useState<AppData>({ locations: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newEmployeeByLocation, setNewEmployeeByLocation] = useState<Record<string, string>>({});
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'weekly'>('dashboard');
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    loadAppData().then((result) => {
      if (active) {
        setData(result.data);
        setUsingLocalFallback(result.usingLocalFallback);
        setIsLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveAppData(data);
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [data, isLoaded]);

  const trackEnd = useMemo(() => {
    const maxTotal = Math.max(0, ...data.locations.flatMap((location) => location.employees.map((employee) => getEmployeeTotal(employee))));
    let end = 300;
    while (maxTotal >= end * 0.9) {
      end += 50;
    }
    return end;
  }, [data]);

  const handleAdminLogin = (event: FormEvent) => {
    event.preventDefault();
    if (username.trim().toLowerCase() !== 'admin' || password !== AdminPassword) {
      setAdminError('Incorrect admin credentials.');
      return;
    }
    setAdminError('');
    setPassword('');
    setIsAdmin(true);
    setAdminModalOpen(false);
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  const updateLocationName = (name: string) => {
    if (!name.trim()) return;
    const location = createLocation(name.trim());
    setData((current) => ({ ...current, locations: [...current.locations, location] }));
    setNewLocationName('');
  };

  const addEmployee = (locationId: string) => {
    const name = newEmployeeByLocation[locationId]?.trim();
    if (!name) return;
    setData((current) => ({
      ...current,
      locations: current.locations.map((location) =>
        location.id === locationId
          ? {
              ...location,
              employees: [...location.employees, createEmployee(name, location.employees.length)]
            }
          : location
      )
    }));
    setNewEmployeeByLocation((prev) => ({ ...prev, [locationId]: '' }));
  };

  const deleteLocation = (locationId: string) => {
    if (!window.confirm('Delete this location and all employees?')) return;
    setData((current) => ({
      ...current,
      locations: current.locations.filter((location) => location.id !== locationId)
    }));
  };

  const deleteEmployee = (locationId: string, employeeId: string) => {
    if (!window.confirm('Delete this employee?')) return;
    setData((current) => ({
      ...current,
      locations: current.locations.map((location) =>
        location.id === locationId
          ? {
              ...location,
              employees: location.employees.filter((employee) => employee.id !== employeeId)
            }
          : location
      )
    }));
  };

  const updateWeeklySales = (locationId: string, employeeId: string, weekIndex: number, rawValue: string) => {
    const value = Number(rawValue);
    if (Number.isNaN(value) || value < 0) return;
    setData((current) => ({
      ...current,
      locations: current.locations.map((location) =>
        location.id === locationId
          ? {
              ...location,
              employees: location.employees.map((employee) =>
                employee.id === employeeId
                  ? {
                      ...employee,
                      salesByWeek: employee.salesByWeek.map((weekSales, index) =>
                        index === weekIndex ? value : weekSales
                      )
                    }
                  : employee
              )
            }
          : location
      )
    }));
  };

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <h1>Normandy Optical</h1>
          <p>Safilo Sales Competition Dashboard</p>
        </div>
        <div className="hero-actions">
          {isAdmin && (
            <button className="secondary admin-button" onClick={handleLogout}>
              Logout
            </button>
          )}
          <button className="admin-button" onClick={() => setAdminModalOpen(true)}>
            {isAdmin ? 'Admin active' : 'Login as admin'}
          </button>
        </div>
      </header>

      {usingLocalFallback && (
        <div className="warning-slideout">
          <div>
            <strong>Local persistence active</strong>
            <p>Firebase is not configured or could not be reached, so this data is stored only in this browser.</p>
          </div>
        </div>
      )}
      <div className="tab-bar">
        <button
          className={`tab-button ${selectedTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setSelectedTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${selectedTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setSelectedTab('weekly')}
        >
          Weekly sales entry
        </button>
      </div>

      {selectedTab === 'dashboard' ? (
        <>
          {isAdmin && (
            <section className="admin-panel">
              <h2>Admin controls</h2>
              <div className="admin-row">
                <label>
                  New location name
                  <input
                    value={newLocationName}
                    onChange={(event) => setNewLocationName(event.target.value)}
                    placeholder="Add a location"
                  />
                </label>
                <button onClick={() => updateLocationName(newLocationName)}>Add location</button>
              </div>
              {data.locations.length === 0 && <p className="hint">Add a store location first to begin adding employees.</p>}
            </section>
          )}

          <main className="track-list">
            {data.locations.length === 0 ? (
              <div className="empty-state">
                <h2>No locations yet</h2>
                <p>Log in as admin and add a new location to start tracking Safilo sales.</p>
              </div>
            ) : (
              data.locations.map((location) => (
                <section key={location.id} className="track-lane">
                  <div className="lane-header">
                    <div>
                      <h3>{location.name}</h3>
                      <p>{location.employees.length} employee(s)</p>
                    </div>
                    {isAdmin ? (
                      <div className="admin-row lane-add">
                        <input
                          value={newEmployeeByLocation[location.id] ?? ''}
                          onChange={(event) =>
                            setNewEmployeeByLocation((prev) => ({ ...prev, [location.id]: event.target.value }))
                          }
                          placeholder="New employee name"
                        />
                        <button onClick={() => addEmployee(location.id)}>Add employee</button>
                        <button className="secondary delete-button" onClick={() => deleteLocation(location.id)}>
                          Delete location
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="track-bar">
                    <div className="finish-line">🏁</div>
                    {location.employees.length === 0 && (
                      <div className="empty-lane">No horses yet. Add employees to show them on the track.</div>
                    )}
                    {location.employees.map((employee) => {
                      const positionPct = Math.min((getEmployeeTotal(employee) / trackEnd) * 100, 98);
                      return (
                        <div className="horse-row" key={employee.id}>
                          <div className="horse-label" style={{ background: employee.color }}>
                            <span className="horse-emoji" style={{ transform: 'scaleX(-1)' }}>🏇</span>
                            <div>
                              <strong>{employee.name}</strong>
                              <div>{getEmployeeTotal(employee)} total sales</div>
                            </div>
                            {isAdmin && (
                              <button className="secondary delete-button" onClick={() => deleteEmployee(location.id, employee.id)}>
                                Delete
                              </button>
                            )}
                          </div>
                          <div className="track-rail">
                            <div className="track-progress" style={{ width: `${positionPct}%` }}></div>
                            <span className="horse-puppet" style={{ left: `${positionPct}%` }}>🏇</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </main>
        </>
      ) : (
        <section className="sales-panel">
          <div className="sales-panel-header">
            <div>
              <h2>Weekly sales entry</h2>
              <p>Use Week 1–12 to enter employee sales by location. Changes save automatically.</p>
            </div>
            {!isAdmin && <div className="hint">Log in as admin to edit weekly sales.</div>}
          </div>

          {data.locations.length === 0 ? (
            <div className="empty-state">
              <h2>No locations available</h2>
              <p>Add a location first in the Dashboard tab.</p>
            </div>
          ) : (
            data.locations.map((location) => (
              <section key={location.id} className="sales-location-card">
                <div className="lane-header">
                  <div>
                    <h3>{location.name}</h3>
                    <p>{location.employees.length} employee(s)</p>
                  </div>
                  {isAdmin && (
                    <button className="secondary delete-button" onClick={() => deleteLocation(location.id)}>
                      Delete location
                    </button>
                  )}
                </div>
                <div className="sales-table-wrap">
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        {weekLabels.map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {location.employees.length === 0 ? (
                        <tr>
                          <td colSpan={weekLabels.length + 2} className="empty-cell">
                            No employees in this location yet.
                          </td>
                        </tr>
                      ) : (
                        location.employees.map((employee) => (
                          <tr key={employee.id}>
                            <td className="employee-name">
                              <span className="horse-emoji">🏇</span>
                              {employee.name}
                              {isAdmin && (
                                <button className="secondary delete-button" onClick={() => deleteEmployee(location.id, employee.id)}>
                                  Delete
                                </button>
                              )}
                            </td>
                            {employee.salesByWeek.map((value, weekIndex) => (
                              <td key={weekIndex}>
                                <input
                                  type="number"
                                  min="0"
                                  value={String(value)}
                                  disabled={!isAdmin}
                                  onChange={(event) =>
                                    updateWeeklySales(location.id, employee.id, weekIndex, event.target.value)
                                  }
                                />
                              </td>
                            ))}
                            <td>{getEmployeeTotal(employee)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </section>
      )}

      {adminModalOpen && (
        <div className="modal-backdrop" onClick={() => setAdminModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Admin login</h2>
            <form onSubmit={handleAdminLogin}>
              <label>
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              {adminError && <div className="error-text">{adminError}</div>}
              <div className="modal-actions">
                <button type="submit">Login</button>
                <button type="button" className="secondary" onClick={() => setAdminModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
