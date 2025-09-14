from rest_framework import serializers

class TripInputSerializer(serializers.Serializer):
    current_location = serializers.CharField()
    pickup_location = serializers.CharField()
    dropoff_location = serializers.CharField()
    current_cycle_used = serializers.IntegerField(min_value=0)
