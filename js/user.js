// user.js - Complete implementation
import { db, auth } from './firebase.js';
import {
  collection, addDoc, onSnapshot, doc, getDoc, updateDoc, 
  arrayUnion, arrayRemove, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { logoutUser, checkUser } from './auth.js';

let currentUser;

// Check login status
checkUser(async (user, userData) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  if (userData.role !== 'user') {
    alert("Access denied. Only Users allowed!");
    window.location.href = "login.html";
    return;
  }
  
  currentUser = user;
  loadClubs();
  loadMyClubs();
  loadCarousel();
  
  // Set up logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }
});

// Load available clubs
function loadClubs() {
  const list = document.getElementById("clubList");
  if (!list) return;
  
  list.innerHTML = "<p>Loading clubs...</p>";
  
  onSnapshot(collection(db, "clubs"), snapshot => {
    if (snapshot.empty) {
      list.innerHTML = "<p>No clubs available.</p>";
      return;
    }
    
    list.innerHTML = "";
    snapshot.forEach(docSnap => {
      const club = docSnap.data();
      const id = docSnap.id;

      list.innerHTML += `
        <div class="club-card">
          <h4>${club.name}</h4>
          <p>${club.desc}</p>
          <button onclick="joinClub('${id}', '${club.name}')">Join</button>
        </div>
      `;
    });
  }, error => {
    console.error("Error loading clubs:", error);
    list.innerHTML = "<p>Error loading clubs. Please try again.</p>";
  });
}

// Join a club
window.joinClub = async function (clubId, clubName) {
  try {
    const userRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    // Check if already joined
    const joinedClubs = userDoc.data().joinedClubs || [];
    const alreadyJoined = joinedClubs.some(club => 
      (typeof club === 'string' && club === clubId) || 
      (typeof club === 'object' && club.id === clubId)
    );
    
    if (alreadyJoined) {
      alert("You have already joined this club!");
      return;
    }
    
    await updateDoc(userRef, {
      joinedClubs: arrayUnion({id: clubId, name: clubName})
    });
    
    alert("Joined club!");
    loadMyClubs();
  } catch (error) {
    console.error("Error joining club:", error);
    alert("Failed to join club: " + error.message);
  }
}

// Load user's joined clubs
async function loadMyClubs() {
  const list = document.getElementById("joinedClubs");
  if (!list) return;
  
  list.innerHTML = "<p>Loading your clubs...</p>";
  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();
    
    if (!userData.joinedClubs || userData.joinedClubs.length === 0) {
      list.innerHTML = "<p>No clubs joined yet.</p>";
      return;
    }
    
    list.innerHTML = "";
    userData.joinedClubs.forEach(club => {
      // Handle both old format (string clubId) and new format (object with id and name)
      const clubId = typeof club === 'string' ? club : club.id;
      const clubName = typeof club === 'string' ? clubId : club.name;
      
      list.innerHTML += `
        <div class="joined-club">
          <h4>${clubName}</h4>
          <button onclick="leaveClub('${clubId}')">Leave</button>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading joined clubs:", error);
    list.innerHTML = "<p>Error loading your clubs. Please try again.</p>";
  }
}

// Leave a club
window.leaveClub = async function (clubId) {
  if (confirm("Leave this club?")) {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      // Handle both old and new data structure
      const joinedClubs = userDoc.data().joinedClubs || [];
      const clubToRemove = joinedClubs.find(club => 
        (typeof club === 'string' && club === clubId) || 
        (typeof club === 'object' && club.id === clubId)
      );
      
      await updateDoc(userRef, {
        joinedClubs: arrayRemove(clubToRemove)
      });
      
      alert("Left club!");
      loadMyClubs();
    } catch (error) {
      console.error("Error leaving club:", error);
      alert("Failed to leave club: " + error.message);
    }
  }
}

// Function to load and display carousel on user page
function loadCarousel() {
  const carouselContainer = document.getElementById("carouselContainer");
  if (!carouselContainer) return;
  
  carouselContainer.innerHTML = "<p>Loading...</p>";
  
  // Listen for changes in the posters collection
  onSnapshot(collection(db, "posters"), (snapshot) => {
    if (snapshot.empty) {
      carouselContainer.innerHTML = "<p>No announcements available.</p>";
      return;
    }
    
    const posters = [];
    snapshot.forEach(doc => {
      const poster = doc.data();
      posters.push({
        url: poster.url,
        title: poster.title || ''
      });
    });
    
    if (posters.length === 0) {
      carouselContainer.innerHTML = "<p>No posters to display.</p>";
      return;
    }
    
    // Create carousel structure
    carouselContainer.innerHTML = `
      <div class="carousel-wrapper">
        <div class="carousel-slides">
          ${posters.map((poster, index) => `
            <div class="carousel-slide" data-index="${index}">
              <img src="${poster.url}" alt="${poster.title}">
              ${poster.title ? `<div class="carousel-caption">${poster.title}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="carousel-controls">
          <button class="carousel-prev">&lt;</button>
          <div class="carousel-dots">
            ${posters.map((_, index) => `
              <span class="carousel-dot" data-index="${index}"></span>
            `).join('')}
          </div>
          <button class="carousel-next">&gt;</button>
        </div>
      </div>
    `;
    
    // Initialize carousel functionality
    let currentSlide = 0;
    const slides = carouselContainer.querySelectorAll('.carousel-slide');
    const dots = carouselContainer.querySelectorAll('.carousel-dot');
    
    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      currentSlide = index;
    }
    
    // Show first slide
    showSlide(0);
    
    // Set up event listeners
    carouselContainer.querySelector('.carousel-prev').addEventListener('click', () => {
      const newIndex = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(newIndex);
    });
    
    carouselContainer.querySelector('.carousel-next').addEventListener('click', () => {
      const newIndex = (currentSlide + 1) % slides.length;
      showSlide(newIndex);
    });
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
      });
    });
    
    // Auto-slide function
    let slideInterval = setInterval(() => {
      const newIndex = (currentSlide + 1) % slides.length;
      showSlide(newIndex);
    }, 5000); // Change slide every 5 seconds
    
    // Pause auto-slide on hover
    carouselContainer.addEventListener('mouseenter', () => {
      clearInterval(slideInterval);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
      slideInterval = setInterval(() => {
        const newIndex = (currentSlide + 1) % slides.length;
        showSlide(newIndex);
      }, 5000);
    });
  }, (error) => {
    console.error("Error loading carousel posters:", error);
    carouselContainer.innerHTML = "<p>Error loading content. Please try again later.</p>";
  });
}

// Submit feedback
window.submitFeedback = async function() {
  const feedbackText = document.getElementById("feedbackText");
  const feedbackName = document.getElementById("feedbackName");
  
  if (!feedbackText || !feedbackName) {
    console.error("Feedback form elements not found");
    return;
  }
  
  const text = feedbackText.value;
  const name = feedbackName.value;
  
  if (!text || !name) {
    alert("Please fill in all fields");
    return;
  }
  
  try {
    await addDoc(collection(db, "feedbacks"), {
      name: name,
      message: text,
      userEmail: currentUser.email,
      timestamp: new Date().toISOString()
    });
    
    alert("Feedback submitted!");
    feedbackText.value = "";
    feedbackName.value = "";
  } catch (error) {
    console.error("Error submitting feedback:", error);
    alert("Failed to submit feedback: " + error.message);
  }
}

// Expose logout
window.logoutUser = logoutUser;
