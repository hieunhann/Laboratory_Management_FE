import React, { useEffect, useState } from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiTag,
  FiShare2,
  FiCopy,
  FiCheckCircle,
  FiPercent,
  FiDollarSign,
} from "react-icons/fi";
import { Pagination, Spin } from "antd";
import { setAuthToken } from "../../../utils/auth";
import { toast } from "react-toastify";
import VoucherAPI from "../../../apis/VoucherAPI";
import "./VouchersManagement.css";

const DEFAULT_FORM = {
  code: "",
  discountType: 1, // 1 = Percentage, 2 = FixedAmount
  discountValue: "",
  minOrderValue: "",
  maxDiscountAmount: "",
  startDate: "",
  expiryDate: "",
  usageLimit: "",
  isActive: true,
};

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Share/Distribute modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [voucherToShare, setVoucherToShare] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [shareNote, setShareNote] = useState("");

  // Form State
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Helper formatting currency inputs with dot thousands separator (50000 -> 50.000)
  const formatCurrencyDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const cleanDigits = String(val).replace(/\D/g, "");
    if (!cleanDigits) return "";
    return Number(cleanDigits).toLocaleString("vi-VN");
  };

  const handleCurrencyChange = (fieldName, rawInput) => {
    const cleanDigits = String(rawInput).replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      [fieldName]: cleanDigits ? Number(cleanDigits) : "",
    }));
  };

  const handleDateChange = (e, fieldName) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [fieldName]: val }));
    if (val) {
      setTimeout(() => e.target.blur(), 150);
    }
  };

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    fetchVouchers();
  }, []);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen || isShareModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isDeleteModalOpen, isShareModalOpen]);

  const fetchVouchers = async () => {
    try {
      setIsLoading(true);
      const data = await VoucherAPI.getAllVouchers(1, 1000);
      const safeArray = Array.isArray(data)
        ? data
        : data?.data && Array.isArray(data.data)
        ? data.data
        : [];
      setVouchers(safeArray);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Không thể tải danh sách Voucher.");
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter & Search Logic
  const safeVouchersList = Array.isArray(vouchers) ? vouchers : [];
  const filteredVouchers = safeVouchersList.filter((v) => {
    const matchesSearch =
      !searchInput.trim() ||
      v.code?.toLowerCase().includes(searchInput.toLowerCase().trim());

    if (statusFilter === "active") return matchesSearch && v.isActive;
    if (statusFilter === "inactive") return matchesSearch && !v.isActive;
    return matchesSearch;
  });

  const paginatedVouchers = filteredVouchers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Form handling
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedVoucher(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (voucher) => {
    setModalMode("edit");
    setSelectedVoucher(voucher);
    setFormData({
      code: voucher.code || "",
      discountType: voucher.discountType || 1,
      discountValue: voucher.discountValue ?? "",
      minOrderValue: voucher.minOrderValue ?? "",
      maxDiscountAmount: voucher.maxDiscountAmount ?? "",
      startDate: voucher.startDate
        ? new Date(voucher.startDate).toISOString().slice(0, 16)
        : "",
      expiryDate: voucher.expiryDate
        ? new Date(voucher.expiryDate).toISOString().slice(0, 16)
        : "",
      usageLimit: voucher.usageLimit ?? "",
      isActive: voucher.isActive ?? true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) {
      errors.code = "Vui lòng nhập mã Voucher.";
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      errors.discountValue = "Giá trị giảm phải lớn hơn 0.";
    }
    if (formData.discountType === 1 && Number(formData.discountValue) > 100) {
      errors.discountValue = "Phần trăm giảm không được vượt quá 100%.";
    }
    if (
      formData.startDate &&
      formData.expiryDate &&
      new Date(formData.expiryDate) < new Date(formData.startDate)
    ) {
      errors.expiryDate = "Ngày hết hạn phải sau ngày bắt đầu.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: Number(formData.discountType),
        discountValue: Number(formData.discountValue),
        minOrderValue: formData.minOrderValue !== "" ? Number(formData.minOrderValue) : null,
        maxDiscountAmount: formData.maxDiscountAmount !== "" ? Number(formData.maxDiscountAmount) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        usageLimit: formData.usageLimit !== "" ? Number(formData.usageLimit) : null,
        isActive: formData.isActive,
      };

      if (modalMode === "create") {
        await VoucherAPI.createVoucher(payload);
        toast.success("Tạo mã Voucher mới thành công!");
      } else {
        await VoucherAPI.updateVoucher(selectedVoucher.voucherId, payload);
        toast.success("Cập nhật thông tin Voucher thành công!");
      }

      setIsModalOpen(false);
      fetchVouchers();
    } catch (error) {
      console.error("Save voucher error:", error);
      toast.error(
        "Thao tác thất bại: " + (error.response?.data?.message || "Vui lòng kiểm tra lại dữ liệu.")
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handling
  const handleOpenDeleteModal = (voucher) => {
    setVoucherToDelete(voucher);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!voucherToDelete) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      await VoucherAPI.deleteVoucher(voucherToDelete.voucherId);
      toast.success(`Đã xóa Voucher ${voucherToDelete.code} thành công.`);
      setIsDeleteModalOpen(false);
      fetchVouchers();
    } catch (error) {
      console.error("Delete voucher error:", error);
      toast.error("Không thể xóa Voucher này.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Share/Distribute modal handling
  const handleOpenShareModal = (voucher) => {
    setVoucherToShare(voucher);
    setRecipientEmail("");
    setShareNote(`Mã quà tặng đặc biệt ${voucher.code} từ HemaLink Blood Test System!`);
    setIsShareModalOpen(true);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã ${code} vào bộ nhớ tạm!`);
  };

  const handleSendShare = (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      toast.warning("Vui lòng nhập Email người nhận.");
      return;
    }
    toast.success(`Đã phân phối mã Voucher ${voucherToShare?.code} tới ${recipientEmail}!`);
    setIsShareModalOpen(false);
  };

  const breadcrumbs = [{ name: "Quản lý Voucher" }];

  // Statistics
  const totalCount = safeVouchersList.length;
  const activeCount = safeVouchersList.filter((v) => v.isActive).length;
  const percentCount = safeVouchersList.filter((v) => v.discountType === 1).length;
  const fixedCount = safeVouchersList.filter((v) => v.discountType === 2).length;

  return (
    <AdminLayout pageTitle="Quản lý mã giảm giá" breadcrumbs={breadcrumbs}>
      <div className="vouchers-container">
        {/* Header section */}
        <div className="vouchers-header">
          <div className="vouchers-header-left">
            <h1>Quản lý Voucher & Mã giảm giá</h1>
            <p>Tạo mới, chỉnh sửa và phân phối mã ưu đãi cho khách hàng</p>
          </div>
          <button className="add-voucher-button" onClick={handleOpenCreateModal}>
            <FiPlus size={18} /> Tạo Voucher mới
          </button>
        </div>

        {/* Content Card */}
        <div className="vouchers-content">
          {/* Stat Cards */}
          <div className="vouchers-stats-row">
            <div className="vouchers-stat-card">
              <div className="vouchers-stat-icon total">
                <FiTag />
              </div>
              <div className="vouchers-stat-content">
                <div className="vouchers-stat-value">{totalCount}</div>
                <div className="vouchers-stat-label">TỔNG SỐ VOUCHER</div>
              </div>
            </div>

            <div className="vouchers-stat-card">
              <div className="vouchers-stat-icon active">
                <FiCheckCircle />
              </div>
              <div className="vouchers-stat-content">
                <div className="vouchers-stat-value">{activeCount}</div>
                <div className="vouchers-stat-label">ĐANG HOẠT ĐỘNG</div>
              </div>
            </div>
          </div>

          {/* Controls: Search & Filter */}
          <div className="vouchers-controls">
            <div className="search-section">
              <div className="search-box">
                <FiSearch size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã Voucher..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                />
                {searchInput && (
                  <button className="clear-search-btn" onClick={() => setSearchInput("")}>
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="filter-section">
              <span className="filter-label">Trạng thái:</span>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Tất cả ({vouchers.length})</option>
                <option value="active">Đang hoạt động ({activeCount})</option>
                <option value="inactive">Đã tắt ({totalCount - activeCount})</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          {isLoading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>Đang tải danh sách Voucher...</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="empty-container">
              <FiTag size={48} className="empty-icon" />
              <h3>Không tìm thấy Voucher nào</h3>
              <p>Thử thay đổi từ khóa tìm kiếm hoặc tạo Voucher mới.</p>
            </div>
          ) : (
            <div className="vouchers-table-container">
              <table className="vouchers-table">
                <thead>
                  <tr>
                    <th>MÃ VOUCHER</th>
                    <th>LOẠI GIẢM GIÁ</th>
                    <th>GIÁ TRỊ GIẢM</th>
                    <th>ĐƠN TỐI THIỂU</th>
                    <th>GIẢM TỐI ĐA</th>
                    <th>LƯỢT DÙNG</th>
                    <th>THỜI HẠN ÁP DỤNG</th>
                    <th>TRẠNG THÁI</th>
                    <th className="text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVouchers.map((v) => {
                    const isPercentage = v.discountType === 1;

                    return (
                      <tr key={v.voucherId || v.code}>
                        <td>
                          <div
                            className="voucher-code-badge"
                            title="Click để sao chép mã"
                            onClick={() => handleCopyCode(v.code)}
                          >
                            <FiTag className="badge-icon" />
                            <span>{v.code}</span>
                            <FiCopy className="copy-icon" />
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge ${isPercentage ? "type-percent" : "type-fixed"}`}>
                            {isPercentage ? "Phần trăm (%)" : "Cố định (₫)"}
                          </span>
                        </td>
                        <td className="value-cell">
                          {isPercentage
                            ? `${v.discountValue}%`
                            : `${v.discountValue?.toLocaleString("vi-VN")}₫`}
                        </td>
                        <td>
                          {v.minOrderValue
                            ? `${v.minOrderValue.toLocaleString("vi-VN")}₫`
                            : "-"}
                        </td>
                        <td>
                          {v.maxDiscountAmount
                            ? `${v.maxDiscountAmount.toLocaleString("vi-VN")}₫`
                            : "-"}
                        </td>
                        <td>
                          <span className="usage-text">
                            {v.usageCount || 0} / {v.usageLimit ? v.usageLimit : "∞"}
                          </span>
                        </td>
                        <td>
                          <div className="date-range-text">
                            <span>
                              {v.startDate
                                ? new Date(v.startDate).toLocaleDateString("vi-VN")
                                : "Bắt đầu ngay"}
                            </span>
                            <span className="date-sep">➔</span>
                            <span>
                              {v.expiryDate
                                ? new Date(v.expiryDate).toLocaleDateString("vi-VN")
                                : "Không hết hạn"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${v.isActive ? "active" : "inactive"}`}>
                            {v.isActive ? "Hoạt động" : "Đã tắt"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-button share"
                              title="Gửi mã cho tài khoản khác"
                              onClick={() => handleOpenShareModal(v)}
                            >
                              <FiShare2 size={16} />
                            </button>
                            <button
                              className="action-button edit"
                              title="Chỉnh sửa Voucher"
                              onClick={() => handleOpenEditModal(v)}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              className="action-button delete"
                              title="Xóa Voucher"
                              onClick={() => handleOpenDeleteModal(v)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredVouchers.length > 0 && (
            <div className="vouchers-pagination">
              <span className="page-info">
                Hiển thị {paginatedVouchers.length} / {filteredVouchers.length} Voucher
              </span>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredVouchers.length}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
                showSizeChanger
                pageSizeOptions={["10", "20", "50"]}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="vouchers-modal-overlay">
          <div className="category-modal">
            <div className="modal-header">
              <h2>{modalMode === "create" ? "Tạo Voucher mới" : "Chỉnh sửa Voucher"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="voucher-modal-form">
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group flex-1">
                    <label className="form-label">
                      Mã Voucher <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input ${formErrors.code ? "error" : ""}`}
                      placeholder="VD: HEMALI10, TRIAN50K..."
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                    />
                    {formErrors.code && (
                      <span className="form-error">{formErrors.code}</span>
                    )}
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">
                      Loại giảm giá <span className="required-star">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: Number(e.target.value) })
                      }
                    >
                      <option value={1}>Phần trăm (%)</option>
                      <option value={2}>Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group flex-1">
                    <label className="form-label">
                      Giá trị giảm {formData.discountType === 1 ? "(%)" : "(VNĐ)"}{" "}
                      <span className="required-star">*</span>
                    </label>
                    {formData.discountType === 1 ? (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className={`form-input ${formErrors.discountValue ? "error" : ""}`}
                        placeholder="VD: 10"
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({ ...formData, discountValue: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        type="text"
                        className={`form-input ${formErrors.discountValue ? "error" : ""}`}
                        placeholder="VD: 50.000"
                        value={formatCurrencyDisplay(formData.discountValue)}
                        onChange={(e) => handleCurrencyChange("discountValue", e.target.value)}
                      />
                    )}
                    {formErrors.discountValue && (
                      <span className="form-error">{formErrors.discountValue}</span>
                    )}
                  </div>

                  {formData.discountType === 1 && (
                    <div className="form-group flex-1">
                      <label className="form-label">Giảm tối đa (VNĐ)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: 100.000"
                        value={formatCurrencyDisplay(formData.maxDiscountAmount)}
                        onChange={(e) => handleCurrencyChange("maxDiscountAmount", e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="form-row-2">
                  <div className="form-group flex-1">
                    <label className="form-label">Giá trị đơn hàng tối thiểu (VNĐ)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: 300.000"
                      value={formatCurrencyDisplay(formData.minOrderValue)}
                      onChange={(e) => handleCurrencyChange("minOrderValue", e.target.value)}
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Giới hạn tổng số lượt dùng</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="VD: 100 (Để trống = ∞)"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, usageLimit: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group flex-1">
                    <label className="form-label">Ngày bắt đầu áp dụng</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={formData.startDate}
                      onChange={(e) => handleDateChange(e, "startDate")}
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Ngày hết hạn</label>
                    <input
                      type="datetime-local"
                      className={`form-input ${formErrors.expiryDate ? "error" : ""}`}
                      value={formData.expiryDate}
                      onChange={(e) => handleDateChange(e, "expiryDate")}
                    />
                    {formErrors.expiryDate && (
                      <span className="form-error">{formErrors.expiryDate}</span>
                    )}
                  </div>
                </div>

                {modalMode === "edit" && (
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                      />
                      <span>Kích hoạt Voucher (Cho phép người dùng áp dụng)</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-button cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="modal-button primary" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : modalMode === "create" ? "Tạo Voucher" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="vouchers-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <h3>Xác nhận xóa Voucher</h3>
            </div>
            <div className="delete-modal-body">
              <p>
                Bạn có chắc chắn muốn xóa mã Voucher <strong>{voucherToDelete?.code}</strong> không?
              </p>
              <p className="delete-warning">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="delete-modal-footer">
              <button
                type="button"
                className="modal-button cancel"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="modal-button danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share / Distribute Modal */}
      {isShareModalOpen && (
        <div className="vouchers-modal-overlay">
          <div className="category-modal">
            <div className="modal-header">
              <h2>Gửi / Phân phối Voucher</h2>
              <button className="modal-close" onClick={() => setIsShareModalOpen(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="share-preview-box">
                <div className="spb-left">
                  <FiTag className="spb-icon" />
                  <div>
                    <div className="spb-code">{voucherToShare?.code}</div>
                    <div className="spb-desc">
                      {voucherToShare?.discountType === 1
                        ? `Giảm ${voucherToShare?.discountValue}%`
                        : `Giảm ${voucherToShare?.discountValue?.toLocaleString("vi-VN")}₫`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-button cancel"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={() => handleCopyCode(voucherToShare?.code)}
                >
                  <FiCopy /> Copy mã
                </button>
              </div>

              <form onSubmit={handleSendShare} className="category-form">
                <div className="form-group">
                  <label className="form-label">
                    Email tài khoản nhận mã <span className="required-star">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="VD: customer@gmail.com..."
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nội dung thư gửi kèm</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={shareNote}
                    onChange={(e) => setShareNote(e.target.value)}
                    placeholder="Nhập nội dung nhắn gửi..."
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="modal-button cancel"
                    onClick={() => setIsShareModalOpen(false)}
                  >
                    Đóng
                  </button>
                  <button type="submit" className="modal-button primary">
                    <FiShare2 /> Gửi Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default VouchersManagement;
