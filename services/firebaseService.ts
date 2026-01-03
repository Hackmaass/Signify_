import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { UserData } from '../types';

// Universal Safe Env Access (Works for Vite, Next.js, CRA, and Node)
const getEnv = (key: string) => {
  // 1. Try Vite (Client-side)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) { }

  // 2. Try Process Env (Next.js / CRA / Node)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) { }

  return "";
};

// Config prioritizes Environment Variables, but falls back to your provided keys
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || "AIzaSyBcO19mIR3FBu7040VobqCwjwNIYOh54Ic",
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || "signify-ef7ce.firebaseapp.com",
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || "signify-ef7ce",
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "signify-ef7ce.firebasestorage.app",
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || "420927638288",
  appId: getEnv("VITE_FIREBASE_APP_ID") || "1:420927638288:web:67268f62445187d925f395",
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID") || "G-ZKM8G6RGST"
};

// Initialize Firebase conditionally
let app;
let auth: any;
let isFirebaseInitialized = false;

try {
  // Check if config exists before initializing
  if (firebaseConfig.apiKey) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    isFirebaseInitialized = true;
  } else {
    console.warn("Firebase config missing. Running in mock mode.");
  }
} catch (error) {
  console.warn("Firebase initialization failed. Falling back to mock mode.", error);
}

const STORAGE_KEY_PREFIX = 'signify_data_';
const MOCK_SESSION_KEY = 'signify_mock_session_uid'; // Stores the current active UID in mock mode

// --- DATA MAPPING ---

const getStorageKey = (uid: string) => `${STORAGE_KEY_PREFIX}${uid}`;

const createDefaultUserData = (uid: string, displayName: string, photoURL?: string): UserData => ({
  uid,
  displayName,
  photoURL,
  streak: 0,
  lastPracticeDate: new Date(0).toISOString(),
  totalLessons: 0,
  history: {}
});

// --- HELPER: LOCAL STORAGE DB ---
const fetchOrCreateUserData = async (uid: string, displayName: string, photoURL?: string): Promise<UserData> => {
  const key = getStorageKey(uid);
  const stored = localStorage.getItem(key);

  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      displayName: displayName || parsed.displayName, // Update display name if it changed
      photoURL: photoURL || parsed.photoURL,
    };
  }

  const newUser = createDefaultUserData(uid, displayName, photoURL);
  localStorage.setItem(key, JSON.stringify(newUser));
  return newUser;
};

// --- AUTH SERVICES ---

export const registerWithEmail = async (email: string, password: string, name: string): Promise<UserData> => {
  if (!isFirebaseInitialized) return mockRegister(email, password, name);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      await updateProfile(user, {
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      });

      // Clear mock session if real login succeeds
      localStorage.removeItem(MOCK_SESSION_KEY);

      return await fetchOrCreateUserData(
        user.uid,
        name,
        user.photoURL || undefined
      );
    }
    throw new Error("User creation failed");
  } catch (error: any) {
    return handleAuthError(error, email, password, name, 'register');
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<UserData> => {
  if (!isFirebaseInitialized) return mockLogin(email, password);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Clear mock session
    localStorage.removeItem(MOCK_SESSION_KEY);

    if (user) {
      return await fetchOrCreateUserData(
        user.uid,
        user.displayName || 'Learner',
        user.photoURL || undefined
      );
    }
    throw new Error("Login failed");
  } catch (error: any) {
    return handleAuthError(error, email, password, undefined, 'login');
  }
};

// Centralized error handler to trigger mock fallback on config errors
const handleAuthError = (error: any, email: string, password: string, name: string | undefined, type: 'login' | 'register') => {
  const code = error.code || '';
  const msg = error.message || '';

  // Check for configuration errors -> Fallback to Mock
  if (
    code.includes('auth/api-key-not-valid') ||
    code.includes('auth/invalid-api-key') ||
    code.includes('auth/configuration-not-found') ||
    code.includes('auth/project-not-found') ||
    code.includes('auth/unauthorized-domain') ||
    msg.includes('api-key') ||
    msg.includes('API key')
  ) {
    console.warn("Firebase Auth Config Error. Falling back to Mock Auth.");
    return type === 'login' ? mockLogin(email, password) : mockRegister(email, password, name || 'User');
  }

  // Actual auth errors (wrong password, user not found) should NOT fallback
  throw error;
};

// --- MOCK AUTHENTICATION ---
const generateMockUid = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `mock-user-${Math.abs(hash)}`;
};

const mockRegister = async (email: string, pass: string, name: string): Promise<UserData> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const uid = generateMockUid(email);
  const photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;

  localStorage.setItem(MOCK_SESSION_KEY, uid);
  return await fetchOrCreateUserData(uid, name, photoURL);
};

const mockLogin = async (email: string, pass: string): Promise<UserData> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const uid = generateMockUid(email);

  localStorage.setItem(MOCK_SESSION_KEY, uid);

  const stored = localStorage.getItem(getStorageKey(uid));
  const name = stored ? JSON.parse(stored).displayName : 'Demo User';

  return await fetchOrCreateUserData(uid, name);
};

export const signOut = async () => {
  try {
    if (isFirebaseInitialized && auth) {
      try { await firebaseSignOut(auth); } catch (e) { console.warn(e); }
    }
    localStorage.removeItem(MOCK_SESSION_KEY);
    window.location.reload();
  } catch (error) {
    console.error("Logout Failed:", error);
  }
};

export const onAuthStateChange = (callback: (user: UserData | null) => void) => {
  // 1. Check Mock Session
  const mockUid = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockUid) {
    fetchOrCreateUserData(mockUid, 'User').then(callback);
    return () => { };
  }

  // 2. Check Firebase Session
  if (isFirebaseInitialized && auth) {
    try {
      return onAuthStateChanged(auth, async (firebaseUser: any) => {
        if (firebaseUser) {
          const userData = await fetchOrCreateUserData(firebaseUser.uid, firebaseUser.displayName || 'Learner', firebaseUser.photoURL || undefined);
          callback(userData);
        } else {
          callback(null);
        }
      }, (error: any) => {
        console.warn("Auth state error:", error);
        callback(null);
      });
    } catch (e) {
      callback(null);
      return () => { };
    }
  } else {
    callback(null);
    return () => { };
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  const mockUid = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockUid) {
    return fetchOrCreateUserData(mockUid, 'User');
  }
  if (isFirebaseInitialized && auth?.currentUser) {
    return fetchOrCreateUserData(auth.currentUser.uid, auth.currentUser.displayName || 'Learner', auth.currentUser.photoURL || undefined);
  }
  return null;
};

// --- DB UPDATE SERVICES ---

export const updateStreak = async (user: UserData): Promise<UserData> => {
  const today = new Date().toISOString().split('T')[0];

  if (user.history[today]) {
    return user;
  }

  const newHistory = { ...user.history, [today]: true };
  const lastDate = user.lastPracticeDate.split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = user.streak;
  if (lastDate === yesterday) {
    newStreak += 1;
  } else if (lastDate !== today) {
    newStreak = 1;
  }
  if (newStreak === 0) newStreak = 1;

  const updatedUser: UserData = {
    ...user,
    streak: newStreak,
    lastPracticeDate: new Date().toISOString(),
    totalLessons: user.totalLessons + 1,
    history: newHistory
  };

  const key = getStorageKey(user.uid);
  localStorage.setItem(key, JSON.stringify(updatedUser));

  return updatedUser;
};