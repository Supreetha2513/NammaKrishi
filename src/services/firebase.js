import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('Firebase configuration is incomplete. Missing fields:', missingFields);
  console.error('Current config:', firebaseConfig);
  throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
}

console.log('Firebase configuration loaded successfully', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

// Initialize Firebase
let app;
let authInitialized = false;
let dbInitialized = false;
let storageInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase app:', error);
  throw new Error(`Failed to initialize Firebase: ${error.message}`);
}

// Initialize Firebase services with error handling
let auth;
try {
  auth = getAuth(app);
  authInitialized = true;
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Auth:', error);
  // Don't throw, allow graceful degradation
}

let db;
try {
  db = getFirestore(app);
  dbInitialized = true;
  console.log('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Firestore:', error);
}

let storage;
try {
  storage = getStorage(app);
  storageInitialized = true;
  console.log('Firebase Storage initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Storage:', error);
}

// Initialize messaging (only in browser with service worker support)
let messaging = null;
if ('serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
    console.log('Firebase Messaging initialized successfully');
  } catch (error) {
    console.log('Firebase Messaging not available:', error.message);
  }
}

// Export services
export { auth, db, storage, messaging, app };
export default app;
