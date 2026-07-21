/* eslint-disable react-refresh/only-export-components */
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form } from "antd";
import { IAMServiceAPI } from "../apis/IAMServiceAPI.jsx";
import {
  getPermissionGroups as getPermissionGroupsAPI,
  getRoles as getRolesAPI,
  getRolePermissions as getRolePermissionsAPI,
  updateRolePermissions as updateRolePermissionsAPI,
  patchRolePermissions as patchRolePermissionsAPI,
  patchRolePermissionsByModule as patchRolePermissionsByModuleAPI,
  createRole as createRoleAPI,
  deleteRole as deleteRoleAPI,
} from "../apis/IAMServiceAPI.jsx";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { setUserData, setAuthToken } from "../utils/auth";

export const useResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const onFinish = async (values) => {
    if (!token) {
      toast.error("Thiếu token đặt lại mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      const response = await IAMServiceAPI.ResetPasswordAPI(
        token,
        values.password
      );
      if (response.status >= 200 && response.status < 300) {
        const msg = "Đặt lại mật khẩu thành công.";
        toast.success(msg);
        navigate("/login");
      }
    } catch (err) {
      console.log("Server response:", err.response);

      const serverMsg =
        (typeof err?.response?.data === "string" && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Không thể đặt lại mật khẩu.";
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return { onFinish, loading, token };
};

export const useForgotPassword = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await IAMServiceAPI.ForgotPasswordAPI(values.email);

      if (response.status >= 200 && response.status < 300) {
        toast.success(
          response?.message ||
            "Yêu cầu đổi mật khẩu đã được gửi về Email, vui lòng kiểm tra lại Email!!"
        );
      }
    } catch (err) {
      const serverMsg =
        (typeof err?.response?.data === "string" && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Gửi yêu cầu thất bại. Vui lòng thử lại.";
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };
  return { onFinish, loading };
};

export const useLoginWithPassword = () => {
  const navigate = useNavigate();
  const onFinish = async (values) => {
    try {
      const response = await IAMServiceAPI.LoginWithPassword(
        values.username,
        values.password
      );

      const data = response?.data.data || {};
      const decode = jwtDecode(data.accessToken);
      const role =
        decode["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const perm = decode["perm"];

      if (response.status === 200) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiresAt", data.expiresAt);
        localStorage.setItem("permissions", JSON.stringify(perm) || []);
        setUserData(data);
        if (role === "Customer") {
          toast.success("Đăng nhập thành công!");
          navigate("/");
        } else if (
          role === "Admin" ||
          role === "Manager" ||
          role === "LabUser" ||
          role === "Receptionist" ||
          role === "LabBlogger" ||
          role === "Technician" ||
          role === "Staff"
        ) {
          toast.success("Đăng nhập thành công!");
          navigate("/dashboard");
        } else if (role === "Consultant") {
          toast.success("Đăng nhập thành công!");
          navigate("/instruments");
        }
      }
    } catch (error) {
      if (error.response?.status === 423) {
        toast.error("Tài Khoản Của Bạn Đã Bị Khóa!!");
        return;
      }
      const serverMsg =
        (typeof error?.response?.data === "string" && error.response.data) ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "";
      toast.error(
        typeof serverMsg === "string" && serverMsg.trim()
          ? serverMsg
          : "Tên đăng nhập hoặc mật khẩu không chính xác!"
      );
    }
  };
  return { onFinish };
};

export const useLoginWithGoogle = () => {
  const navigate = useNavigate();
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        toast.error("Không nhận được token từ Google");
        return;
      }

      // Gửi idToken sang backend để xác thực
      const response = await IAMServiceAPI.LoginWithGoogle(idToken);

      const data = response?.data.data || {};
      const decode = jwtDecode(data.accessToken);
      const role =
        decode["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const perm = decode["perm"];

      if (response.status <= 200 && response.status < 300) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiresAt", data.expiresAt);
        localStorage.setItem("permissions", JSON.stringify(perm) || []);
        setUserData(data);
        if (role === "Customer") {
          toast.success("Đăng nhập thành công!");
          navigate("/");
        } else if (
          role === "Admin" ||
          role === "Manager" ||
          role === "LabUser" ||
          role === "Receptionist" ||
          role === "LabBlogger" ||
          role === "Technician" ||
          role === "Staff"
        ) {
          toast.success("Đăng nhập thành công!");
          navigate("/dashboard");
        } else if (role === "Consultant") {
          toast.success("Đăng nhập thành công!");
          navigate("/instruments");
        }
      } else {
        toast.error("Không nhận được access token từ server");
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Đăng nhập bằng Google thất bại!");
    }
  };
  return { handleGoogleLoginSuccess };
};

