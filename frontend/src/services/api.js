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
};

export default api;
