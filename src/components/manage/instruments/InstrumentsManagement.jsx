import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiUpload, FiImage, FiSettings } from "react-icons/fi";
import { Spin } from "antd";
import AdminLayout from "../../admin/layout/AdminLayout";
import InstrumentService from "../../../services/InstrumentService";
import { StatisticsAPI } from "../../../apis/StatisticsAPI";
import { setAuthToken } from "../../../utils/auth";
import { isManager } from "../../../utils/role";
import "./InstrumentsManagement.css";

const STATUS_CONFIG = {
  machine: [
    {
      key: "ACTIVE",
      rawValues: ["ACTIVE", 0],
      label: "Đang hoạt động",
      badge: "status-active",
    },
    {
      key: "OFF",
      rawValues: ["OFF", 1],
      label: "Đang tắt",
      badge: "status-off",
    },
    {
      key: "ERROR",
      rawValues: ["ERROR", 2],
      label: "Đang lỗi",
      badge: "status-error",
    },
    {
      key: "MAINTENANCE",
      rawValues: ["MAINTENANCE", 3],
      label: "Đang bảo trì",
      badge: "status-maintenance",
    },
  ],
  reagent: [
    {
      key: "FULL",
      rawValues: ["FULL", 0],
      label: "Đầy đủ",
      badge: "pill-full",
    },
    {
      key: "LOW",
      rawValues: ["LOW", 1],
      label: "Sắp hết",
      badge: "pill-low",
    },
    {
      key: "EMPTY",
      rawValues: ["EMPTY", 2],
      label: "Đã hết",
      badge: "pill-empty",
    },
  ],
};

const findStatusOption = (options, candidate) =>
  options.find(
    (option) =>
      option.key === candidate ||
      option.rawValues.some((value) => value === candidate)
  ) ?? options[0];

const getBackendStatusValue = (options, key) => {
  const option = findStatusOption(options, key);
  const numericValue = option.rawValues.find(
    (value) => typeof value === "number"
  );
  return typeof numericValue !== "undefined"
    ? numericValue
    : option.rawValues[0] ?? option.key;
};

const EMPTY_FORM = {
  code: "",
  name: "",
  machineStatus: STATUS_CONFIG.machine[0].key,
  reagentStatus: STATUS_CONFIG.reagent[0].key,
  imageFile: null,
};

const mapInstrumentToForm = (instrument) => ({
  code:
    instrument.code ??
    instrument.instrumentCode ??
    instrument.InstrumentCode ??
    "",
  name: instrument.name ?? instrument.Name ?? "",
  machineStatus: findStatusOption(
    STATUS_CONFIG.machine,
    instrument.machineStatus ??
      instrument.status ??
      instrument.Status ??
      instrument.MachineStatus
  ).key,
  reagentStatus: findStatusOption(
    STATUS_CONFIG.reagent,
    instrument.reagentStatus ??
      instrument.reagent_status ??
      instrument.ReagentStatus ??
      instrument.Reagent_Status
  ).key,
  imageFile: null,
});

const buildPayloadFromForm = (formState) => ({
  code: formState.code.trim(),
  name: formState.name.trim(),
  status: getBackendStatusValue(STATUS_CONFIG.machine, formState.machineStatus),
  reagentStatus: getBackendStatusValue(
    STATUS_CONFIG.reagent,
    formState.reagentStatus
  ),
  imageFile: formState.imageFile,
});

const pickInstrumentCode = (instrument) =>
  instrument?.code ?? instrument?.instrumentCode ?? "";

