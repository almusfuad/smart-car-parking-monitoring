import React, { useCallback, useMemo } from 'react';
import useAlerts from '../../hooks/useAlerts';
import FilterPanel from '../dashboard/FilterPanel';
import ExportButton from '../shared/ExportButton';
import AlertStats from './AlertStats';
import AlertFilters from './AlertFilters';
import BulkActions from './BulkActions';
import AlertsTable from './AlertsTable';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportHelpers';

/**
 * AlertManagementPanel Component
 * Orchestrates alert management UI with filtering, acknowledgment, and export
 */
const AlertManagementPanel = () => {
  // Use custom hook for all alert logic
  const {
    alerts,
    stats,
    loading,
    error,
    selectedAlerts,
    isAllSelected,
    updateFilters,
    acknowledgeAlert,
    bulkAcknowledgeAlerts,
    toggleAlertSelection,
    selectAllAlerts,
  } = useAlerts();

  // Handle filter changes from FilterPanel
  const handleFilterChange = useCallback((newFilters) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle severity filter change
  const handleSeverityChange = useCallback((severity) => {
    updateFilters(prev => ({ ...prev, severity }));
  }, [updateFilters]);

  // Handle status filter change
  const handleStatusChange = useCallback((acknowledged) => {
    updateFilters(prev => ({ ...prev, acknowledged }));
  }, [updateFilters]);

  // Handle alert acknowledgment
  const handleAcknowledge = useCallback(async (alertId) => {
    const result = await acknowledgeAlert(alertId);
    if (!result.success) {
      alert('Failed to acknowledge alert: ' + result.error);
    }
  }, [acknowledgeAlert]);

  // Handle bulk acknowledgment
  const handleBulkAcknowledge = useCallback(async () => {
    const result = await bulkAcknowledgeAlerts();
    if (!result.success) {
      alert(result.error || 'Failed to acknowledge alerts');
    }
  }, [bulkAcknowledgeAlerts]);

  // Handle export
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

  // Additional filters for FilterPanel
  const additionalFilters = useMemo(() => (
    <AlertFilters
      onSeverityChange={handleSeverityChange}
      onStatusChange={handleStatusChange}
    />
  ), [handleSeverityChange, handleStatusChange]);

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

      {/* Statistics Cards */}
      <AlertStats stats={stats} />

      {/* Filter Panel */}
      <FilterPanel
        onFilterChange={handleFilterChange}
        showStatusFilter={false}
        additionalFilters={additionalFilters}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedAlerts.length}
        onBulkAcknowledge={handleBulkAcknowledge}
      />

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
      <AlertsTable
        alerts={alerts}
        loading={loading}
        selectedAlerts={selectedAlerts}
        isAllSelected={isAllSelected}
        onSelectAll={selectAllAlerts}
        onSelectAlert={toggleAlertSelection}
        onAcknowledgeAlert={handleAcknowledge}
      />
    </div>
  );
};

export default AlertManagementPanel;
