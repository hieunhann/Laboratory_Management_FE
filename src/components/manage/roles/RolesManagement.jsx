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
  FiKey,
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
  createPermission,
  updatePermission,
  deletePermission,
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

  // Create / Delete Role Modals
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [createRoleFormData, setCreateRoleFormData] = useState({
    name: "",
    description: "",
    isDefault: false,
  });
  const [createRoleFormErrors, setCreateRoleFormErrors] = useState({
    name: "",
    description: "",
  });

  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  // Permission CRUD Modals
  const [isCreatePermModalOpen, setIsCreatePermModalOpen] = useState(false);
  const [isCreatingPerm, setIsCreatingPerm] = useState(false);
  const [createPermData, setCreatePermData] = useState({
    name: "",
    description: "",
  });

  const [isEditPermModalOpen, setIsEditPermModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [isUpdatingPerm, setIsUpdatingPerm] = useState(false);
  const [editPermData, setEditPermData] = useState({
    name: "",
    description: "",
  });

  const [isDeletePermModalOpen, setIsDeletePermModalOpen] = useState(false);
  const [permToDelete, setPermToDelete] = useState(null);
  const [isDeletingPerm, setIsDeletingPerm] = useState(false);

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
    permission?.permissionId ??
    permission?.id ??
    permission?.Id ??
    null;

  const getPermissionLabel = (permission) =>
    permission?.label ??
    permission?.name ??
    permission?.permissionName ??
    permission?.key ??
    "-";

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
      toast.error("Không thể cập nhật một số quyền. Vui lòng thử lại!");
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

  // ================= PERMISSION CRUD HANDLERS =================
  const handleOpenCreatePermModal = (defaultModule = "") => {
    const initialName = defaultModule ? `${defaultModule}.` : "";
    setCreatePermData({
      name: initialName,
      description: "",
    });
    setIsCreatePermModalOpen(true);
  };

  const handleCreatePermSubmit = async () => {
    if (!createPermData.name.trim()) {
      toast.error("Vui lòng nhập tên/mã quyền (Key)");
      return;
    }

    setIsCreatingPerm(true);
    try {
      await createPermission({
        name: createPermData.name.trim(),
        description: createPermData.description.trim(),
      });
      toast.success(`Đã tạo quyền mới '${createPermData.name.trim()}' thành công!`);
      setIsCreatePermModalOpen(false);
      initData();
    } catch (error) {
      console.error("Error creating permission:", error);
      toast.error(
        error.response?.data?.message || "Không thể tạo quyền hạn mới"
      );
    } finally {
      setIsCreatingPerm(false);
    }
  };

  const handleOpenEditPermModal = (permission) => {
    setEditingPerm(permission);
    const permKey = getPermissionId(permission);
    setEditPermData({
      name: permKey || permission.name || "",
      description: permission.description || "",
    });
    setIsEditPermModalOpen(true);
  };

  const handleEditPermSubmit = async () => {
    if (!editingPerm) return;
    const permId = editingPerm.permissionId || editingPerm.id;

    if (!editPermData.name.trim()) {
      toast.error("Vui lòng nhập tên/mã quyền");
      return;
    }

    setIsUpdatingPerm(true);
    try {
      await updatePermission(permId, {
        name: editPermData.name.trim(),
        description: editPermData.description.trim(),
      });
      toast.success("Cập nhật thông tin quyền thành công!");
      setIsEditPermModalOpen(false);
      setEditingPerm(null);
      initData();
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật quyền"
      );
    } finally {
      setIsUpdatingPerm(false);
    }
  };

  const handleOpenDeletePermModal = (permission) => {
    setPermToDelete(permission);
    setIsDeletePermModalOpen(true);
  };

  const handleDeletePermSubmit = async () => {
    if (!permToDelete) return;
    const permId = permToDelete.permissionId || permToDelete.id;

    setIsDeletingPerm(true);
    try {
      await deletePermission(permId);
      toast.success("Đã xóa quyền khỏi hệ thống!");
      setIsDeletePermModalOpen(false);
      setPermToDelete(null);
      initData();
    } catch (error) {
      console.error("Error deleting permission:", error);
      toast.error(
        error.response?.data?.message || "Không thể xóa quyền này"
      );
    } finally {
      setIsDeletingPerm(false);
    }
  };

  // ================= ROLE CRUD HANDLERS =================
  const handleOpenCreateRoleModal = () => {
    setCreateRoleFormData({ name: "", description: "", isDefault: false });
    setCreateRoleFormErrors({ name: "", description: "" });
    setIsCreateRoleModalOpen(true);
  };

  const handleCreateRoleSubmit = async () => {
    if (!createRoleFormData.name.trim()) {
      toast.error("Tên vai trò là bắt buộc");
      return;
    }

    setIsCreatingRole(true);
    try {
      const payload = {
        name: createRoleFormData.name.trim(),
        description: createRoleFormData.description.trim(),
        isDefault: createRoleFormData.isDefault,
      };

      await createRole(payload);
      toast.success("Tạo vai trò mới thành công!");
      setIsCreateRoleModalOpen(false);
      initData();
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error(error.response?.data?.message || "Không thể tạo vai trò mới");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleDeleteRoleClick = (role) => {
    setRoleToDelete(role);
    setIsDeleteRoleModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    const roleId = getRoleId(roleToDelete);
    if (!roleId) return;

    setIsDeletingRole(true);
    try {
      await deleteRole(roleId);
      toast.success("Đã xóa vai trò thành công!");
      setIsDeleteRoleModalOpen(false);
      setRoleToDelete(null);
      initData();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error(error.response?.data?.message || "Không thể xóa vai trò này");
    } finally {
      setIsDeletingRole(false);
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
              Cấp/tước quyền hạn trên từng vai trò và Quản lý danh mục Quyền hạn (Permission CRUD)
            </p>
          </div>
          <div className="matrix-header-actions">
            <button
              className="btn-add-perm-top"
              onClick={() => handleOpenCreatePermModal("")}
            >
              <FiKey size={16} />
              <span>Tạo quyền mới</span>
            </button>
            <button className="btn-add-role" onClick={handleOpenCreateRoleModal}>
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
                                <div className="module-header-inner">
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

                                  <button
                                    className="btn-add-perm-module"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCreatePermModal(moduleName);
                                    }}
                                    title={`Thêm quyền hạn mới vào Module ${moduleName}`}
                                  >
                                    <FiPlus size={12} /> Thêm quyền
                                  </button>
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
                                    {/* Permission Info Column (Sticky Left with Edit/Delete Controls) */}
                                    <td className="permission-info-cell sticky-col">
                                      <div className="perm-info-wrapper">
                                        <div className="perm-info-top">
                                          <span className="perm-label-text">
                                            {permLabel}
                                          </span>
                                          <div className="perm-row-actions">
                                            <button
                                              className="btn-perm-action edit"
                                              onClick={() =>
                                                handleOpenEditPermModal(permission)
                                              }
                                              title="Sửa quyền hạn này"
                                            >
                                              <FiEdit2 size={13} />
                                            </button>
                                            <button
                                              className="btn-perm-action delete"
                                              onClick={() =>
                                                handleOpenDeletePermModal(permission)
                                              }
                                              title="Xóa quyền hạn khỏi hệ thống"
                                            >
                                              <FiTrash2 size={13} />
                                            </button>
                                          </div>
                                        </div>

                                        {permission.description && (
                                          <span className="perm-desc-text">
                                            {permission.description}
                                          </span>
                                        )}
                                        <span className="perm-key-code">
                                          {permKey}
                                        </span>
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
                                          onClick={(e) => {
                                            e.preventDefault();
                                            togglePermissionForRole(
                                              roleId,
                                              permKey
                                            );
                                          }}
                                        >
                                          <div
                                            className={`custom-matrix-checkbox ${
                                              isChecked ? "checked" : ""
                                            }`}
                                          >
                                            {isChecked && (
                                              <FiCheck className="check-mark-icon" />
                                            )}
                                          </div>
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

        {/* Floating Save Bar */}
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

        {/* Create Permission Modal */}
        {isCreatePermModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsCreatePermModalOpen(false)}
          >
            <div
              className="roles-modal create-perm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Tạo quyền hạn mới</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsCreatePermModalOpen(false)}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Tên / Mã quyền (Permission Key) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: BlogPost.Publish hoặc User.Manage"
                    value={createPermData.name}
                    onChange={(e) =>
                      setCreatePermData({ ...createPermData, name: e.target.value })
                    }
                    disabled={isCreatingPerm}
                  />
                  <span className="form-hint">
                    Nên dùng định dạng: <code>Module.HànhĐộng</code> (ví dụ: Patient.Create)
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả quyền hạn</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Nhập mô tả ý nghĩa của quyền này"
                    value={createPermData.description}
                    onChange={(e) =>
                      setCreatePermData({
                        ...createPermData,
                        description: e.target.value,
                      })
                    }
                    disabled={isCreatingPerm}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={() => setIsCreatePermModalOpen(false)}
                  disabled={isCreatingPerm}
                >
                  Hủy
                </button>
                <button
                  className="modal-button primary"
                  onClick={handleCreatePermSubmit}
                  disabled={isCreatingPerm}
                >
                  {isCreatingPerm ? "Đang tạo..." : "Tạo quyền mới"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Permission Modal */}
        {isEditPermModalOpen && editingPerm && (
          <div
            className="modal-overlay"
            onClick={() => setIsEditPermModalOpen(false)}
          >
            <div
              className="roles-modal edit-perm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Chỉnh sửa quyền hạn</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsEditPermModalOpen(false)}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Tên / Mã quyền (Permission Key) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPermData.name}
                    onChange={(e) =>
                      setEditPermData({ ...editPermData, name: e.target.value })
                    }
                    disabled={isUpdatingPerm}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả quyền hạn</label>
                  <textarea
                    className="form-textarea"
                    value={editPermData.description}
                    onChange={(e) =>
                      setEditPermData({
                        ...editPermData,
                        description: e.target.value,
                      })
                    }
                    disabled={isUpdatingPerm}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={() => setIsEditPermModalOpen(false)}
                  disabled={isUpdatingPerm}
                >
                  Hủy
                </button>
                <button
                  className="modal-button primary"
                  onClick={handleEditPermSubmit}
                  disabled={isUpdatingPerm}
                >
                  {isUpdatingPerm ? "Đang lưu..." : "Cập nhật quyền"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Permission Confirmation Modal */}
        {isDeletePermModalOpen && permToDelete && (
          <div
            className="modal-overlay"
            onClick={() => setIsDeletePermModalOpen(false)}
          >
            <div
              className="roles-modal delete-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Xác nhận xóa quyền hạn</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsDeletePermModalOpen(false)}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p>
                  Bạn có chắc chắn muốn xóa quyền{" "}
                  <strong>
                    {getPermissionId(permToDelete) || permToDelete.name}
                  </strong>{" "}
                  khỏi hệ thống không?
                </p>
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "14px",
                    marginTop: "8px",
                  }}
                >
                  Lưu ý: Quyền này sẽ bị gỡ bỏ tự động khỏi toàn bộ các Vai trò đang sở hữu nó.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={() => setIsDeletePermModalOpen(false)}
                  disabled={isDeletingPerm}
                >
                  Hủy
                </button>
                <button
                  className="modal-button delete-button"
                  onClick={handleDeletePermSubmit}
                  disabled={isDeletingPerm}
                >
                  {isDeletingPerm ? "Đang xóa..." : "Xóa quyền hạn"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
        {isCreateRoleModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsCreateRoleModalOpen(false)}
          >
            <div
              className="roles-modal create-role-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Tạo vai trò mới</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsCreateRoleModalOpen(false)}
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
                    className="form-input"
                    placeholder="Nhập tên vai trò (vd: Technician, Doctor)"
                    value={createRoleFormData.name}
                    onChange={(e) =>
                      setCreateRoleFormData({
                        ...createRoleFormData,
                        name: e.target.value,
                      })
                    }
                    disabled={isCreatingRole}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Mô tả nhiệm vụ của vai trò"
                    value={createRoleFormData.description}
                    onChange={(e) =>
                      setCreateRoleFormData({
                        ...createRoleFormData,
                        description: e.target.value,
                      })
                    }
                    disabled={isCreatingRole}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  disabled={isCreatingRole}
                >
                  Hủy
                </button>
                <button
                  className="modal-button primary"
                  onClick={handleCreateRoleSubmit}
                  disabled={isCreatingRole}
                >
                  {isCreatingRole ? "Đang tạo..." : "Tạo vai trò"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Role Confirmation Modal */}
        {isDeleteRoleModalOpen && roleToDelete && (
          <div
            className="modal-overlay"
            onClick={() => setIsDeleteRoleModalOpen(false)}
          >
            <div
              className="roles-modal delete-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Xác nhận xóa vai trò</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsDeleteRoleModalOpen(false)}
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
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={() => setIsDeleteRoleModalOpen(false)}
                  disabled={isDeletingRole}
                >
                  Hủy
                </button>
                <button
                  className="modal-button delete-button"
                  onClick={handleConfirmDeleteRole}
                  disabled={isDeletingRole}
                >
                  {isDeletingRole ? "Đang xóa..." : "Xóa vai trò"}
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
