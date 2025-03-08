// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyHX_UJC3Ml_6xAWCirNCWpangGpRN8e0",
  authDomain: "unclenomad-5acf1.firebaseapp.com",
  projectId: "unclenomad-5acf1",
  storageBucket: "unclenomad-5acf1.appspot.com",  // 🔹 Fixed storage bucket URL
  messagingSenderId: "693368534135",
  appId: "1:693368534135:web:a5f5c01b6d8c8fdfba8272",
  measurementId: "G-6GBMXL818E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth };  // ✅ Export auth for authentication