export const useRegister = () => {
  const navigate = useNavigate();
  const [apiErrors, setApiErrors] = useState({});
  const [form] = Form.useForm();
  const onFinish = async (values) => {
    setApiErrors({}); // Clear previous errors

    try {
      const payload = {
        username: values.UserName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        fullName: values.fullname,
      };

      const response = await IAMServiceAPI.Register(payload);
      if (response && response.status >= 200 && response.status < 300) {
        toast.success("Đăng ký thành công!");
        navigate("/login");
      } else {
        toast.error("Đăng ký không thành công!");
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Handle API error response
      if (error.response?.data) {
        const errorData = error.response.data;
        const newErrors = {};

        // Check if error has detail field (like DUPLICATE_EMAIL)
        if (errorData.detail) {
          const detail = errorData.detail.toLowerCase();

          // Map error to specific field based on detail content or code
          if (
            errorData.code === "DUPLICATE_EMAIL" ||
            detail.includes("email")
          ) {
            newErrors.email = errorData.detail;
          } else if (
            detail.includes("username") ||
            detail.includes("tên đăng nhập")
          ) {
            newErrors.UserName = errorData.detail;
          } else if (
            detail.includes("password") ||
            detail.includes("mật khẩu")
          ) {
            newErrors.password = errorData.detail;
          } else if (detail.includes("fullname") || detail.includes("họ tên")) {
            newErrors.fullname = errorData.detail;
          } else {
            // Default to email field if can't determine
            newErrors.email = errorData.detail;
          }
        }
        // Check for errors array
        else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err) => {
            if (err.field) {
              const fieldName = err.field.toLowerCase();
              // Map backend field names to form field names
              const fieldMap = {
                username: "UserName",
                email: "email",
                password: "password",
                confirmpassword: "confirmPassword",
                fullname: "fullname",
              };
              const mappedField = fieldMap[fieldName] || err.field;
              newErrors[mappedField] = err.message || err;
            }
          });
        }
        // Check for validation errors object
        else if (errorData.errors && typeof errorData.errors === "object") {
          Object.keys(errorData.errors).forEach((field) => {
            const fieldName = field.toLowerCase();
            const errorMessages = errorData.errors[field];
            const fieldMap = {
              username: "UserName",
              email: "email",
              password: "password",
              confirmpassword: "confirmPassword",
              fullname: "fullname",
            };
            const mappedField = fieldMap[fieldName] || field;
            newErrors[mappedField] = Array.isArray(errorMessages)
              ? errorMessages.join(", ")
              : errorMessages;
          });
        }
        // Fallback to message
        else if (errorData.message) {
          newErrors.email = errorData.message;
        }

        if (Object.keys(newErrors).length > 0) {
          setApiErrors(newErrors);
          // Set form fields errors programmatically
          const formErrors = Object.keys(newErrors).map((field) => ({
            name: field,
            errors: [newErrors[field]],
          }));
          form.setFields(formErrors);
        } else {
          toast.error("Đăng ký không thành công, vui lòng thử lại sau!");
        }
      } else {
        toast.error("Đăng ký không thành công, vui lòng thử lại sau!");
      }
    }
  };
  return { onFinish, apiErrors, form, setApiErrors };
};

