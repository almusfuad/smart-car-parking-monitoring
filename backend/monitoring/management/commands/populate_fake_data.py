"""
Management command to populate database with fake data for testing
Usage: python manage.py populate_fake_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import random
from monitoring.models import (
    ParkingFacility,
    ParkingZone,
    Device,
    TelemetryData,
    ParkingLog,
    Alert
)


class Command(BaseCommand):
    help = 'Populate database with fake data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting to populate fake data...'))

        # Clear existing data
        self.stdout.write('Clearing existing data...')
        Alert.objects.all().delete()
        ParkingLog.objects.all().delete()
        TelemetryData.objects.all().delete()
        Device.objects.all().delete()
        ParkingZone.objects.all().delete()
        ParkingFacility.objects.all().delete()

        # Create Parking Facilities
        self.stdout.write('Creating parking facilities...')
        facility1 = ParkingFacility.objects.create(name='Downtown Parking Hub')
        facility2 = ParkingFacility.objects.create(name='Airport Terminal Complex')
        facility3 = ParkingFacility.objects.create(name='Shopping Mall Parking')
        facilities = [facility1, facility2, facility3]
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(facilities)} facilities'))

        # Create Parking Zones
        self.stdout.write('Creating parking zones...')
        zones = []
        zones.append(ParkingZone.objects.create(facility=facility1, name='Zone A - Ground Floor', daily_capacity=50))
        zones.append(ParkingZone.objects.create(facility=facility1, name='Zone B - Level 1', daily_capacity=80))
        zones.append(ParkingZone.objects.create(facility=facility1, name='Zone C - Level 2', daily_capacity=100))
        zones.append(ParkingZone.objects.create(facility=facility2, name='Terminal 1 - Short Term', daily_capacity=120))
        zones.append(ParkingZone.objects.create(facility=facility2, name='Terminal 2 - Long Term', daily_capacity=200))
        zones.append(ParkingZone.objects.create(facility=facility3, name='East Wing', daily_capacity=150))
        zones.append(ParkingZone.objects.create(facility=facility3, name='West Wing', daily_capacity=150))
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(zones)} zones'))

        # Create Devices
        self.stdout.write('Creating devices...')
        devices = []
        device_counter = 1
        for zone in zones:
            num_devices = random.randint(2, 4)
            for i in range(num_devices):
                device = Device.objects.create(
                    zone=zone,
                    code=f'DEV-{device_counter:03d}',
                    is_active=True,
                    last_seen=timezone.now() - timedelta(seconds=random.randint(0, 3600))
                )
                devices.append(device)
                device_counter += 1
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(devices)} devices'))

        # Create TelemetryData
        self.stdout.write('Creating telemetry data...')
        telemetry_count = 0
        now = timezone.now()
        for device in devices:
            # Create telemetry for the last 24 hours
            num_records = random.randint(10, 20)
            for i in range(num_records):
                timestamp = now - timedelta(hours=random.randint(0, 24), minutes=random.randint(0, 59))
                voltage = round(random.uniform(220, 240), 2)
                current = round(random.uniform(5, 15), 2)
                power_factor = round(random.uniform(0.8, 0.95), 2)
                
                TelemetryData.objects.create(
                    device=device,
                    voltage=voltage,
                    current=current,
                    power_factor=power_factor,
                    timestamp=timestamp
                )
                telemetry_count += 1
        self.stdout.write(self.style.SUCCESS(f'✓ Created {telemetry_count} telemetry records'))

        # Create ParkingLogs
        self.stdout.write('Creating parking logs...')
        log_count = 0
        for device in devices:
            # Create parking logs for today
            num_logs = random.randint(5, 15)
            is_occupied = False
            for i in range(num_logs):
                timestamp = now - timedelta(hours=random.randint(0, 12), minutes=random.randint(0, 59))
                is_occupied = not is_occupied  # Toggle occupation
                
                ParkingLog.objects.create(
                    device=device,
                    is_occupied=is_occupied,
                    timestamp=timestamp
                )
                log_count += 1
        self.stdout.write(self.style.SUCCESS(f'✓ Created {log_count} parking logs'))

        # Create Alerts
        self.stdout.write('Creating alerts...')
        alert_count = 0
        severities = [Alert.CRITICAL, Alert.WARNING, Alert.INFO]
        messages = [
            'High power consumption detected (>2000W)',
            'Device offline for more than 2 minutes',
            'Low voltage detected',
            'Communication timeout',
            'Sensor calibration required',
            'Battery backup activated',
        ]
        
        # Create alerts for some devices
        alert_devices = random.sample(devices, min(8, len(devices)))
        for device in alert_devices:
            num_alerts = random.randint(1, 3)
            for i in range(num_alerts):
                Alert.objects.create(
                    device=device,
                    message=random.choice(messages),
                    severity=random.choice(severities),
                    is_active=random.choice([True, True, False]),  # 66% active
                    acknowledged=random.choice([True, False]),
                )
                alert_count += 1
        self.stdout.write(self.style.SUCCESS(f'✓ Created {alert_count} alerts'))

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('Database population completed successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'Facilities: {len(facilities)}')
        self.stdout.write(f'Zones: {len(zones)}')
        self.stdout.write(f'Devices: {len(devices)}')
        self.stdout.write(f'Telemetry Records: {telemetry_count}')
        self.stdout.write(f'Parking Logs: {log_count}')
        self.stdout.write(f'Alerts: {alert_count}')
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(self.style.SUCCESS('\nYou can now test the dashboard at http://localhost:5173'))
