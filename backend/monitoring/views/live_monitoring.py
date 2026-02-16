"""
Live Monitoring Views

This module provides real-time device monitoring endpoints
optimized for frequent polling (every 10 seconds).
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from ..models import TelemetryData, ParkingLog, Alert, Device
from ..services import calculate_device_health, calculate_power


class LiveDeviceStatusAPIView(APIView):
    """
    GET /api/devices/live-status/
    Returns real-time device status with latest telemetry and parking data.
    Optimized for 10-second polling intervals.
    
    Provides:
    - Device status (OK, WARNING, CRITICAL)
    - Latest telemetry data
    - Latest parking log
    - Active alerts
    - Health score
    """

    def get(self, request):
        devices = Device.objects.select_related('zone__facility').filter(is_active=True)
        now = timezone.now()
        
        live_data = []
        for device in devices:
            # Get latest telemetry data
            latest_telemetry = TelemetryData.objects.filter(
                device=device
            ).order_by('-timestamp').first()
            
            # Get latest parking log
            latest_parking = ParkingLog.objects.filter(
                device=device
            ).order_by('-timestamp').first()
            
            # Determine device status based on last_seen
            if not device.last_seen:
                status_label = 'CRITICAL'
                time_since_seen = None
            else:
                time_diff = (now - device.last_seen).total_seconds()
                time_since_seen = int(time_diff)
                
                if time_diff <= 120:  # 2 minutes
                    status_label = 'OK'
                elif time_diff <= 600:  # 10 minutes
                    status_label = 'WARNING'
                else:
                    status_label = 'CRITICAL'
            
            # Get active alerts
            alerts = Alert.objects.filter(
                device=device,
                is_active=True
            ).values('severity', 'message')
            
            # Calculate health score
            health_score = calculate_device_health(device)
            
            # Calculate power from telemetry if available
            power_value = None
            if latest_telemetry:
                power_value = calculate_power(
                    latest_telemetry.voltage,
                    latest_telemetry.current,
                    latest_telemetry.power_factor
                )
            
            live_data.append({
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
                'status': status_label,
                'health_score': health_score,
                'last_seen': device.last_seen.isoformat() if device.last_seen else None,
                'time_since_seen': time_since_seen,
                'telemetry': {
                    'voltage': latest_telemetry.voltage,
                    'current': latest_telemetry.current,
                    'power': round(power_value, 2),
                    'power_factor': latest_telemetry.power_factor,
                    'timestamp': latest_telemetry.timestamp.isoformat(),
                } if latest_telemetry else None,
                'parking': {
                    'is_occupied': latest_parking.is_occupied,
                    'timestamp': latest_parking.timestamp.isoformat(),
                } if latest_parking else None,
                'alerts': list(alerts),
                'alerts_count': len(alerts),
            })
        
        return Response({
            'timestamp': now.isoformat(),
            'devices': live_data,
            'total_devices': len(live_data),
        })
