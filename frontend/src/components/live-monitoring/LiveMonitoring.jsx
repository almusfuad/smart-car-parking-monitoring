import React from 'react';
import useLiveDevices from '../../hooks/useLiveDevices';
import DeviceCard from './DeviceCard';
import DeviceStats from './DeviceStats';
import ExportButton from '../shared/ExportButton';
import { formatDistanceToNow } from 'date-fns';
import { exportLiveDevicesData } from '../../utils/exportHelpers';

/**
 * LiveMonitoring Component
 * Orchestrates the live monitoring page with real-time device status
 * Auto-refreshes every 10 seconds via useLiveDevices hook
 */
const LiveMonitoring = () => {
  const { data, loading, error, lastUpdated, refresh } = useLiveDevices();

  const handleExport = (format) => {
    if (data?.devices) {
      exportLiveDevicesData(data.devices, format);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live device data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const devices = data?.devices || [];
  const totalDevices = data?.total_devices || 0;
  
  // Calculate status counts
  const statusCounts = devices.reduce((acc, device) => {
    acc[device.status] = (acc[device.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Monitoring</h2>
          <p className="text-gray-500 text-sm mt-1">
            Real-time device status • Auto-refresh every 10 seconds
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-gray-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </div>
          )}
          
          <ExportButton 
            onExport={handleExport} 
            disabled={loading || !data?.devices || data.devices.length === 0}
            label="Export"
          />
          
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <DeviceStats totalDevices={totalDevices} statusCounts={statusCounts} />

      {/* Device Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No active devices found</p>
        </div>
      )}
    </div>
  );
};

export default LiveMonitoring;
