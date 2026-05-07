import { initializeApp, getApps } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { AppData } from './types';

const STORAGE_KEY = 'sales-tracker-data-v1';
const FIRESTORE_COLLECTION = 'salesTracker';
const FIRESTORE_DOC = 'appData';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const FIREBASE_ENABLED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
console.log('[Storage] Firebase config loaded:', {
  FIREBASE_ENABLED,
  hasApiKey: Boolean(firebaseConfig.apiKey),
  hasProjectId: Boolean(firebaseConfig.projectId),
  hasAppId: Boolean(firebaseConfig.appId),
  projectId: firebaseConfig.projectId || 'undefined'
});
const defaultData: AppData = {
  locations: []
};

function migrateEmployeeData(employee: any): any {
  // Strip old emoji field if present, it's no longer used
  const { emoji, ...rest } = employee;
  return rest;
}

function getFirestoreClient() {
  if (!FIREBASE_ENABLED) {
    return null;
  }

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return getFirestore(app);
}

export async function loadAppData(): Promise<{ data: AppData; usingLocalFallback: boolean }> {
  if (typeof window === 'undefined') {
    return { data: defaultData, usingLocalFallback: false };
  }

  const db = getFirestoreClient();
  console.log('[Storage] loadAppData: db =', db ? 'connected' : 'null (Firebase not enabled)');
  
  if (db) {
    try {
      console.log('[Storage] Attempting Firestore read from', FIRESTORE_COLLECTION + '/' + FIRESTORE_DOC);
      const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC));
      console.log('[Storage] Firestore read succeeded, doc exists:', snapshot.exists());
      if (snapshot.exists()) {
        console.log('[Storage] Using Firestore data');
        const data = snapshot.data() as AppData;
        // Migrate employee data to strip old emoji field
        const migratedData = {
          ...data,
          locations: data.locations.map(loc => ({
            ...loc,
            employees: loc.employees.map(migrateEmployeeData)
          }))
        };
        return { data: migratedData, usingLocalFallback: false };
      }
    } catch (error) {
      console.warn('Firestore load failed, falling back to local storage:', error);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as AppData;
      // Migrate employee data to strip old emoji field
      const migratedData = {
        ...data,
        locations: data.locations.map(loc => ({
          ...loc,
          employees: loc.employees.map(migrateEmployeeData)
        }))
      };
      return { data: migratedData, usingLocalFallback: true };
    }
  } catch (error) {
    console.error('Failed to load saved data:', error);
  }

  return { data: defaultData, usingLocalFallback: true };
}

export async function saveAppData(data: AppData) {
  if (typeof window === 'undefined') {
    return;
  }

  const db = getFirestoreClient();
  if (db) {
    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC), data);
    } catch (error) {
      console.warn('Firestore save failed:', error);
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
}
