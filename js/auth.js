// js/auth.js
// auth.js
import { db, auth } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

export const checkUser = (callback) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      const uid = user.uid;
      console.log("User signed in. User id:" + uid);
      const userRef = doc(db, "users", uid); // Assuming you have a 'users' collection
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        console.log("Document data:", userSnap.data());
        callback(user, userSnap.data()); // Pass the user data to the callback
      } else {
        console.log("No such document!");
        callback(user, {}); // User document does not exist. Pass an empty object.
      }
    } else {
      // User is signed out
      console.log("User not logged in.");
      callback(null, {}); //No user logged in. Pass an empty object.
    }
  });
};

// Logout user
export function logoutUser() {
  signOut(auth).then(() => {
    window.location.href = "login.html"; // Redirect to login after logout
  }).catch(error => {
    console.error("Logout error:", error.message);
  });
}
