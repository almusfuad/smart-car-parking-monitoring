import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for fetching chart data with loading and error states
 * Provides a unified pattern for all analytics charts
 * 
 * @param {Function} fetchFunction - API function to call for data fetching
 * @param {Array} dependencies - Array of dependencies that trigger re-fetch
 * @param {Function} transformData - Optional function to transform API response
 * @returns {Object} { data, loading, error, refetch }
 * 
 * @example
 * const { data, loading, error } = useChartData(
 *   () => api.getDeviceHealth(filters),
 *   [filters.facility, filters.zone],
 *   (response) => ({
 *     chartData: transformToChartFormat(response.data),
 *     metrics: response.metrics
 *   })
 * );
 */
const useChartData = (fetchFunction, dependencies = [], transformData = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchFunction();
      
      // Apply transformation if provided, otherwise use response as-is
      const processedData = transformData ? transformData(response) : response;
      
      setData(processedData);
    } catch (err) {
      console.error('[useChartData] Error fetching data:', err);
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, transformData]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

export default useChartData;
