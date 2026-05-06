export interface Employee {
  id: string;
  name: string;
  color: string;
  emoji: string;
  salesByWeek: number[];
}

export interface LocationData {
  id: string;
  name: string;
  employees: Employee[];
}

export interface AppData {
  locations: LocationData[];
}
