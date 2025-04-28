// js/gallery.js

import { db } from './firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

const gallerySection = document.getElementById("galleryItems");
let galleryItems = [];

// Load Gallery
window.loadGallery = async function () {
  gallerySection.innerHTML = '';
  galleryItems = [];

  try {
    const snaps = await getDocs(collection(db, "gallery"));
    snaps.forEach(docSnap => {
      const d = docSnap.data();
      d.id = docSnap.id;
      galleryItems.push(d);
    });

    renderGallery(galleryItems);

  } catch (error) {
    console.error("Error loading gallery: ", error);
    alert("Error loading gallery. Please try again.");
  }
};

// Render Gallery Items
function renderGallery(items) {
  gallerySection.innerHTML = '';

  items.forEach(d => {
    gallerySection.innerHTML += `
      <div class="gallery-card">
        <strong>${d.uploadedBy}</strong> • <em>${d.club}</em>
        <p>${d.caption || "No caption"}</p>
        ${d.type === "video"
          ? `<video controls width="100%" style="border-radius:12px; cursor:pointer;" onclick="openLightbox('${d.url}', '${d.type}')"><source src="${d.url}"></video>`
          : `<img src="${d.url}" width="100%" style="border-radius:12px; cursor:pointer;" onclick="openLightbox('${d.url}', '${d.type}')" />`}
      </div>
    `;
  });
}

// Lightbox open
window.openLightbox = function (url, type) {
  const overlay = document.getElementById("lightboxOverlay");
  const content = document.getElementById("lightboxContent");

  if (type === "video") {
    content.innerHTML = `
      <video controls autoplay style="max-width:90vw; max-height:90vh;">
        <source src="${url}">
      </video>
    `;
  } else {
    content.innerHTML = `<img src="${url}" style="max-width:90vw; max-height:90vh;" />`;
  }

  overlay.style.display = "flex";
};

// Lightbox close
window.closeLightbox = function () {
  document.getElementById("lightboxOverlay").style.display = "none";
};

// Search Gallery by caption
window.searchGallery = function () {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filteredItems = galleryItems.filter(item =>
    (item.caption || "").toLowerCase().includes(query)
  );

  renderGallery(filteredItems);
};

// Auto load
window.onload = () => {
  loadGallery();
};