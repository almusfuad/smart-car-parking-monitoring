"""
Dashboard Services

This module provides business logic for dashboard-related operations,
including summary statistics, zone performance, and device heartbeat monitoring.
"""

from django.db.models import Q
from django.utils import timezone
from datetime import datetime

from ..models import TelemetryData, ParkingLog, Alert, Device, ParkingZone
from .common import calculate_device_health, determine_device_status, apply_sorting


def get_dashboard_summary(date):
    """
    Calculate dashboard summary statistics for a specific date.
    
    Args:
        date: Date object or string in 'YYYY-MM-DD' format
    
    Returns:
        dict: Summary statistics including total_events, current_occupancy,
              active_devices, and alerts_count
    """
    if isinstance(date, str):
        date = datetime.strptime(date, "%Y-%m-%d").date()
    
    # Count telemetry events for the date
    total_events = TelemetryData.objects.filter(
        timestamp__date=date
    ).count()
    
    # Get current parking occupancy
    current_occupancy = ParkingLog.objects.filter(
        is_occupied=True,
    ).count()
    
    # Count active devices
    active_devices = Device.objects.filter(
        is_active=True,
    ).count()
    
    # Count active alerts
    alerts_count = Alert.objects.filter(
        is_active=True,
    ).count()
    
    return {
        "total_events": total_events,
        "current_occupancy": current_occupancy,
        "active_devices": active_devices,
        "alerts_count": alerts_count,
    }


def calculate_zone_performance(zone):
    """
    Calculate performance metrics for a single zone.
    
    Args:
        zone: ParkingZone instance (should have 'devices' and 'facility' prefetched)
    
    Returns:
        dict: Zone performance data including utilization and alerts
    """
    # Get device count in this zone
    total_devices = zone.devices.filter(is_active=True).count()
    
    # Get current occupancy from latest parking logs
    occupied_slots = ParkingLog.objects.filter(
        device__zone=zone,
        is_occupied=True,
    ).values('device').distinct().count()
    
    # Calculate utilization percentage
    utilization = (occupied_slots / zone.daily_capacity * 100) if zone.daily_capacity > 0 else 0
    
    # Get active alerts for this zone
    active_alerts = Alert.objects.filter(
        device__zone=zone,
        is_active=True
    ).count()
    
    return {
        'id': zone.id,
        'name': zone.name,
        'facility': zone.facility.name,
        'facility_id': zone.facility.id,
        'total_devices': total_devices,
        'occupied_slots': occupied_slots,
        'daily_capacity': zone.daily_capacity,
        'utilization_percentage': round(utilization, 2),
        'active_alerts': active_alerts,
    }


def get_zones_performance(facility_id=None, zone_id=None, search_query=None, 
                          sort_by='name', order='asc'):
    """
    Get performance metrics for all zones with filtering and sorting.
    
    Args:
        facility_id: Optional facility filter
        zone_id: Optional zone filter
        search_query: Optional search string for zone/facility names
        sort_by: Field to sort by
        order: Sort order ('asc' or 'desc')
    
    Returns:
        list: Zone performance data for all matching zones
    """
    zones = ParkingZone.objects.select_related('facility').prefetch_related('devices').all()
    
    # Apply filters
    if facility_id:
        zones = zones.filter(facility_id=facility_id)
    
    if zone_id:
        zones = zones.filter(id=zone_id)
    
    if search_query:
        zones = zones.filter(
            Q(name__icontains=search_query) | 
            Q(facility__name__icontains=search_query)
        )
    
    # Build zone performance data
    zones_data = [calculate_zone_performance(zone) for zone in zones]
    
    # Apply sorting
    sort_field_map = {
        'name': 'name',
        'utilization': 'utilization_percentage',
        'alerts': 'active_alerts',
        'facility': 'facility',
    }
    
    return apply_sorting(zones_data, sort_by, order, sort_field_map)


def calculate_device_heartbeat(device, now=None):
    """
    Calculate heartbeat data for a single device.
    
    Args:
        device: Device instance (should have 'zone__facility' selected)
        now: Current time (defaults to timezone.now())
    
    Returns:
        dict: Device heartbeat data including status, health, and alerts
    """
    if now is None:
        now = timezone.now()
    
    # Determine device status
    status_info = determine_device_status(device, now)
    
    # Get active alerts for this device
    alerts = Alert.objects.filter(
        device=device,
        is_active=True
    ).values('severity', 'message')
    
    # Calculate health score
    health_score = calculate_device_health(device)
    
    return {
        'id': device.id,
        'code': device.code,
        'zone': device.zone.name,
        'zone_id': device.zone.id,
        'facility': device.zone.facility.name,
        'facility_id': device.zone.facility.id,
        'is_active': device.is_active,
        'last_seen': device.last_seen.isoformat() if device.last_seen else None,
        'status': status_info['status'],
        'status_message': status_info['message'],
        'health_score': health_score,
        'active_alerts': list(alerts),
        'alerts_count': len(alerts),
    }


def get_devices_heartbeat(facility_id=None, zone_id=None, status_filter=None,
                          search_query=None, sort_by='code', order='asc'):
    """
    Get heartbeat data for all devices with filtering and sorting.
    
    Args:
        facility_id: Optional facility filter
        zone_id: Optional zone filter
        status_filter: Optional status filter ('OK', 'WARNING', 'CRITICAL')
        search_query: Optional search string for device codes
        sort_by: Field to sort by
        order: Sort order ('asc' or 'desc')
    
    Returns:
        list: Device heartbeat data for all matching devices
    """
    devices = Device.objects.select_related('zone__facility').all()
    now = timezone.now()
    
    # Apply filters
    if facility_id:
        devices = devices.filter(zone__facility_id=facility_id)
    
    if zone_id:
        devices = devices.filter(zone_id=zone_id)
    
    if search_query:
        devices = devices.filter(code__icontains=search_query)
    
    # Build device heartbeat data
    devices_data = []
    for device in devices:
        device_data = calculate_device_heartbeat(device, now)
        
        # Apply status filter
        if status_filter and device_data['status'] != status_filter:
            continue
        
        devices_data.append(device_data)
    
    # Apply sorting
    sort_field_map = {
        'code': 'code',
        'health': 'health_score',
        'status': 'status',
        'zone': 'zone',
        'facility': 'facility',
    }
    
    return apply_sorting(devices_data, sort_by, order, sort_field_map)
