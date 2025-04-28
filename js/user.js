// user.js
import { db, auth } from './firebase.js';
import {
  collection, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { logoutUser, checkUser } from './auth.js';

let currentUser;

// Check login status
checkUser(async (user, userData) => {
  if (!user || userData.role !== 'user') {
    alert("Access denied. Only Users allowed!");
    window.location.href = "login.html";
  }
  else { // user and userData.role are defined here
    currentUser = user;
    loadClubs();
    loadMyClubs();
    loadPosters();
  }
});

// Load available clubs
function loadClubs() {
  const list = document.getElementById("clubList");
  onSnapshot(collection(db, "clubs"), snapshot => {
    list.innerHTML = "";
    snapshot.forEach(docSnap => {
      const club = docSnap.data();
      const id = docSnap.id;

      list.innerHTML += `
        <div class="club-card">
          <h4>${club.name}</h4>
          <p>${club.desc}</p>
          <button onclick="joinClub('${id}')">Join</button>
        </div>
      `;
    });
  });
}

// Join a club
window.joinClub = async function (clubId) {
  const userRef = doc(db, "users", currentUser.uid);
  await updateDoc(userRef, {
    joinedClubs: arrayUnion(clubId)
  });
  alert("Joined club!");
  loadMyClubs();
}

// Load user's joined clubs
function loadMyClubs() {
  const list = document.getElementById("joinedClubs");
  getDoc(doc(db, "users", currentUser.uid)).then(docSnap => {
    const joined = docSnap.data().joinedClubs || [];
    list.innerHTML = joined.length
      ? joined.map(id => `<div>${id} <button onclick="leaveClub('${id}')">Leave</button></div>`).join('')
      : "<p>No clubs joined yet.</p>";
  });
}

// Leave a club
window.leaveClub = async function (clubId) {
  const userRef = doc(db, "users", currentUser.uid);
  await updateDoc(userRef, {
    joinedClubs: arrayRemove(clubId)
  });
  alert("Left club!");
  loadMyClubs();
}

// Load posters for carousel
// Load posters for carousel
function loadPosters() {
  const carousel = document.getElementById("posterCarousel");
  onSnapshot(collection(db, "posters"), snapshot => {
    carousel.innerHTML = "";
    let posters = [];

    snapshot.forEach(docSnap => {
      const poster = docSnap.data();
      posters.push(`<img src="${poster.url}" class="poster-img" style="width: 100%; height: auto; border-radius: 12px;">`);
    });

    carousel.innerHTML = posters.join('');

    // Auto-slide carousel
    let current = 0;
    setInterval(() => {
      const imgs = carousel.querySelectorAll('img');
      imgs.forEach((img, idx) => {
        img.style.display = (idx === current) ? 'block' : 'none';
      });
      current = (current + 1) % imgs.length;
    }, 3000); // Change poster every 3 seconds
  });
}

// Expose logout
window.logoutUser = logoutUser;