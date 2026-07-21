// Utility functions for authentication
import api from "../configs/axios";

const URL = "iam/api/auth/logout";
export const setAuthToken = (token) => {
  // Lưu token vào localStorage (hỗ trợ cả key cũ và key chuẩn)
  localStorage.setItem("authToken", token);
  localStorage.setItem("accessToken", token);
  // Gán header mặc định cho axios instance
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const getAuthToken = () => {
  // ưu tiên đọc từ accessToken nếu có
  return (
    localStorage.getItem("accessToken") || localStorage.getItem("authToken")
  );
};

export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("permissions");
  localStorage.removeItem("patientInfo");
  // Xóa header mặc định
  delete api.defaults.headers.common["Authorization"];
};

// User data functions
export const setUserData = (userData) => {
  localStorage.setItem("user", JSON.stringify(userData));
  // Không tự động set token ở đây — gọi setAuthToken khi login thành công
};

export const getUserData = () => {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

export const removeUserData = () => {
  localStorage.removeItem("user");
  removeAuthToken();
};

export const isAuthenticated = () => {
  const userData = getUserData();
  const token = getAuthToken();
  return !!(userData && token);
};

// Khởi tạo auth khi app load
export const initAuth = () => {
  const token = getAuthToken();
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Demo functions...
export const demoLogin = () => {
  const demoUser = {
    fullname: "Nguyễn Văn An",
    patientId: "550e8400",
    gender: "Nam",
    age: 40,
    email: "nguyenvanan@email.com",
    phone: "0912345678",
    birthday: "15 tháng 3, 1985",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    idCard: "079085001234",
    healthInsurance: "BH-2024-001234",
    registrationDate: "15 tháng 1, 2024",
  };
  setUserData(demoUser);
  window.location.reload();
};

export const demoLogout = () => {
  removeUserData();
  window.location.reload();
};

export const clearAllAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("expiresAt");
  localStorage.removeItem("user");
  removeAuthToken();
};

export const logoutUser = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  const accessToken = getAuthToken();
  try {
    if (refreshToken || accessToken) {
      await api.post(
        URL,
        { refreshToken },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
    }
  } catch {
    // swallow
  } finally {
    clearAllAuth();
  }
};
