import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching all dashboard data
 * Fetches summary, zones performance, and device heartbeat data
 */
const useDashboardData = (date) => {
  const [data, setData] = useState({
    summary: null,
    zones: null,
    devices: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [summaryResult, zonesResult, devicesResult] = await Promise.all([
          api.getDashboardSummary(date),
          api.getZonesPerformance(),
          api.getDevicesHeartbeat(),
        ]);

        setData({
          summary: summaryResult,
          zones: zonesResult,
          devices: devicesResult,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (date) {
      fetchData();
    }
  }, [date]);

  return { data, loading, error };
};

export default useDashboardData;
