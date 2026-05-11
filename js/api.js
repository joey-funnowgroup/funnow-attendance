// ─────────────────────────────────────────────────────────────
// api.js — All network calls to the Google Apps Script backend
// ─────────────────────────────────────────────────────────────
//
// CORS NOTE (carry-over from project briefing):
// POST requests use Content-Type "text/plain;charset=utf-8" to bypass
// Apps Script CORS preflight. Do NOT switch to application/json.
//

// Every protected write call includes the current Google ID token so the
// backend can verify the caller's identity. The server uses the verified
// email — never trust client-supplied identity fields.
async function apiPost(payload) {
  try {
    const enriched = { ...payload, idToken: G_ID_TOKEN };
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(enriched)
    });
    const data = await res.json();

    // Server signalled an auth problem — kick the user back to sign-in
    if (data && data.success === false && (data.code === "auth" || data.code === "domain" || data.code === "forbidden")) {
      if (typeof handleAuthExpired === "function") handleAuthExpired(data.code);
    }

    return data;
  } catch (err) {
    console.error("API Error: Make sure your Google Sheet headers are exact matches to the script.", err);
    throw err;
  }
}

// ── Admin list cache ──
//
// Avoids blocking login on a network round-trip. The cached list is
// served instantly; a background refresh keeps it fresh for the next
// page load. Cache busts after ADMIN_CACHE_TTL or when a write to
// the admin list happens (addAdmin / removeAdmin in admin.js).
//
function loadAdminCache() {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.emails)) return null;
    if (Date.now() - data.cachedAt > ADMIN_CACHE_TTL) return null;
    return data.emails;
  } catch (e) { return null; }
}
function saveAdminCache(emails) {
  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({ emails, cachedAt: Date.now() }));
  } catch (e) {}
}
function clearAdminCache() {
  try { localStorage.removeItem(ADMIN_CACHE_KEY); } catch (e) {}
}

function updateAdminButtonsVisibility() {
  if (U && adminEmails.includes(U.email.toLowerCase())) {
    document.getElementById("h-admin-nav").style.display = "inline-block";
    document.getElementById("h-inbox-nav").style.display = "flex";
    checkPendingRequests();
  } else {
    document.getElementById("h-admin-nav").style.display = "none";
    document.getElementById("h-inbox-nav").style.display = "none";
  }
}

async function fetchAdmins() {
  if (!SHEETS_READY) return;

  // Fast path: if we have a fresh cached list, render immediately.
  const cached = loadAdminCache();
  if (cached) {
    adminEmails = cached;
    updateAdminButtonsVisibility();
    // Still refresh in the background so the next page load is current.
    setTimeout(refreshAdminsFromServer, 200);
    return;
  }
  await refreshAdminsFromServer();
}

async function refreshAdminsFromServer() {
  try {
    const r = await fetch(APPS_SCRIPT_URL + "?action=getAdmins");
    const list = await r.json();
    if (Array.isArray(list)) {
      adminEmails = list;
      saveAdminCache(adminEmails);
    }
  } catch (e) {
    console.warn("Could not refresh admins", e);
  }
  updateAdminButtonsVisibility();
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
