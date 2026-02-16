"""
Analytics Views

This module provides API endpoints for analytics and reporting,
including usage patterns, occupancy trends, and device health metrics.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from ..models import ParkingLog, TelemetryData, Device


class HourlyUsageAPIView(APIView):
    """
    GET /api/analytics/hourly-usage/
    Returns parking usage statistics grouped by hour for the last 24 hours.
    
    Query Parameters:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
    
    Returns hourly breakdown of:
    - Occupied count
    - Vacant count
    - Total events
    - Occupancy rate percentage
    """

    def get(self, request):
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')

        # Get data for the last 24 hours
        end_time = timezone.now()
        start_time = end_time - timedelta(hours=24)

        # Filter logs
        logs = ParkingLog.objects.filter(timestamp__gte=start_time, timestamp__lte=end_time)
        
        if facility_id:
            logs = logs.filter(device__zone__facility_id=facility_id)
        if zone_id:
            logs = logs.filter(device__zone_id=zone_id)

        # Group by hour and count
        hourly_data = []
        for i in range(24):
            hour_start = start_time + timedelta(hours=i)
            hour_end = hour_start + timedelta(hours=1)
            
            hour_logs = logs.filter(timestamp__gte=hour_start, timestamp__lt=hour_end)
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

        return Response({
            'period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat(),
            },
            'hourly_data': hourly_data,
            'summary': {
                'total_events': sum(h['total_events'] for h in hourly_data),
                'avg_occupancy_rate': round(
                    sum(h['occupancy_rate'] for h in hourly_data) / 24, 2
                ),
            }
        })


class OccupancyTrendAPIView(APIView):
    """
    GET /api/analytics/occupancy-trend/
    Returns occupancy trend over a specified time period.
    
    Query Parameters:
    - days: Number of days to look back (default: 7)
    - facility: Filter by facility ID
    - zone: Filter by zone ID
    
    Returns daily breakdown of:
    - Occupied count
    - Vacant count
    - Total events
    - Occupancy rate percentage
    """

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')

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
            
            daily_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'date_label': current_date.strftime('%b %d'),
                'total_parking': total,
                'occupied': occupied,
                'vacant': vacant,
                'avg_occupancy': round((occupied / total * 100) if total > 0 else 0, 2),
                'peak_occupancy': round((occupied / total * 100) if total > 0 else 0, 2),  # Simplified for now
            })
            
            current_date += timedelta(days=1)

        return Response({
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days,
            },
            'daily_data': daily_data,
            'summary': {
                'total_events': sum(d['total_parking'] for d in daily_data),
                'avg_occupancy': round(
                    sum(d['avg_occupancy'] for d in daily_data) / len(daily_data), 2
                ) if daily_data else 0,
            }
        })


class DeviceHealthAPIView(APIView):
    """
    GET /api/analytics/device-health/
    Returns device health metrics and statistics.
    
    Query Parameters:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
    
    Returns:
    - Summary metrics (total, average health, status counts)
    - Device categories (healthy, warning, critical, offline)
    - Individual device health details
    """

    def get(self, request):
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')

        # Get all devices
        devices = Device.objects.select_related('zone__facility').filter(is_active=True)
        
        if facility_id:
            devices = devices.filter(zone__facility_id=facility_id)
        if zone_id:
            devices = devices.filter(zone_id=zone_id)

        now = timezone.now()
        cutoff_time = now - timedelta(minutes=5)

        # Calculate health metrics for each device
        device_health = []
        health_categories = {'healthy': 0, 'warning': 0, 'critical': 0, 'offline': 0}
        
        for device in devices:
            # Get latest telemetry
            latest_telemetry = TelemetryData.objects.filter(device=device).order_by('-timestamp').first()
            
            if not latest_telemetry or not device.last_seen:
                status = 'offline'
                health_score = 0
                health_categories['offline'] += 1
            else:
                # Calculate health based on last seen time
                time_diff = (now - device.last_seen).total_seconds() / 60  # minutes
                
                if time_diff <= 1:
                    status = 'healthy'
                    health_score = 100
                    health_categories['healthy'] += 1
                elif time_diff <= 3:
                    status = 'warning'
                    health_score = 70
                    health_categories['warning'] += 1
                elif time_diff <= 5:
                    status = 'critical'
                    health_score = 40
                    health_categories['critical'] += 1
                else:
                    status = 'offline'
                    health_score = 0
                    health_categories['offline'] += 1

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

        return Response({
            'device_categories': health_categories,
            'metrics': {
                'total_devices': total_devices,
                'average_health': round(avg_health, 2),
                'healthy_percentage': round((health_categories['healthy'] / total_devices * 100) if total_devices > 0 else 0, 2),
            },
            'devices': device_health,
        })
