"""
Common/Shared Views

This module provides common API endpoints used across multiple features,
such as facilities and zones lookup data.
"""

from rest_framework.views import APIView
from rest_framework.response import Response

from ..models import ParkingFacility


class FacilitiesListAPIView(APIView):
    """
    GET /api/facilities/
    Returns list of all parking facilities with their zones.
    
    Used by frontend for populating facility and zone filters
    across dashboard, alerts, and analytics pages.
    
    Returns:
    - id: Facility ID
    - name: Facility name
    - zones: List of zones with id, name, and daily_capacity
    - zones_count: Total zones in facility
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
