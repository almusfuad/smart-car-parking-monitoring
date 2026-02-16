"""
Reason:
Explicit REST endpoints as required by the spec.
"""

from django.urls import path
from .views import (
    TelemetryAPIView,
    ParkingLogAPIView,
    BulkTelemetryAPIView,
    DashboardSummaryAPIView
)


urlpatterns = [
    path('telemetry/', TelemetryAPIView.as_view(), name='telemetry'),
    path('telemetry/bulk/', BulkTelemetryAPIView.as_view(), name='bulk-telemetry'),
    path('parking-log/', ParkingLogAPIView.as_view(), name='parking-log'),
    path('dashboard/summary/', DashboardSummaryAPIView.as_view(), name='dashboard-summary'),
]