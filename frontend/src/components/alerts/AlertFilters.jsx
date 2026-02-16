import React, { useCallback } from 'react';

/**
 * AlertFilters Component
 * Provides severity and acknowledgment status filters for alerts
 * @param {Function} onSeverityChange - Callback when severity filter changes
 * @param {Function} onStatusChange - Callback when status filter changes
 */
const AlertFilters = React.memo(({ onSeverityChange, onStatusChange }) => {
  const handleSeverityChange = useCallback((e) => {
    onSeverityChange(e.target.value || undefined);
  }, [onSeverityChange]);

  const handleStatusChange = useCallback((e) => {
    onStatusChange(e.target.value || undefined);
  }, [onStatusChange]);

  return (
    <div className="flex gap-2">
      {/* Severity Filter */}
      <select
        onChange={handleSeverityChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Severities</option>
        <option value="CRITICAL">Critical</option>
        <option value="WARNING">Warning</option>
        <option value="INFO">Info</option>
      </select>
      
      {/* Status Filter */}
      <select
        onChange={handleStatusChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Status</option>
        <option value="false">Unacknowledged</option>
        <option value="true">Acknowledged</option>
      </select>
    </div>
  );
});

AlertFilters.displayName = 'AlertFilters';

export default AlertFilters;
