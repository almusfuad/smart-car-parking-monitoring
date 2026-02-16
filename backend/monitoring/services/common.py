"""
Common Services

This module provides shared business logic used across multiple features,
including device status determination, power calculations, and health scoring.
"""

from django.utils import timezone
from datetime import timedelta
from django.db.models import Q


HIGH_POWER_THRESHOLD = 2000  # watts


def calculate_power(voltage, current, power_factor):
    """
    Calculate power consumption in watts.
    
    Args:
        voltage: Voltage in volts
        current: Current in amperes
        power_factor: Power factor (0-1)
    
    Returns:
        Power in watts
    """
    return voltage * current * power_factor


def determine_device_status(device, now=None):
    """
    Determine device status based on last_seen timestamp.
    
    Args:
        device: Device instance
        now: Current time (defaults to timezone.now())
    
    Returns:
        dict: {
            'status': 'OK' | 'WARNING' | 'CRITICAL',
            'message': Status description,
            'time_since_seen': Seconds since last seen (or None)
        }
    """
    if now is None:
        now = timezone.now()
    
    if not device.last_seen:
        return {
            'status': 'CRITICAL',
            'message': 'Never seen',
            'time_since_seen': None
        }
    
    time_diff = (now - device.last_seen).total_seconds()
    
    if time_diff <= 120:  # 2 minutes
        return {
            'status': 'OK',
            'message': 'Online',
            'time_since_seen': int(time_diff)
        }
    elif time_diff <= 600:  # 10 minutes
        return {
            'status': 'WARNING',
            'message': 'Delayed',
            'time_since_seen': int(time_diff)
        }
    else:
        return {
            'status': 'CRITICAL',
            'message': 'Offline',
            'time_since_seen': int(time_diff)
        }


def calculate_device_health(device):
    """
    Calculate device health score (0-100).
    
    Args:
        device: Device instance (must have alerts relationship)
    
    Returns:
        int: Health score (0-100)
    """
    from ..models import Alert
    
    alerts_count = Alert.objects.filter(device=device, is_active=True).count()
    score = 100 - (alerts_count * 10)
    
    if not device.last_seen:
        score -= 20  # No data received yet
    
    return max(score, 0)


def apply_filters_to_queryset(queryset, filters, field_mapping=None):
    """
    Apply multiple filters to a queryset dynamically.
    
    Args:
        queryset: Django queryset to filter
        filters: dict of filter_key: filter_value
        field_mapping: Optional dict mapping filter keys to model fields
    
    Returns:
        Filtered queryset
    """
    if field_mapping is None:
        field_mapping = {}
    
    for key, value in filters.items():
        if value is not None and value != '':
            field_name = field_mapping.get(key, key)
            if isinstance(value, bool) or value in ['true', 'false']:
                # Handle boolean filters
                bool_value = value if isinstance(value, bool) else (value.lower() == 'true')
                queryset = queryset.filter(**{field_name: bool_value})
            else:
                # Handle regular filters
                queryset = queryset.filter(**{field_name: value})
    
    return queryset


def apply_search_filter(queryset, search_query, search_fields):
    """
    Apply search across multiple fields using OR logic.
    
    Args:
        queryset: Django queryset
        search_query: Search string
        search_fields: List of field names to search (supports __icontains)
    
    Returns:
        Filtered queryset
    """
    if not search_query or not search_fields:
        return queryset
    
    q_objects = Q()
    for field in search_fields:
        q_objects |= Q(**{f"{field}__icontains": search_query})
    
    return queryset.filter(q_objects)


def apply_sorting(data_list, sort_by, order='asc', field_mapping=None):
    """
    Sort a list of dictionaries by a specified field.
    
    Args:
        data_list: List of dictionaries
        sort_by: Field name to sort by
        order: 'asc' or 'desc'
        field_mapping: Optional dict mapping sort keys to data keys
    
    Returns:
        Sorted list
    """
    if field_mapping is None:
        field_mapping = {}
    
    sort_field = field_mapping.get(sort_by, sort_by)
    reverse = (order == 'desc')
    
    return sorted(data_list, key=lambda x: x.get(sort_field, 0), reverse=reverse)
