import axios from "axios";

const api = axios.create({
  baseURL: "https://hemalink-gateway-5ils.onrender.com/",
});

// Create a separate axios instance for public API calls (without auth headers)
// This instance will never have Authorization headers set
export const publicApi = axios.create({
  baseURL: "https://hemalink-gateway-5ils.onrender.com/",
});

// Ensure publicApi never gets Authorization headers
// Remove any existing Authorization header
if (publicApi.defaults.headers.common["Authorization"]) {
  delete publicApi.defaults.headers.common["Authorization"];
}

export default api;
