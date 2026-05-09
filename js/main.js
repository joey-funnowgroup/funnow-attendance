// ─────────────────────────────────────────────────────────────
// main.js — Boot sequence
// ─────────────────────────────────────────────────────────────
//
// Runs after every other module has loaded and bound its event
// listeners. On boot we:
//   1. Try to restore a saved session from localStorage. If valid
//      (within 15-min idle window), log the user back in instantly
//      so a page refresh doesn't kick them out.
//   2. If no session is found, kick off a background admin-list
//      refresh so the cache is ready by the time someone signs in.
//

(function boot() {
  const restored = (typeof loadSession === "function") ? loadSession() : null;
  if (restored && restored.email) {
    loginUser(restored.email, restored.name, restored.photo);
    return;
  }
  // Not signed in — pre-warm the admin list cache for the next sign-in.
  fetchAdmins();
})();
