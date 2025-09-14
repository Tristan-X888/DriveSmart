// Small API client for the Django backend.
// Uses Vite env var VITE_API_BASE when present, otherwise defaults to localhost.

const API_BASE =
  (import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");

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
  return jsonFetch(`${API_BASE}/api/trips/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// (Optional) health check
export async function ping() {
  return jsonFetch(`${API_BASE}/api/ping/`, { method: "GET" });
}
