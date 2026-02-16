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

from .models import TelemetryData, ParkingLog, Alert, Device, ParkingZone, ParkingFacility
from .serializers import TelemetrySerializer, ParkingLogSerializer, AlertSerializer
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
    """
    GET /api/dashboard/zones-performances/
    Query Parameters:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
    - search: Search by zone or facility name
    - sort_by: Sort by field (utilization, alerts, name) default: name
    - order: Sort order (asc, desc) default: asc
    """

    def get(self, request):
        zones = ParkingZone.objects.select_related('facility').prefetch_related('devices').all()
        
        # Apply filters
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')
        search_query = request.query_params.get('search', '').strip()
        
        if facility_id:
            zones = zones.filter(facility_id=facility_id)
        
        if zone_id:
            zones = zones.filter(id=zone_id)
        
        if search_query:
            zones = zones.filter(
                Q(name__icontains=search_query) | 
                Q(facility__name__icontains=search_query)
            )
        
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
                'facility_id': zone.facility.id,
                'total_devices': total_devices,
                'occupied_slots': occupied_slots,
                'daily_capacity': zone.daily_capacity,
                'utilization_percentage': round(utilization, 2),
                'active_alerts': active_alerts,
            })
        
        # Apply sorting
        sort_by = request.query_params.get('sort_by', 'name')
        order = request.query_params.get('order', 'asc')
        
        sort_field_map = {
            'name': 'name',
            'utilization': 'utilization_percentage',
            'alerts': 'active_alerts',
            'facility': 'facility',
        }
        
        sort_field = sort_field_map.get(sort_by, 'name')
        reverse = (order == 'desc')
        
        zones_data.sort(key=lambda x: x[sort_field], reverse=reverse)
        
        return Response(zones_data)


class DevicesHeartbeatAPIView(APIView):
    """
    GET /api/dashboard/devices-hearbeat/
    Query Parameters:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
    - status: Filter by status (OK, WARNING, CRITICAL)
    - search: Search by device code
    - sort_by: Sort by field (code, health, status) default: code
    - order: Sort order (asc, desc) default: asc
    """

    def get(self, request):
        devices = Device.objects.select_related('zone__facility').all()
        now = timezone.now()
        
        # Apply filters
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')
        status_filter = request.query_params.get('status')
        search_query = request.query_params.get('search', '').strip()
        
        if facility_id:
            devices = devices.filter(zone__facility_id=facility_id)
        
        if zone_id:
            devices = devices.filter(zone_id=zone_id)
        
        if search_query:
            devices = devices.filter(code__icontains=search_query)
        
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
            
            # Apply status filter
            if status_filter and status_label != status_filter:
                continue
            
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
                'zone_id': device.zone.id,
                'facility': device.zone.facility.name,
                'facility_id': device.zone.facility.id,
                'is_active': device.is_active,
                'last_seen': device.last_seen.isoformat() if device.last_seen else None,
                'status': status_label,
                'status_message': status_message,
                'health_score': health_score,
                'active_alerts': list(alerts),
                'alerts_count': len(alerts),
            })
        
        # Apply sorting
        sort_by = request.query_params.get('sort_by', 'code')
        order = request.query_params.get('order', 'asc')
        
        sort_field_map = {
            'code': 'code',
            'health': 'health_score',
            'status': 'status',
            'zone': 'zone',
            'facility': 'facility',
        }
        
        sort_field = sort_field_map.get(sort_by, 'code')
        reverse = (order == 'desc')
        
        devices_data.sort(key=lambda x: x[sort_field], reverse=reverse)
        
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


class FacilitiesListAPIView(APIView):
    """
    GET /api/facilities/
    Returns list of all parking facilities with their zones
    """

    def get(self, request):
        facilities = ParkingFacility.objects.prefetch_related('zones').all()
        
        facilities_data = []
        for facility in facilities:
            zones = facility.zones.all().values('id', 'name', 'daily_capacity')
            facilities_data.append({
                'id': facility.id,
                'name': facility.name,
                'zones': list(zones),
                'zones_count': len(zones),
            })
        
        return Response(facilities_data)


