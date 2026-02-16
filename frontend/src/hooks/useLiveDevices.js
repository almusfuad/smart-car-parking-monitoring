import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching live device status with auto-refresh
 * Polls the API every 10 seconds for real-time updates
 * 
 * @param {boolean} enabled - Whether auto-refresh is enabled (default: true)
 * @param {number} interval - Refresh interval in milliseconds (default: 10000)
 * @returns {Object} { data, loading, error, lastUpdated, refresh }
 */
const useLiveDevices = (enabled = true, interval = 10000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch live device data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      console.log('[useLiveDevices] Fetching live device data...', new Date().toISOString());
      const response = await api.getLiveDevices();
      
      if (isMountedRef.current) {
        setData(response);
        setLastUpdated(new Date());
        setLoading(false);
        console.log('[useLiveDevices] Data fetched successfully:', response.total_devices, 'devices');
      }
    } catch (err) {
      console.error('[useLiveDevices] Error fetching data:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch live device data');
        setLoading(false);
      }
    }
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!enabled) {
      console.log('[useLiveDevices] Auto-refresh is disabled');
      return;
    }

    console.log('[useLiveDevices] Setting up auto-refresh with interval:', interval, 'ms');

    // Initial fetch
    fetchData();

    // Set up interval for auto-refresh
    intervalRef.current = setInterval(() => {
      console.log('[useLiveDevices] Auto-refresh triggered');
      fetchData();
    }, interval);

    // Cleanup function
    return () => {
      console.log('[useLiveDevices] Cleaning up interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

export default useLiveDevices;
