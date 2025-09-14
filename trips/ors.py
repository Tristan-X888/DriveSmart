# trips/ors.py
"""
OpenRouteService helpers:
- geocode(query) -> [lon, lat]
- route(coords)  -> dict with:
    {
      "line_coords": [[lon,lat], ...],
      "distance_miles": float,
      "duration_seconds": float,
      # Optional extras for UI:
      "instructions": [  # normalized, friendly list the frontend can render
        {"text": str, "distance_meters": float, "duration_seconds": float, "name": str|None, "type": str|None},
        ...
      ],
      "segments": [... raw ORS segments ...]
    }
}

Notes:
- Uses the ORS "driving-hgv" profile (truck) to match property-carrying assumptions.
- Requires ORS_API_KEY in environment.
"""

from __future__ import annotations
import os
import requests
from typing import List, Dict, Any, Sequence, Tuple

LonLat = Tuple[float, float]
ORS_BASE = "https://api.openrouteservice.org"
PROFILE = "driving-hgv"  # truck routing profile


class ORSError(RuntimeError):
    pass


def _api_key() -> str:
    key = os.environ.get("ORS_API_KEY") or os.environ.get("OPENROUTESERVICE_API_KEY")
    if not key:
        raise ORSError("Missing ORS_API_KEY (or OPENROUTESERVICE_API_KEY) in environment.")
    return key


def geocode(query: str) -> LonLat:
    """
    Simple forward geocode via ORS Geocoding.
    Returns [lon, lat].
    """
    if not query:
        raise ValueError("geocode: query is required")

    url = f"{ORS_BASE}/geocode/search"
    params = {"api_key": _api_key(), "text": query, "size": 1}
    r = requests.get(url, params=params, timeout=20)
    if r.status_code != 200:
        raise ORSError(f"Geocode failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    feats = data.get("features") or []
    if not feats:
        raise ORSError(f"Geocode had no results for: {query}")
    coords = feats[0]["geometry"]["coordinates"]  # [lon, lat]
    return (float(coords[0]), float(coords[1]))


def route(coords: Sequence[LonLat]) -> Dict[str, Any]:
    """
    Request a truck route (driving-hgv) with step-by-step instructions.
    coords: list of [lon, lat] points (at least 2).
    """
    pts = list(coords or [])
    if len(pts) < 2:
        raise ValueError("route: need at least 2 coordinates [lon,lat]")

    url = f"{ORS_BASE}/v2/directions/{PROFILE}/geojson"
    headers = {"Authorization": _api_key(), "Content-Type": "application/json"}
    body = {
        "coordinates": [[float(x), float(y)] for (x, y) in pts],
        "instructions": True,
        "instructions_format": "text",
        "maneuvers": True,
        # optional: avoid restrictions if desired; keep defaults for now
    }

    r = requests.post(url, json=body, headers=headers, timeout=60)
    if r.status_code != 200:
        raise ORSError(f"Route failed: {r.status_code} {r.text[:400]}")
    data = r.json()

    # ORS GeoJSON structure:
    # { "type": "FeatureCollection",
    #   "features": [
    #      { "type": "Feature",
    #        "geometry": {"type":"LineString","coordinates":[[lon,lat],...]},
    #        "properties": {
    #            "summary": {"distance": meters, "duration": seconds},
    #            "segments": [
    #               {"distance": m, "duration": s, "steps":[
    #                   {"distance": m, "duration": s, "instruction": str, "name": "...", "type": "..."}, ...
    #               ]}, ...
    #            ]
    #        }
    #      }
    #   ]
    # }
    feats = (data.get("features") or [])
    if not feats:
        raise ORSError("Route response missing features")

    feat = feats[0]
    geom = feat.get("geometry") or {}
    props = feat.get("properties") or {}
    line_coords = geom.get("coordinates") or []
    summary = props.get("summary") or {}
    segments = props.get("segments") or []

    distance_meters = float(summary.get("distance") or 0.0)
    duration_seconds = float(summary.get("duration") or 0.0)
    distance_miles = distance_meters / 1609.344

    # Normalize steps into a single flat list for the UI.
    instructions = []
    for seg in segments:
        for s in seg.get("steps") or []:
            instructions.append({
                "text": s.get("instruction") or "",
                "distance_meters": float(s.get("distance") or 0.0),
                "duration_seconds": float(s.get("duration") or 0.0),
                "name": s.get("name"),
                "type": s.get("type"),
            })

    return {
        "line_coords": line_coords,
        "distance_miles": distance_miles,
        "duration_seconds": duration_seconds,
        "segments": segments,
        "instructions": instructions,  # frontend RouteInstructions can consume this directly
    }
