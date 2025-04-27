// js/firebase.js

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmLj1G96Gn82BqFA_sghHKaTay2Qcvdbk",
  authDomain: "clubvibe-kmce.firebaseapp.com",
  projectId: "clubvibe-kmce",
  storageBucket: "clubvibe-kmce.firebasestorage.app",
  messagingSenderId: "856209245389",
  appId: "1:856209245389:web:0cd89fe0562c73597c5584",
  measurementId: "G-MQT9WPZ1QX"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export modules
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);



