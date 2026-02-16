"""
Views Package - Feature-Based Organization

This package organizes Django REST Framework API views by feature/domain concern
rather than grouping them in a single monolithic file.

Organization:
- telemetry.py: Data ingestion (telemetry and parking logs)
- dashboard.py: Dashboard summary and zone/device performance
- live_monitoring.py: Real-time device monitoring
- alerts.py: Alert management and acknowledgment
- analytics.py: Analytics and reporting endpoints
- common.py: Shared/common endpoints (facilities list)

All views are exported here for backward compatibility with urls.py
"""

# Data Ingestion Views
from .telemetry import (
    TelemetryAPIView,
    BulkTelemetryAPIView,
    ParkingLogAPIView,
)

# Dashboard Views
from .dashboard import (
    DashboardSummaryAPIView,
    ZonesPerformanceAPIView,
    DevicesHeartbeatAPIView,
)

# Live Monitoring Views
from .live_monitoring import (
    LiveDeviceStatusAPIView,
)

# Alert Management Views
from .alerts import (
    AlertListAPIView,
    AlertAcknowledgeAPIView,
    AlertBulkAcknowledgeAPIView,
)

# Analytics Views
from .analytics import (
    HourlyUsageAPIView,
    OccupancyTrendAPIView,
    DeviceHealthAPIView,
)

# Common/Shared Views
from .common import (
    FacilitiesListAPIView,
)

# Export all views for backward compatibility
__all__ = [
    # Data Ingestion
    'TelemetryAPIView',
    'BulkTelemetryAPIView',
    'ParkingLogAPIView',
    # Dashboard
    'DashboardSummaryAPIView',
    'ZonesPerformanceAPIView',
    'DevicesHeartbeatAPIView',
    # Live Monitoring
    'LiveDeviceStatusAPIView',
    # Alerts
    'AlertListAPIView',
    'AlertAcknowledgeAPIView',
    'AlertBulkAcknowledgeAPIView',
    # Analytics
    'HourlyUsageAPIView',
    'OccupancyTrendAPIView',
    'DeviceHealthAPIView',
    # Common
    'FacilitiesListAPIView',
]
