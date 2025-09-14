// Small API client for the Django backend.
// Uses Vite env var VITE_API_BASE when present, otherwise defaults to localhost.

export const API_BASE =
  (import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");

// ---- helpers ----
function sanitizeCycleUsed(val) {
  // keep only digits, limit to 2 chars (UI mirrors this), then clamp 0–70
  const digits = String(val ?? "").replace(/\D/g, "").slice(0, 2);
  const n = Number.parseInt(digits || "0", 10);
  return Math.max(0, Math.min(70, Number.isFinite(n) ? n : 0));
}

// optional light trimming for text inputs (doesn't alter valid content)
function trimStr(x) {
  return typeof x === "string" ? x.trim() : x;
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // leave data as null; we'll still throw with raw text if not ok
  }
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.error || JSON.stringify(data))) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/**
 * POST /api/trips/
 * body: {
 *   current_location: string,
 *   pickup_location: string,
 *   dropoff_location: string,
 *   current_cycle_used: number
 * }
 * returns: {
 *   inputs, route: { geometry, summary, instructions?, segments? },
 *   waypoints, stops, logs
 * }
 */
export async function planTrip(payload) {
  const body = {
    current_location: trimStr(payload?.current_location),
    pickup_location: trimStr(payload?.pickup_location),
    dropoff_location: trimStr(payload?.dropoff_location),
    current_cycle_used: sanitizeCycleUsed(payload?.current_cycle_used),
  };
  return jsonFetch(`${API_BASE}/api/trips/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// (Optional) health check
export async function ping() {
  return jsonFetch(`${API_BASE}/api/ping/`, { method: "GET" });
}
