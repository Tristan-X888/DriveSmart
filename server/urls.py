from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("trips.urls")), # <-- mounts all app routes under /api/
]