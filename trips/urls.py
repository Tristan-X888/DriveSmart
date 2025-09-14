from django.urls import path
from .views import TripPlanView, ping  # keep ping if you added it earlier

app_name = "trips"  # optional but recommended for namespacing

urlpatterns = [
    path("ping/", ping, name="ping"),                       # GET /api/ping/
    path("trips/", TripPlanView.as_view(), name="plan"),    # POST /api/trips/
]
