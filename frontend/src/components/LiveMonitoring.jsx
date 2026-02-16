import React from 'react';
import useLiveDevices from '../hooks/useLiveDevices';
import StatusBadge from './StatusBadge';
import ExportButton from './ExportButton';
import { formatDistanceToNow } from 'date-fns';
import { exportLiveDevicesData } from '../utils/exportHelpers';

/**
 * LiveMonitoring Component
 * Displays real-time device status with auto-refresh every 10 seconds
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

/**
 * Individual Device Card Component
 */
const DeviceCard = ({ device }) => {
  const getHealthColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimeSince = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{device.code}</h3>
          <p className="text-sm text-gray-600">
            {device.facility.name} • {device.zone.name}
          </p>
        </div>
        <StatusBadge status={device.status} />
      </div>

      {/* Health Score */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Health Score</span>
          <span className="text-sm font-bold text-gray-900">{device.health_score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getHealthColor(device.health_score)}`}
            style={{ width: `${device.health_score}%` }}
          ></div>
        </div>
      </div>

      {/* Telemetry Data */}
      {device.telemetry && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Latest Telemetry</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-500">Voltage</p>
              <p className="text-sm font-semibold text-gray-900">
                {device.telemetry.voltage?.toFixed(2)} V
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-sm font-semibold text-gray-900">
                {device.telemetry.current?.toFixed(2)} A
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Power</p>
              <p className="text-sm font-semibold text-gray-900">
                {device.telemetry.power?.toFixed(2)} W
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {formatTimeSince(device.telemetry.timestamp)}
          </p>
        </div>
      )}

      {/* Parking Status */}
      {device.parking && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Parking Status</h4>
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              device.parking.is_occupied 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {device.parking.is_occupied ? 'Occupied' : 'Available'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {formatTimeSince(device.parking.timestamp)}
          </p>
        </div>
      )}

      {/* Alerts */}
      {device.alerts_count > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-red-600 uppercase">
              Active Alerts ({device.alerts_count})
            </h4>
          </div>
          <div className="space-y-2">
            {device.alerts.slice(0, 2).map((alert, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.severity}
                </span>
                <span className="text-gray-700 flex-1">{alert.message}</span>
              </div>
            ))}
            {device.alerts_count > 2 && (
              <p className="text-xs text-gray-500">
                +{device.alerts_count - 2} more alerts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Last Seen */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <p className="text-xs text-gray-500">
          Last seen: <span className="text-gray-700 font-medium">{formatTimeSince(device.last_seen)}</span>
        </p>
      </div>
    </div>
  );
};

export default LiveMonitoring;
