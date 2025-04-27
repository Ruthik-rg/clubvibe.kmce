 // js/user.js

import { db, auth } from './firebase.js';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';
import { logoutUser, checkUser } from './auth.js';

let currentUser;

checkUser(async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  loadPosters();
  loadClubs();
  loadMyClubs();
});

// Load Carousel Posters
// Load Posters Carousel
function loadPosters() {
  const carouselInner = document.getElementById("carouselInner");

  onSnapshot(collection(db, "posters"), snapshot => {
    carouselInner.innerHTML = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      carouselInner.innerHTML += `
        <div class="carousel-item">
          <img src="${data.url}" class="poster" alt="poster" />
        </div>
      `;
    });

    startCarouselAutoScroll(); // Start moving after loading
  });
}

// Auto Move Carousel
function startCarouselAutoScroll() {
  const container = document.querySelector(".carousel-inner");
  let scrollAmount = 0;

  setInterval(() => {
    scrollAmount += 1;
    if (scrollAmount >= container.scrollWidth - container.clientWidth) {
      scrollAmount = 0; // Reset to start
    }
    container.scrollTo({
      left: scrollAmount,
      behavior: "smooth"
    });
  }, 30); // Adjust speed by changing milliseconds
}

// Load Clubs to Join
function loadClubs() {
  const container = document.getElementById("clubsContainer");
  onSnapshot(collection(db, "clubs"), snapshot => {
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      container.innerHTML += `
        <div class="club-card">
          <h3>${data.name}</h3>
          <p>${data.desc}</p>
          <button onclick="joinClub('${doc.id}')">Join</button>
        </div>
      `;
    });
  });
}

// Join a Club
window.joinClub = async function (clubId) {
  const userRef = doc(db, "users", currentUser.uid);
  await updateDoc(userRef, {
    joinedClubs: arrayUnion(clubId)
  });
  alert("Successfully joined club!");
  loadMyClubs();
}

// Load My Clubs and Announcements
function loadMyClubs() {
  const section = document.getElementById("joinedClubs");
  getDoc(doc(db, "users", currentUser.uid)).then(docSnap => {
    const joined = docSnap.data().joinedClubs || [];
    section.innerHTML = joined.length
      ? joined.map(id => `<div>${id}</div>`).join('')
      : "<p>No clubs joined yet.</p>";

    loadAnnouncements(joined);
  });
}

// Load Club Announcements
function loadAnnouncements(clubIds) {
  const list = document.getElementById("announcementList");
  list.innerHTML = '';

  clubIds.forEach(async (clubId) => {
    const announcementsRef = collection(db, `announcements/${clubId}/messages`);
    const snapshot = await getDocs(announcementsRef);

    snapshot.forEach(doc => {
      const data = doc.data();
      list.innerHTML += `
        <div class="announcement-card">
          <strong>${clubId}</strong>
          <p>${data.message}</p>
          <small>${new Date(data.timestamp).toLocaleString()}</small>
        </div>
      `;
    });
  });
}

// Tab Switch
window.switchTab = function (tab) {
  if (tab === "myClubs") {
    document.getElementById("clubList").style.display = "none";
    document.getElementById("myClubs").style.display = "block";
  } else {
    document.getElementById("clubList").style.display = "block";
    document.getElementById("myClubs").style.display = "none";
  }
};

// Logout
document.getElementById("logoutBtn").addEventListener("click", logoutUser);