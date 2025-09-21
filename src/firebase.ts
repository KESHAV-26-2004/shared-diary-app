// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4FS0buQOOMpmLuaNiZ26P6PIhtV7qjuk",
  authDomain: "shared-diary-app-659d6.firebaseapp.com",
  projectId: "shared-diary-app-659d6",
  storageBucket: "shared-diary-app-659d6.appspot.com",
  messagingSenderId: "1097560633952",
  appId: "1:1097560633952:web:YOUR_APP_ID" // Replace with your actual appId if available
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
