import React, { useEffect, useState } from 'react';
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
import api from '../services/api';

const HourlyUsageChart = ({ filters = {} }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchHourlyUsage();
  }, [filters.facility, filters.zone]);

  const fetchHourlyUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getHourlyUsage(filters);
      setData(response.hourly_data || []);
      setSummary(response.summary || {});
    } catch (err) {
      setError('Failed to load hourly usage data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          24-Hour Parking Usage
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          24-Hour Parking Usage
        </h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          24-Hour Parking Usage
        </h2>
        {summary && (
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
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
    </div>
  );
};

export default HourlyUsageChart;
