import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import {
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiShield,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiSave,
  FiRotateCcw,
  FiCheckSquare,
  FiSquare,
} from "react-icons/fi";
import { Spin } from "antd";
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

  // System States
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [permissionGroupsLoading, setPermissionGroupsLoading] = useState(false);

  // Original & Working Permission Maps
  // Map structure: { [roleId]: Set<permissionKey> }
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});
  const [workingPermissionsMap, setWorkingPermissionsMap] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Matrix UI States
  const [collapsedModules, setCollapsedModules] = useState(new Set());
  const [permissionSearch, setPermissionSearch] = useState("");

  // Create / Edit / Delete Modals
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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial Data Fetching
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    setPermissionGroupsLoading(true);
    try {
      // 1. Fetch Permission Groups
      const groups = await getPermissionGroups();
      const groupsList = Array.isArray(groups) ? groups : [];
      setPermissionGroups(groupsList);

      // 2. Fetch All Roles
      const { items } = await getRoles({ page: 1, pageSize: 100 });
      const rolesList = items || [];
      setRoles(rolesList);

      // 3. Fetch Permissions for each role
      await fetchMatrixPermissions(rolesList, groupsList);
    } catch (error) {
      console.error("Error initializing Permission Matrix:", error);
      toast.error("Không thể tải dữ liệu ma trận phân quyền");
    } finally {
      setIsLoading(false);
      setPermissionGroupsLoading(false);
    }
  };

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

  const fetchMatrixPermissions = async (rolesList, groupsList) => {
    if (!rolesList || rolesList.length === 0) return;
    setLoadingPermissions(true);

    try {
      const initialMap = {};
      const workingMap = {};

      await Promise.all(
        rolesList.map(async (role) => {
          const roleId = getRoleId(role);
          if (!roleId) return;

          try {
            const permissions = await getRolePermissions(roleId);
            const permissionsArray = Array.isArray(permissions)
              ? permissions
              : [];

            const keysSet = new Set(
              permissionsArray
                .map((p) => (typeof p === "string" ? p : getPermissionId(p)))
                .filter(Boolean)
            );

            initialMap[roleId] = keysSet;
            workingMap[roleId] = new Set(keysSet);
          } catch (err) {
            console.error(`Error fetching permissions for role ${roleId}`, err);
            initialMap[roleId] = new Set();
            workingMap[roleId] = new Set();
          }
        })
      );

      setRolePermissionsMap(initialMap);
      setWorkingPermissionsMap(workingMap);
    } catch (error) {
      console.error("Error fetching matrix permissions:", error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissionGroups.forEach((group) => {
      const moduleName =
        group.module || group.moduleName || group.label || "Hệ thống";
      const moduleLabel = group.label || group.module || moduleName;

      if (!groups[moduleName]) {
        groups[moduleName] = {
          moduleName,
          moduleLabel,
          permissions: [],
        };
      }

      if (Array.isArray(group.permissions)) {
        group.permissions.forEach((perm) => {
          const permKey = getPermissionId(perm);
          if (
            !groups[moduleName].permissions.some(
              (p) => getPermissionId(p) === permKey
            )
          ) {
            groups[moduleName].permissions.push(perm);
          }
        });
      }
    });
    return groups;
  }, [permissionGroups]);

  // Filtered Modules by Search Query
  const filteredGroupedPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return groupedPermissions;

    const query = permissionSearch.trim().toLowerCase();
    const result = {};

    Object.entries(groupedPermissions).forEach(([moduleName, group]) => {
      const matchedPerms = group.permissions.filter((perm) => {
        const label = getPermissionLabel(perm).toLowerCase();
        const key = (getPermissionId(perm) || "").toLowerCase();
        const desc = (perm.description || "").toLowerCase();
        return (
          label.includes(query) || key.includes(query) || desc.includes(query)
        );
      });

      if (matchedPerms.length > 0) {
        result[moduleName] = {
          ...group,
          permissions: matchedPerms,
        };
      }
    });

    return result;
  }, [groupedPermissions, permissionSearch]);

  // Matrix Checkbox Interaction
  const togglePermissionForRole = (roleId, permissionKey) => {
    if (!roleId || !permissionKey) return;

    setWorkingPermissionsMap((prev) => {
      const currentRoleSet = prev[roleId] ? new Set(prev[roleId]) : new Set();

      if (currentRoleSet.has(permissionKey)) {
        currentRoleSet.delete(permissionKey);
      } else {
        currentRoleSet.add(permissionKey);
      }

      return {
        ...prev,
        [roleId]: currentRoleSet,
      };
    });
  };

  // Toggle All Permissions in a Module for a specific Role
  const toggleModulePermissionsForRole = (roleId, modulePermissions) => {
    if (!roleId || !modulePermissions || modulePermissions.length === 0)
      return;

    const permKeys = modulePermissions
      .map((p) => getPermissionId(p))
      .filter(Boolean);

    setWorkingPermissionsMap((prev) => {
      const currentRoleSet = prev[roleId] ? new Set(prev[roleId]) : new Set();
      const allSelected = permKeys.every((key) => currentRoleSet.has(key));

      if (allSelected) {
        permKeys.forEach((key) => currentRoleSet.delete(key));
      } else {
        permKeys.forEach((key) => currentRoleSet.add(key));
      }

      return {
        ...prev,
        [roleId]: currentRoleSet,
      };
    });
  };

  // Check if any role has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return roles.some((role) => {
      const roleId = getRoleId(role);
      if (!roleId) return false;

      const initialSet = rolePermissionsMap[roleId] || new Set();
      const workingSet = workingPermissionsMap[roleId] || new Set();

      if (initialSet.size !== workingSet.size) return true;
      for (const key of workingSet) {
        if (!initialSet.has(key)) return true;
      }
      return false;
    });
  }, [roles, rolePermissionsMap, workingPermissionsMap]);

  // Reset Changes
  const handleResetChanges = () => {
    const resetMap = {};
    Object.entries(rolePermissionsMap).forEach(([roleId, keysSet]) => {
      resetMap[roleId] = new Set(keysSet);
    });
    setWorkingPermissionsMap(resetMap);
    toast.info("Đã hủy các thay đổi chưa lưu");
  };

  // Save All Unsaved Changes via API
  const handleSaveAllChanges = async () => {
    setIsSavingAll(true);
    let updatedCount = 0;

    try {
      const updatePromises = roles.map(async (role) => {
        const roleId = getRoleId(role);
        if (!roleId) return;

        const initialSet = rolePermissionsMap[roleId] || new Set();
        const workingSet = workingPermissionsMap[roleId] || new Set();

        const addKeys = Array.from(workingSet).filter(
          (key) => !initialSet.has(key)
        );
        const removeKeys = Array.from(initialSet).filter(
          (key) => !workingSet.has(key)
        );

        if (addKeys.length > 0 || removeKeys.length > 0) {
          const roleIdInt = parseInt(roleId, 10);
          await patchRolePermissions(roleIdInt, addKeys, removeKeys);
          updatedCount++;
        }
      });

      await Promise.all(updatePromises);

      if (updatedCount > 0) {
        toast.success(`Đã cập nhật quyền thành công cho ${updatedCount} vai trò!`);
        // Refresh permissions map
        const newInitialMap = {};
        Object.entries(workingPermissionsMap).forEach(([roleId, set]) => {
          newInitialMap[roleId] = new Set(set);
        });
        setRolePermissionsMap(newInitialMap);
      } else {
        toast.info("Không có thay đổi nào cần lưu");
      }
    } catch (error) {
      console.error("Error saving permission changes:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể cập nhật một số quyền. Vui lòng thử lại!";
      toast.error(message);
    } finally {
      setIsSavingAll(false);
    }
  };

  // Module Accordion Toggle
  const toggleModuleCollapse = (moduleName) => {
    setCollapsedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleName)) {
        newSet.delete(moduleName);
      } else {
        newSet.add(moduleName);
      }
      return newSet;
    });
  };

  const collapseAllModules = () => {
    setCollapsedModules(new Set(Object.keys(groupedPermissions)));
  };

  const expandAllModules = () => {
    setCollapsedModules(new Set());
  };

  // Create Role Handlers
  const handleOpenCreateModal = () => {
    setCreateFormData({ name: "", description: "", isDefault: false });
    setCreateFormErrors({ name: "", description: "" });
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (createFormErrors[name]) {
      setCreateFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateCreateForm = () => {
    const errors = { name: "", description: "" };
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
    }

    setCreateFormErrors(errors);
    return isValid;
  };

  const handleCreateRoleSubmit = async () => {
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
      toast.success("Tạo vai trò mới thành công!");
      handleCloseCreateModal();
      initData();
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error(
        error.response?.data?.message || "Không thể tạo vai trò mới"
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Delete Role Handlers
  const handleDeleteRoleClick = (role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    const roleId = getRoleId(roleToDelete);
    if (!roleId) return;

    setIsDeleting(true);
    try {
      await deleteRole(roleId);
      toast.success("Đã xóa vai trò thành công!");
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
      initData();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error(
        error.response?.data?.message || "Không thể xóa vai trò này"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout pageTitle="Bảng ma trận quyền truy cập" breadcrumbs={breadcrumbs}>
      <div className="matrix-page-container">
        {/* Header Title Bar */}
        <div className="matrix-header">
          <div className="matrix-header-left">
            <h1 className="matrix-title">Quản lý & Ma trận Phân quyền</h1>
            <p className="matrix-subtitle">
              Cấp hoặc tước quyền hạn trực tiếp trên từng vai trò bằng Bảng Ma trận (Permission Matrix)
            </p>
          </div>
          <div className="matrix-header-actions">
            <button className="btn-add-role" onClick={handleOpenCreateModal}>
              <FiPlus size={18} />
              <span>Tạo vai trò mới</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="matrix-toolbar">
          <div className="matrix-search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm quyền hạn (tên, mã quyền)..."
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
            />
            {permissionSearch && (
              <button
                className="btn-clear-search"
                onClick={() => setPermissionSearch("")}
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="matrix-quick-controls">
            <button className="btn-matrix-toggle" onClick={expandAllModules}>
              Mở tất cả nhóm
            </button>
            <button className="btn-matrix-toggle" onClick={collapseAllModules}>
              Thu gọn tất cả
            </button>
          </div>
        </div>

        {/* Permission Matrix Table */}
        <div className="matrix-table-card">
          {isLoading || permissionGroupsLoading ? (
            <div className="matrix-loading-wrapper">
              <Spin size="large" />
              <p>Đang tải Ma trận Phân quyền...</p>
            </div>
          ) : (
            <div className="matrix-scroll-wrapper">
              <table className="permission-matrix-table">
                <thead>
                  <tr>
                    {/* Sticky Corner Header */}
                    <th className="sticky-corner-cell">
                      <div className="corner-content">
                        <span>Hạng mục Quyền</span>
                        <span className="corner-divider">/</span>
                        <span>Vai trò ({roles.length})</span>
                      </div>
                    </th>

                    {/* Dynamic Role Header Columns */}
                    {roles.map((role) => {
                      const roleId = getRoleId(role);
                      const currentPermissions =
                        workingPermissionsMap[roleId] || new Set();
                      const count = currentPermissions.size;

                      return (
                        <th key={roleId} className="role-column-header">
                          <div className="role-header-card">
                            <div className="role-badge">
                              <FiShield className="role-shield-icon" />
                              <span className="role-name-text">
                                {role.name || role.roleName || "N/A"}
                              </span>
                            </div>
                            <div className="role-meta-info">
                              <span className="role-perm-count">
                                {loadingPermissions ? "..." : `${count} quyền`}
                              </span>
                              <div className="role-actions-row">
                                <button
                                  className="btn-role-action delete"
                                  onClick={() => handleDeleteRoleClick(role)}
                                  title="Xóa vai trò này"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(filteredGroupedPermissions).length === 0 ? (
                    <tr>
                      <td
                        colSpan={1 + roles.length}
                        className="empty-matrix-cell"
                      >
                        Không tìm thấy quyền hạn nào phù hợp với từ khóa.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(filteredGroupedPermissions).map(
                      ([moduleName, group]) => {
                        const isCollapsed = collapsedModules.has(moduleName);

                        return (
                          <React.Fragment key={moduleName}>
                            {/* Module Header Row */}
                            <tr className="module-group-row">
                              <td className="module-header-cell sticky-col">
                                <div
                                  className="module-title-wrapper"
                                  onClick={() => toggleModuleCollapse(moduleName)}
                                >
                                  {isCollapsed ? (
                                    <FiChevronRight className="accordion-icon" />
                                  ) : (
                                    <FiChevronDown className="accordion-icon" />
                                  )}
                                  <span className="module-title">
                                    {group.moduleLabel || moduleName}
                                  </span>
                                  <span className="module-badge-count">
                                    {group.permissions.length} quyền
                                  </span>
                                </div>
                              </td>

                              {/* Action Checkboxes for Module Row */}
                              {roles.map((role) => {
                                const roleId = getRoleId(role);
                                const currentRoleSet =
                                  workingPermissionsMap[roleId] || new Set();
                                const modulePermKeys = group.permissions
                                  .map((p) => getPermissionId(p))
                                  .filter(Boolean);

                                const isAllModuleSelected =
                                  modulePermKeys.length > 0 &&
                                  modulePermKeys.every((k) =>
                                    currentRoleSet.has(k)
                                  );

                                const isSomeModuleSelected =
                                  !isAllModuleSelected &&
                                  modulePermKeys.some((k) =>
                                    currentRoleSet.has(k)
                                  );

                                return (
                                  <td
                                    key={`mod-${moduleName}-${roleId}`}
                                    className="module-toggle-cell"
                                  >
                                    <button
                                      type="button"
                                      className={`btn-module-toggle ${
                                        isAllModuleSelected
                                          ? "all-checked"
                                          : isSomeModuleSelected
                                          ? "some-checked"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        toggleModulePermissionsForRole(
                                          roleId,
                                          group.permissions
                                        )
                                      }
                                      title={
                                        isAllModuleSelected
                                          ? "Bỏ chọn tất cả quyền trong module này"
                                          : "Chọn tất cả quyền trong module này"
                                      }
                                    >
                                      {isAllModuleSelected ? (
                                        <FiCheckSquare size={16} />
                                      ) : isSomeModuleSelected ? (
                                        <div className="indeterminate-box" />
                                      ) : (
                                        <FiSquare size={16} />
                                      )}
                                      <span className="toggle-label">Tất cả</span>
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Permission Items Rows */}
                            {!isCollapsed &&
                              group.permissions.map((permission) => {
                                const permKey = getPermissionId(permission);
                                const permLabel = getPermissionLabel(permission);

                                return (
                                  <tr
                                    key={permKey}
                                    className="permission-item-row"
                                  >
                                    {/* Permission Description Column (Sticky Left) */}
                                    <td className="permission-info-cell sticky-col">
                                      <div className="perm-info-wrapper">
                                        <span className="perm-label-text">
                                          {permLabel}
                                        </span>
                                        {permission.description && (
                                          <span className="perm-desc-text">
                                            {permission.description}
                                          </span>
                                        )}
                                        <span className="perm-key-code">
                                          {permKey}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Permission Checkbox Cells for Each Role */}
                                    {roles.map((role) => {
                                      const roleId = getRoleId(role);
                                      const currentRoleSet =
                                        workingPermissionsMap[roleId] ||
                                        new Set();
                                      const isChecked = currentRoleSet.has(permKey);

                                      return (
                                        <td
                                          key={`cell-${permKey}-${roleId}`}
                                          className={`matrix-checkbox-cell ${
                                            isChecked ? "cell-active" : ""
                                          }`}
                                          onClick={() =>
                                            togglePermissionForRole(
                                              roleId,
                                              permKey
                                            )
                                          }
                                        >
                                          <label className="matrix-checkbox-label">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}} // handled by parent td onClick
                                              className="matrix-hidden-input"
                                            />
                                            <div
                                              className={`custom-matrix-checkbox ${
                                                isChecked ? "checked" : ""
                                              }`}
                                            >
                                              {isChecked && (
                                                <FiCheck className="check-mark-icon" />
                                              )}
                                            </div>
                                          </label>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Floating Save Bar for Unsaved Matrix Changes */}
        {hasUnsavedChanges && (
          <div className="floating-save-bar">
            <div className="save-bar-content">
              <div className="save-bar-info">
                <FiShield className="save-bar-icon" />
                <span>Bạn đang có các thay đổi phân quyền chưa lưu.</span>
              </div>
              <div className="save-bar-actions">
                <button
                  type="button"
                  className="btn-save-cancel"
                  onClick={handleResetChanges}
                  disabled={isSavingAll}
                >
                  <FiRotateCcw /> Hủy thay đổi
                </button>
                <button
                  type="button"
                  className="btn-save-submit"
                  onClick={handleSaveAllChanges}
                  disabled={isSavingAll}
                >
                  {isSavingAll ? (
                    <>Đang lưu...</>
                  ) : (
                    <>
                      <FiSave /> Lưu tất cả thay đổi
                    </>
                  )}
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
                    placeholder="Nhập tên vai trò (vd: Technician, Doctor)"
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
                    placeholder="Mô tả nhiệm vụ của vai trò"
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
                  onClick={handleCreateRoleSubmit}
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
          <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
            <div
              className="roles-modal delete-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Xác nhận xóa vai trò</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
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
                  Lưu ý: Các người dùng hiện tại đang giữ vai trò này có thể mất quyền tương ứng.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  className="modal-button delete-button"
                  onClick={handleConfirmDeleteRole}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Đang xóa..." : "Xóa vai trò"}
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
