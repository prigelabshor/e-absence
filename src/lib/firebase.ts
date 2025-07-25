
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnGvanYJXj5VKcfgxUnWPYRJMqx8T9JgY",
  authDomain: "class-attendant-bdm6w.firebaseapp.com",
  projectId: "class-attendant-bdm6w",
  storageBucket: "class-attendant-bdm6w.firebasestorage.app",
  messagingSenderId: "170143608612",
  appId: "1:170143608612:web:d87f4711f5f628c9828db1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
