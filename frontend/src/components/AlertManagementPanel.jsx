import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import FilterPanel from './FilterPanel';
import ExportButton from './ExportButton';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelpers';

/**
 * AlertManagementPanel Component
 * Displays and manages system alerts with filtering and acknowledgment
 */
const AlertManagementPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    acknowledged: 0,
    unacknowledged: 0,
    severity_counts: { INFO: 0, WARNING: 0, CRITICAL: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ is_active: 'true' });
  const [selectedAlerts, setSelectedAlerts] = useState([]);

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

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters({ ...newFilters, is_active: 'true' });
  }, []);

  const handleAcknowledge = useCallback(async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId);
      // Refresh alerts after acknowledging
      fetchAlerts();
    } catch (err) {
      alert('Failed to acknowledge alert: ' + err.message);
    }
  }, [fetchAlerts]);

  const handleBulkAcknowledge = useCallback(async () => {
    if (selectedAlerts.length === 0) {
      alert('Please select alerts to acknowledge');
      return;
    }

    try {
      await api.bulkAcknowledgeAlerts(selectedAlerts);
      // Refresh alerts after bulk acknowledge
      fetchAlerts();
    } catch (err) {
      alert('Failed to acknowledge alerts: ' + err.message);
    }
  }, [selectedAlerts, fetchAlerts]);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      const unacknowledgedIds = alerts
        .filter(alert => !alert.acknowledged)
        .map(alert => alert.id);
      setSelectedAlerts(unacknowledgedIds);
    } else {
      setSelectedAlerts([]);
    }
  }, [alerts]);

  const handleSelectAlert = useCallback((alertId) => {
    setSelectedAlerts(prev => {
      if (prev.includes(alertId)) {
        return prev.filter(id => id !== alertId);
      } else {
        return [...prev, alertId];
      }
    });
  }, []);

  const handleExport = useCallback((format) => {
    const exportData = alerts.map(alert => ({
      Device: alert.device_code,
      Facility: alert.facility_name,
      Zone: alert.zone_name,
      Message: alert.message,
      Severity: alert.severity,
      Status: alert.acknowledged ? 'Acknowledged' : 'Pending',
      Created: new Date(alert.created_at).toLocaleString(),
    }));

    const filename = `alerts_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else if (format === 'excel') {
      exportToExcel(exportData, filename);
    } else if (format === 'pdf') {
      exportToPDF(exportData, filename, 'System Alerts Report');
    }
  }, [alerts]);

  const handleSeverityChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, severity: e.target.value || undefined }));
  }, []);

  const handleAcknowledgedChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, acknowledged: e.target.value || undefined }));
  }, []);

  const additionalFilters = useMemo(() => (
    <div className="flex gap-2">
      <select
        onChange={handleSeverityChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Severities</option>
        <option value="CRITICAL">Critical</option>
        <option value="WARNING">Warning</option>
        <option value="INFO">Info</option>
      </select>
      
      <select
        onChange={handleAcknowledgedChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Status</option>
        <option value="false">Unacknowledged</option>
        <option value="true">Acknowledged</option>
      </select>
    </div>
  ), [handleSeverityChange, handleAcknowledgedChange]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alert Management</h2>
          <p className="text-gray-500 text-sm mt-1">
            Monitor and manage system alerts
          </p>
        </div>
        <ExportButton 
          onExport={handleExport} 
          disabled={loading || alerts.length === 0}
          label="Export Alerts"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Alerts</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        
        <div className="bg-red-50 rounded-lg shadow p-6">
          <h3 className="text-red-600 text-sm font-medium mb-2">Critical</h3>
          <p className="text-3xl font-bold text-red-700">{stats.severity_counts.CRITICAL}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <h3 className="text-yellow-600 text-sm font-medium mb-2">Warning</h3>
          <p className="text-3xl font-bold text-yellow-700">{stats.severity_counts.WARNING}</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <h3 className="text-blue-600 text-sm font-medium mb-2">Info</h3>
          <p className="text-3xl font-bold text-blue-700">{stats.severity_counts.INFO}</p>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel 
        onFilterChange={handleFilterChange} 
        showStatusFilter={false}
        additionalFilters={additionalFilters}
      />

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
          <span className="text-blue-700 font-medium">
            {selectedAlerts.length} alert{selectedAlerts.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkAcknowledge}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Acknowledge Selected
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <div>
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">No alerts found</p>
            <p className="text-sm mt-1">All systems are running smoothly</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.length === alerts.filter(a => !a.acknowledged).length && alerts.filter(a => !a.acknowledged).length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    isSelected={selectedAlerts.includes(alert.id)}
                    onSelect={handleSelectAlert}
                    onAcknowledge={handleAcknowledge}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual Alert Row Component
 */
const AlertRow = React.memo(({ alert, isSelected, onSelect, onAcknowledge }) => {
  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'WARNING':
        return '⚠️';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  return (
    <tr className={alert.acknowledged ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}>
      <td className="px-4 py-4">
        {!alert.acknowledged && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(alert.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSeverityStyles(alert.severity)}`}>
          <span className="mr-1">{getSeverityIcon(alert.severity)}</span>
          {alert.severity}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{alert.device_code}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{alert.facility_name}</div>
        <div className="text-xs text-gray-500">{alert.zone_name}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-md">{alert.message}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </div>
        <div className="text-xs text-gray-400">
          {new Date(alert.created_at).toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {alert.acknowledged ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Acknowledged
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Pending
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="text-blue-600 hover:text-blue-900 transition-colors"
          >
            Acknowledge
          </button>
        )}
      </td>
    </tr>
  );
});

export default AlertManagementPanel;
