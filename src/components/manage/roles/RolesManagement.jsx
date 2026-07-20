import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import {
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiShield,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { Pagination, Spin } from "antd";
import { setAuthToken } from "../../../utils/auth";
import { toast } from "react-toastify";
import {
  getRoles,
  getPermissionGroups,
  getRolePermissions,
  patchRolePermissions,
  createRole,
  deleteRole,
} from "../../../services/IAMService.jsx";
import "./RolesManagement.css";

const getRoleId = (role) => role?.id ?? role?.roleId ?? role?.Id ?? null;

const RolesManagement = () => {
  const breadcrumbs = [
    { name: "Tổng quan", link: "/admin/dashboard" },
    { name: "Quyền truy cập" },
  ];

  // States
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Store permissions for each role
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState({});

  // Permission groups
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [permissionGroupsLoading, setPermissionGroupsLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [initialPermissions, setInitialPermissions] = useState([]); // Lưu permissions ban đầu để so sánh
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState(new Set());

  // Create role modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    isDefault: false,
  });
  const [createFormErrors, setCreateFormErrors] = useState({
    name: "",
    description: "",
  });

  // Delete role modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    // Load permission groups first, then roles will load permissions
    fetchPermissionGroups();
  }, []);

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Helper functions
  const getPermissionId = (permission) =>
    permission?.key ??
    permission?.id ??
    permission?.permissionId ??
    permission?.Id ??
    null;

  const getPermissionLabel = (permission) =>
    permission?.label ??
    permission?.name ??
    permission?.permissionName ??
    permission?.key ??
    "-";

  const comparePermissionIds = (id1, id2) => {
    if (!id1 || !id2) return false;
    return String(id1) === String(id2);
  };

  const findPermissionInGroups = (permissionId) => {
    if (!permissionId) return null;
    for (const group of permissionGroups) {
      if (Array.isArray(group.permissions)) {
        const found = group.permissions.find((p) =>
          comparePermissionIds(getPermissionId(p), permissionId)
        );
        if (found) return found;
      }
    }
    return null;
  };

  const fetchPermissionGroups = async () => {
    setPermissionGroupsLoading(true);
    try {
      const groups = await getPermissionGroups();
      setPermissionGroups(Array.isArray(groups) ? groups : []);
    } catch (error) {
      console.error("Error loading permission groups:", error);
      toast.error("Không thể tải nhóm quyền");
    } finally {
      setPermissionGroupsLoading(false);
    }
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const params = { page, pageSize };
      const { items, meta } = await getRoles(params);
      const rolesList = items || [];
      setRoles(rolesList);
      setTotal(meta?.totalItems ?? rolesList.length ?? 0);

      // Fetch permissions for each role
      fetchRolesPermissions(rolesList);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Không thể tải danh sách vai trò");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolesPermissions = async (rolesList) => {
    if (!rolesList || rolesList.length === 0) return;

    // Set loading state for all roles
    const loadingMap = {};
    rolesList.forEach((role) => {
      const roleId = getRoleId(role);
      if (roleId) loadingMap[roleId] = true;
    });
    setLoadingPermissions(loadingMap);

    try {
      // Fetch permissions for all roles in parallel
      const permissionPromises = rolesList.map(async (role) => {
        const roleId = getRoleId(role);
        if (!roleId) return { roleId: null, permissions: [] };

        try {
          const permissions = await getRolePermissions(roleId);
          const permissionsArray = Array.isArray(permissions)
            ? permissions
            : [];

          // Map permissions to get labels from permission groups
          const mappedPermissions = permissionsArray.map((perm) => {
            if (typeof perm === "string") {
              // Try to find in permission groups
              const found = findPermissionInGroups(perm);
              return found || { key: perm, label: perm };
            }
            // If it's an object, check if we have more info in permission groups
            const permKey = getPermissionId(perm);
            if (permKey) {
              const found = findPermissionInGroups(permKey);
              if (found && found.label) {
                return { ...perm, label: found.label };
              }
            }
            return perm;
          });

          return { roleId, permissions: mappedPermissions };
        } catch (error) {
          console.error(
            `Error fetching permissions for role ${roleId}:`,
            error
          );
          return { roleId, permissions: [] };
        }
      });

      const results = await Promise.all(permissionPromises);

      // Update permissions map
      const newPermissionsMap = { ...rolePermissionsMap };
      results.forEach(({ roleId, permissions }) => {
        if (roleId) {
          newPermissionsMap[roleId] = permissions;
        }
      });
      setRolePermissionsMap(newPermissionsMap);
    } catch (error) {
      console.error("Error fetching roles permissions:", error);
    } finally {
      // Clear loading state
      setLoadingPermissions({});
    }
  };

  const handleOpenEditModal = async (role) => {
    const roleId = getRoleId(role);
    if (!roleId) return;

    setSelectedRole(role);
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setExpandedModules(new Set());

    try {
      const permissions = await getRolePermissions(roleId);
      const permissionsArray = Array.isArray(permissions) ? permissions : [];

      // Nếu API trả về array of strings (permission keys), cần map với permission groups
      // Nếu API trả về array of objects, giữ nguyên
      const mappedPermissions = permissionsArray.map((perm) => {
        // Nếu là string, tìm trong permission groups
        if (typeof perm === "string") {
          const found = findPermissionById(perm);
          return found || { key: perm, label: perm };
        }
        // Nếu là object, giữ nguyên
        return perm;
      });

      setRolePermissions(mappedPermissions);
      // Lưu initial permissions để so sánh sau này
      setInitialPermissions(mappedPermissions);
    } catch (error) {
      console.error("Error loading role permissions:", error);
      toast.error("Không thể tải quyền của vai trò");
      setRolePermissions([]);
      setInitialPermissions([]);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    setRolePermissions([]);
    setInitialPermissions([]);
    setExpandedModules(new Set());
    setIsSaving(false);
    setIsDetailLoading(false);
  };

  const togglePermission = (permissionId) => {
    setRolePermissions((prev) => {
      const exists = prev.some((p) =>
        comparePermissionIds(getPermissionId(p), permissionId)
      );
      if (exists) {
        return prev.filter(
          (p) => !comparePermissionIds(getPermissionId(p), permissionId)
        );
      } else {
        // Tìm permission từ groups để thêm vào
        const permission = findPermissionById(permissionId);
        if (permission) {
          return [...prev, permission];
        }
        return prev;
      }
    });
  };

  const findPermissionById = (permissionId) => {
    return findPermissionInGroups(permissionId);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    const roleId = getRoleId(selectedRole);
    if (!roleId) return;

    setIsSaving(true);
    try {
      // Lấy permission keys từ permissions hiện tại và ban đầu
      const currentKeys = rolePermissions
        .map((p) => getPermissionId(p))
        .filter(Boolean)
        .map((k) => String(k));

      const initialKeys = initialPermissions
        .map((p) => getPermissionId(p))
        .filter(Boolean)
        .map((k) => String(k));

      // Tính toán addKeys và removeKeys
      const addKeys = currentKeys.filter(
        (key) => !initialKeys.some((ik) => comparePermissionIds(ik, key))
      );
      const removeKeys = initialKeys.filter(
        (key) => !currentKeys.some((ck) => comparePermissionIds(ck, key))
      );

      // Chỉ gọi API nếu có thay đổi
      if (addKeys.length > 0 || removeKeys.length > 0) {
        // Convert roleId to int
        const roleIdInt = parseInt(roleId, 10);
        await patchRolePermissions(roleIdInt, addKeys, removeKeys);
        toast.success("Cập nhật quyền thành công!");

        // Update permissions map for this role
        const newPermissionsMap = { ...rolePermissionsMap };
        newPermissionsMap[roleId] = rolePermissions;
        setRolePermissionsMap(newPermissionsMap);

        // Cập nhật initial permissions
        setInitialPermissions(rolePermissions);
      } else {
        toast.info("Không có thay đổi nào");
      }

      fetchRoles();
    } catch (error) {
      console.error("Error updating role permissions:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể cập nhật quyền";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleModule = (moduleName) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleName)) {
        newSet.delete(moduleName);
      } else {
        newSet.add(moduleName);
      }
      return newSet;
    });
  };

  const toggleModulePermissions = (moduleName, permissions) => {
    const permissionKeys = permissions
      .map((p) => getPermissionId(p))
      .filter(Boolean);
    const selectedKeys = rolePermissions
      .map((p) => getPermissionId(p))
      .filter(Boolean);

    const allSelected = permissionKeys.every((key) =>
      selectedKeys.some((sk) => comparePermissionIds(sk, key))
    );

    if (allSelected) {
      // Bỏ chọn tất cả
      setRolePermissions((prev) =>
        prev.filter(
          (p) =>
            !permissionKeys.some((pk) =>
              comparePermissionIds(getPermissionId(p), pk)
            )
        )
      );
    } else {
      // Chọn tất cả
      const toAdd = permissions.filter(
        (p) =>
          !selectedKeys.some((sk) =>
            comparePermissionIds(getPermissionId(p), sk)
          )
      );
      setRolePermissions((prev) => [...prev, ...toAdd]);
    }
  };

  // Group permissions by module
  // Response structure: [{ module, label, permissions: [{ key, label }] }]
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissionGroups.forEach((group) => {
      // Sử dụng module từ response, fallback về moduleName hoặc label
      const moduleName =
        group.module || group.moduleName || group.label || "Khác";
      const moduleLabel = group.label || group.module || moduleName;

      if (!groups[moduleName]) {
        groups[moduleName] = {
          moduleName,
          moduleLabel,
          permissions: [],
        };
      }
      if (Array.isArray(group.permissions)) {
        groups[moduleName].permissions.push(...group.permissions);
      }
    });
    return groups;
  }, [permissionGroups]);

  const isPermissionSelected = (permissionId) => {
    return rolePermissions.some((p) =>
      comparePermissionIds(getPermissionId(p), permissionId)
    );
  };

  const getModuleSelectedCount = (moduleName) => {
    const modulePerms = groupedPermissions[moduleName]?.permissions || [];
    return modulePerms.filter((p) => isPermissionSelected(getPermissionId(p)))
      .length;
  };

  // Create role handlers
  const handleOpenCreateModal = () => {
    setCreateFormData({
      name: "",
      description: "",
      isDefault: false,
    });
    setCreateFormErrors({
      name: "",
      description: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormData({
      name: "",
      description: "",
      isDefault: false,
    });
    setCreateFormErrors({
      name: "",
      description: "",
    });
  };

  const handleCreateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user types
    if (createFormErrors[name]) {
      setCreateFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateCreateForm = () => {
    const errors = {
      name: "",
      description: "",
    };
    let isValid = true;

    if (!createFormData.name.trim()) {
      errors.name = "Tên vai trò là bắt buộc";
      isValid = false;
    } else if (createFormData.name.trim().length < 2) {
      errors.name = "Tên vai trò phải có ít nhất 2 ký tự";
      isValid = false;
    }

    if (!createFormData.description.trim()) {
      errors.description = "Mô tả là bắt buộc";
      isValid = false;
    } else if (createFormData.description.trim().length < 5) {
      errors.description = "Mô tả phải có ít nhất 5 ký tự";
      isValid = false;
    }

    setCreateFormErrors(errors);
    return isValid;
  };

  const handleCreateRole = async () => {
    if (!validateCreateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: createFormData.name.trim(),
        description: createFormData.description.trim(),
        isDefault: createFormData.isDefault,
      };

      await createRole(payload);
      toast.success("Tạo vai trò thành công!");
      handleCloseCreateModal();
      fetchRoles();
    } catch (error) {
      console.error("Error creating role:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể tạo vai trò";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete role handlers
  const handleDeleteRole = (role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    const roleId = getRoleId(roleToDelete);
    if (!roleId) return;

    setIsDeleting(true);
    try {
      await deleteRole(roleId);
      toast.success("Đã xóa vai trò thành công!");
      fetchRoles();
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error("Error deleting role:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể xóa vai trò";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout pageTitle="Quản lý quyền truy cập" breadcrumbs={breadcrumbs}>
      <div className="roles-container">
        <div className="roles-header">
          <div className="roles-header-left">
            <h1>Quản lý quyền truy cập</h1>
            <p>Quản lý vai trò và quyền truy cập của người dùng</p>
          </div>
          <button className="add-role-button" onClick={handleOpenCreateModal}>
            <FiPlus size={20} />
            <span>Tạo vai trò</span>
          </button>
        </div>

        <div className="roles-content">
          <div className="roles-controls">
            <div className="page-info">
              <span>Tổng cộng {total || 0} vai trò</span>
            </div>
          </div>

          <div className="roles-table-container">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Vai trò</th>
                  <th>Các quyền</th>
                  <th>Số quyền</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "40px" }}>
                      <div style={{ textAlign: "center" }}>
                        <Spin size="large" />
                      </div>
                    </td>
                  </tr>
                ) : roles.length > 0 ? (
                  roles.map((role) => (
                    <tr key={getRoleId(role)}>
                      <td>
                        <div className="role-name-cell">
                          <FiShield size={18} className="role-icon" />
                          <span className="role-name">
                            {role.name || role.roleName || "-"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="role-permissions-cell">
                          {loadingPermissions[getRoleId(role)] ? (
                            <span className="loading-permissions">
                              Đang tải...
                            </span>
                          ) : (
                            (() => {
                              const roleId = getRoleId(role);
                              const permissions =
                                rolePermissionsMap[roleId] || [];
                              const permissionCount = permissions.length;

                              if (permissionCount === 0) {
                                return (
                                  <span className="no-permissions">
                                    Chưa có quyền nào
                                  </span>
                                );
                              }

                              // Hiển thị tối đa 3 quyền đầu tiên, còn lại hiển thị số lượng
                              const displayPermissions = permissions.slice(
                                0,
                                3
                              );
                              const remainingCount =
                                permissionCount - displayPermissions.length;

                              return (
                                <div className="permissions-list-inline">
                                  {displayPermissions.map((perm, index) => (
                                    <span
                                      key={getPermissionId(perm) || index}
                                      className="permission-tag"
                                    >
                                      {getPermissionLabel(perm)}
                                    </span>
                                  ))}
                                  {remainingCount > 0 && (
                                    <span className="permission-more">
                                      +{remainingCount} quyền khác
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="permission-count">
                          {(() => {
                            const roleId = getRoleId(role);
                            const permissions = rolePermissionsMap[roleId];
                            if (permissions !== undefined) {
                              return permissions.length;
                            }
                            return (
                              role.permissionCount ??
                              role.permissions?.length ??
                              0
                            );
                          })()}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-button edit"
                            onClick={() => handleOpenEditModal(role)}
                            title="Chỉnh sửa quyền"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            className="action-button delete"
                            onClick={() => handleDeleteRole(role)}
                            title="Xóa vai trò"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", padding: 40 }}
                    >
                      Chưa có vai trò nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > pageSize && (
            <div className="pagination-container">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(newPage, newPageSize) => {
                  setPage(newPage);
                  setPageSize(newPageSize);
                }}
                showSizeChanger
                showTotal={(total) => `Tổng ${total} vai trò`}
                pageSizeOptions={["5", "10", "20", "50"]}
              />
            </div>
          )}
        </div>

        {/* Edit Permissions Modal */}
        {isModalOpen && selectedRole && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  Chỉnh sửa quyền: {selectedRole.name || selectedRole.roleName}
                </h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body">
                {isDetailLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <div className="permissions-selector">
                    {Object.keys(groupedPermissions).length > 0 ? (
                      Object.entries(groupedPermissions).map(
                        ([moduleName, group]) => {
                          const isExpanded = expandedModules.has(moduleName);
                          const selectedCount =
                            getModuleSelectedCount(moduleName);
                          const totalCount = group.permissions.length;
                          const allSelected =
                            selectedCount === totalCount && totalCount > 0;

                          return (
                            <div key={moduleName} className="permission-module">
                              <div
                                className="module-header"
                                onClick={() => handleToggleModule(moduleName)}
                              >
                                <div className="module-header-left">
                                  {isExpanded ? (
                                    <FiChevronUp size={20} />
                                  ) : (
                                    <FiChevronDown size={20} />
                                  )}
                                  <span className="module-name">
                                    {group.moduleLabel || moduleName}
                                  </span>
                                  <span className="module-count">
                                    ({selectedCount}/{totalCount})
                                  </span>
                                </div>
                                <div className="module-actions">
                                  <button
                                    className="select-all-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleModulePermissions(
                                        moduleName,
                                        group.permissions
                                      );
                                    }}
                                    disabled={isSaving}
                                  >
                                    {allSelected
                                      ? "Bỏ chọn tất cả"
                                      : "Chọn tất cả"}
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="permissions-list">
                                  {group.permissions.length > 0 ? (
                                    group.permissions.map((permission) => {
                                      const permId =
                                        getPermissionId(permission);
                                      const isSelected =
                                        isPermissionSelected(permId);

                                      return (
                                        <div
                                          key={permId}
                                          className={`permission-item ${
                                            isSelected ? "selected" : ""
                                          }`}
                                          onClick={() =>
                                            togglePermission(permId)
                                          }
                                        >
                                          <div className="permission-checkbox">
                                            {isSelected ? (
                                              <FiCheck
                                                size={16}
                                                className="check-icon"
                                              />
                                            ) : (
                                              <div className="empty-checkbox" />
                                            )}
                                          </div>
                                          <div className="permission-info">
                                            <span className="permission-name">
                                              {getPermissionLabel(permission)}
                                            </span>
                                            {permission.description && (
                                              <span className="permission-desc">
                                                {permission.description}
                                              </span>
                                            )}
                                            {permission.key &&
                                              permission.key !==
                                                getPermissionLabel(
                                                  permission
                                                ) && (
                                                <span className="permission-key">
                                                  {permission.key}
                                                </span>
                                              )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className="empty-text">
                                      Không có quyền nào
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="loading-container">
                        {permissionGroupsLoading ? (
                          <div style={{ textAlign: "center" }}>
                            <Spin />
                          </div>
                        ) : (
                          <p className="empty-text">Không có nhóm quyền nào</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button
                  className="modal-button primary"
                  onClick={handleSavePermissions}
                  disabled={isSaving || isDetailLoading}
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
        {isCreateModalOpen && (
          <div className="modal-overlay" onClick={handleCloseCreateModal}>
            <div
              className="roles-modal create-role-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Tạo vai trò mới</h2>
                <button
                  className="modal-close"
                  onClick={handleCloseCreateModal}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Tên vai trò <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={`form-input ${
                      createFormErrors.name ? "error" : ""
                    }`}
                    placeholder="Nhập tên vai trò"
                    value={createFormData.name}
                    onChange={handleCreateFormChange}
                    disabled={isCreating}
                  />
                  {createFormErrors.name && (
                    <span className="form-error">{createFormErrors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Mô tả <span className="required">*</span>
                  </label>
                  <textarea
                    name="description"
                    className={`form-textarea ${
                      createFormErrors.description ? "error" : ""
                    }`}
                    placeholder="Nhập mô tả vai trò"
                    value={createFormData.description}
                    onChange={handleCreateFormChange}
                    disabled={isCreating}
                    rows={3}
                  />
                  {createFormErrors.description && (
                    <span className="form-error">
                      {createFormErrors.description}
                    </span>
                  )}
                </div>

                <div className="form-group checkbox-form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={createFormData.isDefault}
                      onChange={handleCreateFormChange}
                      disabled={isCreating}
                      className="custom-checkbox"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">Vai trò mặc định</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={handleCloseCreateModal}
                  disabled={isCreating}
                >
                  Hủy
                </button>
                <button
                  className="modal-button primary"
                  onClick={handleCreateRole}
                  disabled={isCreating}
                >
                  {isCreating ? "Đang tạo..." : "Tạo vai trò"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && roleToDelete && (
          <div className="modal-overlay" onClick={handleCancelDelete}>
            <div
              className="roles-modal delete-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Xác nhận xóa</h2>
                <button className="modal-close" onClick={handleCancelDelete}>
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p>
                  Bạn có chắc chắn muốn xóa vai trò{" "}
                  <strong>
                    {roleToDelete.name || roleToDelete.roleName || "-"}
                  </strong>{" "}
                  không?
                </p>
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "14px",
                    marginTop: "8px",
                  }}
                >
                  Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  className="modal-button delete-button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RolesManagement;
