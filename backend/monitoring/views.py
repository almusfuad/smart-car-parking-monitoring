"""
Reason:
Clean APIView usage.
Bulk insert optimized.
Aggregation done via ORM.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Count, Q, Max
from django.utils import timezone
from datetime import datetime, timedelta

from .models import TelemetryData, ParkingLog, Alert, Device, ParkingZone
from .serializers import TelemetrySerializer, ParkingLogSerializer
from .services import check_high_power, calculate_device_health, calculate_power


class TelemetryAPIView(APIView):

    def post(self, request):
        serializer = TelemetrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        telemetry = serializer.save()

        check_high_power(telemetry.device, telemetry)

        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)
    

class BulkTelemetryAPIView(APIView):

    def post(self, request):
        serializer = TelemetrySerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            objects = []

            for item in serializer.validated_data:
                device = Device.objects.filter(
                    code=item.pop('device_code')
                ).first()
                objects.append(TelemetryData(device=device, **item))


            TelemetryData.objects.bulk_create(
                objects,
                ignore_conflicts=True
            )

        return Response({"inserted": len(objects)}, status=status.HTTP_201_CREATED)
    

class ParkingLogAPIView(APIView):
    
    def post(self, request):
        serializer = ParkingLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "ok"})
    

class DashboardSummaryAPIView(APIView):

    def get(self, request):
        date_str = request.query_params.get('date')
        date = datetime.strptime(
            date_str, "%Y-%m-%d"
        ).date()

        total_events = TelemetryData.objects.filter(
            timestamp__date=date
        ).count()

        current_occupancy = ParkingLog.objects.filter(
            is_occupied=True,
        ).count()

        active_devices = Device.objects.filter(
            is_active=True,
        ).count()

        alerts_count = Alert.objects.filter(
            is_active=True,
        ).count()

        return Response({
            "total_events": total_events,
            "current_occupancy": current_occupancy,
            "active_devices": active_devices,
            "alerts_count": alerts_count,
        })


class ZonesPerformanceAPIView(APIView):

    def get(self, request):
        zones = ParkingZone.objects.select_related('facility').prefetch_related('devices').all()
        
        zones_data = []
        for zone in zones:
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
            
            zones_data.append({
                'id': zone.id,
                'name': zone.name,
                'facility': zone.facility.name,
                'total_devices': total_devices,
                'occupied_slots': occupied_slots,
                'daily_capacity': zone.daily_capacity,
                'utilization_percentage': round(utilization, 2),
                'active_alerts': active_alerts,
            })
        
        return Response(zones_data)


class DevicesHeartbeatAPIView(APIView):

    def get(self, request):
        devices = Device.objects.select_related('zone__facility').all()
        now = timezone.now()
        
        devices_data = []
        for device in devices:
            # Determine device status based on last_seen
            if not device.last_seen:
                status_label = 'CRITICAL'
                status_message = 'Never seen'
            else:
                time_diff = (now - device.last_seen).total_seconds()
                if time_diff <= 120:  # 2 minutes
                    status_label = 'OK'
                    status_message = 'Online'
                elif time_diff <= 600:  # 10 minutes
                    status_label = 'WARNING'
                    status_message = 'Delayed'
                else:
                    status_label = 'CRITICAL'
                    status_message = 'Offline'
            
            # Get active alerts for this device
            alerts = Alert.objects.filter(
                device=device,
                is_active=True
            ).values('severity', 'message')
            
            # Calculate health score
            health_score = calculate_device_health(device)
            
            devices_data.append({
                'id': device.id,
                'code': device.code,
                'zone': device.zone.name,
                'facility': device.zone.facility.name,
                'is_active': device.is_active,
                'last_seen': device.last_seen.isoformat() if device.last_seen else None,
                'status': status_label,
                'status_message': status_message,
                'health_score': health_score,
                'active_alerts': list(alerts),
                'alerts_count': len(alerts),
            })
        
        return Response(devices_data)


class LiveDeviceStatusAPIView(APIView):
    """
    Real-time device monitoring endpoint with latest telemetry and parking status.
    Optimized for 10-second polling.
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
