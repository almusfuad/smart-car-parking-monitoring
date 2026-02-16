"""
Telemetry and Parking Log Data Ingestion Views

This module handles incoming telemetry data and parking log data from IoT devices.
Provides both single and bulk insertion endpoints for optimal performance.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..serializers import TelemetrySerializer, ParkingLogSerializer
from ..services import validate_telemetry_data, process_telemetry_data, bulk_process_telemetry_data


class TelemetryAPIView(APIView):
    """
    POST /api/telemetry/
    Single telemetry data ingestion endpoint.
    Validates data and triggers power consumption checks.
    """

    def post(self, request):
        # Validate telemetry data
        is_valid, error_msg = validate_telemetry_data(request.data)
        if not is_valid:
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use serializer for database insertion
        serializer = TelemetrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        telemetry = serializer.save()
        
        # Check for high power alerts (handled in service)
        from ..services import create_high_power_alert
        create_high_power_alert(telemetry.device, telemetry)
        
        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)


class BulkTelemetryAPIView(APIView):
    """
    POST /api/telemetry/bulk/
    Bulk telemetry data ingestion endpoint.
    Optimized for batch processing with atomic transactions.
    """

    def post(self, request):
        if not isinstance(request.data, list):
            return Response(
                {'error': 'Expected a list of telemetry records'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process bulk telemetry data using service layer
        result = bulk_process_telemetry_data(
            request.data,
            check_alerts=True
        )
        
        if not result['success']:
            return Response(
                {
                    'error': 'Batch processing failed',
                    'details': result['errors']
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'status': 'ok',
            'inserted': result['processed_count'],
            'failed': result['failed_count'],
            'errors': result['errors']
        }, status=status.HTTP_201_CREATED)


class ParkingLogAPIView(APIView):
    """
    POST /api/parking-log/
    Parking log data ingestion endpoint.
    Records parking slot occupancy changes.
    """

    def post(self, request):
        serializer = ParkingLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "ok"})

