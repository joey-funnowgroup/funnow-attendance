// ─────────────────────────────────────────────────────────────
// config.js — Public client configuration
// ─────────────────────────────────────────────────────────────
//
// Phase 3: client master password is gone — admin auth is server-side
// via Google ID-token verification + the Admins-sheet whitelist.
//

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdr4cInA-vcT_qG7i1dtrkRW5yd5-oEIw0bjFh7olAiKnUbUcg2P_f13arw1Q5pjXKAw/exec";
const LOCAL           = "fn_att_v5";

// Google Sign-In — public OAuth client ID (also referenced inline in index.html)
const GOOGLE_CLIENT_ID = "833536628314-kciu975apuhvd5c64df197tdg4p91hai.apps.googleusercontent.com";

// Sign-in domain allowlist — only these email domains are permitted to use the app.
// Any other domain (including personal Gmail) is rejected on both client and server.
const ALLOWED_DOMAINS = ["eatigo.com", "myfunnow.com"];

// Session persistence + idle logout
const SESSION_KEY      = "fn_att_session_v1";
const IDLE_TIMEOUT_MS  = 15 * 60 * 1000;  // 15 minutes

// Frontend admin-list cache (avoids blocking login on a network round-trip)
const ADMIN_CACHE_KEY  = "fn_att_admins_v1";
const ADMIN_CACHE_TTL  = 5 * 60 * 1000;   // 5 minutes

const SHEETS_READY = APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE";
