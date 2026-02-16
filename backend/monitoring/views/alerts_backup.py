"""
Alert Management Views

This module provides API endpoints for alert monitoring and management,
including listing, filtering, acknowledgment, and bulk operations.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..serializers import AlertSerializer
from ..services import (
    get_alerts_with_filters,
    calculate_alert_statistics,
    acknowledge_alert,
    bulk_acknowledge_alerts,
)


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
        # Get filters from request
        facility_id = request.query_params.get('facility')
        zone_id = request.query_params.get('zone')
        severity = request.query_params.get('severity')
        acknowledged = request.query_params.get('acknowledged')
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')
        sort_by = request.query_params.get('sort_by', 'created_at')
        order = request.query_params.get('order', 'desc')
        
        # Get filtered alerts
        alerts = get_alerts_with_filters(
            facility_id=facility_id,
            zone_id=zone_id,
            severity=severity,
            acknowledged=acknowledged,
            is_active=is_active,
            search=search,
            sort_by=sort_by,
            order=order
        )
        
        # Serialize alerts
        serializer = AlertSerializer(alerts, many=True)
        
        # Calculate statistics
        stats = calculate_alert_statistics(alerts)
        
        return Response({
            'alerts': serializer.data,
            **stats
        })
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
