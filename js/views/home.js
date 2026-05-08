// ─────────────────────────────────────────────────────────────
// views/home.js — Employee dashboard
// Live clock, today card, attendance history, clock in/out, edit modal
// ─────────────────────────────────────────────────────────────

// ── Live clock ──
const tick = () => {
  const now = getTW();
  const ce  = document.getElementById("clk");
  const de  = document.getElementById("cld");
  if (ce) ce.textContent = tStr(now);
  if (de) de.textContent = dLong(now);
  if (document.getElementById("v-home").style.display !== "none") renderButtons();
};
setInterval(tick, 1000); tick();

// ── Renderers ──
function renderHome() {
  renderButtons();
  renderTodayCard();
  renderHistTable();
}

function renderButtons() {
  const rec    = todayRec();
  const hasIn  = rec && rec.clockIn;
  const hasOut = rec && rec.clockOut;
  const btnIn  = document.getElementById("btn-in");
  const btnOut = document.getElementById("btn-out");
  const note   = document.getElementById("ac-note");
  const mcBtns = document.querySelectorAll(".mc-btn");

  if (hasIn && !hasOut) {
    btnIn.className  = "ac-btn ac-dis"; btnIn.disabled  = true;
    btnOut.className = "ac-btn ac-out"; btnOut.disabled = false;
    note.textContent = "Clocked in at " + rec.clockInDisplay;
    mcBtns.forEach(b => { b.disabled = true; b.style.opacity = b.classList.contains("active") ? "1" : "0.4"; b.style.cursor = "not-allowed"; });
  } else if (hasOut) {
    btnIn.className  = "ac-btn ac-dis"; btnIn.disabled  = true;
    btnOut.className = "ac-btn ac-dis"; btnOut.disabled = true;
    note.textContent = "Day complete — have a great evening!";
    mcBtns.forEach(b => { b.disabled = true; b.style.opacity = b.classList.contains("active") ? "1" : "0.4"; b.style.cursor = "not-allowed"; });
  } else {
    btnIn.className  = "ac-btn ac-in";  btnIn.disabled  = false;
    btnOut.className = "ac-btn ac-dis"; btnOut.disabled = true;
    note.textContent = "";
    mcBtns.forEach(b => { b.disabled = false; b.style.opacity = "1"; b.style.cursor = "pointer"; });
  }
}

function renderTodayCard() {
  const rec   = todayRec();
  const hasIn = rec && rec.clockIn;
  const tc    = document.getElementById("today-card");
  if (hasIn) {
    tc.style.display = "block";
    document.getElementById("td-in").textContent   = rec.clockInDisplay  || "—";
    document.getElementById("td-out").textContent  = rec.clockOutDisplay || "—";
    document.getElementById("td-dur").textContent  = rec.duration || (rec.clockOut ? "—" : "Ongoing");
    document.getElementById("td-mode").textContent = rec.workMode || "—";
  } else {
    tc.style.display = "none";
  }
}

function renderHistTable() {
  let data = records.filter(r => r.email === U.email);
  if (fFrom) data = data.filter(r => r.date >= fFrom);
  if (fTo)   data = data.filter(r => r.date <= fTo);
  if (fMode) data = data.filter(r => r.workMode === fMode);

  document.getElementById("rp-sub").textContent = data.length + " record" + (data.length === 1 ? "" : "s");
  document.getElementById("f-clr").style.display = (fFrom || fTo || fMode) ? "block" : "none";

  const tbody = document.getElementById("hist-body");
  if (!data.length) {
    tbody.innerHTML = "<tr class='nr'><td colspan='5'>No records found.</td></tr>";
    return;
  }
  tbody.innerHTML = [...data].reverse().map(r => {
    const isToday = r.date === dKey(getTW());
    return `<tr>
      <td style="font-weight:700">
        ${dDisp(r.date)}
        ${isToday ? ` <span style="font-size:10px;background:var(--or-lt);color:var(--or);padding:2px 8px;border-radius:20px;font-weight:700;margin-left:4px">Today</span>` : ""}
        <button onclick="openEditModal('${r.date}')" style="background:none;border:none;color:var(--pu);font-size:11px;font-weight:700;margin-left:8px;cursor:pointer;text-decoration:underline;">Edit</button>
      </td>
      <td style="color:var(--or);font-weight:700;font-family:Outfit,sans-serif">${r.clockInDisplay || "—"}</td>
      <td style="font-weight:700;font-family:Outfit,sans-serif">${r.clockOutDisplay || `<span style="color:#bbb;font-style:italic;font-size:12px;font-family:DM Sans">In progress</span>`}</td>
      <td style="color:var(--pu);font-weight:700;font-family:Outfit,sans-serif">${r.duration || (r.clockIn && !r.clockOut ? `<span style="color:#bbb;font-style:italic;font-size:12px;font-family:DM Sans">Ongoing</span>` : "—")}</td>
      <td style="font-size:12px;font-weight:600;color:#666">${r.workMode || "—"}</td>
    </tr>`;
  }).join("");
}

