"""
Reason:
Centralized business logic layer.
Prevents fat views and duplicated logic.
"""

from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from .models import Alert, TelemetryData, Device


HIGH_POWER_TRESHOLD = 2000    # watts


def calculate_power(voltage, current, power_factor):
    return voltage * current * power_factor


def check_high_power(device, telemetry):
    power = calculate_power(
        telemetry.voltage,
        telemetry.current,
        telemetry.power_factor
    )

    if power > HIGH_POWER_TRESHOLD:
        Alert.objects.create(
            device=device,
            message="Abnormally high power usage",
            severity=Alert.CRITICAL,
            is_active=True
        )


def check_device_offline():
    threshold = timezone.now() - timedelta(minutes=2)

    for device in Device.objects.filter(is_active=True):
        if not device.last_seen or device.last_seen < threshold:
            Alert.objects.get_or_create(
                device=device,
                message="Device offline",
                severity=Alert.WARNING,
                is_active=True
            )


def calculate_device_health(device):
    alerts_count = device.alerts.filter(is_active=True).count()
    score = 100 - (alerts_count * 10)

    if not device.last_seen:
        score -= 20  # No data received yet
    return max(score, 0)

