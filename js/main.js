// ─────────────────────────────────────────────────────────────
// main.js — Boot sequence
// ─────────────────────────────────────────────────────────────
//
// Runs after every other module has loaded and bound its event
// listeners. On boot we:
//   1. Try to restore a saved session from localStorage. If valid
//      (within 15-min idle window), set up the user silently —
//      without forcing a navigation, so the router below decides
//      where to land based on the URL hash.
//   2. Hand control to the router. It reads location.hash, applies
//      auth gates, and shows the right view. This makes refresh,
//      bookmarks, and shared links all work.
//

(function boot() {
  const restored = (typeof loadSession === "function") ? loadSession() : null;
  if (restored && restored.email) {
    // skipNav=true so the router (called next) honours the URL hash
    loginUser(restored.email, restored.name, restored.photo, true);
  } else {
    fetchAdmins(); // pre-warm the admin list cache for the next sign-in
  }
  if (typeof handleRoute === "function") handleRoute();
})();
