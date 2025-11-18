// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcb2166yrs6UOwvVexw7Zh6kMdRA5VVXw",
  authDomain: "herculethes2-0.firebaseapp.com",
  projectId: "herculethes2-0",
  storageBucket: "herculethes2-0.firebasestorage.app",
  messagingSenderId: "1012958658300",
  appId: "1:1012958658300:web:9ae8b79be87f3d1c252179",
  measurementId: "G-7KGWTGYYB2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// guard analytics so it doesn't explode in non-browser environments
let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, auth,db,  analytics };