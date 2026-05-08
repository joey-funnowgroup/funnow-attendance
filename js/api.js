// ─────────────────────────────────────────────────────────────
// api.js — All network calls to the Google Apps Script backend
// ─────────────────────────────────────────────────────────────
//
// CORS NOTE (carry-over from project briefing):
// POST requests use Content-Type "text/plain;charset=utf-8" to bypass
// Apps Script CORS preflight. Do NOT switch to application/json.
//

async function apiPost(payload) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error("API Error: Make sure your Google Sheet headers are exact matches to the script.", err);
    throw err;
  }
}

async function fetchAdmins() {
  if (!SHEETS_READY) return;
  try {
    const r = await fetch(APPS_SCRIPT_URL + "?action=getAdmins");
    adminEmails = await r.json();
  } catch (e) {
    console.warn("Could not fetch admins", e);
  }

  if (U && adminEmails.includes(U.email.toLowerCase())) {
    document.getElementById("h-admin-nav").style.display = "inline-block";
    document.getElementById("h-inbox-nav").style.display = "flex";
    checkPendingRequests();
  } else {
    document.getElementById("h-admin-nav").style.display = "none";
    document.getElementById("h-inbox-nav").style.display = "none";
  }
}

async function checkPendingRequests() {
  try {
    const reqRes = await fetch(APPS_SCRIPT_URL + "?action=getRequests");
    const pendingReqs = await reqRes.json();
    const count = pendingReqs.length || 0;

    const badges = [
      document.getElementById("nav-req-badge"),
      document.getElementById("tab-req-badge")
    ];
    badges.forEach(b => {
      if (b) {
        b.textContent = count;
        b.style.display = count > 0 ? "inline-block" : "none";
      }
    });
  } catch (e) { /* silent */ }
}

async function pushToSheet(rec) {
  if (!SHEETS_READY) { setSyncBadge("err"); return; }
  setSyncBadge("ing");
  try {
    await apiPost({ action: "upsert", record: rec });
    setSyncBadge("ok");
  } catch (e) {
    setSyncBadge("err");
  }
}

async function fetchFromSheet() {
  if (!SHEETS_READY) { records = loadLocal(); return; }
  setSyncBadge("ing");
  try {
    const r = await fetch(APPS_SCRIPT_URL + "?action=getAll");
    const data = await r.json();
    records = Array.isArray(data) ? data : loadLocal();
    saveLocal(records);
    setSyncBadge("ok");
  } catch (e) {
    records = loadLocal();
    setSyncBadge("err");
  }
}

async function fetchUserRecords() {
  if (!SHEETS_READY) { records = loadLocal(); renderHistTable(); return; }
  setSyncBadge("ing");
  try {
    const r = await fetch(`${APPS_SCRIPT_URL}?action=getByEmail&email=${encodeURIComponent(U.email)}`);
    const data = await r.json();
    const myRecs = Array.isArray(data) ? data : [];
    const otherRecs = loadLocal().filter(x => x.email !== U.email);
    records = [...otherRecs, ...myRecs];
    saveLocal(records);
    setSyncBadge("ok");
  } catch (e) {
    records = loadLocal();
    setSyncBadge("err");
  }
  renderHistTable();
}
