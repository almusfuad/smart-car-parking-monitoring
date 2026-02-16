/**
 * DeviceHeartbeat Component
 * Displays device status with last-seen information and health indicators
 */

import StatusBadge from '../shared/StatusBadge';

const DeviceHeartbeat = ({ devices, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Device Heartbeat Monitor</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Device Heartbeat Monitor</h2>
        <p className="text-gray-500 text-center py-8">No devices available</p>
      </div>
    );
  }

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    return date.toLocaleString();
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Device Heartbeat Monitor</h2>
        <div className="text-sm text-gray-500">
          Total: {devices.length} devices
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`border rounded-lg p-4 ${
              device.status === 'CRITICAL'
                ? 'border-red-300 bg-red-50'
                : device.status === 'WARNING'
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-green-300 bg-green-50'
            }`}
          >
            {/* Device Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{device.code}</h3>
                <p className="text-xs text-gray-600">
                  {device.facility} - {device.zone}
                </p>
              </div>
              <StatusBadge status={device.status} size="sm" />
            </div>

            {/* Device Status */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900">{device.status_message}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Last Seen:</span>
                <span className="text-xs text-gray-700">
                  {formatLastSeen(device.last_seen)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Health:</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        device.health_score >= 80
                          ? 'bg-green-500'
                          : device.health_score >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${device.health_score}%` }}
                    ></div>
                  </div>
                  <span className={`font-semibold ${getHealthColor(device.health_score)}`}>
                    {device.health_score}%
                  </span>
                </div>
              </div>

              {/* Active Alerts */}
              {device.alerts_count > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      Active Alerts: {device.alerts_count}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {device.active_alerts.slice(0, 2).map((alert, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-red-500">•</span>
                        <span className="flex-1">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceHeartbeat;
