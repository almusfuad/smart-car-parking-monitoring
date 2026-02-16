import React from 'react';
import StatusBadge from '../shared/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

/**
 * DeviceCard Component
 * Displays detailed information for a single device including:
 * - Device identification and location
 * - Health score with visual indicator
 * - Telemetry data (voltage, current, power)
 * - Parking status
 * - Active alerts
 * 
 * @param {Object} device - Device object with all telemetry and status information
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

export default React.memo(DeviceCard);
