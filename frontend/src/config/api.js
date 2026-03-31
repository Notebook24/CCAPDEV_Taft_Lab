// src/config/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the backend URL.
//
// In development (Vite dev server):  VITE_API_URL is usually empty/unset,
//   so API_BASE_URL falls back to "" and the Vite proxy forwards /api calls.
//   OR set VITE_API_URL=http://localhost:3000 in your .env.local.
//
// In production (Render):  Set the environment variable
//   VITE_API_URL=https://your-backend.onrender.com  in the Render dashboard
//   for your *frontend* static site service (or leave it empty if you serve
//   both from the same Express service and everything is same-origin).
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default API_BASE_URL;