const InstrumentsManagement = () => {
  const breadcrumbs = [
    { name: "Phòng xét nghiệm", link: "/dashboard" },
    { name: "Thiết bị" },
  ];

  const isReadOnly = isManager(); // Manager chỉ được xem, không được thêm/sửa/xóa

  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Phân trang và bộ lọc
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filterMachineStatus, setFilterMachineStatus] = useState(""); // "" = Tất cả
  const [filterReagentStatus, setFilterReagentStatus] = useState(""); // "" = Tất cả

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Statistics state
  const [instrumentsStats, setInstrumentsStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const tableData = useMemo(() => instruments ?? [], [instruments]);

  const fetchInstruments = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: currentPage,
        pageSize: pageSize,
      };

      // Thêm search nếu có
      if (searchText.trim()) {
        params.search = searchText.trim();
      }

      // Thêm filter status nếu không phải "Tất cả"
      if (filterMachineStatus !== "") {
        const machineStatusValue = getBackendStatusValue(
          STATUS_CONFIG.machine,
          filterMachineStatus
        );
        params.status = machineStatusValue;
      }

      if (filterReagentStatus !== "") {
        const reagentStatusValue = getBackendStatusValue(
          STATUS_CONFIG.reagent,
          filterReagentStatus
        );
        params.reagentStatus = reagentStatusValue;
      }

      const response = await InstrumentService.list(params);
      setInstruments(response.items || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.currentPage || currentPage);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
    fetchInstrumentsStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    pageSize,
    searchText,
    filterMachineStatus,
    filterReagentStatus,
  ]);

  const fetchInstrumentsStatistics = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const response = await StatisticsAPI.getInstrumentsStatistics();
      if (response?.data) {
        const instrumentsData = response.data.data || response.data;
        if (instrumentsData && typeof instrumentsData === "object") {
          setInstrumentsStats(instrumentsData);
        }
      }
    } catch (error) {
      console.error("Error fetching instruments statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const releasePreview = (previewUrl) => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const resetForm = () => {
    releasePreview(imagePreview);
    setFormState(EMPTY_FORM);
    setImagePreview("");
    setFormError("");
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = async (instrument) => {
    const code = pickInstrumentCode(instrument);
    if (!code) {
      setFormError("Không xác định được mã thiết bị");
      return;
    }

    setModalMode("edit");
    setFormError("");
    setIsModalOpen(true);

    try {
      // Fetch fresh data from API to ensure we have the latest imagePath
      // getByCode already maps the instrument and builds imageUrl
      const freshInstrument = await InstrumentService.getByCode(code);

      setFormState(mapInstrumentToForm(freshInstrument));
      releasePreview(imagePreview);

      // Use imageUrl from fresh instrument (already built from imagePath)
      // Fallback to imageData (base64) if imageUrl not available
      const previewImage =
        freshInstrument.imageUrl || freshInstrument.imageData || "";
      setImagePreview(previewImage);
    } catch (err) {
      // Fallback to using instrument from list if API call fails
      console.error("Error fetching instrument details:", err);
      setFormState(mapInstrumentToForm(instrument));
      releasePreview(imagePreview);
      const previewImage = instrument.imageUrl || instrument.imageData || "";
      setImagePreview(previewImage);
      setFormError(
        "Không thể tải chi tiết thiết bị. Hiển thị thông tin từ danh sách."
      );
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitting(false);
    resetForm();
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file) => {
    releasePreview(imagePreview);
    if (!file) {
      setImagePreview("");
      setFormState((prev) => ({ ...prev, imageFile: null }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setFormState((prev) => ({ ...prev, imageFile: file }));
  };

  const validateForm = () => {
    if (!formState.code.trim() || !formState.name.trim()) {
      setFormError("Vui lòng nhập đầy đủ mã máy và tên máy.");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = buildPayloadFromForm(formState);
      if (modalMode === "create") {
        await InstrumentService.create(payload);
      } else {
        await InstrumentService.update(formState.code, payload);
      }
      // Refresh the list to get updated data
      await fetchInstruments();
      closeModal();
    } catch (err) {
      setFormError(err?.message || "Không thể lưu thiết bị.");
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (instrument) => {
    setDeleteTarget(instrument);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const code = pickInstrumentCode(deleteTarget);
    setDeleteLoading(true);
    try {
      await InstrumentService.remove(code);
      closeDeleteModal();
      fetchInstruments();
    } catch (err) {
      setError(err?.message || "Không thể xóa thiết bị.");
      setDeleteLoading(false);
    }
  };

  const getMachineStatusDisplay = (instrument) =>
    findStatusOption(
      STATUS_CONFIG.machine,
      instrument.machineStatus ??
        instrument.status ??
        instrument.Status ??
        instrument.MachineStatus
    );

  const getReagentStatusDisplay = (instrument) =>
    findStatusOption(
      STATUS_CONFIG.reagent,
      instrument.reagentStatus ??
        instrument.reagent_status ??
        instrument.ReagentStatus ??
        instrument.Reagent_Status
    );

  return (
    <AdminLayout pageTitle="Instruments Management" breadcrumbs={breadcrumbs}>
      <div className="instruments-management">
        <div className="instruments-header">
          <div>
            <h2>Danh sách thiết bị</h2>
            <p>Theo dõi trạng thái vận hành và thuốc thử cho từng máy.</p>
          </div>
          {!isReadOnly && (
            <button className="primary-btn" onClick={openCreateModal}>
              + Thêm thiết bị
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        {loadingStats ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <Spin />
          </div>
        ) : instrumentsStats ? (
          <div className="instruments-stats-cards">
            <div className="instruments-stat-card">
              <div
                className="instruments-stat-icon"
                style={{ color: "#3b82f6" }}
              >
                <FiSettings />
              </div>
              <div className="instruments-stat-content">
                <div className="instruments-stat-title">Tổng số máy</div>
                <div className="instruments-stat-value">
                  {instrumentsStats.totalInstruments || 0}
                </div>
                <div className="instruments-stat-change">Tất cả máy</div>
              </div>
            </div>

            <div className="instruments-stat-card">
              <div
                className="instruments-stat-icon"
                style={{ color: "#10b981" }}
              >
                <FiSettings />
              </div>
              <div className="instruments-stat-content">
                <div className="instruments-stat-title">Máy đang hoạt động</div>
                <div className="instruments-stat-value">
                  {instrumentsStats.onlineInstruments || 0}
                </div>
                <div className="instruments-stat-change">Đang sử dụng</div>
              </div>
            </div>

            <div className="instruments-stat-card">
              <div
                className="instruments-stat-icon"
                style={{ color: "#6b7280" }}
              >
                <FiSettings />
              </div>
              <div className="instruments-stat-content">
                <div className="instruments-stat-title">Máy đang tắt</div>
                <div className="instruments-stat-value">
                  {instrumentsStats.offlineInstruments || 0}
                </div>
                <div className="instruments-stat-change">Không hoạt động</div>
              </div>
            </div>

            <div className="instruments-stat-card">
              <div
                className="instruments-stat-icon"
                style={{ color: "#f59e0b" }}
              >
                <FiSettings />
              </div>
              <div className="instruments-stat-content">
                <div className="instruments-stat-title">Máy đang bảo trì</div>
                <div className="instruments-stat-value">
                  {instrumentsStats.maintenanceInstruments || 0}
                </div>
                <div className="instruments-stat-change">Cần xử lý</div>
              </div>
            </div>

            <div className="instruments-stat-card">
              <div
                className="instruments-stat-icon"
                style={{ color: "#ef4444" }}
              >
                <FiSettings />
              </div>
              <div className="instruments-stat-content">
                <div className="instruments-stat-title">Máy đang lỗi</div>
                <div className="instruments-stat-value">
                  {instrumentsStats.faultInstruments || 0}
                </div>
                <div className="instruments-stat-change">Nguy cấp</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Bộ lọc và tìm kiếm */}
        <div className="instruments-filters">
          <div className="filter-group">
            <label htmlFor="search-input">Tìm kiếm</label>
            <input
              id="search-input"
              type="text"
              placeholder="Nhập tên hoặc mã thiết bị"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="machine-status-filter">Trạng thái máy</label>
            <select
              id="machine-status-filter"
              value={filterMachineStatus}
              onChange={(e) => {
                setFilterMachineStatus(e.target.value);
                setCurrentPage(1); // Reset về trang 1 khi filter
              }}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              {STATUS_CONFIG.machine.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="reagent-status-filter">Trạng thái thuốc</label>
            <select
              id="reagent-status-filter"
              value={filterReagentStatus}
              onChange={(e) => {
                setFilterReagentStatus(e.target.value);
                setCurrentPage(1); // Reset về trang 1 khi filter
              }}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              {STATUS_CONFIG.reagent.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="instruments-card">
          {loading && <p className="state-text">Đang tải danh sách...</p>}
          {!loading && error && <p className="error-text">{error}</p>}
          {!loading && !error && tableData.length === 0 && (
            <p className="state-text">Chưa có thiết bị nào.</p>
          )}

          {!loading && !error && tableData.length > 0 && (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã máy</th>
                      <th>Tên máy</th>
                      <th>Trạng thái máy</th>
                      <th>Trạng thái thuốc</th>
                      {!isReadOnly && (
                        <th className="action-column">Hành động</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((instrument) => {
                      const code = pickInstrumentCode(instrument);
                      const machineStatus = getMachineStatusDisplay(instrument);
                      const reagentStatus = getReagentStatusDisplay(instrument);
                      return (
                        <tr key={code}>
                          <td className="code-cell">{code}</td>
                          <td>{instrument.name}</td>
                          <td>
                            <span
                              className={`status-pill ${machineStatus.badge}`}
                            >
                              {machineStatus.label}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${reagentStatus.badge}`}
                            >
                              {reagentStatus.label}
                            </span>
                          </td>
                          {!isReadOnly && (
                            <td className="action-column">
                              <div className="action-buttons">
                                <button
                                  className="ghost-btn"
                                  onClick={() => openEditModal(instrument)}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="danger-btn"
                                  onClick={() => handleDeleteClick(instrument)}
                                  disabled={
                                    deleteLoading &&
                                    code === pickInstrumentCode(deleteTarget)
                                  }
                                >
                                  {deleteLoading &&
                                  code === pickInstrumentCode(deleteTarget)
                                    ? "Đang xóa..."
                                    : "Xóa"}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              <div className="pagination">
                <div className="pagination-controls">
                  <button
                    className="ghost-btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    Đầu
                  </button>
                  <button
                    className="ghost-btn"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </button>
                  <span className="page-info">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    className="ghost-btn"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Sau
                  </button>
                  <button
                    className="ghost-btn"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                  >
                    Cuối
                  </button>
                </div>
                <div className="page-size-selector">
                  <label htmlFor="page-size">Số dòng:</label>
                  <select
                    id="page-size"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <InstrumentModal
          mode={modalMode}
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFieldChange={handleFormChange}
          onFileChange={handleFileChange}
          formState={formState}
          formError={formError}
          submitting={submitting}
          imagePreview={imagePreview}
        />
      )}

      {isDeleteModalOpen && deleteTarget && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          code={pickInstrumentCode(deleteTarget)}
          name={deleteTarget?.name}
        />
      )}
    </AdminLayout>
  );
};

const InstrumentModal = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  onFieldChange,
  onFileChange,
  formState,
  formError,
  submitting,
  imagePreview,
}) => {
  if (!isOpen) return null;

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file ảnh hợp lệ");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước file không được vượt quá 5MB");
        return;
      }
    }
    onFileChange(file);
  };

  const title = mode === "create" ? "Thêm thiết bị mới" : "Chỉnh sửa thiết bị";
  const submitLabel = mode === "create" ? "Thêm" : "Cập nhật";

  const modalContent = (
    <div className="instrument-modal-backdrop" role="dialog" aria-modal="true">
      <div className="instrument-modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-stack">
              <div className="form-field">
                <label htmlFor="instrument-code">
                  Mã máy{" "}
                  {mode === "create" && (
                    <span className="required-star">*</span>
                  )}
                </label>
                <input
                  id="instrument-code"
                  type="text"
                  placeholder="VD: EQ001"
                  value={formState.code || ""}
                  onChange={(e) => onFieldChange("code", e.target.value)}
                  disabled={mode === "edit"}
                />
              </div>

              <div className="form-field">
                <label htmlFor="instrument-name">
                  Tên máy{" "}
                  {mode === "create" && (
                    <span className="required-star">*</span>
                  )}
                </label>
                <input
                  id="instrument-name"
                  type="text"
                  placeholder="VD: Máy xét nghiệm tự động"
                  value={formState.name || ""}
                  onChange={(e) => onFieldChange("name", e.target.value)}
                />
              </div>

              <div className="form-field upload-field">
                <label>
                  <FiImage /> Hình ảnh thiết bị{" "}
                  {mode === "create" && (
                    <span className="required-star">*</span>
                  )}
                </label>
                {!imagePreview ? (
                  <div className="instrument-image-upload-area">
                    <input
                      type="file"
                      name="instrumentImageFile"
                      id="instrumentImageFile"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="instrument-file-input-hidden"
                    />
                    <label
                      htmlFor="instrumentImageFile"
                      className="instrument-image-upload-label"
                    >
                      <div className="instrument-upload-icon">
                        <FiUpload />
                      </div>
                      <div className="instrument-upload-text">
                        <span className="instrument-upload-primary">
                          Nhấp để tải ảnh lên
                        </span>
                        <span className="instrument-upload-secondary">
                          hoặc kéo thả ảnh vào đây
                        </span>
                      </div>
                      <span className="instrument-upload-hint">
                        JPG, PNG (tối đa 5MB)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="instrument-image-preview-wrapper">
                    <div className="instrument-image-preview">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="instrument-image-change-btn"
                      onClick={() =>
                        document.getElementById("instrumentImageFile")?.click()
                      }
                    >
                      <FiUpload /> Thay đổi ảnh
                    </button>
                    <input
                      type="file"
                      name="instrumentImageFile"
                      id="instrumentImageFile"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="instrument-file-input-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="machine-status">Trạng thái máy</label>
                  <select
                    id="machine-status"
                    value={formState.machineStatus}
                    onChange={(e) =>
                      onFieldChange("machineStatus", e.target.value)
                    }
                  >
                    {STATUS_CONFIG.machine.map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="reagent-status">Trạng thái thuốc</label>
                  <select
                    id="reagent-status"
                    value={formState.reagentStatus}
                    onChange={(e) =>
                      onFieldChange("reagentStatus", e.target.value)
                    }
                  >
                    {STATUS_CONFIG.reagent.map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <p className="error-text form-error">{formError}</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? "Đang lưu..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  code,
  name,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="instrument-modal-backdrop" role="dialog" aria-modal="true">
      <div className="instrument-modal confirm-modal">
        <div className="modal-header">
          <h3>Xóa thiết bị</h3>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>
            Bạn có chắc chắn muốn xóa thiết bị{" "}
            <strong>
              {code} - {name}
            </strong>
            ?
          </p>
          <p>Thao tác này không thể hoàn tác.</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="danger-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xóa..." : "Xóa thiết bị"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default InstrumentsManagement;
