import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../../services/api';
import useChartData from '../../../hooks/useChartData';
import ChartContainer from '../ChartContainer';

const COLORS = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  offline: '#6b7280',
};

const STATUS_LABELS = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  offline: 'Offline',
};

const DeviceHealthChart = ({ filters = {} }) => {
  // Use custom hook for data fetching
  const { data, loading, error } = useChartData(
    () => api.getDeviceHealth(filters),
    [filters.facility, filters.zone],
    (response) => {
      // Transform device_categories to chart data
      const categories = response.device_categories || {};
      const chartData = Object.keys(categories).map(key => ({
        name: STATUS_LABELS[key] || key,
        value: categories[key],
        color: COLORS[key] || '#9ca3af',
      }));
      
      return {
        chartData,
        metrics: response.metrics || {},
      };
    }
  );

  const chartData = data?.chartData || [];
  const metrics = data?.metrics || {};

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            Devices: <span className="font-semibold">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-semibold">
              {((data.value / data.payload.total) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if less than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalDevices = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = chartData.map(item => ({ ...item, total: totalDevices }));

  // Metrics summary component
  const metricsDisplay = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-1">Total Devices</p>
        <p className="text-2xl font-bold text-gray-800">{metrics.total_devices || 0}</p>
      </div>
      <div className="bg-green-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-1">Healthy</p>
        <p className="text-2xl font-bold text-green-600">{metrics.healthy_count || 0}</p>
      </div>
      <div className="bg-yellow-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-1">Avg Health</p>
        <p className="text-2xl font-bold text-yellow-600">
          {metrics.avg_health_score ? `${metrics.avg_health_score}%` : '0%'}
        </p>
      </div>
      <div className="bg-red-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-1">Critical</p>
        <p className="text-2xl font-bold text-red-600">{metrics.critical_count || 0}</p>
      </div>
    </div>
  );

  return (
    <ChartContainer 
      title="Device Health Status" 
      loading={loading} 
      error={error}
    >
      {/* Metrics Summary */}
      {metricsDisplay}

      {chartData.length === 0 || totalDevices === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No device data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-sm text-gray-700">
                  {value} ({entry.payload.value})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
};

export default DeviceHealthChart;
