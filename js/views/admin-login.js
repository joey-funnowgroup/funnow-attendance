// ─────────────────────────────────────────────────────────────
// views/admin-login.js — Master password gate
// ─────────────────────────────────────────────────────────────
//
// Phase 3 NOTE: This whole view is removed in Phase 3. Admin access
// will then be granted purely by Google Sign-In + Admins-sheet whitelist.
//

document.getElementById("al-back").addEventListener("click", () => show("v-login"));

document.getElementById("al-enter").addEventListener("click", () => {
  const pwd = document.getElementById("al-pwd").value;
  if (pwd === PWD) {
    document.getElementById("al-pwd").value      = "";
    document.getElementById("al-err").textContent = "";
    show("v-admin-dash");
    renderAdmin();
    switchAdTab("records");
  } else {
    document.getElementById("al-err").textContent = "Incorrect password.";
  }
});

document.getElementById("al-pwd").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("al-enter").click();
});
