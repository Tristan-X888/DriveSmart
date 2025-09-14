# trips/serializers.py
from rest_framework import serializers


class TripInputSerializer(serializers.Serializer):
    """
    Input schema for POST /api/trips/
    {
      "current_location": "Kansas City, MO",
      "pickup_location": "Chicago, IL",
      "dropoff_location": "Dallas, TX",
      "current_cycle_used": 20
    }
    """
    current_location = serializers.CharField(
        max_length=200,
        allow_blank=False,
        trim_whitespace=True,
    )
    pickup_location = serializers.CharField(
        max_length=200,
        allow_blank=False,
        trim_whitespace=True,
    )
    dropoff_location = serializers.CharField(
        max_length=200,
        allow_blank=False,
        trim_whitespace=True,
    )
    # Enforce 0–70 on the API even if the UI limits to 2 digits
    current_cycle_used = serializers.IntegerField(
        min_value=0,
        max_value=70,
        help_text="Hours already used in the 70hr/8day cycle (0–70).",
    )

    def validate(self, attrs):
        # Optional extra guardrails: ensure the three places are not all identical
        cl = attrs.get("current_location", "").strip().lower()
        pl = attrs.get("pickup_location", "").strip().lower()
        dl = attrs.get("dropoff_location", "").strip().lower()

        if cl and pl and dl and (cl == pl == dl):
            raise serializers.ValidationError(
                {"detail": "Current, pickup, and dropoff locations cannot all be the same."}
            )
        return attrs
