"""
Reason:
Domain-driven relational models.
Includes DB-level constraints for:
- Unique telemetry per device-timestamp
- Alert deduplication
- Indexed time-series access
"""


from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class ParkingFacility(models.Model):
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name
    

class ParkingZone(models.Model):
    facility = models.ForeignKey(
        ParkingFacility,
        on_delete=models.CASCADE,
        related_name='zones'
    )
    name = models.CharField(max_length=100)
    daily_capacity = models.PositiveIntegerField(default=100)

    class Meta:
        unique_together = ('facility', 'name')

    def __str__(self):
        return f"{self.facility.name} - {self.name}"
    

class Device(models.Model):
    zone = models.ForeignKey(
        ParkingZone,
        on_delete=models.CASCADE,
        related_name='devices',
    )
    code = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.zone} - {self.code}"
    

class TelemetryData(models.Model):
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='telemetry',
    )
    voltage = models.FloatField()
    current = models.FloatField()
    power_factor = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    timestamp = models.DateTimeField(db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['device', 'timestamp'],
                name='unique_device_timestamp'
            )
        ]
        indexes = [
            models.Index(fields=['timestamp']),
        ]



class ParkingLog(models.Model):
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='logs',
    )
    is_occupied = models.BooleanField()
    timestamp = models.DateTimeField(db_index=True)


    class Meta:
        indexes = [
            models.Index(fields=['timestamp']),
        ]



class Alert(models.Model):
    
    INFO = 'INFO'
    WARNING = 'WARNING'
    CRITICAL = 'CRITICAL'

    SEVERITY_CHOICES = [
        (INFO, 'Info'),
        (WARNING, 'Warning'),
        (CRITICAL, 'Critical'),
    ]


    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='alerts',
    )
    message = models.CharField(max_length=255)
    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_CHOICES,
    )
    is_active = models.BooleanField(default=True)
    acknowledged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["device", "message", "is_active"],
                condition=models.Q(is_active=True),
                name="unique_active_alert"
            )
        ]