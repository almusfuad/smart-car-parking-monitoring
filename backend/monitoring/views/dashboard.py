"""
Dashboard Views

This module provides API endpoints for the main dashboard interface,
including summary statistics, zone performance, and device heartbeat monitoring.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import datetime

from ..models import TelemetryData, ParkingLog, Alert, Device, ParkingZone
from ..services import calculate_device_health


class DashboardSummaryAPIView(APIView):
    """
    GET /api/dashboard/summary/?date=YYYY-MM-DD
    Returns dashboard summary statistics for a specific date.
    Includes total events, occupancy, active devices, and alert counts.
    """

    def get(self, request):
        date_str = request.query_params.get('date')
        date = datetime.strptime(date_str, "%Y-%m-%d").date()

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

        return Response({
            "total_events": total_events,
            "current_occupancy": current_occupancy,
            "active_devices": active_devices,
            "alerts_count": alerts_count,
        })


class ZonesPerformanceAPIView(APIView):
    """
    GET /api/dashboard/zones-performances/
    Returns zone performance metrics with filtering and sorting capabilities.
    
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
        
        # Build zone performance data
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
    Returns device heartbeat and health monitoring data with filtering.
    
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
        
        # Build device heartbeat data
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
