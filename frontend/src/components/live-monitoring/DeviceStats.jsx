import React from 'react';

/**
 * DeviceStats Component
 * Displays summary statistics for live device monitoring:
 * - Total device count
 * - Online devices (OK status)
 * - Delayed devices (WARNING status)
 * - Offline devices (CRITICAL status)
 * 
 * @param {number} totalDevices - Total number of devices
 * @param {Object} statusCounts - Object with counts for each status (OK, WARNING, CRITICAL)
 */
const DeviceStats = ({ totalDevices, statusCounts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Devices</h3>
        <p className="text-3xl font-bold text-gray-900">{totalDevices}</p>
      </div>
      
      <div className="bg-green-50 rounded-lg shadow p-6">
        <h3 className="text-green-600 text-sm font-medium mb-2">Online (OK)</h3>
        <p className="text-3xl font-bold text-green-700">{statusCounts.OK || 0}</p>
      </div>
      
      <div className="bg-yellow-50 rounded-lg shadow p-6">
        <h3 className="text-yellow-600 text-sm font-medium mb-2">Delayed (WARNING)</h3>
        <p className="text-3xl font-bold text-yellow-700">{statusCounts.WARNING || 0}</p>
      </div>
      
      <div className="bg-red-50 rounded-lg shadow p-6">
        <h3 className="text-red-600 text-sm font-medium mb-2">Offline (CRITICAL)</h3>
        <p className="text-3xl font-bold text-red-700">{statusCounts.CRITICAL || 0}</p>
      </div>
    </div>
  );
};

export default React.memo(DeviceStats);
