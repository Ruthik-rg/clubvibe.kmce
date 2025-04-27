// js/admin.js

import { db, auth } from './firebase.js';
import {
  collection, getDocs, doc, updateDoc, arrayRemove, addDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';
import { logoutUser, checkUser } from './auth.js';

checkUser(user => {
  if (!user || user.role !== "admin") {
    window.location.href = "login.html"; // Only allow admin
  }
});

// Load all clubs + members
async function loadClubs() {
  const clubTable = document.getElementById("clubTable");
  const announceSelect = document.getElementById("announceClub");

  clubTable.innerHTML = '';
  announceSelect.innerHTML = '<option value="">Select Club</option>';

  const clubsSnap = await getDocs(collection(db, "clubs"));
  const usersSnap = await getDocs(collection(db, "users"));

  clubsSnap.forEach(clubDoc => {
    const club = clubDoc.data();
    const clubId = clubDoc.id;
    const members = [];

    usersSnap.forEach(userDoc => {
      const user = userDoc.data();
      if (user.joinedClubs?.includes(clubId)) {
        members.push({ id: userDoc.id, email: user.email });
      }
    });

    const memberList = members.map(m => `
      <li>
        ${m.email}
        <button onclick="removeUserFromClub('${clubId}', '${m.id}')">Remove</button>
      </li>
    `).join('');

    clubTable.innerHTML += `
      <div class="club-card">
        <h3>${club.name}</h3>
        <p>${club.desc}</p>
        <strong>Members (${members.length}):</strong>
        <ul>${memberList || '<li>No members yet</li>'}</ul>
      </div>
    `;

    const opt = document.createElement("option");
    opt.value = clubId;
    opt.innerText = club.name;
    announceSelect.appendChild(opt);
  });
}

// Remove user from club
window.removeUserFromClub = async function (clubId, userId) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    joinedClubs: arrayRemove(clubId)
  });
  alert("User removed from club");
  loadClubs(); // Refresh
}

// Post Announcement
window.postAnnouncement = async function () {
  const clubId = document.getElementById("announceClub").value;
  const message = document.getElementById("announcementText").value;
  const dateTime = document.getElementById("announcementDate").value;

  if (!clubId || !message || !dateTime) return alert("Please fill all announcement fields!");

  await addDoc(collection(db, `announcements/${clubId}/messages`), {
    message,
    timestamp: dateTime
  });

  alert("Announcement posted!");
}

// Load Feedbacks
async function loadFeedbacks() {
  const list = document.getElementById("feedbackList");
  list.innerHTML = "";

  const feedbackSnap = await getDocs(collection(db, "feedbacks"));

  feedbackSnap.forEach(doc => {
    const data = doc.data();
    list.innerHTML += `
      <div class="feedback-card">
        <strong>${data.name || "Anonymous"} (${data.userEmail || "?"})</strong>
        <em>${data.club || "General"}</em>
        <p>${data.message}</p>
        <small>${new Date(data.timestamp).toLocaleString()}</small>
      </div>
    `;
  });
}

document.getElementById("logoutBtn").addEventListener("click", logoutUser);

loadClubs();
loadFeedbacks();