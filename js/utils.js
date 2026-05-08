// ─────────────────────────────────────────────────────────────
// utils.js — Date/time formatting, localStorage, toast, sync badge, CSV
// ─────────────────────────────────────────────────────────────

// Date / time helpers (all display in Taiwan time, UTC+8)
const getTW = () => {
  const u = Date.now() + new Date().getTimezoneOffset() * 60000;
  return new Date(u + 8 * 3600000);
};
const tStr  = d => [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, "0")).join(":");
const t4    = d => [d.getHours(), d.getMinutes()].map(n => String(n).padStart(2, "0")).join(":");
const dKey  = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
const dLong = d => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const dDisp = s => { const [y, m, day] = s.split("-"); return dLong(new Date(+y, +m - 1, +day)); };
const dur   = (a, b) => { const ms = new Date(b) - new Date(a), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000); return h + "h " + m + "m"; };

// Name formatting from email
const nameF = e => e.includes("@") ? e.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Admin";
const inits = n => n.split(" ").slice(0, 2).map(p => p[0] || "").join("").toUpperCase() || "?";

// Local cache (Phase 3 will trim what we cache here)
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL) || "[]"); } catch { return []; } };
const saveLocal = r => localStorage.setItem(LOCAL, JSON.stringify(r));

// Sync badge in the home header
function setSyncBadge(state) {
  const b = document.getElementById("sync-badge");
  if (!b) return;
  b.className = "sync-badge";
  if (state === "ok")       { b.classList.add("sync-ok");  b.textContent = "Synced"; }
  else if (state === "err") { b.classList.add("sync-err"); b.textContent = "Offline mode"; }
  else                      { b.classList.add("sync-ing"); b.textContent = "Syncing..."; }
}

// Toast (transient bottom-center notification)
let TT;
const toast = (msg, type = "success") => {
  const clr = { success: "#16A34A", error: "#DC2626", warning: "#D97706" };
  const el  = document.getElementById("toast");
  el.textContent     = msg;
  el.style.background = clr[type] || clr.success;
  el.style.display    = "block";
  clearTimeout(TT);
  TT = setTimeout(() => el.style.display = "none", 4000);
};

// CSV export (used by both Home and Admin views)
function exportCSV(scope) {
  const src = scope === "user" ? records.filter(r => r.email === U.email) : [...records];
  let data = src;
  if (scope === "user") {
    if (fFrom) data = data.filter(r => r.date >= fFrom);
    if (fTo)   data = data.filter(r => r.date <= fTo);
    if (fMode) data = data.filter(r => r.workMode === fMode);
  }
  if (scope === "admin") {
    if (afPerson) data = data.filter(r => r.email === afPerson);
    if (afFrom)   data = data.filter(r => r.date >= afFrom);
    if (afTo)     data = data.filter(r => r.date <= afTo);
    if (afMode)   data = data.filter(r => r.workMode === afMode);
  }
  const hdr  = ["Name", "Email", "Date", "Clock In (TWN 24h)", "Clock Out (TWN 24h)", "Total Hours", "Work Location", "Status"];
  const rows = data.map(r => [r.name, r.email, dDisp(r.date), r.clockInDisplay || "", r.clockOutDisplay || "", r.duration || "", r.workMode, r.clockOut ? "Complete" : "In Progress"]);
  const csv  = [hdr, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  a.download = `funnow_attendance_${dKey(getTW())}.csv`;
  a.click();
}
