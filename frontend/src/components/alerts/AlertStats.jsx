import React from 'react';

/**
 * AlertStats Component
 * Displays summary statistics for alerts
 * @param {Object} stats - Statistics object with counts
 */
const AlertStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Alerts</h3>
        <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
      </div>
      
      {/* Critical Alerts */}
      <div className="bg-red-50 rounded-lg shadow p-6">
        <h3 className="text-red-600 text-sm font-medium mb-2">Critical</h3>
        <p className="text-3xl font-bold text-red-700">{stats.severity_counts?.CRITICAL || 0}</p>
      </div>
      
      {/* Warning Alerts */}
      <div className="bg-yellow-50 rounded-lg shadow p-6">
        <h3 className="text-yellow-600 text-sm font-medium mb-2">Warning</h3>
        <p className="text-3xl font-bold text-yellow-700">{stats.severity_counts?.WARNING || 0}</p>
      </div>
      
      {/* Info Alerts */}
      <div className="bg-blue-50 rounded-lg shadow p-6">
        <h3 className="text-blue-600 text-sm font-medium mb-2">Info</h3>
        <p className="text-3xl font-bold text-blue-700">{stats.severity_counts?.INFO || 0}</p>
      </div>
    </div>
  );
};

export default AlertStats;
