// js/admin-gallery.js

import { db, storage, auth } from './firebase.js';
import { collection, addDoc, deleteDoc, doc, getDocs } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js';
import { logoutUser, checkUser } from './auth.js';

const input = document.getElementById('mediaInput');
const gallery = document.getElementById('galleryItems');
let selectedToDelete = [];

checkUser(user => {
  if (!user || user.role !== "admin") {
    window.location.href = "login.html"; // Only allow admin
  }
});

// Upload Selected Files
window.uploadSelected = async function () {
  const files = input.files;
  const caption = document.getElementById("caption").value;
  const club = document.getElementById("clubTag").value || "General";

  if (files.length === 0) return alert("Please select files to upload!");

  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "gallery"), {
        url,
        caption,
        club,
        uploadedBy: auth.currentUser?.email || "admin",
        uploaderId: auth.currentUser?.uid || "admin",
        type: file.type.startsWith("video") ? "video" : "image",
        timestamp: new Date().toISOString()
      });
    });

    await Promise.all(uploadPromises);

    alert("All files uploaded successfully!");
    loadGallery();

  } catch (error) {
    console.error("Upload error:", error);
    alert("Error uploading files. Try again.");
  }
};

// Load Gallery
window.loadGallery = async function () {
  gallery.innerHTML = "";
  selectedToDelete = [];

  try {
    const snaps = await getDocs(collection(db, "gallery"));
    snaps.forEach(docSnap => {
      const d = docSnap.data();
      d.id = docSnap.id;

      gallery.innerHTML += `
        <div class="gallery-card">
          <input type="checkbox" onchange="toggleDelete('${d.id}', this.checked)" />
          <strong>${d.uploadedBy}</strong> • <em>${d.club}</em>
          <p>${d.caption}</p>
          ${d.type === "video"
            ? `<video controls width="100%"><source src="${d.url}"></video>`
            : `<img src="${d.url}" width="100%" style="border-radius:12px;" />`}
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading gallery:", error);
    alert("Error loading gallery items.");
  }
};

// Toggle selection for delete
window.toggleDelete = function (id, isChecked) {
  if (isChecked) {
    selectedToDelete.push(id);
  } else {
    selectedToDelete = selectedToDelete.filter(item => item !== id);
  }
};

// Delete Selected Media
window.deleteSelected = async function () {
  if (selectedToDelete.length === 0) return alert("Select at least one item to delete!");

  try {
    const deletePromises = selectedToDelete.map(async (id) => {
      await deleteDoc(doc(db, "gallery", id));
      // (Optional) delete file from storage if you saved its path
    });

    await Promise.all(deletePromises);

    alert("Selected items deleted!");
    loadGallery();

  } catch (error) {
    console.error("Error deleting gallery items:", error);
    alert("Error deleting selected items.");
  }
};

document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);

// Auto load
window.onload = () => {
  loadGallery();
};