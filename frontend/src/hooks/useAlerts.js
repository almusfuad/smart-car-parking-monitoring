import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * useAlerts Hook
 * Manages alert data fetching, filtering, and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Alert data, loading state, and action functions
 */
const useAlerts = (initialFilters = { is_active: 'true' }) => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    acknowledged: 0,
    unacknowledged: 0,
    severity_counts: { INFO: 0, WARNING: 0, CRITICAL: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedAlerts, setSelectedAlerts] = useState([]);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAlerts(filters);
      setAlerts(data.alerts || []);
      setStats({
        total: data.total || 0,
        acknowledged: data.acknowledged || 0,
        unacknowledged: data.unacknowledged || 0,
        severity_counts: data.severity_counts || { INFO: 0, WARNING: 0, CRITICAL: 0 },
      });
      setSelectedAlerts([]); // Clear selection when filters change
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.facility, filters.zone, filters.severity, filters.acknowledged, filters.search, filters.sort_by, filters.order, filters.is_active]);

  // Fetch alerts when filters change
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters({ ...newFilters, is_active: 'true' });
  }, []);

  // Acknowledge a single alert
  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId);
      await fetchAlerts(); // Refresh alerts after acknowledging
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to acknowledge alert';
      console.error('Error acknowledging alert:', err);
      return { success: false, error: errorMessage };
    }
  }, [fetchAlerts]);

  // Bulk acknowledge multiple alerts
  const bulkAcknowledgeAlerts = useCallback(async () => {
    if (selectedAlerts.length === 0) {
      return { success: false, error: 'No alerts selected' };
    }

    try {
      await api.bulkAcknowledgeAlerts(selectedAlerts);
      await fetchAlerts(); // Refresh alerts after bulk acknowledge
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to acknowledge alerts';
      console.error('Error bulk acknowledging alerts:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedAlerts, fetchAlerts]);

  // Select/deselect a single alert
  const toggleAlertSelection = useCallback((alertId) => {
    setSelectedAlerts(prev => {
      if (prev.includes(alertId)) {
        return prev.filter(id => id !== alertId);
      } else {
        return [...prev, alertId];
      }
    });
  }, []);

  // Select all unacknowledged alerts
  const selectAllAlerts = useCallback((checked) => {
    if (checked) {
      const unacknowledgedIds = alerts
        .filter(alert => !alert.acknowledged)
        .map(alert => alert.id);
      setSelectedAlerts(unacknowledgedIds);
    } else {
      setSelectedAlerts([]);
    }
  }, [alerts]);

  // Clear all selected alerts
  const clearSelection = useCallback(() => {
    setSelectedAlerts([]);
  }, []);

  // Get unacknowledged alerts count
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  // Check if all unacknowledged alerts are selected
  const isAllSelected = selectedAlerts.length === unacknowledgedCount && unacknowledgedCount > 0;

  return {
    // Data
    alerts,
    stats,
    filters,
    selectedAlerts,
    
    // State
    loading,
    error,
    isAllSelected,
    unacknowledgedCount,
    
    // Actions
    updateFilters,
    acknowledgeAlert,
    bulkAcknowledgeAlerts,
    toggleAlertSelection,
    selectAllAlerts,
    clearSelection,
    refetch: fetchAlerts,
  };
};

export default useAlerts;
