"""
Telemetry and Parking Log Data Ingestion Views

This module handles incoming telemetry data and parking log data from IoT devices.
Provides both single and bulk insertion endpoints for optimal performance.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from ..models import TelemetryData, Device
from ..serializers import TelemetrySerializer, ParkingLogSerializer
from ..services import check_high_power


class TelemetryAPIView(APIView):
    """
    POST /api/telemetry/
    Single telemetry data ingestion endpoint.
    Validates data and triggers power consumption checks.
    """

    def post(self, request):
        serializer = TelemetrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        telemetry = serializer.save()

        # Trigger alert check for high power consumption
        check_high_power(telemetry.device, telemetry)

        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)


class BulkTelemetryAPIView(APIView):
    """
    POST /api/telemetry/bulk/
    Bulk telemetry data ingestion endpoint.
    Optimized for batch processing with atomic transactions.
    """

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
