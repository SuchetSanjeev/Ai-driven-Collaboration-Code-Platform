// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmLxH3U_tuo-VTFzaBa7Rdd6fjMMddDqY",
  authDomain: "ai-driven-collaborative-a33b6.firebaseapp.com",
  projectId: "ai-driven-collaborative-a33b6",
  storageBucket: "ai-driven-collaborative-a33b6.firebasestorage.app",
  messagingSenderId: "506057459646",
  appId: "1:506057459646:web:f14c5d0223428795191bef",
  measurementId: "G-1FG5F8PHT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase Authentication
export const auth = getAuth(app);

export const db = getFirestore(app); // <-- Initialize and export db
