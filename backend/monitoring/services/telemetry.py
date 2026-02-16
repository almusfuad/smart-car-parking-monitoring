"""
Telemetry Services

This module provides business logic for telemetry data processing,
including data validation, bulk operations, and alert triggering.
"""

from django.db import transaction
from django.utils import timezone

from ..models import TelemetryData, Device
from .alerts import create_high_power_alert


def process_telemetry_data(device_code, telemetry_data, check_alerts=True):
    """
    Process and save telemetry data from a device.
    
    Args:
        device_code: Device code string
        telemetry_data: dict with voltage, current, power_factor
        check_alerts: Whether to check for alert conditions
    
    Returns:
        tuple: (success: bool, message: str, telemetry: TelemetryData or None)
    """
    try:
        device = Device.objects.get(code=device_code, is_active=True)
    except Device.DoesNotExist:
        return False, "Device not found or inactive", None
    
    # Create telemetry record
    telemetry = TelemetryData.objects.create(
        device=device,
        voltage=telemetry_data.get('voltage'),
        current=telemetry_data.get('current'),
        power_factor=telemetry_data.get('power_factor'),
        timestamp=timezone.now()
    )
    
    # Update device last_seen
    device.last_seen = telemetry.timestamp
    device.save(update_fields=['last_seen'])
    
    # Check for high power alerts
    if check_alerts:
        create_high_power_alert(device, telemetry)
    
    return True, "Telemetry data processed successfully", telemetry


def bulk_process_telemetry_data(telemetry_batch, check_alerts=True):
    """
    Process multiple telemetry records in a single transaction.
    
    Args:
        telemetry_batch: list of dicts, each with device_code and telemetry data
        check_alerts: Whether to check for alert conditions
    
    Returns:
        dict: {
            'success': bool,
            'processed_count': int,
            'failed_count': int,
            'errors': list of error messages
        }
    """
    processed_count = 0
    failed_count = 0
    errors = []
    
    try:
        with transaction.atomic():
            for item in telemetry_batch:
                device_code = item.get('device_code')
                
                if not device_code:
                    failed_count += 1
                    errors.append("Missing device_code in batch item")
                    continue
                
                success, message, _ = process_telemetry_data(
                    device_code,
                    item,
                    check_alerts=check_alerts
                )
                
                if success:
                    processed_count += 1
                else:
                    failed_count += 1
                    errors.append(f"{device_code}: {message}")
        
        return {
            'success': True,
            'processed_count': processed_count,
            'failed_count': failed_count,
            'errors': errors
        }
    
    except Exception as e:
        return {
            'success': False,
            'processed_count': 0,
            'failed_count': len(telemetry_batch),
            'errors': [f"Transaction failed: {str(e)}"]
        }


def validate_telemetry_data(data):
    """
    Validate telemetry data fields.
    
    Args:
        data: dict with voltage, current, power_factor
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    required_fields = ['voltage', 'current', 'power_factor']
    
    # Check required fields
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate types and ranges
    try:
        voltage = float(data['voltage'])
        current = float(data['current'])
        power_factor = float(data['power_factor'])
        
        if voltage < 0:
            return False, "Voltage must be non-negative"
        if current < 0:
            return False, "Current must be non-negative"
        if not (0 <= power_factor <= 1):
            return False, "Power factor must be between 0 and 1"
        
        return True, None
    
    except (ValueError, TypeError) as e:
        return False, f"Invalid data type: {str(e)}"
