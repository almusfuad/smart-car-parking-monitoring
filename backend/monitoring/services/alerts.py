"""
Alert Services

This module provides business logic for alert management operations,
including filtering, statistics calculation, and acknowledgment.
"""

from django.db.models import Q
from django.utils import timezone

from ..models import Alert


def get_alerts_with_filters(facility_id=None, zone_id=None, severity=None,
                            acknowledged=None, is_active=None, search=None,
                            sort_by='created_at', order='desc'):
    """
    Get alerts with comprehensive filtering and sorting options.
    
    Args:
        facility_id: Optional facility filter
        zone_id: Optional zone filter
        severity: Optional severity filter
        acknowledged: Optional acknowledged status filter (bool)
        is_active: Optional active status filter (bool)
        search: Optional search string for message or device code
        sort_by: Field to sort by
        order: Sort order ('asc' or 'desc')
    
    Returns:
        QuerySet: Filtered and sorted alerts
    """
    # Start with all alerts
    alerts = Alert.objects.select_related('device__zone__facility').all()
    
    # Apply filters
    if facility_id:
        alerts = alerts.filter(device__zone__facility_id=facility_id)
    
    if zone_id:
        alerts = alerts.filter(device__zone_id=zone_id)
    
    if severity:
        alerts = alerts.filter(severity=severity.upper())
    
    if acknowledged is not None:
        is_acknowledged = acknowledged if isinstance(acknowledged, bool) else (acknowledged.lower() == 'true')
        alerts = alerts.filter(acknowledged=is_acknowledged)
    
    if is_active is not None:
        active_status = is_active if isinstance(is_active, bool) else (is_active.lower() == 'true')
        alerts = alerts.filter(is_active=active_status)
    else:
        # By default, show only active alerts
        alerts = alerts.filter(is_active=True)
    
    if search:
        alerts = alerts.filter(
            Q(message__icontains=search) |
            Q(device__code__icontains=search)
        )
    
    # Apply sorting
    valid_sort_fields = ['created_at', 'severity']
    if sort_by in valid_sort_fields:
        sort_field = f"-{sort_by}" if order == 'desc' else sort_by
        alerts = alerts.order_by(sort_field)
    
    return alerts


def calculate_alert_statistics(alerts_queryset):
    """
    Calculate summary statistics for a set of alerts.
    
    Args:
        alerts_queryset: QuerySet of alerts
    
    Returns:
        dict: {
            'total': total count,
            'acknowledged': acknowledged count,
            'unacknowledged': unacknowledged count,
            'severity_counts': counts by severity level
        }
    """
    total_alerts = alerts_queryset.count()
    acknowledged_count = alerts_queryset.filter(acknowledged=True).count()
    
    severity_counts = {
        'INFO': alerts_queryset.filter(severity='INFO').count(),
        'WARNING': alerts_queryset.filter(severity='WARNING').count(),
        'CRITICAL': alerts_queryset.filter(severity='CRITICAL').count(),
    }
    
    return {
        'total': total_alerts,
        'acknowledged': acknowledged_count,
        'unacknowledged': total_alerts - acknowledged_count,
        'severity_counts': severity_counts,
    }


def acknowledge_alert(alert_id):
    """
    Acknowledge a single alert.
    
    Args:
        alert_id: ID of the alert to acknowledge
    
    Returns:
        tuple: (success: bool, message: str, alert: Alert or None)
    """
    try:
        alert = Alert.objects.get(id=alert_id)
        
        if alert.acknowledged:
            return False, "Alert already acknowledged", alert
        
        alert.acknowledged = True
        alert.acknowledged_at = timezone.now()
        alert.save()
        
        return True, "Alert acknowledged successfully", alert
    
    except Alert.DoesNotExist:
        return False, "Alert not found", None


def bulk_acknowledge_alerts(alert_ids):
    """
    Acknowledge multiple alerts at once.
    
    Args:
        alert_ids: List of alert IDs to acknowledge
    
    Returns:
        dict: {
            'success': bool,
            'acknowledged_count': int,
            'skipped_count': int (already acknowledged),
            'not_found_count': int,
            'message': str
        }
    """
    if not alert_ids:
        return {
            'success': False,
            'acknowledged_count': 0,
            'skipped_count': 0,
            'not_found_count': 0,
            'message': 'No alert IDs provided'
        }
    
    # Get alerts to acknowledge
    alerts_to_ack = Alert.objects.filter(
        id__in=alert_ids,
        acknowledged=False
    )
    
    # Count results
    acknowledged_count = alerts_to_ack.count()
    already_acknowledged_count = Alert.objects.filter(
        id__in=alert_ids,
        acknowledged=True
    ).count()
    not_found_count = len(alert_ids) - acknowledged_count - already_acknowledged_count
    
    # Perform bulk update
    if acknowledged_count > 0:
        alerts_to_ack.update(
            acknowledged=True,
            acknowledged_at=timezone.now()
        )
    
    return {
        'success': True,
        'acknowledged_count': acknowledged_count,
        'skipped_count': already_acknowledged_count,
        'not_found_count': not_found_count,
        'message': f'Successfully acknowledged {acknowledged_count} alert(s)'
    }


def create_high_power_alert(device, telemetry, threshold=2000):
    """
    Create a high power usage alert for a device.
    
    Args:
        device: Device instance
        telemetry: TelemetryData instance
        threshold: Power threshold in watts
    
    Returns:
        Alert: Created alert instance
    """
    from .common import calculate_power
    
    power = calculate_power(
        telemetry.voltage,
        telemetry.current,
        telemetry.power_factor
    )
    
    if power > threshold:
        alert = Alert.objects.create(
            device=device,
            message=f"Abnormally high power usage: {power:.2f}W",
            severity=Alert.CRITICAL,
            is_active=True
        )
        return alert
    
    return None


def check_and_create_offline_alerts():
    """
    Check for offline devices and create alerts.
    
    Returns:
        int: Number of alerts created
    """
    from datetime import timedelta
    from ..models import Device
    
    threshold = timezone.now() - timedelta(minutes=2)
    alerts_created = 0
    
    for device in Device.objects.filter(is_active=True):
        if not device.last_seen or device.last_seen < threshold:
            # Use get_or_create to avoid duplicate alerts
            alert, created = Alert.objects.get_or_create(
                device=device,
                message="Device offline",
                severity=Alert.WARNING,
                is_active=True,
                defaults={'acknowledged': False}
            )
            if created:
                alerts_created += 1
    
    return alerts_created
