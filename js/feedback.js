// js/feedback.js

import { db, auth } from './firebase.js';
import { addDoc, collection } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';
import { logoutUser, checkUser } from './auth.js';

const form = document.getElementById("feedbackForm");
const feedbackStatus = document.getElementById("feedbackStatus");

checkUser(user => {
  if (!user) {
    window.location.href = "login.html"; // Must login first
  }
});

// Submit Feedback
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const club = document.getElementById("club").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!message) {
    feedbackStatus.innerHTML = "<p style='color:red;'>Feedback message is required!</p>";
    return;
  }

  try {
    await addDoc(collection(db, "feedbacks"), {
      name,
      club,
      message,
      userEmail: auth.currentUser.email,
      timestamp: new Date().toISOString()
    });

    feedbackStatus.innerHTML = "<p style='color:green;'>Feedback submitted successfully!</p>";
    form.reset();

  } catch (error) {
    console.error("Error submitting feedback:", error);
    feedbackStatus.innerHTML = "<p style='color:red;'>Error submitting feedback. Try again!</p>";
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);