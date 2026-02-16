"""
Analytics Services

This module provides business logic for analytics and reporting operations,
including usage patterns, occupancy trends, and device health metrics.
"""

from django.utils import timezone
from datetime import timedelta

from ..models import ParkingLog, TelemetryData, Device


def calculate_hourly_usage(facility_id=None, zone_id=None, hours=24):
    """
    Calculate parking usage statistics grouped by hour.
    
    Args:
        facility_id: Optional facility filter
        zone_id: Optional zone filter
        hours: Number of hours to look back (default: 24)
    
    Returns:
        dict: {
            'period': {'start': datetime, 'end': datetime},
            'hourly_data': list of hourly statistics,
            'summary': aggregate statistics
        }
    """
    end_time = timezone.now()
    start_time = end_time - timedelta(hours=hours)
    
    # Filter logs
    logs = ParkingLog.objects.filter(
        timestamp__gte=start_time,
        timestamp__lte=end_time
    )
    
    if facility_id:
        logs = logs.filter(device__zone__facility_id=facility_id)
    if zone_id:
        logs = logs.filter(device__zone_id=zone_id)
    
    # Group by hour and count
    hourly_data = []
    for i in range(hours):
        hour_start = start_time + timedelta(hours=i)
        hour_end = hour_start + timedelta(hours=1)
        
        hour_logs = logs.filter(
            timestamp__gte=hour_start,
            timestamp__lt=hour_end
        )
        
        occupied_count = hour_logs.filter(is_occupied=True).count()
        vacant_count = hour_logs.filter(is_occupied=False).count()
        total = occupied_count + vacant_count
        
        hourly_data.append({
            'hour': hour_start.strftime('%Y-%m-%d %H:00'),
            'hour_label': hour_start.strftime('%H:00'),
            'occupied': occupied_count,
            'vacant': vacant_count,
            'total_events': total,
            'occupancy_rate': round((occupied_count / total * 100) if total > 0 else 0, 2),
        })
    
    # Calculate summary
    total_events = sum(h['total_events'] for h in hourly_data)
    avg_occupancy_rate = round(
        sum(h['occupancy_rate'] for h in hourly_data) / hours, 2
    ) if hourly_data else 0
    
    return {
        'period': {
            'start': start_time.isoformat(),
            'end': end_time.isoformat(),
        },
        'hourly_data': hourly_data,
        'summary': {
            'total_events': total_events,
            'avg_occupancy_rate': avg_occupancy_rate,
        }
    }


def calculate_occupancy_trend(days=7, facility_id=None, zone_id=None):
    """
    Calculate occupancy trend over a specified time period.
    
    Args:
        days: Number of days to look back (default: 7)
        facility_id: Optional facility filter
        zone_id: Optional zone filter
    
    Returns:
        dict: {
            'period': {'start': date, 'end': date, 'days': int},
            'daily_data': list of daily statistics,
            'summary': aggregate statistics
        }
    """
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Get logs for the period
    logs = ParkingLog.objects.filter(
        timestamp__date__gte=start_date,
        timestamp__date__lte=end_date
    )
    
    if facility_id:
        logs = logs.filter(device__zone__facility_id=facility_id)
    if zone_id:
        logs = logs.filter(device__zone_id=zone_id)
    
    # Group by date
    daily_data = []
    current_date = start_date
    
    while current_date <= end_date:
        day_logs = logs.filter(timestamp__date=current_date)
        occupied = day_logs.filter(is_occupied=True).count()
        vacant = day_logs.filter(is_occupied=False).count()
        total = occupied + vacant
        
        occupancy_rate = round((occupied / total * 100) if total > 0 else 0, 2)
        
        daily_data.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'date_label': current_date.strftime('%b %d'),
            'total_parking': total,
            'occupied': occupied,
            'vacant': vacant,
            'avg_occupancy': occupancy_rate,
            'peak_occupancy': occupancy_rate,  # Simplified - could calculate actual peak
        })
        
        current_date += timedelta(days=1)
    
    # Calculate summary
    total_events = sum(d['total_parking'] for d in daily_data)
    avg_occupancy = round(
        sum(d['avg_occupancy'] for d in daily_data) / len(daily_data), 2
    ) if daily_data else 0
    
    return {
        'period': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
            'days': days,
        },
        'daily_data': daily_data,
        'summary': {
            'total_events': total_events,
            'avg_occupancy': avg_occupancy,
        }
    }


def categorize_device_health_status(device, now=None):
    """
    Categorize a device's health status based on last_seen time.
    
    Args:
        device: Device instance
        now: Current time (defaults to timezone.now())
    
    Returns:
        tuple: (status, health_score) where status is one of:
               'healthy', 'warning', 'critical', 'offline'
    """
    if now is None:
        now = timezone.now()
    
    if not device.last_seen:
        return 'offline', 0
    
    time_diff = (now - device.last_seen).total_seconds() / 60  # minutes
    
    if time_diff <= 1:
        return 'healthy', 100
    elif time_diff <= 3:
        return 'warning', 70
    elif time_diff <= 5:
        return 'critical', 40
    else:
        return 'offline', 0


def calculate_device_health_metrics(facility_id=None, zone_id=None):
    """
    Calculate comprehensive device health metrics and statistics.
    
    Args:
        facility_id: Optional facility filter
        zone_id: Optional zone filter
    
    Returns:
        dict: {
            'device_categories': counts by health status,
            'metrics': overall statistics,
            'devices': individual device health data
        }
    """
    # Get all devices
    devices = Device.objects.select_related('zone__facility').filter(is_active=True)
    
    if facility_id:
        devices = devices.filter(zone__facility_id=facility_id)
    if zone_id:
        devices = devices.filter(zone_id=zone_id)
    
    now = timezone.now()
    
    # Calculate health metrics for each device
    device_health = []
    health_categories = {'healthy': 0, 'warning': 0, 'critical': 0, 'offline': 0}
    
    for device in devices:
        # Get latest telemetry
        latest_telemetry = TelemetryData.objects.filter(
            device=device
        ).order_by('-timestamp').first()
        
        # Categorize device health
        status, health_score = categorize_device_health_status(device, now)
        health_categories[status] += 1
        
        device_health.append({
            'device_code': device.code,
            'facility': device.zone.facility.name,
            'zone': device.zone.name,
            'health_score': health_score,
            'status': status,
            'last_seen': device.last_seen.isoformat() if device.last_seen else None,
        })
    
    # Calculate overall statistics
    total_devices = len(device_health)
    avg_health = sum(d['health_score'] for d in device_health) / total_devices if total_devices > 0 else 0
    healthy_percentage = round(
        (health_categories['healthy'] / total_devices * 100) if total_devices > 0 else 0, 2
    )
    
    return {
        'device_categories': health_categories,
        'metrics': {
            'total_devices': total_devices,
            'average_health': round(avg_health, 2),
            'healthy_percentage': healthy_percentage,
        },
        'devices': device_health,
    }
