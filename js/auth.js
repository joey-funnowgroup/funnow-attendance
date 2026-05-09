// ─────────────────────────────────────────────────────────────
// auth.js — Google Sign-In handler + session establishment
// ─────────────────────────────────────────────────────────────
//
// Phase 3 will move ID-token verification to the backend (Apps Script
// will validate the JWT). For now we just decode the JWT client-side
// to extract email/name/picture — same as the original.
//

window.handleGoogleLogin = function (response) {
  try {
    const p  = response.credential.split(".");
    const pl = JSON.parse(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")));
    loginUser(pl.email, pl.name, pl.picture);
  } catch (e) {
    document.getElementById("le-err").textContent = "Google sign-in failed. Please try again.";
  }
};

function loginUser(email, name, photo) {
  U = { email, name: name || nameF(email), photo: photo || null };

  document.getElementById("nav-nm").textContent  = U.name;
  document.getElementById("nav-av").textContent  = inits(U.name);
  document.getElementById("uc-name").textContent  = U.name;
  document.getElementById("uc-email").textContent = U.email;

  const av = document.getElementById("uc-av");
  if (U.photo) {
    av.outerHTML = `<img src="${U.photo}" class="uc-ph" id="uc-av" alt="${U.name}">`;
  } else {
    av.textContent = inits(U.name);
  }

  show("v-home");
  records = loadLocal();
  renderHome();
  fetchUserRecords();
  fetchAdmins();
}
