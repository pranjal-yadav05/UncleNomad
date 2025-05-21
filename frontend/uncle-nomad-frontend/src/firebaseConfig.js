// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcnEPDVy1u_hD-zI-DzXX7xtcA3f232bE",
  authDomain: "uncle-nomad-c5f9a.firebaseapp.com",
  projectId: "uncle-nomad-c5f9a",
  storageBucket: "uncle-nomad-c5f9a.firebasestorage.app",
  messagingSenderId: "189010268588",
  appId: "1:189010268588:web:c850b687fd729d6ec1aa09",
  measurementId: "G-VB6029FQXS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Auth with proper settings
const auth = getAuth(app);

// Export auth instance
export { auth }; // ✅ Export auth for authentication
