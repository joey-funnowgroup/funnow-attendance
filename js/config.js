// ─────────────────────────────────────────────────────────────
// config.js — Public client configuration
// ─────────────────────────────────────────────────────────────
//
// Phase 1 NOTE: Values match the original index.html byte-for-byte.
// PWD will be removed in Phase 3 (server-side admin auth).
//

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdr4cInA-vcT_qG7i1dtrkRW5yd5-oEIw0bjFh7olAiKnUbUcg2P_f13arw1Q5pjXKAw/exec";
const PWD             = "FunNow@Admin25";
const LOCAL           = "fn_att_v5";
const GMAIL           = "https://gmailmcp.googleapis.com/mcp/v1";

const SHEETS_READY = APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE";
