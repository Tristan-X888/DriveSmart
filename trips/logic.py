# trips/logic.py
from __future__ import annotations
from typing import List, Sequence, Tuple
import math

LonLat = Tuple[float, float]  # [lon, lat]

# --- geometry helpers ---------------------------------------------------------

def _haversine_miles(p1: LonLat, p2: LonLat) -> float:
    """
    Great-circle distance between two [lon, lat] points in miles.
    """
    lon1, lat1 = p1
    lon2, lat2 = p2
    # convert to radians
    φ1 = math.radians(lat1)
    λ1 = math.radians(lon1)
    φ2 = math.radians(lat2)
    λ2 = math.radians(lon2)

    dφ = φ2 - φ1
    dλ = λ2 - λ1

    a = math.sin(dφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(dλ / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    R_miles = 3958.7613
    return R_miles * c


def _segment_distance_miles(a: LonLat, b: LonLat) -> float:
    return _haversine_miles(a, b)


def _interp_on_segment(a: LonLat, b: LonLat, t: float) -> LonLat:
    """
    Linear interpolation on a small segment (ok for short legs of a road polyline).
    t in [0,1] returns a point between a and b in lon/lat space.
    """
    ax, ay = a
    bx, by = b
    return (ax + (bx - ax) * t, ay + (by - ay) * t)

# --- public API ----------------------------------------------------------------

def compute_fuel_stops_along_line(
    line_coords: Sequence[LonLat],
    total_distance_miles: float,
    fuel_every_miles: float = 1000.0,
) -> List[LonLat]:
    """
    Evenly space fuel stops along a routed polyline by DISTANCE, not by index.
    Returns a list of [lon, lat] points placed at approx. multiples of `fuel_every_miles`
    from the start of the line.

    Args:
        line_coords: list of [lon, lat] vertices (LineString).
        total_distance_miles: route total distance (miles) (used for quick stop count).
        fuel_every_miles: spacing between fuel stops (default 1000 miles).

    Notes:
        - We never place a stop at the very first vertex (start) or final vertex (end).
        - If the route is shorter than `fuel_every_miles`, returns [].
        - Robust to small or unevenly spaced polylines.

    """
    pts = list(line_coords or [])
    if len(pts) < 2 or total_distance_miles <= 0 or fuel_every_miles <= 0:
      return []

    # How many stops do we want?
    num_stops = int(total_distance_miles // fuel_every_miles)
    if num_stops <= 0:
      return []

    # Precompute cumulative distances along the line
    seg_len = []
    for i in range(len(pts) - 1):
        d = _segment_distance_miles(pts[i], pts[i + 1])
        seg_len.append(max(d, 0.0))

    cum = [0.0]
    for d in seg_len:
        cum.append(cum[-1] + d)
    total_len = cum[-1]
    if total_len <= 0:
        return []

    # Targets at k * fuel_every_miles (k = 1..num_stops), clipped to < total_len
    targets = [k * fuel_every_miles for k in range(1, num_stops + 1) if k * fuel_every_miles < total_len]
    if not targets:
        return []

    # Walk the line once and place points
    fuel_points: List[LonLat] = []
    seg_index = 0
    for target in targets:
        # advance seg_index until cum[seg_index+1] >= target
        while seg_index < len(seg_len) - 1 and cum[seg_index + 1] < target:
            seg_index += 1

        # segment [seg_index] is where target falls
        seg_start_m = cum[seg_index]
        seg_end_m = cum[seg_index + 1]
        seg_d = seg_end_m - seg_start_m
        if seg_d <= 0:
            # degenerate segment, just use start vertex
            fuel_points.append(tuple(pts[seg_index]))  # type: ignore
            continue

        t = (target - seg_start_m) / seg_d  # 0..1
        p = _interp_on_segment(pts[seg_index], pts[seg_index + 1], t)
        fuel_points.append(p)

    return fuel_points
