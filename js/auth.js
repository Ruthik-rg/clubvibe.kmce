// js/auth.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

// Check current logged-in user
export function checkUser(callback) {
  onAuthStateChanged(auth, async user => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        callback({ ...user, role: userData.role || "user" });
      } else {
        console.error("No user document found!");
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// Logout user
export function logoutUser() {
  signOut(auth).then(() => {
    window.location.href = "login.html"; // Redirect to login after logout
  }).catch(error => {
    console.error("Logout error:", error.message);
  });
}
