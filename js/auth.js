// ─────────────────────────────────────────────────────────────
// auth.js — Google Sign-In + persistent session with idle timeout
// ─────────────────────────────────────────────────────────────
//
// Session lives in localStorage so refresh / browser close keeps
// the user logged in. After IDLE_TIMEOUT_MS of no activity (no
// click, keypress, or touch), the session expires automatically
// and we redirect back to the login screen.
//
// Phase 3 will move ID-token verification to the backend (Apps
// Script will validate the JWT). For now we still decode the JWT
// client-side for display purposes — same as the original.
//

// ── Session storage helpers ───────────────────────────────────

function saveSession() {
  if (!U) return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      user:         U,
      lastActivity: Date.now()
    }));
  } catch (e) { /* quota exceeded — not fatal */ }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.user || !data.user.email) return null;
    if (Date.now() - data.lastActivity > IDLE_TIMEOUT_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data.user;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

// Bumps the lastActivity timestamp so an active user stays signed in.
// Throttled to once every 10 seconds so we don't hammer localStorage on
// every keystroke.
let lastBumpAt = 0;
function bumpActivity() {
  if (!U) return;
  const now = Date.now();
  if (now - lastBumpAt < 10 * 1000) return;
  lastBumpAt = now;
  saveSession();
}

// Listen for any user interaction → bump activity timestamp
["click", "keydown", "touchstart"].forEach(evt =>
  document.addEventListener(evt, bumpActivity, { passive: true, capture: true })
);

// Idle watchdog — every minute, check if we've been idle too long
setInterval(() => {
  if (!U) return;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Date.now() - data.lastActivity > IDLE_TIMEOUT_MS) {
      signOutDueToIdle();
    }
  } catch (e) {}
}, 60 * 1000);

function signOutDueToIdle() {
  U = null;
  records = [];
  IS_MASTER_ADMIN = false;
  clearSession();
  toast("Signed out due to inactivity. Please sign in again.", "warning");
  if (typeof goto === "function") goto("#/login");
  // Hide admin nav buttons in case they were visible
  const adm = document.getElementById("h-admin-nav");
  const inb = document.getElementById("h-inbox-nav");
  if (adm) adm.style.display = "none";
  if (inb) inb.style.display = "none";
}

// ── Google Sign-In ────────────────────────────────────────────

window.handleGoogleLogin = function (response) {
  try {
    const p  = response.credential.split(".");
    const pl = JSON.parse(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")));
    loginUser(pl.email, pl.name, pl.picture);
  } catch (e) {
    document.getElementById("le-err").textContent = "Google sign-in failed. Please try again.";
  }
};

// loginUser establishes the user session.
//   skipNav = true  → caller will route the user (used on page-load
//                     session restore so the URL hash decides where).
//   skipNav = false → we navigate to #/home (the default for fresh sign-ins).
function loginUser(email, name, photo, skipNav) {
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

  saveSession();

  records = loadLocal();
  renderHome();
  fetchUserRecords();
  fetchAdmins();

  if (!skipNav) goto("#/home");
}
