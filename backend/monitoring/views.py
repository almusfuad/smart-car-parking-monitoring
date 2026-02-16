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
from django.db.models import Count
from django.utils import timezone
from datetime import datetime

from .models import TelemetryData, ParkingLog, Alert, Device
from .serializers import TelemetrySerializer, ParkingLogSerializer
from .services import check_high_power, calculate_device_health


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

