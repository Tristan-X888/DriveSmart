# trips/views.py
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TripInputSerializer
from .ors import geocode, route
from .logic import compute_fuel_stops_along_line
from .hos import build_daily_logs  # real HOS planner


class TripPlanView(APIView):
    """
    POST /api/trips/
    {
      "current_location": "Kansas City, MO",
      "pickup_location": "Chicago, IL",
      "dropoff_location": "Dallas, TX",
      "current_cycle_used": 20
    }
    """
    def post(self, request):
        ser = TripInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        # 1) Geocode
        cur = geocode(data["current_location"])
        pick = geocode(data["pickup_location"])
        drop = geocode(data["dropoff_location"])

        # 2) Route (cur -> pick -> drop)  [includes instructions & segments]
        coords = [list(cur), list(pick), list(drop)]
        r = route(coords)  # dict: { line_coords, distance_miles, duration_seconds, instructions, segments }

        # 3) Fueling stops (every ~1000 miles along the line)
        fuel = compute_fuel_stops_along_line(
            r["line_coords"], r["distance_miles"], 1000.0
        )

        # 4) Real HOS logs
        logs = build_daily_logs(
            distance_miles=float(r["distance_miles"]),
            route_drive_seconds=float(r["duration_seconds"]),
            current_cycle_used_hours=float(data.get("current_cycle_used", 0)),
        )

        return Response({
            "inputs": data,
            "route": {
                "geometry": {"type": "LineString", "coordinates": r["line_coords"]},
                "summary": {
                    "distance_miles": round(r["distance_miles"], 2),
                    "duration_seconds": r["duration_seconds"],
                },
                # NEW: pass through for the "Instructions" tab
                "instructions": r.get("instructions", []),
                "segments": r.get("segments", []),
            },
            "waypoints": {
                "current": list(cur),
                "pickup": list(pick),
                "dropoff": list(drop),
            },
            "stops": {"fueling": fuel},
            "logs": logs,
        }, status=status.HTTP_200_OK)


def ping(request):
    return JsonResponse({"status": "ok"})
