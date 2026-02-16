"""
Reason:
Explicit REST endpoints as required by the spec.
"""

from django.urls import path
from .views import (
    TelemetryAPIView,
    ParkingLogAPIView,
    BulkTelemetryAPIView,
    DashboardSummaryAPIView,
    ZonesPerformanceAPIView,
    DevicesHeartbeatAPIView,
    LiveDeviceStatusAPIView,
    FacilitiesListAPIView,
    AlertListAPIView,
    AlertAcknowledgeAPIView,
    AlertBulkAcknowledgeAPIView,
)


urlpatterns = [
    path('telemetry/', TelemetryAPIView.as_view(), name='telemetry'),
    path('telemetry/bulk/', BulkTelemetryAPIView.as_view(), name='bulk-telemetry'),
    path('parking-log/', ParkingLogAPIView.as_view(), name='parking-log'),
    path('dashboard/summary/', DashboardSummaryAPIView.as_view(), name='dashboard-summary'),
    path('dashboard/zones-performances/', ZonesPerformanceAPIView.as_view(), name='zones-performances'),
    path('dashboard/devices-hearbeat/', DevicesHeartbeatAPIView.as_view(), name='devices-heartbeat'),
    path('devices/live-status/', LiveDeviceStatusAPIView.as_view(), name='live-device-status'),
    path('facilities/', FacilitiesListAPIView.as_view(), name='facilities-list'),
    path('alerts/', AlertListAPIView.as_view(), name='alert-list'),
    path('alerts/<int:pk>/acknowledge/', AlertAcknowledgeAPIView.as_view(), name='alert-acknowledge'),
    path('alerts/bulk-acknowledge/', AlertBulkAcknowledgeAPIView.as_view(), name='alert-bulk-acknowledge'),
]