"""
Services Package

This package provides a feature-based service layer for the monitoring application.
Services encapsulate business logic and are organized by feature domain.

Modules:
- common: Shared utilities and calculations used across features
- dashboard: Dashboard summary, zone performance, device heartbeat
- analytics: Usage patterns, occupancy trends, device health metrics
- alerts: Alert management, filtering, acknowledgment, and statistics
- telemetry: Telemetry data processing and validation
- live_monitoring: Real-time device status and monitoring

Design Principles:
- Separation of concerns: Business logic isolated from view layer
- Reusability: Common functions shared across features
- Testability: Pure functions with minimal dependencies
- Maintainability: Clear module organization by feature

Usage:
    from monitoring.services import (
        get_dashboard_summary,
        calculate_hourly_usage,
        acknowledge_alert,
        get_device_live_status
    )
"""

# Common services
from .common import (
    calculate_power,
    determine_device_status,
    calculate_device_health,
    apply_filters_to_queryset,
    apply_search_filter,
    apply_sorting,
    HIGH_POWER_THRESHOLD,
)

# Dashboard services
from .dashboard import (
    get_dashboard_summary,
    calculate_zone_performance,
    get_zones_performance,
    calculate_device_heartbeat,
    get_devices_heartbeat,
)

# Analytics services
from .analytics import (
    calculate_hourly_usage,
    calculate_occupancy_trend,
    categorize_device_health_status,
    calculate_device_health_metrics,
)

# Alert services
from .alerts import (
    get_alerts_with_filters,
    calculate_alert_statistics,
    acknowledge_alert,
    bulk_acknowledge_alerts,
    create_high_power_alert,
    check_and_create_offline_alerts,
)

# Telemetry services
from .telemetry import (
    process_telemetry_data,
    bulk_process_telemetry_data,
    validate_telemetry_data,
)

# Live monitoring services
from .live_monitoring import (
    get_device_live_status,
    get_all_devices_live_status,
)


__all__ = [
    # Common
    'calculate_power',
    'determine_device_status',
    'calculate_device_health',
    'apply_filters_to_queryset',
    'apply_search_filter',
    'apply_sorting',
    'HIGH_POWER_THRESHOLD',
    
    # Dashboard
    'get_dashboard_summary',
    'calculate_zone_performance',
    'get_zones_performance',
    'calculate_device_heartbeat',
    'get_devices_heartbeat',
    
    # Analytics
    'calculate_hourly_usage',
    'calculate_occupancy_trend',
    'categorize_device_health_status',
    'calculate_device_health_metrics',
    
    # Alerts
    'get_alerts_with_filters',
    'calculate_alert_statistics',
    'acknowledge_alert',
    'bulk_acknowledge_alerts',
    'create_high_power_alert',
    'check_and_create_offline_alerts',
    
    # Telemetry
    'process_telemetry_data',
    'bulk_process_telemetry_data',
    'validate_telemetry_data',
    
    # Live Monitoring
    'get_device_live_status',
    'get_all_devices_live_status',
]


# For backward compatibility with old services.py
def check_high_power(device, telemetry):
    """
    Legacy function for backward compatibility.
    Use create_high_power_alert instead.
    """
    return create_high_power_alert(device, telemetry, threshold=HIGH_POWER_THRESHOLD)


def check_device_offline():
    """
    Legacy function for backward compatibility.
    Use check_and_create_offline_alerts instead.
    """
    return check_and_create_offline_alerts()