class AlertListAPIView(APIView):
    """
    GET /api/alerts/
    Returns list of alerts with filtering options
    Query params:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
    - severity: Filter by severity (INFO, WARNING, CRITICAL)
    - acknowledged: Filter by acknowledged status (true/false)
    - is_active: Filter by active status (true/false)
    - search: Search in message
    - sort_by: Sort field (created_at, severity)
    - order: Sort order (asc, desc)
    """

    def get(self, request):
        # Start with all alerts
        alerts = Alert.objects.select_related(
            'device__zone__facility'
        ).all()

        # Apply filters
        facility_id = request.query_params.get('facility')
        if facility_id:
            alerts = alerts.filter(device__zone__facility_id=facility_id)

        zone_id = request.query_params.get('zone')
        if zone_id:
            alerts = alerts.filter(device__zone_id=zone_id)

        severity = request.query_params.get('severity')
        if severity:
            alerts = alerts.filter(severity=severity.upper())

        acknowledged = request.query_params.get('acknowledged')
        if acknowledged is not None:
            is_acknowledged = acknowledged.lower() == 'true'
            alerts = alerts.filter(acknowledged=is_acknowledged)

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            active_status = is_active.lower() == 'true'
            alerts = alerts.filter(is_active=active_status)
        else:
            # By default, show only active alerts
            alerts = alerts.filter(is_active=True)

        search = request.query_params.get('search')
        if search:
            alerts = alerts.filter(
                Q(message__icontains=search) |
                Q(device__code__icontains=search)
            )

        # Sorting
        sort_by = request.query_params.get('sort_by', 'created_at')
        order = request.query_params.get('order', 'desc')
        
        valid_sort_fields = ['created_at', 'severity']
        if sort_by in valid_sort_fields:
            sort_field = f"-{sort_by}" if order == 'desc' else sort_by
            alerts = alerts.order_by(sort_field)

        # Serialize and return
        serializer = AlertSerializer(alerts, many=True)
        
        # Add summary stats
        total_alerts = alerts.count()
        acknowledged_count = alerts.filter(acknowledged=True).count()
        severity_counts = {
            'INFO': alerts.filter(severity='INFO').count(),
            'WARNING': alerts.filter(severity='WARNING').count(),
            'CRITICAL': alerts.filter(severity='CRITICAL').count(),
        }

        return Response({
            'alerts': serializer.data,
            'total': total_alerts,
            'acknowledged': acknowledged_count,
            'unacknowledged': total_alerts - acknowledged_count,
            'severity_counts': severity_counts,
        })


class AlertAcknowledgeAPIView(APIView):
    """
    PATCH /api/alerts/<id>/acknowledge/
    Acknowledges an alert
    """

    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response(
                {'error': 'Alert not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        alert.acknowledged = True
        alert.save(update_fields=['acknowledged'])

        serializer = AlertSerializer(alert)
        return Response(serializer.data)


class AlertBulkAcknowledgeAPIView(APIView):
    """
    POST /api/alerts/bulk-acknowledge/
    Acknowledges multiple alerts
    Body: { "alert_ids": [1, 2, 3] }
    """

    def post(self, request):
        alert_ids = request.data.get('alert_ids', [])
        
        if not alert_ids:
            return Response(
                {'error': 'No alert IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated = Alert.objects.filter(
            id__in=alert_ids,
            is_active=True
        ).update(acknowledged=True)

        return Response({
            'status': 'success',
            'acknowledged_count': updated
        })


class HourlyUsageAPIView(APIView):
    """
    GET /api/analytics/hourly-usage/
    Returns parking usage statistics grouped by hour for the last 24 hours
    Query params:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
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
            'data': hourly_data,
        })


class OccupancyTrendAPIView(APIView):
    """
    GET /api/analytics/occupancy-trend/
    Returns occupancy trend over time
    Query params:
    - days: Number of days to look back (default: 7)
    - facility: Filter by facility ID
    - zone: Filter by zone ID
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
                'occupied': occupied,
                'vacant': vacant,
                'total_events': total,
                'occupancy_rate': round((occupied / total * 100) if total > 0 else 0, 2),
            })
            
            current_date += timedelta(days=1)

        return Response({
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days,
            },
            'data': daily_data,
        })


class DeviceHealthAPIView(APIView):
    """
    GET /api/analytics/device-health/
    Returns device health metrics and statistics
    Query params:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
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
            'summary': {
                'total_devices': total_devices,
                'average_health': round(avg_health, 2),
                'healthy': health_categories['healthy'],
                'warning': health_categories['warning'],
                'critical': health_categories['critical'],
                'offline': health_categories['offline'],
            },
            'devices': device_health,
        })
