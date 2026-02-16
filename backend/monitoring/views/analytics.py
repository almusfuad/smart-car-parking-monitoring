"""
Analytics Views

This module provides API endpoints for analytics and reporting,
including usage patterns, occupancy trends, and device health metrics.
"""

from rest_framework.views import APIView
from rest_framework.response import Response

from ..services import (
    calculate_hourly_usage,
    calculate_occupancy_trend,
    calculate_device_health_metrics,
)


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
        
        result = calculate_hourly_usage(
            facility_id=facility_id,
            zone_id=zone_id,
            hours=24
        )
        
        return Response(result)


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
        
        result = calculate_occupancy_trend(
            days=days,
            facility_id=facility_id,
            zone_id=zone_id
        )
        
        return Response(result)


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
        
        result = calculate_device_health_metrics(
            facility_id=facility_id,
            zone_id=zone_id
        )
        
        return Response(result)

