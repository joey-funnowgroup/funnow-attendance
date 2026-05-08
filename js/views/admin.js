// ─────────────────────────────────────────────────────────────
// views/admin.js — Admin dashboard (records / requests / roles)
// ─────────────────────────────────────────────────────────────

// ── Approve / Reject edit requests ──
window.handleReqAction = async function (reqId, actionType) {
  if (!confirm(`Are you sure you want to ${actionType === "approveEdit" ? "APPROVE" : "REJECT"} this request?`)) return;
  toast("Processing...", "warning");
  try {
    await apiPost({ action: actionType, reqId: reqId });
    toast("Request processed!", "success");
    setTimeout(() => { renderAdmin(); checkPendingRequests(); }, 1000);
  } catch (e) {
    toast("Error processing request.", "error");
  }
};

// ── Manage admin roles ──
window.addAdminRole = async function () {
  const email = document.getElementById("new-admin-email").value.trim().toLowerCase();
  if (!email || !email.includes("@")) return toast("Valid email required", "error");
  if (adminEmails.includes(email))    return toast("Already an admin", "warning");

  toast("Adding admin...", "warning");
  adminEmails.push(email);
  renderAdminList();
  document.getElementById("new-admin-email").value = "";

  try {
    await apiPost({ action: "addAdmin", email: email });
    toast("Admin added successfully!", "success");
    fetchAdmins();
  } catch (e) {
    toast("Error adding admin.", "error");
  }
};

window.removeAdminRole = async function (email) {
  if (!confirm(`Remove admin privileges for ${email}?`)) return;
  toast("Removing admin...", "warning");
  adminEmails = adminEmails.filter(e => e !== email);
  renderAdminList();

  try {
    await apiPost({ action: "removeAdmin", email: email });
    toast("Admin removed!", "success");
    fetchAdmins();
  } catch (e) {
    toast("Error removing admin.", "error");
  }
};

function renderAdminList() {
  const tbody = document.getElementById("admin-list-body");
  if (!adminEmails.length) {
    tbody.innerHTML = "<tr class='nr'><td colspan='2'>No authorized admins assigned. Master password is required to login.</td></tr>";
    return;
  }
  tbody.innerHTML = adminEmails.map(email => `
    <tr>
      <td style="font-weight:600">${email}</td>
      <td style="text-align:right;">
        <button class="btn-action btn-reject" style="margin-right:0;" onclick="removeAdminRole('${email}')">Remove</button>
      </td>
    </tr>
  `).join("");
}

// ── Big render: Records + Requests + Roles tabs ──
async function renderAdmin() {
  await fetchFromSheet();
  await fetchAdmins();
  renderAdminList();

  const today   = dKey(getTW());
  const persons = [...new Set(records.map(r => r.email))].sort();

  const sel = document.getElementById("af-person");
  sel.innerHTML = "<option value=''>All Employees</option>" +
    persons.map(e => `<option value="${e}"${e === afPerson ? " selected" : ""}>${nameF(e)} (${e})</option>`).join("");

  let filt = records;
  if (afPerson) filt = filt.filter(r => r.email === afPerson);
  if (afFrom)   filt = filt.filter(r => r.date >= afFrom);
  if (afTo)     filt = filt.filter(r => r.date <= afTo);
  if (afMode)   filt = filt.filter(r => r.workMode === afMode);

  document.getElementById("s-tot").textContent  = records.length;
  document.getElementById("s-in").textContent   = records.filter(r => r.date === today && r.clockIn).length;
  document.getElementById("s-done").textContent = records.filter(r => r.date === today && r.clockOut).length;
  document.getElementById("s-show").textContent = filt.length;
  document.getElementById("af-clr").style.display = (afPerson || afFrom || afTo || afMode) ? "block" : "none";

  const tbody = document.getElementById("ad-body");
  if (!filt.length) {
    tbody.innerHTML = "<tr class='nr'><td colspan='8'>No records found</td></tr>";
  } else {
    tbody.innerHTML = [...filt].reverse().map(r => {
      const st = r.clockOut
        ? `<span class="pill p-ok">Complete</span>`
        : `<span class="pill p-pr">In Progress</span>`;
      return `<tr>
        <td style="font-weight:700">${r.name}</td>
        <td style="color:#999;font-size:12px">${r.email}</td>
        <td>${dDisp(r.date)}</td>
        <td style="color:var(--or);font-weight:700;font-family:Outfit,sans-serif">${r.clockInDisplay  || "—"}</td>
        <td style="font-weight:700;font-family:Outfit,sans-serif">${r.clockOutDisplay || "—"}</td>
        <td style="color:var(--pu);font-weight:700;font-family:Outfit,sans-serif">${r.duration || "—"}</td>
        <td style="font-size:12px;font-weight:600;color:#666">${r.workMode || "—"}</td>
        <td>${st}</td>
      </tr>`;
    }).join("");
  }

  // Pending requests tab
  const reqBody = document.getElementById("admin-requests-body");
  try {
    const reqRes      = await fetch(APPS_SCRIPT_URL + "?action=getRequests");
    const pendingReqs = await reqRes.json();

    const count  = pendingReqs.length || 0;
    const badges = [
      document.getElementById("nav-req-badge"),
      document.getElementById("tab-req-badge")
    ];
    badges.forEach(b => { if (b) { b.textContent = count; b.style.display = count > 0 ? "inline-block" : "none"; } });

    if (!pendingReqs || !pendingReqs.length) {
      reqBody.innerHTML = "<tr class='nr'><td colspan='6'>No pending requests at the moment.</td></tr>";
    } else {
      reqBody.innerHTML = pendingReqs.map(r => `
        <tr>
          <td style="font-weight:700">${r.name}<br><span style="font-size:11px;color:#999;font-weight:400">${r.email}</span></td>
          <td style="font-weight:700">${dDisp(r.date)}</td>
          <td style="color:var(--pu);font-weight:700">${r.field}</td>
          <td style="color:var(--or);font-weight:700">${r.value}</td>
          <td style="font-size:12px;color:#666">${r.reason}</td>
          <td>
            <button class="btn-action btn-approve" onclick="handleReqAction('${r.reqId}', 'approveEdit')">Approve</button>
            <button class="btn-action btn-reject"  onclick="handleReqAction('${r.reqId}', 'rejectEdit')">Reject</button>
          </td>
        </tr>
      `).join("");
    }
  } catch (e) {
    reqBody.innerHTML = "<tr class='nr'><td colspan='6'>Error loading requests. Check console for details.</td></tr>";
  }
}

// ── Admin top-nav: back to portal ──
document.getElementById("ad-back").addEventListener("click", () => {
  if (U) show("v-home"); else show("v-login");
});

// ── Admin filters ──
document.getElementById("af-person").addEventListener("change", e => { afPerson = e.target.value; renderAdmin(); });
["af-from", "af-to"].forEach(id =>
  document.getElementById(id).addEventListener("change", e => {
    if (id === "af-from") afFrom = e.target.value; else afTo = e.target.value;
    renderAdmin();
  })
);
document.getElementById("af-mode").addEventListener("change", e => { afMode = e.target.value; renderAdmin(); });
document.getElementById("af-clr").addEventListener("click", () => {
  afPerson = afFrom = afTo = afMode = "";
  ["af-person", "af-from", "af-to", "af-mode"].forEach(id => {
    const el = document.getElementById(id);
    if (el.tagName === "SELECT") el.value = ""; else el.value = "";
  });
  renderAdmin();
});

// ── Export CSV (admin scope) ──
document.getElementById("ad-exp").addEventListener("click", () => exportCSV("admin"));
