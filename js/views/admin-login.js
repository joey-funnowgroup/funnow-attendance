// ─────────────────────────────────────────────────────────────
// views/admin-login.js — Master password gate
// ─────────────────────────────────────────────────────────────
//
// Phase 3 NOTE: This whole view is removed in Phase 3. Admin access
// will then be granted purely by Google Sign-In + Admins-sheet whitelist.
//
// On a successful master-password entry we set IS_MASTER_ADMIN = true
// (in-memory only, doesn't persist across refresh) so the router's
// admin gate lets the user into #/admin/records, /inbox, /roles.
//

document.getElementById("al-back").addEventListener("click", () => goto("#/login"));

document.getElementById("al-enter").addEventListener("click", () => {
  const pwd = document.getElementById("al-pwd").value;
  if (pwd === PWD) {
    IS_MASTER_ADMIN = true;
    document.getElementById("al-pwd").value      = "";
    document.getElementById("al-err").textContent = "";
    goto("#/admin/records");
  } else {
    document.getElementById("al-err").textContent = "Incorrect password.";
  }
});

document.getElementById("al-pwd").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("al-enter").click();
});