// ── Edit Request Modal ──
window.openEditModal = function (date) {
  editDateContext = date;
  document.getElementById("edit-modal").style.display = "flex";
  document.getElementById("edit-value").value  = "";
  document.getElementById("edit-reason").value = "";
};

window.closeEditModal = function () {
  document.getElementById("edit-modal").style.display = "none";
};

document.getElementById("submit-edit-btn").addEventListener("click", async () => {
  const field  = document.getElementById("edit-field").value;
  const val    = document.getElementById("edit-value").value.trim();
  const reason = document.getElementById("edit-reason").value.trim();

  if (!val)    return toast("Please enter a proposed value", "error");
  if (!reason) return toast("Please provide a reason", "error");

  const requestPayload = {
    action: "requestEdit",
    email:  U.email,
    name:   U.name,
    date:   editDateContext,
    field:  field,
    value:  val,
    reason: reason
  };

  const btn = document.getElementById("submit-edit-btn");
  btn.textContent = "Sending..."; btn.disabled = true;

  try {
    await apiPost(requestPayload);
    toast("Request sent to Admin!", "success");
  } catch (e) {
    toast("Error sending request.", "warning");
  }

  closeEditModal();
  btn.textContent = "Send Request"; btn.disabled = false;
});

// ── Clock In ──
async function doClockIn() {
  if (BUSY) return;
  const rec = todayRec();
  if (rec && rec.clockIn) { toast("Already clocked in today", "warning"); return; }

  BUSY = true;
  document.getElementById("btn-in").className = "ac-btn ac-dis";
  document.getElementById("btn-in").disabled  = true;
  document.getElementById("btn-in").textContent = "Recording...";

  const now = getTW(), today = dKey(now), t = t4(now);
  const newRec = {
    id:               `${U.email}_${today}`,
    email:            U.email,
    name:             U.name,
    date:             today,
    clockIn:          new Date().toISOString(),
    clockInDisplay:   t,
    clockOut:         null,
    clockOutDisplay:  null,
    workMode:         MODE,
    duration:         null
  };

  records = records.filter(r => !(r.email === U.email && r.date === today));
  records.push(newRec);
  saveLocal(records);

  await pushToSheet(newRec);

  BUSY = false;
  document.getElementById("btn-in").textContent = "Clock In";
  toast("Clocked in at " + t, "success");
  renderHome();
}

// ── Clock Out ──
async function doClockOut() {
  if (BUSY) return;
  const rec = todayRec();
  if (!rec || !rec.clockIn) { toast("No clock-in record found", "error"); return; }
  if (rec.clockOut)         { toast("Already clocked out today", "warning"); return; }

  BUSY = true;
  document.getElementById("btn-out").className = "ac-btn ac-dis";
  document.getElementById("btn-out").disabled  = true;
  document.getElementById("btn-out").textContent = "Recording...";

  const now = getTW(), today = dKey(now), t = t4(now), d = dur(rec.clockIn, new Date().toISOString());
  const idx = records.findIndex(r => r.email === U.email && r.date === today);
  records[idx] = { ...records[idx], clockOut: new Date().toISOString(), clockOutDisplay: t, duration: d };
  saveLocal(records);

  await pushToSheet(records[idx]);

  BUSY = false;
  document.getElementById("btn-out").textContent = "Clock Out";
  toast("Clocked out at " + t + " · " + d, "success");
  renderHome();
}

// ── Home top-nav buttons ──
document.getElementById("h-out").addEventListener("click", () => {
  U = null;
  records = [];
  document.getElementById("le").value = "";
  document.getElementById("h-admin-nav").style.display = "none";
  document.getElementById("h-inbox-nav").style.display = "none";
  show("v-login");
});

document.getElementById("h-admin-nav").addEventListener("click", () => {
  show("v-admin-dash");
  renderAdmin();
  switchAdTab("records");
});

document.getElementById("h-inbox-nav").addEventListener("click", () => {
  show("v-admin-dash");
  renderAdmin();
  switchAdTab("requests");
});

// ── Mode picker ──
document.getElementById("mc-btns").addEventListener("click", e => {
  const btn = e.target.closest(".mc-btn");
  if (!btn || btn.disabled) return;
  document.querySelectorAll(".mc-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  MODE = btn.dataset.mode;
});

// ── Clock action buttons ──
document.getElementById("btn-in").addEventListener("click",  doClockIn);
document.getElementById("btn-out").addEventListener("click", doClockOut);

// ── Export CSV (employee scope) ──
document.getElementById("h-exp").addEventListener("click", () => exportCSV("user"));

// ── Personal-history filters ──
["f-from", "f-to"].forEach(id =>
  document.getElementById(id).addEventListener("change", e => {
    if (id === "f-from") fFrom = e.target.value; else fTo = e.target.value;
    renderHistTable();
  })
);
document.getElementById("f-mode").addEventListener("change", e => { fMode = e.target.value; renderHistTable(); });
document.getElementById("f-clr").addEventListener("click", () => {
  fFrom = fTo = fMode = "";
  document.getElementById("f-from").value = "";
  document.getElementById("f-to").value   = "";
  document.getElementById("f-mode").value = "";
  renderHistTable();
});
