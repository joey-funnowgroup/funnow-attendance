// ─────────────────────────────────────────────────────────────
// router.js — View switching (Phase 1: same display:none/flex logic)
// ─────────────────────────────────────────────────────────────
//
// Phase 2 will replace this with hash-based routing (#/login, #/home,
// #/admin/inbox, etc.). For Phase 1 we keep the original behaviour.
//

const VIEWS = ["v-login", "v-home", "v-admin-login", "v-admin-dash"];

const show = v => {
  VIEWS.forEach(id => document.getElementById(id).style.display = "none");
  document.getElementById(v).style.display = (v === "v-login" || v === "v-admin-login") ? "flex" : "block";
};

// Admin tab switcher (used inline in HTML; must be on window)
window.switchAdTab = function (tabId) {
  document.querySelectorAll(".ad-tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".ad-tab").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + tabId).classList.add("active");
  document.getElementById("btn-tab-" + tabId).classList.add("active");
};
