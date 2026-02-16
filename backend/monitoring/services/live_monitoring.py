"""
Live Monitoring Services

This module provides business logic for real-time monitoring operations,
including live device status aggregation and real-time data retrieval.
"""

from django.utils import timezone

from ..models import TelemetryData, ParkingLog, Alert, Device
from .common import calculate_device_health, determine_device_status, calculate_power


def get_device_live_status(device, now=None):
    """
    Get comprehensive live status for a single device.
    
    Args:
        device: Device instance (should have 'zone__facility' selected)
        now: Current time (defaults to timezone.now())
    
    Returns:
        dict: Complete live status including telemetry, parking, alerts, and health
    """
    if now is None:
        now = timezone.now()
    
    # Get latest telemetry data
    latest_telemetry = TelemetryData.objects.filter(
        device=device
    ).order_by('-timestamp').first()
    
    # Get latest parking log
    latest_parking = ParkingLog.objects.filter(
        device=device
    ).order_by('-timestamp').first()
    
    # Determine device status
    status_info = determine_device_status(device, now)
    
    # Get active alerts
    alerts = Alert.objects.filter(
        device=device,
        is_active=True
    ).values('severity', 'message')
    
    # Calculate health score
    health_score = calculate_device_health(device)
    
    # Calculate power from telemetry if available
    power_value = None
    telemetry_data = None
    
    if latest_telemetry:
        power_value = calculate_power(
            latest_telemetry.voltage,
            latest_telemetry.current,
            latest_telemetry.power_factor
        )
        
        telemetry_data = {
            'voltage': latest_telemetry.voltage,
            'current': latest_telemetry.current,
            'power': round(power_value, 2),
            'power_factor': latest_telemetry.power_factor,
            'timestamp': latest_telemetry.timestamp.isoformat(),
        }
    
    # Format parking data
    parking_data = None
    if latest_parking:
        parking_data = {
            'is_occupied': latest_parking.is_occupied,
            'timestamp': latest_parking.timestamp.isoformat(),
        }
    
    return {
        'id': device.id,
        'code': device.code,
        'zone': {
            'id': device.zone.id,
            'name': device.zone.name,
        },
        'facility': {
            'id': device.zone.facility.id,
            'name': device.zone.facility.name,
        },
        'status': status_info['status'],
        'health_score': health_score,
        'last_seen': device.last_seen.isoformat() if device.last_seen else None,
        'time_since_seen': status_info['time_since_seen'],
        'telemetry': telemetry_data,
        'parking': parking_data,
        'alerts': list(alerts),
        'alerts_count': len(alerts),
    }


def get_all_devices_live_status(facility_id=None, zone_id=None):
    """
    Get live status for all active devices with optional filtering.
    
    Args:
        facility_id: Optional facility filter
        zone_id: Optional zone filter
    
    Returns:
        dict: {
            'timestamp': current timestamp,
            'devices': list of device live status data,
            'total_devices': count of devices
        }
    """
    devices = Device.objects.select_related('zone__facility').filter(is_active=True)
    
    # Apply filters
    if facility_id:
        devices = devices.filter(zone__facility_id=facility_id)
    if zone_id:
        devices = devices.filter(zone_id=zone_id)
    
    now = timezone.now()
    
    # Build live data for all devices
    live_data = [get_device_live_status(device, now) for device in devices]
    
    return {
        'timestamp': now.isoformat(),
        'devices': live_data,
        'total_devices': len(live_data),
    }
