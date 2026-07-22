/* eslint-disable react-refresh/only-export-components */
import api from "../configs/axios";

const URL = "iam/api/auth/";
const URL_Google = "iam/v1/auth/";
const URL_User = "iam/api/users/";
const URL_RBAC = "iam/api/rbac/";

// ==================== Auth APIs ====================
export const IAMServiceAPI = {
  ResetPasswordAPI: async (token, newPassword) => {
    return await api.post(`${URL}reset-password`, {
      token: token,
      newPassword: newPassword,
    });
  },

  ForgotPasswordAPI: async (email) => {
    return await api.post(`${URL}forgot-password`, {
      UsernameOrEmail: email,
    });
  },

  LoginWithPassword: async (username, password) => {
    return await api.post(`${URL}login`, {
      username: username,
      password: password,
    });
  },

  LoginWithGoogle: async (idToken) => {
    return await api.post(`${URL_Google}google`, { idToken });
  },

  Register: async (payLoad) => {
    return await api.post(`${URL}register`, payLoad);
  },

  ChangePassword: async (currentPassword, newPassword) => {
    return await api.post(`${URL}change-password`, {
      currentPassword: currentPassword,
      newPassword: newPassword,
    });
  },

  GetUserById: async (userId) => {
    return await api.get(`${URL_User}${userId}`);
  },

  // GET /api/Users/me
  // Lấy thông tin user hiện tại đang đăng nhập
  GetCurrentUser: async () => {
    return await api.get(`${URL_User}me`);
  },

  UpdateUserRoles: async (userId, roleIds) => {
    return await api.post(`${URL_User}${userId}/roles`, {
      roleIds: Array.isArray(roleIds) ? roleIds : [roleIds],
    });
  },

  // GET /api/statistics/users
  // Lấy thống kê người dùng và khách hàng
  GetUsersStatistics: async () => {
    return await api.get("iam/api/statistics/users");
  },
};

// ==================== RBAC APIs ====================

// GET /api/rbac/permission-groups
// Lấy danh sách các nhóm quyền
export const getPermissionGroups = async (params = {}) => {
  const response = await api.get(`${URL_RBAC}permission-groups`, { params });
  return response;
};

// GET /api/rbac/roles
// Lấy danh sách các vai trò (roles)
export const getRoles = async (params = {}) => {
  const response = await api.get(`${URL_RBAC}roles`, { params });
  return response;
};

// POST /api/Roles
// Tạo role mới
export const createRole = async (data) => {
  if (!data) throw new Error("Role data is required");
  const response = await api.post("iam/api/roles", data);
  return response;
};

// DELETE /api/Roles/{id}
// Xóa role
export const deleteRole = async (id) => {
  if (!id) throw new Error("Role ID is required");
  const response = await api.delete(`iam/api/roles/${id}`);
  return response;
};

// GET /api/rbac/roles/{roleId}/permissions
// Lấy danh sách quyền của một vai trò cụ thể
export const getRolePermissions = async (roleId) => {
  if (!roleId) throw new Error("Role ID is required");
  const response = await api.get(`${URL_RBAC}roles/${roleId}/permissions`);
  return response;
};

// PUT /api/rbac/roles/{roleId}/permissions
// Cập nhật toàn bộ quyền của một vai trò
export const updateRolePermissions = async (roleId, permissions = []) => {
  if (!roleId) throw new Error("Role ID is required");
  const response = await api.put(
    `${URL_RBAC}roles/${roleId}/permissions`,
    permissions
  );
  return response;
};

// PATCH /api/rbac/roles/{roleId}/permissions
// Cập nhật một phần quyền của một vai trò
// Body: { addKeys: [], removeKeys: [] }
export const patchRolePermissions = async (
  roleId,
  addKeys = [],
  removeKeys = []
) => {
  if (!roleId) throw new Error("Role ID is required");
  const response = await api.patch(`${URL_RBAC}roles/${roleId}/permissions`, {
    addKeys: Array.isArray(addKeys) ? addKeys : [],
    removeKeys: Array.isArray(removeKeys) ? removeKeys : [],
  });
  return response;
};

// PATCH /api/rbac/roles/{roleId}/permissions/modules/{module}
// Cập nhật quyền theo module cụ thể
// Body: { enable: true/false }
export const patchRolePermissionsByModule = async (
  roleId,
  module,
  enable = true
) => {
  if (!roleId) throw new Error("Role ID is required");
  if (!module) throw new Error("Module is required");
  const response = await api.patch(
    `${URL_RBAC}roles/${roleId}/permissions/modules/${module}`,
    {
      enable: Boolean(enable),
    }
  );
  return response;
};

// ==================== Permission CRUD APIs ====================
export const createPermissionAPI = async (data) => {
  return await api.post(`${URL_RBAC}permissions`, data);
};

export const updatePermissionAPI = async (id, data) => {
  return await api.put(`${URL_RBAC}permissions/${id}`, data);
};

export const deletePermissionAPI = async (id) => {
  return await api.delete(`${URL_RBAC}permissions/${id}`);
};

// Default export để tương thích với code cũ
export default IAMServiceAPI;
