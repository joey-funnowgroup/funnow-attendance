// ─────────────────────────────────────────────────────────────
// views/login.js — Employee login view event handlers
// ─────────────────────────────────────────────────────────────

document.getElementById("l-btn").addEventListener("click", () => {
  const email = document.getElementById("le").value.trim();
  const err   = document.getElementById("le-err2");
  if (!email || !email.includes("@") || !email.includes(".")) {
    err.textContent = "Please enter a valid email address";
    return;
  }
  err.textContent = "";
  loginUser(email, nameF(email), null);
});

document.getElementById("le").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("l-btn").click();
});

document.getElementById("l-admin-btn").addEventListener("click", () => show("v-admin-login"));
