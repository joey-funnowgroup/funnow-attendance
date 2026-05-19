// ─────────────────────────────────────────────────────────────
// auth.js — Google Sign-In + persistent session with idle timeout
// ─────────────────────────────────────────────────────────────
//
// Phase 3:
//   • Captures the Google ID token (JWT) from the Sign-In callback
//     and stashes it alongside the user in localStorage.
//   • Enforces a domain allowlist (ALLOWED_DOMAINS). Any other domain
//     is rejected client-side with a friendly message — and would
//     also be rejected server-side as a defence-in-depth.
//   • Sends the token on every write so Apps Script can verify
//     identity. Token is rotated naturally on the next sign-in.
//
// Session lives in localStorage so refresh / browser close keeps the
// user logged in. After IDLE_TIMEOUT_MS of no activity the session
// expires and we redirect back to the login screen.
//

// ── Domain allowlist helper ──────────────────────────────────

function isAllowedDomain(email) {
  if (!email || typeof email !== "string") return false;
  const dom = email.split("@")[1];
  if (!dom) return false;
  return ALLOWED_DOMAINS.indexOf(dom.toLowerCase()) !== -1;
}

// ── Session storage helpers ───────────────────────────────────

function saveSession() {
  if (!U) return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      user:         U,
      idToken:      G_ID_TOKEN,
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
    if (!isAllowedDomain(data.user.email)) {
      // Defensive: domain allowlist may have changed since session was saved
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    G_ID_TOKEN = data.idToken || null;
    return data.user;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  G_ID_TOKEN = null;
}

// Bumps the lastActivity timestamp so an active user stays signed in.
// Throttled to once every 10 seconds so we don't hammer localStorage.
let lastBumpAt = 0;
function bumpActivity() {
  if (!U) return;
  const now = Date.now();
  if (now - lastBumpAt < 10 * 1000) return;
  lastBumpAt = now;
  saveSession();
}

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
  G_ID_TOKEN = null;
  clearSession();
  toast("Signed out due to inactivity. Please sign in again.", "warning");
  if (typeof goto === "function") goto("#/login");
  const adm = document.getElementById("h-admin-nav");
  const inb = document.getElementById("h-inbox-nav");
  if (adm) adm.style.display = "none";
  if (inb) inb.style.display = "none";
}

// Called by api.js when the backend returns code:"auth" (token expired/invalid)
// or code:"forbidden"/code:"domain". Resets the session and routes to login.
function handleAuthExpired(reason) {
  U = null;
  records = [];
  G_ID_TOKEN = null;
  clearSession();
  let msg = "Session expired. Please sign in again.";
  if (reason === "domain") msg = "Only @eatigo.com and @myfunnow.com accounts are allowed.";
  if (reason === "forbidden") msg = "You don't have permission to do that.";
  toast(msg, "warning");
  if (typeof goto === "function") goto("#/login");
}

// ── Google Sign-In ────────────────────────────────────────────

window.handleGoogleLogin = function (response) {
  try {
    G_ID_TOKEN = response.credential; // raw signed JWT — server will verify
    const p   = G_ID_TOKEN.split(".");
    const pl  = JSON.parse(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")));

    // Domain allowlist — reject before establishing any session
    if (!isAllowedDomain(pl.email)) {
      G_ID_TOKEN = null;
      const err = document.getElementById("le-err");
      if (err) err.textContent = "Only @eatigo.com and @myfunnow.com accounts are allowed.";
      // Stop Google's auto-suggest from re-popping for this account
      try {
        if (window.google && google.accounts && google.accounts.id) {
          google.accounts.id.disableAutoSelect();
        }
      } catch (e) {}
      return;
    }

    loginUser(pl.email, pl.name, pl.picture);
  } catch (e) {
    G_ID_TOKEN = null;
    const err = document.getElementById("le-err");
    if (err) err.textContent = "Google sign-in failed. Please try again.";
  }
};

// loginUser establishes the user session.
//   skipNav = true  → caller will route the user (used on page-load
//                     session restore so the URL hash decides where).
//   skipNav = false → we navigate to #/home (the default for fresh sign-ins).
function loginUser(email, name, photo, skipNav) {
  // Defensive — also enforced upstream, but never establish a session
  // for a non-allowlisted domain.
  if (!isAllowedDomain(email)) {
    G_ID_TOKEN = null;
    const err = document.getElementById("le-err");
    if (err) err.textContent = "Only @eatigo.com and @myfunnow.com accounts are allowed.";
    return;
  }

  U = { email: String(email).toLowerCase(), name: name || nameF(email), photo: photo || null };

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
