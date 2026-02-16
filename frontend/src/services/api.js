import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// API methods
const api = {
  /**
   * GET /api/dashboard/summary/?date=YYYY-MM-DD
   * Fetches dashboard summary metrics for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Response with total_events, current_occupancy, active_devices, alerts_count
   */
  getDashboardSummary: async (date) => {
    try {
      const response = await apiClient.get('/dashboard/summary/', {
        params: { date },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  /**
   * GET /api/dashboard/zones-performances/
   * Fetches zone-wise performance metrics
   * @param {Object} filters - Filter parameters (facility, zone, search, sort_by, order)
   * @returns {Promise} Array of zone performance data
   */
  getZonesPerformance: async (filters = {}) => {
    try {
      const response = await apiClient.get('/dashboard/zones-performances/', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching zones performance:', error);
      throw error;
    }
  },

  /**
   * GET /api/dashboard/devices-hearbeat/
   * Fetches device status with last-seen timestamps
   * @param {Object} filters - Filter parameters (facility, zone, status, search, sort_by, order)
   * @returns {Promise} Array of device heartbeat data
   */
  getDevicesHeartbeat: async (filters = {}) => {
    try {
      const response = await apiClient.get('/dashboard/devices-hearbeat/', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching devices heartbeat:', error);
      throw error;
    }
  },

  /**
   * GET /api/devices/live-status/
   * Fetches real-time device status with latest telemetry and parking data
   * Optimized for polling every 10 seconds
   * @returns {Promise} Object with timestamp, devices array, and total_devices count
   */
  getLiveDevices: async () => {
    try {
      const response = await apiClient.get('/devices/live-status/');
      return response.data;
    } catch (error) {
      console.error('Error fetching live device status:', error);
      throw error;
    }
  },

  /**
   * GET /api/facilities/
   * Fetches list of all facilities with their zones
   * @returns {Promise} Array of facilities with zones
   */
  getFacilities: async () => {
    try {
      const response = await apiClient.get('/facilities/');
      return response.data;
    } catch (error) {
      console.error('Error fetching facilities:', error);
      throw error;
    }
  },
};

export default api;
