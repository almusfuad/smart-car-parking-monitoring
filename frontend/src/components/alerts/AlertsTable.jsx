import React from 'react';
import AlertRow from './AlertRow';

/**
 * AlertsTable Component
 * Displays alerts in a table format with selection and actions
 * @param {Array} alerts - Array of alert objects
 * @param {boolean} loading - Loading state
 * @param {Array} selectedAlerts - Array of selected alert IDs
 * @param {boolean} isAllSelected - Whether all alerts are selected
 * @param {Function} onSelectAll - Callback for select all checkbox
 * @param {Function} onSelectAlert - Callback for individual alert selection
 * @param {Function} onAcknowledgeAlert - Callback for acknowledging an alert
 */
const AlertsTable = ({
  alerts,
  loading,
  selectedAlerts,
  isAllSelected,
  onSelectAll,
  onSelectAlert,
  onAcknowledgeAlert,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium">No alerts found</p>
          <p className="text-sm mt-1">All systems are running smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Select All Checkbox */}
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              
              {/* Column Headers */}
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
                onSelect={onSelectAlert}
                onAcknowledge={onAcknowledgeAlert}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;
