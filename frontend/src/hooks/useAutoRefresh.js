import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-refresh functionality
 * Executes a callback function at specified intervals
 * 
 * @param {Function} callback - Function to execute on each interval
 * @param {number} interval - Interval in milliseconds (default: 10000)
 * @param {boolean} enabled - Whether auto-refresh is enabled (default: true)
 * 
 * @example
 * // Refresh data every 10 seconds
 * useAutoRefresh(() => fetchData(), 10000);
 * 
 * @example
 * // Conditional auto-refresh
 * useAutoRefresh(() => fetchData(), 5000, isActive);
 */
const useAutoRefresh = (callback, interval = 10000, enabled = true) => {
  const savedCallback = useRef();
  const intervalRef = useRef(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) {
      console.log('[useAutoRefresh] Auto-refresh is disabled');
      return;
    }

    if (!savedCallback.current) {
      console.warn('[useAutoRefresh] No callback provided');
      return;
    }

    console.log('[useAutoRefresh] Setting up auto-refresh with interval:', interval, 'ms');

    // Execute callback immediately on mount
    savedCallback.current();

    // Set up interval for subsequent executions
    intervalRef.current = setInterval(() => {
      console.log('[useAutoRefresh] Auto-refresh triggered');
      if (savedCallback.current) {
        savedCallback.current();
      }
    }, interval);

    // Cleanup function
    return () => {
      console.log('[useAutoRefresh] Cleaning up interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled]);
};

export default useAutoRefresh;
