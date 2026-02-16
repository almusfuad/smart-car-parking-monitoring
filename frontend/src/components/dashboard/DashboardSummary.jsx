/**
 * DashboardSummary Component
 * Displays key metrics in summary cards
 */

const DashboardSummary = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const metrics = [
    {
      title: 'Total Events',
      value: data.total_events || 0,
      icon: '📊',
      color: 'bg-blue-500',
      description: 'Telemetry records today',
    },
    {
      title: 'Current Occupancy',
      value: data.current_occupancy || 0,
      icon: '🚗',
      color: 'bg-green-500',
      description: 'Active parking slots',
    },
    {
      title: 'Active Devices',
      value: data.active_devices || 0,
      icon: '📡',
      color: 'bg-purple-500',
      description: 'Online monitoring devices',
    },
    {
      title: 'Active Alerts',
      value: data.alerts_count || 0,
      icon: '⚠️',
      color: 'bg-red-500',
      description: 'Unresolved issues',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
        >
          <div className="p-6">
            {/* Icon and Value Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{metric.icon}</span>
              <div
                className={`${metric.color} w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md`}
              >
                {metric.value}
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">
              {metric.title}
            </h3>
            
            {/* Value Display */}
            <p className="text-3xl font-bold text-gray-800 mb-2">
              {metric.value.toLocaleString()}
            </p>
            
            {/* Description */}
            <p className="text-xs text-gray-500">
              {metric.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardSummary;
