import { setAuthToken } from "../utils/auth";
import api from "../configs/axios";

// Helper function to set auth token before API calls
const ensureAuth = () => {
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
};

export const StatisticsAPI = {
  // Get user statistics (from IAMService - port 5001)
  getUsersStatistics: async () => {
    ensureAuth();
    const response = await api.get("iam/api/statistics/users");
    return response;
  },

  // Get catalog/bundle statistics (from TestOrderService - port 5003)
  getCatalogsStatistics: async () => {
    ensureAuth();
    const response = await api.get("testorder/api/statistics/catalogs");
    return response;
  },

  // Get booking/revenue statistics (from TestOrderService - port 5003)
  getBookingsStatistics: async () => {
    ensureAuth();
    const response = await api.get("testorder/api/statistics/bookings");
    return response;
  },

  // Get blog statistics (from BlogService - port 5004)
  getBlogsStatistics: async () => {
    ensureAuth();
    const response = await api.get("blog/api/statistics/blogs");
    return response;
  },

  // Get instrument statistics (from InstrumentService - port 5008)
  getInstrumentsStatistics: async () => {
    ensureAuth();
    const response = await api.get("instrument/api/statistics/instruments");
    return response;
  },
};

export default StatisticsAPI;
