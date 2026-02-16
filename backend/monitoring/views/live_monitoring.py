"""
Live Monitoring Views

This module provides real-time device monitoring endpoints
optimized for frequent polling (every 10 seconds).
"""

from rest_framework.views import APIView
from rest_framework.response import Response

from ..services import get_all_devices_live_status


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
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')
        
        result = get_all_devices_live_status(
            facility_id=facility_id,
            zone_id=zone_id
        )
        
        return Response(result)

