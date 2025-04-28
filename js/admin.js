import { db, auth, storage } from './firebase.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, arrayRemove
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";
import { logoutUser, checkUser } from './auth.js';

let currentUser;

// Check login status
checkUser((user, userData) => {
  if (!user || userData.role !== 'admin') {
    alert("Access denied. Only Admins allowed!");
    window.location.href = "login.html";
  }
  currentUser = user;
  loadClubs();
  loadPosters();
  loadGallery();
  loadFeedbacks();
});

// Add new club
window.addClub = async function () {
  const name = prompt("Enter Club Name:");
  const desc = prompt("Enter Club Description:");

  if (!name || !desc) {
    alert("Club name and description required.");
    return;
  }

  await addDoc(collection(db, "clubs"), {
    name,
    desc,
    createdAt: new Date().toISOString()
  });
  alert("Club created!");
  loadClubs();
};

// Load clubs and display
async function loadClubs() {
  const clubTable = document.getElementById("clubTable");
  clubTable.innerHTML = "";

  const snapshot = await getDocs(collection(db, "clubs"));
  snapshot.forEach(docSnap => {
    const club = docSnap.data();
    const id = docSnap.id;

    clubTable.innerHTML += `
      <div class="club-card">
        <h4>${club.name}</h4>
        <p>${club.desc}</p>
        <button onclick="deleteClub('${id}')">Delete Club</button>
      </div>
    `;
  });
}

// Delete a club
window.deleteClub = async function (clubId) {
  if (confirm("Delete this club?")) {
    await deleteDoc(doc(db, "clubs", clubId));
    alert("Club deleted!");
    loadClubs();
  }
};

// Upload a poster
window.addPoster = async function () {
  const fileInput = document.getElementById("posterInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("Select a poster image!");
    return;
  }

  const storageRef = ref(storage, `posters/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, "posters"), {
    url,
    uploadedBy: currentUser.email,
    timestamp: new Date().toISOString()
  });

  alert("Poster uploaded!");
  loadPosters();
};

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

// Delete poster
// Delete poster
window.deletePoster = async function (posterId, posterUrl) {
  if (confirm("Delete this poster?")) {
    await deleteDoc(doc(db, "posters", posterId));

    // To delete from Storage: we need reference differently
    const urlParts = posterUrl.split('/o/')[1].split('?')[0];
    const correctPath = decodeURIComponent(urlParts);

    const posterRef = ref(storage, correctPath);
    await deleteObject(posterRef);

    alert("Poster deleted!");
    loadPosters();
  }
};

// Load gallery items
async function loadGallery() {
  const gallerySection = document.getElementById("gallerySection");
  gallerySection.innerHTML = "";

  const snapshot = await getDocs(collection(db, "gallery"));
  snapshot.forEach(docSnap => {
    const media = docSnap.data();
    const id = docSnap.id;

    gallerySection.innerHTML += `
      <div class="gallery-card">
        ${media.type === "video"
          ? `<video src="${media.url}" controls width="100%"></video>`
          : `<img src="${media.url}" width="100%" style="border-radius:12px;">`}
        <button onclick="deleteGallery('${id}')">Delete</button>
      </div>
    `;
  });
}

// Delete gallery item
window.deleteGallery = async function (galleryId) {
  if (confirm("Delete this gallery item?")) {
    await deleteDoc(doc(db, "gallery", galleryId));
    alert("Gallery item deleted!");
    loadGallery();
  }
};

// Load Feedbacks
async function loadFeedbacks() {
  const feedbackSection = document.getElementById("feedbackSection");
  feedbackSection.innerHTML = "";

  const snapshot = await getDocs(collection(db, "feedbacks"));
  snapshot.forEach(docSnap => {
    const feedback = docSnap.data();

    feedbackSection.innerHTML += `
      <div class="feedback-card">
        <strong>${feedback.name} (${feedback.userEmail})</strong>
        <p>${feedback.message}</p>
        <small>${new Date(feedback.timestamp).toLocaleString()}</small>
      </div>
    `;
  });
}

// Expose logout
window.logoutUser = logoutUser;
