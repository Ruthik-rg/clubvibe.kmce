// admin.js - Complete implementation
import { db, auth, storage } from './firebase.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc, 
  arrayRemove, onSnapshot, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";
import { logoutUser, checkUser } from './auth.js';

let currentUser;

// Check login status
checkUser((user, userData) => {
  if (!user || userData.role !== 'admin') {
    alert("Access denied. Only Admins allowed!");
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  loadClubs();
  loadFeedbacks();
  populateClubDropdown();
  loadPosters();

  // Set up logout button
  document.getElementById("logoutBtn").addEventListener("click", logoutUser);
});

// Add new club
window.addClub = async function () {
  const name = prompt("Enter Club Name:");
  const desc = prompt("Enter Club Description:");

  if (!name || !desc) {
    alert("Club name and description required.");
    return;
  }

  try {
    await addDoc(collection(db, "clubs"), {
      name,
      desc,
      createdAt: new Date().toISOString()
    });
    alert("Club created!");
    loadClubs();
    populateClubDropdown(); // Update the dropdown too
  } catch (error) {
    console.error("Error adding club:", error);
    alert("Failed to create club: " + error.message);
  }
};

// Load clubs and display
async function loadClubs() {
  const clubTable = document.getElementById("clubTable");
  clubTable.innerHTML = `
    <div class="admin-action-button">
      <button onclick="addClub()">Add New Club</button>
    </div>
  `;

  try {
    const snapshot = await getDocs(collection(db, "clubs"));
    if (snapshot.empty) {
      clubTable.innerHTML += "<p>No clubs created yet.</p>";
      return;
    }
    
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
  } catch (error) {
    console.error("Error loading clubs:", error);
    clubTable.innerHTML += "<p>Error loading clubs. Please try again.</p>";
  }
}

// Delete a club
window.deleteClub = async function (clubId) {
  if (confirm("Delete this club? This will also remove all associated announcements.")) {
    try {
      // Delete the club document
      await deleteDoc(doc(db, "clubs", clubId));
      
      // Delete all announcements for this club
      const announcementsQuery = query(collection(db, "announcements"), where("clubId", "==", clubId));
      const announcementsSnapshot = await getDocs(announcementsQuery);
      
      const deletePromises = [];
      announcementsSnapshot.forEach(docSnap => {
        deletePromises.push(deleteDoc(doc(db, "announcements", docSnap.id)));
      });
      
      await Promise.all(deletePromises);
      
      alert("Club and related announcements deleted!");
      loadClubs();
      populateClubDropdown();
    } catch (error) {
      console.error("Error deleting club:", error);
      alert("Failed to delete club: " + error.message);
    }
  }
};

// Populate the club dropdown for announcements
async function populateClubDropdown() {
  const dropdown = document.getElementById("announceClub");
  dropdown.innerHTML = '<option value="">Select Club</option>';
  
  try {
    const snapshot = await getDocs(collection(db, "clubs"));
    snapshot.forEach(docSnap => {
      const club = docSnap.data();
      const id = docSnap.id;
      
      dropdown.innerHTML += `<option value="${id}">${club.name}</option>`;
    });
  } catch (error) {
    console.error("Error loading clubs for dropdown:", error);
    alert("Error loading clubs for dropdown. Please try again.");
  }
}

// Post announcement
window.postAnnouncement = async function() {
  const clubId = document.getElementById("announceClub").value;
  const text = document.getElementById("announcementText").value;
  const date = document.getElementById("announcementDate").value;
  
  if (!clubId || !text) {
    alert("Please select a club and enter announcement text.");
    return;
  }
  
  try {
    // Get club name for reference
    const clubDoc = await getDoc(doc(db, "clubs", clubId));
    const clubName = clubDoc.exists() ? clubDoc.data().name : "Unknown Club";
    
    // Create announcement
    await addDoc(collection(db, "announcements"), {
      clubId,
      clubName,
      text,
      date: date || new Date().toISOString(),
      postedBy: currentUser.email,
      timestamp: new Date().toISOString()
    });
    
    alert("Announcement posted!");
    document.getElementById("announcementText").value = "";
    document.getElementById("announcementDate").value = "";
  } catch (error) {
    console.error("Error posting announcement:", error);
    alert("Failed to post announcement: " + error.message);
  }
};

// Upload a poster to the carousel
window.uploadPoster = async function() {
  const fileInput = document.getElementById("posterInput");
  const file = fileInput.files[0];
  
  if (!file) {
    alert("Please select an image first.");
    return;
  }
  
  try {
    // Show loading state
    const uploadButton = fileInput.nextElementSibling;
    const originalText = uploadButton.textContent;
    uploadButton.textContent = "Uploading...";
    uploadButton.disabled = true;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `posters/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    
    // Add to Firestore
    await addDoc(collection(db, "posters"), {
      url: imageUrl,
      title: file.name.split('.')[0], // Use filename as title
      uploadedBy: currentUser.email,
      timestamp: new Date().toISOString()
    });
    
    // Reset input and button
    fileInput.value = "";
    uploadButton.textContent = originalText;
    uploadButton.disabled = false;
    
    alert("Poster uploaded successfully!");
    loadPosters();
  } catch (error) {
    console.error("Error uploading poster:", error);
    alert("Failed to upload poster: " + error.message);
    const uploadButton = fileInput.nextElementSibling;
    uploadButton.textContent = "Upload Poster";
    uploadButton.disabled = false;
  }
};

// Load all posters from Firestore
async function loadPosters() {
  const posterGallery = document.getElementById("posterGallery");
  
  if (!posterGallery) {
    console.error("Poster gallery element not found in DOM");
    return;
  }
  
  posterGallery.innerHTML = "<p>Loading posters...</p>";
  
  try {
    const q = query(collection(db, "posters"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      posterGallery.innerHTML = "<p>No posters uploaded yet.</p>";
      return;
    }
    
    posterGallery.innerHTML = "";
    snapshot.forEach(doc => {
      const poster = doc.data();
      const posterId = doc.id;
      
      posterGallery.innerHTML += `
        <div class="poster-item">
          <img src="${poster.url}" alt="${poster.title || 'Poster'}">
          <div class="poster-controls">
            <p>${poster.title || 'Untitled Poster'}</p>
            <button onclick="deletePoster('${posterId}', '${poster.url}')">Delete</button>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading posters:", error);
    posterGallery.innerHTML = "<p>Error loading posters. Please try again.</p>";
  }
}

// Delete poster from both Firestore and Storage
window.deletePoster = async function(posterId, posterUrl) {
  if (!confirm("Are you sure you want to delete this poster?")) {
    return;
  }
  
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, "posters", posterId));
    
    // Delete from Storage
    try {
      // Extract the path from the URL
      const urlParts = posterUrl.split('/o/')[1];
      if (urlParts) {
        const path = decodeURIComponent(urlParts.split('?')[0]);
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
      }
    } catch (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Continue even if storage delete fails
    }
    
    alert("Poster deleted successfully!");
    loadPosters();
  } catch (error) {
    console.error("Error deleting poster:", error);
    alert("Failed to delete poster: " + error.message);
  }
};

// Load Feedbacks
async function loadFeedbacks() {
  const feedbackList = document.getElementById("feedbackList");
  feedbackList.innerHTML = "";

  try {
    const q = query(collection(db, "feedbacks"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      feedbackList.innerHTML = "<p>No feedback submissions yet.</p>";
      return;
    }
    
    snapshot.forEach(docSnap => {
      const feedback = docSnap.data();
      const id = docSnap.id;

      feedbackList.innerHTML += `
        <div class="feedback-card">
          <strong>${feedback.name} (${feedback.userEmail})</strong>
          <p>${feedback.message}</p>
          <small>${new Date(feedback.timestamp).toLocaleString()}</small>
          <button onclick="deleteFeedback('${id}')">Delete</button>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading feedbacks:", error);
    feedbackList.innerHTML = "<p>Error loading feedbacks. Please try again.</p>";
  }
}

// Delete feedback
window.deleteFeedback = async function(feedbackId) {
  if (confirm("Delete this feedback?")) {
    try {
      await deleteDoc(doc(db, "feedbacks", feedbackId));
      alert("Feedback deleted!");
      loadFeedbacks();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Failed to delete feedback: " + error.message);
    }
  }
};