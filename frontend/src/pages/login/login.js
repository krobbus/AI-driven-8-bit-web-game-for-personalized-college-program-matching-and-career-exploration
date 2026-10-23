import { db } from "../../config/firebase";

const emailIdInput = document.getElementById("inputEmailId");
const passwordInput = document.getElementById("inputPassword");
const togglePassBtn = document.getElementById("togglePass");

const guestBtn = document.getElementById("guestButton");
const loginBtn = document.getElementById("loginButton");
const msg = document.getElementById("loginMessage");
const loadingScreen = document.getElementById("loadingScreen");

let isHidden = true;
togglePassBtn.addEventListener("click", () => {
  isHidden = !isHidden;
  passwordInput.type = isHidden ? "password" : "text";
  togglePassBtn.querySelector("img").src = isHidden ? "assets/WebAssets/PadlockClosed.png" : "assets/WebAssets/PadlockOpened.png";
});

msg.style.transition = "opacity 0.5s ease";                                                                   // login message
msg.style.opacity = 0;
function showMessage(text, color = "white", delay = 100) {
  msg.style.opacity = 0;
  setTimeout(() => {
    msg.textContent = text;
    msg.style.color = color;
    msg.style.opacity = 1;
  }, delay);
}

function playAsGuest() {                                                                                      // guest login
  showMessage('Proceeding to the Game...', "lightgreen");

  setTimeout(() => {
    window.location.href = "./Game.html";
  }, 800);
}

async function loginUser() {                                                                                  // permanent player login
  loadingScreen.style.display = "flex";

  const userInput = emailIdInput.value.trim();
  const passInput = passwordInput.value.trim();

  if (!userInput || !passInput) {
    showMessage("Please fill all fields", "red");
    loadingScreen.style.display = "none";
    return;
  }
  showMessage("Checking account...", "gray");

  try {
    let userData = null;
    let finalPlayerID = null;

    const isEmail = userInput.includes("@");
    if (isEmail) {
      const emailQuery = await db.ref("webGame")
        .orderByChild("email")
        .equalTo(userInput)
        .once("value");

      if (emailQuery.exists()) {
        const results = emailQuery.val();
        finalPlayerID = Object.keys(results)[0]; 
        userData = results[finalPlayerID];
      }
    } else {
      const idSnapshot = await db.ref("webGame/" + userInput).once("value");
      if (idSnapshot.exists()) {
        userData = idSnapshot.val();
        finalPlayerID = userInput;
      }
    }

    if (!userData) {
      showMessage("Player ID/Email not found.", "lightcoral");
      loadingScreen.style.display = "none";
      return;
    }

    if (userData.temporary) {
      showMessage("Guest accounts cannot log in permanently.", "lightcoral");
      loadingScreen.style.display = "none";
      return;
    } 
    
    if (userData.pass !== passInput) {
      showMessage("Incorrect Password.", "lightcoral");
      loadingScreen.style.display = "none";
      return;
    }

    localStorage.setItem("playerID", finalPlayerID);
    showMessage("Login successful! Redirecting...", "lightgreen");

    setTimeout(() => {
      loadingScreen.classList.add("fadeOut");

      setTimeout(() => {
        loadingScreen.style.display = "none";
        window.location.href = "./Game.html";
        localStorage.setItem("startScene", "LeftWing");
      }, 500);
    }, 300);
  } catch (error) {
    console.error("Error:", error);
    showMessage("Error checking account. Try again later.", "lightcoral");
    loadingScreen.style.display = "none";
  }
}

guestBtn.addEventListener("click", (e) => {                                                                  // guest and login buttons
  e.preventDefault();
  playAsGuest();
});

loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  loginUser();
});

window.addEventListener("load", () => {                                                                       // load
  loadingScreen.classList.add("fadeOut");

  localStorage.clear();
  setTimeout(() => {
    loadingScreen.classList.add("fadeOut");
    setTimeout(() => (loadingScreen.style.display = "none"), 500);
  }, 300);
});