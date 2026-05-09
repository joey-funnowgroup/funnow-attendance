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

// Session persistence + idle logout
const SESSION_KEY      = "fn_att_session_v1";
const IDLE_TIMEOUT_MS  = 15 * 60 * 1000;  // 15 minutes

// Frontend admin-list cache (avoids blocking login on a network round-trip)
const ADMIN_CACHE_KEY  = "fn_att_admins_v1";
const ADMIN_CACHE_TTL  = 5 * 60 * 1000;   // 5 minutes

const SHEETS_READY = APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE";
