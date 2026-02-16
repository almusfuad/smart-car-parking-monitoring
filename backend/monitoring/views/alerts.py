"""
Alert Management Views

This module provides API endpoints for alert monitoring and management,
including listing, filtering, acknowledgment, and bulk operations.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from ..models import Alert
from ..serializers import AlertSerializer


class AlertListAPIView(APIView):
    """
    GET /api/alerts/
    Returns list of alerts with comprehensive filtering and sorting options.
    
    Query Parameters:
    - facility: Filter by facility ID
    - zone: Filter by zone ID
    - severity: Filter by severity (INFO, WARNING, CRITICAL)
    - acknowledged: Filter by acknowledged status (true/false)
    - is_active: Filter by active status (true/false)
    - search: Search in message or device code
    - sort_by: Sort field (created_at, severity) default: created_at
    - order: Sort order (asc, desc) default: desc
    
    Returns:
    - alerts: List of alert objects
    - total: Total alert count
    - acknowledged: Acknowledged count
    - unacknowledged: Unacknowledged count
    - severity_counts: Count by severity level
    """

    def get(self, request):
        # Start with all alerts
        alerts = Alert.objects.select_related(
            'device__zone__facility'
        ).all()

        # Apply filters
        facility_id = request.query_params.get('facility')
        if facility_id:
            alerts = alerts.filter(device__zone__facility_id=facility_id)

        zone_id = request.query_params.get('zone')
        if zone_id:
            alerts = alerts.filter(device__zone_id=zone_id)

        severity = request.query_params.get('severity')
        if severity:
            alerts = alerts.filter(severity=severity.upper())

        acknowledged = request.query_params.get('acknowledged')
        if acknowledged is not None:
            is_acknowledged = acknowledged.lower() == 'true'
            alerts = alerts.filter(acknowledged=is_acknowledged)

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            active_status = is_active.lower() == 'true'
            alerts = alerts.filter(is_active=active_status)
        else:
            # By default, show only active alerts
            alerts = alerts.filter(is_active=True)

        search = request.query_params.get('search')
        if search:
            alerts = alerts.filter(
                Q(message__icontains=search) |
                Q(device__code__icontains=search)
            )

        # Sorting
        sort_by = request.query_params.get('sort_by', 'created_at')
        order = request.query_params.get('order', 'desc')
        
        valid_sort_fields = ['created_at', 'severity']
        if sort_by in valid_sort_fields:
            sort_field = f"-{sort_by}" if order == 'desc' else sort_by
            alerts = alerts.order_by(sort_field)

        # Serialize and return
        serializer = AlertSerializer(alerts, many=True)
        
        # Add summary stats
        total_alerts = alerts.count()
        acknowledged_count = alerts.filter(acknowledged=True).count()
        severity_counts = {
            'INFO': alerts.filter(severity='INFO').count(),
            'WARNING': alerts.filter(severity='WARNING').count(),
            'CRITICAL': alerts.filter(severity='CRITICAL').count(),
        }

        return Response({
            'alerts': serializer.data,
            'total': total_alerts,
            'acknowledged': acknowledged_count,
            'unacknowledged': total_alerts - acknowledged_count,
            'severity_counts': severity_counts,
        })


class AlertAcknowledgeAPIView(APIView):
    """
    PATCH /api/alerts/<id>/acknowledge/
    Acknowledges a single alert by ID.
    
    Returns the updated alert object.
    """

    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response(
                {'error': 'Alert not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        alert.acknowledged = True
        alert.save(update_fields=['acknowledged'])

        serializer = AlertSerializer(alert)
        return Response(serializer.data)


class AlertBulkAcknowledgeAPIView(APIView):
    """
    POST /api/alerts/bulk-acknowledge/
    Acknowledges multiple alerts in a single operation.
    
    Request Body:
    {
        "alert_ids": [1, 2, 3, ...]
    }
    
    Returns:
    {
        "status": "success",
        "acknowledged_count": <number>
    }
    """

    def post(self, request):
        alert_ids = request.data.get('alert_ids', [])
        
        if not alert_ids:
            return Response(
                {'error': 'No alert IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated = Alert.objects.filter(
            id__in=alert_ids,
            is_active=True
        ).update(acknowledged=True)

        return Response({
            'status': 'success',
            'acknowledged_count': updated
        })
