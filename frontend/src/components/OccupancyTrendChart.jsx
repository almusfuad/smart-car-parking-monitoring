import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

const OccupancyTrendChart = ({ filters = {}, days = 7 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchOccupancyTrend();
  }, [filters.facility, filters.zone, days]);

  const fetchOccupancyTrend = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getOccupancyTrend(days, filters);
      setData(response.daily_data || []);
      setSummary(response.summary || {});
    } catch (err) {
      setError('Failed to load occupancy trend data');
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
          <p className="font-semibold text-gray-800 mb-2">{data.date}</p>
          <p className="text-sm text-blue-600">
            Total Parking: <span className="font-semibold">{data.total_parking}</span>
          </p>
          <p className="text-sm text-green-600">
            Avg Occupancy: <span className="font-semibold">{data.avg_occupancy}%</span>
          </p>
          <p className="text-sm text-purple-600">
            Peak Occupancy: <span className="font-semibold">{data.peak_occupancy}%</span>
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
          Occupancy Trend ({days} Days)
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
          Occupancy Trend ({days} Days)
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
          Occupancy Trend ({days} Days)
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
              <p className="text-gray-600">Peak Day</p>
              <p className="font-semibold text-purple-600">{summary.peak_day || 'N/A'}</p>
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
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'Occupancy Rate (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area
              type="monotone"
              dataKey="avg_occupancy"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorOccupancy)"
              name="Avg Occupancy (%)"
            />
            <Line
              type="monotone"
              dataKey="peak_occupancy"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ fill: '#a855f7', r: 4 }}
              name="Peak Occupancy (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default OccupancyTrendChart;