export const useChangePassword = ({ open, onClose } = {}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("accessToken");
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  // Make onClose safe to call even if not provided
  const safeOnClose = typeof onClose === "function" ? onClose : () => {};

  const handleSubmit = async (values) => {
    setLoading(true);
    setAuthToken(token);
    try {
      const response = await IAMServiceAPI.ChangePassword(
        values.oldPassword,
        values.newPassword
      );

      if (response.status >= 200 && response.status < 300) {
        toast.success("Đổi mật khẩu thành công!");
        form.resetFields();
        safeOnClose();
      }
    } catch (err) {
      const serverMsg =
        (typeof err?.response?.data === "string" && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Đổi mật khẩu thất bại.";
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };
  // return safe values (open -> boolean, onClose -> safe function)
  return {
    handleSubmit,
    loading,
    passwordPattern,
    onClose: safeOnClose,
    open: !!open,
    form,
  };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data with fullName
 */
export const getUserById = async (userId) => {
  try {
    // Set auth token before making the request
    const token = localStorage.getItem("accessToken");
    if (token) {
      setAuthToken(token);
    }

    const response = await IAMServiceAPI.GetUserById(userId);

    // Handle different response structures
    const userData = response.data?.data || response.data;

    return userData;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`User ${userId} not found (might be deleted).`);
    } else {
      console.error(`Error getting user ${userId}:`, error);
    }
    return null;
  }
};
// ==================== RBAC Service Functions ====================
// GET /api/rbac/permission-groups
// Lấy danh sách các nhóm quyền với logic xử lý response
export const getPermissionGroups = async (params = {}) => {
  const response = await getPermissionGroupsAPI(params);
  const data = response?.data;

  // Xử lý response structure: data.data hoặc data trực tiếp
  if (Array.isArray(data?.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  }

  return [];
};

// GET /api/rbac/roles
// Lấy danh sách các vai trò với logic xử lý response
export const getRoles = async (params = {}) => {
  const response = await getRolesAPI(params);
  const data = response?.data;

  // Xử lý nhiều trường hợp response structure
  if (Array.isArray(data)) {
    return { items: data, meta: { totalItems: data.length } };
  } else if (Array.isArray(data?.data)) {
    return {
      items: data.data,
      meta: data.meta || { totalItems: data.data.length },
    };
  } else if (Array.isArray(data?.items)) {
    return {
      items: data.items,
      meta: data.meta || { totalItems: data.items.length },
    };
  }

  return { items: [], meta: { totalItems: 0 } };
};

// GET /api/rbac/roles/{roleId}/permissions
// Lấy danh sách quyền của một vai trò cụ thể
export const getRolePermissions = async (roleId) => {
  if (!roleId) throw new Error("Role ID is required");
  const response = await getRolePermissionsAPI(roleId);
  const data = response?.data;
  return data?.data || data || [];
};

// PUT /api/rbac/roles/{roleId}/permissions
// Cập nhật toàn bộ quyền của một vai trò
export const updateRolePermissions = async (roleId, permissions = []) => {
  if (!roleId) throw new Error("Role ID is required");
  const response = await updateRolePermissionsAPI(roleId, permissions);
  const data = response?.data;
  return data?.data || data;
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
  const response = await patchRolePermissionsAPI(roleId, addKeys, removeKeys);
  const data = response?.data;
  return data?.data || data;
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
  const response = await patchRolePermissionsByModuleAPI(
    roleId,
    module,
    enable
  );
  const data = response?.data;
  return data?.data || data;
};

// POST /api/Roles
// Tạo role mới
export const createRole = async (data) => {
  if (!data) throw new Error("Role data is required");
  const response = await createRoleAPI(data);
  return response?.data;
};

// DELETE /api/Roles/{id}
// Xóa role
export const deleteRole = async (id) => {
  if (!id) throw new Error("Role ID is required");
  const response = await deleteRoleAPI(id);
  return response?.data;
};

// POST /api/Users/{id}/roles
// Cập nhật role của user
export const updateUserRoles = async (userId, roleIds) => {
  if (!userId) throw new Error("User ID is required");
  if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
    throw new Error("Role IDs array is required");
  }
  const response = await IAMServiceAPI.UpdateUserRoles(userId, roleIds);
  return response?.data || response;
};
