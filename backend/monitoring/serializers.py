"""
Reason:
Serializer-level validation for API payload correctness.
Device resolution by code.
"""


from rest_framework import serializers
from django.utils import timezone
from .models import Device, TelemetryData, ParkingLog


class TelemetrySerializer(serializers.ModelSerializer):
    device_code = serializers.CharField(write_only=True)

    class Meta:
        model = TelemetryData
        fields = [
            'device_code',
            'voltage',
            'current',
            'power_factor',
            'timestamp'
        ]


    def validate_timestamp(self, value):
        if value > timezone.now():
            raise serializers.ValidationError("Timestamp cannot be in the future.")
        return value
    
    def create(self, validated_data):
        code = validated_data.pop('device_code')
        device = Device.objects.filter(code=code).first()
        telemetry = TelemetryData.objects.create(device=device, **validated_data)
        device.last_seen = validated_data['timestamp']
        device.save(update_fields=['last_seen'])

        return telemetry
    

class ParkingLogSerializer(serializers.ModelSerializer):
    device_code = serializers.CharField(write_only=True)

    class Meta:
        model = ParkingLog
        fields = [
            'device_code',
            'is_occupied',
            'timestamp'
        ]

    def create(self, validated_data):
        code = validated_data.pop('device_code')
        device = Device.objects.filter(code=code).first()
        return ParkingLog.objects.create(device=device, **validated_data)