import axios from "axios";
import { setAuthToken } from "../utils/auth";
import api from "../configs/axios";

// Helper function to set auth token before API calls
const ensureAuth = () => {
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
};

// Create axios instances for different services
const iamApi = axios.create({
  baseURL: "http://localhost:5001/",
});

const testOrderApi = axios.create({
  baseURL: "http://localhost:5003/",
});

const blogApi = axios.create({
  baseURL: "http://localhost:5004/",
});

const instrumentApi = axios.create({
  baseURL: "http://localhost:5008/",
});

// Add request interceptor to set auth token
const setupAuthInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

setupAuthInterceptor(iamApi);
setupAuthInterceptor(testOrderApi);
setupAuthInterceptor(blogApi);
setupAuthInterceptor(instrumentApi);

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
