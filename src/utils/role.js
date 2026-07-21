// src/utils/role.js
// Utility functions for role and permission management

import { jwtDecode } from "jwt-decode";

// Define permissions for each role
const rolePermissions = {
  Admin: [
    "dashboard",
    "users",
    "roles",
    "instruments",
    "blogs",
    "categories",
    "patients",
    "packages",
    "catalogs",
    "parameter",
    "reports",
    "appointment-schedule",
  ],
  Manager: [
    "dashboard",
    "users",
    "instruments",
    "blogs",
    "categories",
    "patients",
    "catalogs",
    "parameter",
    "appointment-schedule",
  ],
  Receptionist: ["dashboard", "patients", "appointment-schedule"],
  LabBlogger: ["dashboard", "blogs", "categories"],
  Technician: ["dashboard", "instruments"],
  LabUser: ["dashboard", "patients", "appointment-schedule"],
  Staff: ["dashboard", "patients", "appointment-schedule"],
  Consultant: [
    "instruments",
    "catalogs",
    "parameter",
  ],
};

// Get current user role from token
export const getCurrentUserRole = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const decoded = jwtDecode(token);
    const role =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      decoded.role;

    return role || null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Check if user has permission to access a feature
export const hasPermission = (feature) => {
  const role = getCurrentUserRole();
  if (!role) return false;

  const permissions = rolePermissions[role] || [];
  return permissions.includes(feature);
};

// Get all permissions for current user
export const getUserPermissions = () => {
  const role = getCurrentUserRole();
  if (!role) return [];

  return rolePermissions[role] || [];
};

// Check if user is admin
export const isAdmin = () => {
  return getCurrentUserRole() === "Admin";
};

// Check if user is manager
export const isManager = () => {
  return getCurrentUserRole() === "Manager";
};

// Check if user is staff
export const isStaff = () => {
  return getCurrentUserRole() === "Staff";
};


export const isLabBlogger = () => {
  return getCurrentUserRole() === "LabBlogger";
};

export const isTechnician = () => {
  return getCurrentUserRole() === "Technician";
};
// Check if user can access management pages
export const canAccessManagement = () => {
  const role = getCurrentUserRole();
  return (
    role === "Admin" ||
    role === "Manager" ||
    role === "LabUser" ||
    role === "Receptionist" ||
    role === "LabBlogger" ||
    role === "Technician" ||
    role === "Staff" ||
    role === "Consultant"
  );
};

// Get menu items based on user role
export const getMenuItems = () => {
  const permissions = getUserPermissions();

  const allMenuItems = [
    {
      path: "/dashboard",
      icon: "dashboard",
      name: "Tổng quan",
      permission: "dashboard",
    },
    {
      path: "/appointment-schedule",
      icon: "appointment-schedule",
      name: "Lịch xét nghiệm",
      permission: "appointment-schedule",
    },
    { path: "/users", icon: "users", name: "Người dùng", permission: "users" },
    {
      path: "/roles",
      icon: "roles",
      name: "Quyền truy cập",
      permission: "roles",
    },
    {
      path: "/instruments",
      icon: "instruments",
      name: "Thiết bị",
      permission: "instruments",
    },
    { path: "/blogs", icon: "blogs", name: "Bài viết", permission: "blogs" },
    {
      path: "/categories",
      icon: "categories",
      name: "Danh mục bài viết",
      permission: "categories",
    },
    {
      path: "/patients",
      icon: "patients",
      name: "Bệnh nhân",
      permission: "patients",
    },
    {
      path: "/packages",
      icon: "packages",
      name: "Gói xét nghiệm",
      permission: "packages",
    },
    {
      path: "/catalogs",
      icon: "catalogs",
      name: "Mục xét nghiệm",
      permission: "catalogs",
    },
    {
      path: "/parameter",
      icon: "parameter",
      name: "Chỉ số xét nghiệm",
      permission: "parameter",
    },
    {
      path: "/reports",
      icon: "reports",
      name: "Báo cáo",
      permission: "reports",
    },
  ];

  return allMenuItems.filter((item) => permissions.includes(item.permission));
};

export default {
  getCurrentUserRole,
  hasPermission,
  getUserPermissions,
  isAdmin,
  isManager,
  isStaff,
  canAccessManagement,
  getMenuItems,
};
