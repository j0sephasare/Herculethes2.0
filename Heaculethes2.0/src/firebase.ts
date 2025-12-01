// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to read required Vite envs with a clear error if missing
function req(name: string) {
  const v = import.meta.env[name as keyof ImportMetaEnv] as string | undefined;
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

const firebaseConfig = {
  apiKey: req("VITE_FIREBASE_API_KEY"),
  authDomain: req("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: req("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: req("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: req("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: req("VITE_FIREBASE_APP_ID"),
  // Optional
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Guard analytics so it doesn't explode in non-browser envs
let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  analytics = getAnalytics(app);
}

export { app, auth, db, storage, analytics };
