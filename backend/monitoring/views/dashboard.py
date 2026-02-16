"""
Dashboard Views

This module provides API endpoints for the main dashboard interface,
including summary statistics, zone performance, and device heartbeat monitoring.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import datetime

from ..services import (
    get_dashboard_summary,
    get_zones_performance,
    get_devices_heartbeat,
)


class DashboardSummaryAPIView(APIView):
    """
    GET /api/dashboard/summary/?date=YYYY-MM-DD
    Returns dashboard summary statistics for a specific date.
    Includes total events, occupancy, active devices, and alert counts.
    """

    def get(self, request):
        date_str = request.query_params.get('date')
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        summary = get_dashboard_summary(date)
        return Response(summary)


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
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')
        search_query = request.query_params.get('search', '').strip()
        sort_by = request.query_params.get('sort_by', 'name')
        order = request.query_params.get('order', 'asc')
        
        zones_data = get_zones_performance(
            facility_id=facility_id,
            zone_id=zone_id,
            search_query=search_query,
            sort_by=sort_by,
            order=order
        )
        
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
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')
        status_filter = request.query_params.get('status')
        search_query = request.query_params.get('search', '').strip()
        sort_by = request.query_params.get('sort_by', 'code')
        order = request.query_params.get('order', 'asc')
        
        devices_data = get_devices_heartbeat(
            facility_id=facility_id,
            zone_id=zone_id,
            status_filter=status_filter,
            search_query=search_query,
            sort_by=sort_by,
            order=order
        )
        
        return Response(devices_data)

