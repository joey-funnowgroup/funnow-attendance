// ─────────────────────────────────────────────────────────────
// router.js — Hash-based router with auth gates
// ─────────────────────────────────────────────────────────────
//
// Phase 2: each view has a URL the user can bookmark / share /
// reload. The router enforces auth and admin gates so deep-linking
// to a protected view always lands somewhere safe.
//
//   #/login              → employee login        (anyone)
//   #/home               → employee dashboard    (signed-in)
//   #/admin              → admin master-pwd gate (anyone)
//   #/admin/records      → admin records tab     (admin)
//   #/admin/inbox        → admin requests tab    (admin)
//   #/admin/roles        → admin roles tab       (admin)
//
// Internal admin tab clicks use replaceState so the back button
// doesn't get cluttered with one history entry per tab toggle —
// only "real" navigation (login → home, home → admin, etc.) is
// pushed onto the history stack.
//

const VIEWS = ["v-login", "v-home", "v-admin-login", "v-admin-dash"];

const ROUTES = [
  { hash: "#/login",         view: "v-login",       requiresAuth: false, requiresAdmin: false, adminTab: null       },
  { hash: "#/home",          view: "v-home",        requiresAuth: true,  requiresAdmin: false, adminTab: null       },
  { hash: "#/admin",         view: "v-admin-login", requiresAuth: false, requiresAdmin: false, adminTab: null       },
  { hash: "#/admin/records", view: "v-admin-dash",  requiresAuth: false, requiresAdmin: true,  adminTab: "records"  },
  { hash: "#/admin/inbox",   view: "v-admin-dash",  requiresAuth: false, requiresAdmin: true,  adminTab: "requests" },
  { hash: "#/admin/roles",   view: "v-admin-dash",  requiresAuth: false, requiresAdmin: true,  adminTab: "roles"    },
];

const TAB_HASH = {
  records:  "#/admin/records",
  requests: "#/admin/inbox",
  roles:    "#/admin/roles"
};

// True if the current user can access admin views — either signed in
// with an email on the Admins whitelist, or in the master-password
// session (which sets IS_MASTER_ADMIN in admin-login.js).
function isSignedInAdmin() {
  if (typeof IS_MASTER_ADMIN !== "undefined" && IS_MASTER_ADMIN) return true;
  return !!(U && Array.isArray(adminEmails) && adminEmails.includes(String(U.email).toLowerCase()));
}

function findRoute(hash) {
  for (let i = 0; i < ROUTES.length; i++) {
    if (ROUTES[i].hash === hash) return ROUTES[i];
  }
  return null;
}

// Public navigation entry point. Use this anywhere we'd previously
// have called show("v-foo"). Pushes a history entry so back works.
function goto(hash) {
  if (location.hash !== hash) {
    history.pushState(null, "", hash);
  }
  handleRoute();
}

async function handleRoute() {
  let hash = location.hash || "";

  // Default route — empty / root
  if (!hash || hash === "#" || hash === "#/") {
    hash = U ? "#/home" : "#/login";
    history.replaceState(null, "", hash);
  }

  let route = findRoute(hash);

  // Unknown hash — bounce to a sensible default
  if (!route) {
    hash = U ? "#/home" : "#/login";
    history.replaceState(null, "", hash);
    route = findRoute(hash);
  }

  // Auth gate — needs a signed-in user
  if (route.requiresAuth && !U) {
    history.replaceState(null, "", "#/login");
    route = findRoute("#/login");
  }

  // Admin gate — needs admin privileges
  if (route.requiresAdmin && !isSignedInAdmin()) {
    if (U) {
      // Signed in but not an admin — go home with a toast
      if (typeof toast === "function") toast("Admin access required", "error");
      history.replaceState(null, "", "#/home");
      route = findRoute("#/home");
    } else {
      // Not signed in at all — go to admin login screen
      history.replaceState(null, "", "#/admin");
      route = findRoute("#/admin");
    }
  }

  showView(route.view);

  // Admin tabs — load data then apply tab UI
  if (route.adminTab) {
    if (typeof renderAdmin === "function") {
      try { await renderAdmin(); } catch (e) { /* network errors handled inside */ }
    }
    applyAdminTab(route.adminTab);
  }
}

function showView(v) {
  for (let i = 0; i < VIEWS.length; i++) {
    const el = document.getElementById(VIEWS[i]);
    if (el) el.style.display = "none";
  }
  const target = document.getElementById(v);
  if (target) target.style.display = (v === "v-login" || v === "v-admin-login") ? "flex" : "block";
}

// Apply admin tab UI without touching the URL — used internally
// by handleRoute when it's already authoritative on the URL.
function applyAdminTab(tabId) {
  document.querySelectorAll(".ad-tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".ad-tab").forEach(el => el.classList.remove("active"));
  const content = document.getElementById("tab-" + tabId);
  const btn     = document.getElementById("btn-tab-" + tabId);
  if (content) content.classList.add("active");
  if (btn)     btn.classList.add("active");
}

// Admin tab clicks call this (from inline onclick="switchAdTab('records')").
// Updates the URL hash via replaceState so we get a bookmarkable URL
// without polluting the back-button history with every tab toggle.
window.switchAdTab = function (tabId) {
  const newHash = TAB_HASH[tabId];
  if (newHash && location.hash !== newHash) {
    history.replaceState(null, "", newHash);
  }
  applyAdminTab(tabId);
};

// Backward-compatible wrapper — older code calls show("v-home").
// Translates to a goto(hash). Existing callers keep working without
// edits, but new code should call goto() with an explicit hash.
function show(v) {
  const m = {
    "v-login":       "#/login",
    "v-home":        "#/home",
    "v-admin-login": "#/admin",
    "v-admin-dash":  "#/admin/records"
  };
  goto(m[v] || "#/login");
}

// Browser back / forward
window.addEventListener("popstate", handleRoute);
