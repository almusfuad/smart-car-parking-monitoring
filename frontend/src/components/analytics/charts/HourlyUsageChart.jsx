import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../../services/api';
import useChartData from '../../../hooks/useChartData';
import ChartContainer from '../ChartContainer';

const HourlyUsageChart = ({ filters = {} }) => {
  // Use custom hook for data fetching
  const { data, loading, error } = useChartData(
    () => api.getHourlyUsage(filters),
    [filters.facility, filters.zone],
    (response) => ({
      hourlyData: response.hourly_data || [],
      summary: response.summary || {},
    })
  );

  const hourlyData = data?.hourlyData || [];
  const summary = data?.summary || {};

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{data.hour}</p>
          <p className="text-sm text-blue-600">
            Total Parking: <span className="font-semibold">{data.total_parking}</span>
          </p>
          <p className="text-sm text-gray-600">
            Occupancy Rate: <span className="font-semibold">{data.occupancy_rate}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Summary display component
  const summaryDisplay = (
    <div className="flex gap-4 text-sm">
      <div className="text-center">
        <p className="text-gray-600">Total Parking</p>
        <p className="font-semibold text-blue-600">{summary.total_parking || 0}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-600">Avg Occupancy</p>
        <p className="font-semibold text-green-600">
          {summary.avg_occupancy ? `${summary.avg_occupancy}%` : '0%'}
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600">Peak Hour</p>
        <p className="font-semibold text-purple-600">{summary.peak_hour || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <ChartContainer 
      title="24-Hour Parking Usage" 
      loading={loading} 
      error={error}
      summary={summaryDisplay}
    >
      {hourlyData.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="hour"
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'Total Parking', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="total_parking"
              fill="#3b82f6"
              name="Total Parking"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
};

export default HourlyUsageChart;
