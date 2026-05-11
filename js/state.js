// ─────────────────────────────────────────────────────────────
// state.js — Module-scope app state shared across view scripts
// ─────────────────────────────────────────────────────────────
//
// Phase 1 NOTE: kept as top-level `let`/`var` so all script files can
// reference them (classic scripts share the global lexical env).
//

let U = null;            // Current signed-in user { email, name, photo }
let G_ID_TOKEN = null;   // Google ID token (JWT) for the current session — sent to the backend on every protected request
let MODE = "Office";     // Currently selected work location
let BUSY = false;        // True while a clock-in/out network call is in flight
let records = [];        // All in-memory attendance records
let adminEmails = [];    // Admins whitelist (lowercase emails)

// User-side filter state
let fFrom = "", fTo = "", fMode = "";

// Admin-side filter state
let afPerson = "", afFrom = "", afTo = "", afMode = "";

// Edit modal context (which date row is being edited)
let editDateContext = "";

// Returns today's record for the signed-in user (or null)
const todayRec = () => {
  if (!U) return null;
  const t = dKey(getTW());
  return records.find(r => r.email === U.email && r.date === t) || null;
};
