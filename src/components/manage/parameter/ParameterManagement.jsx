import React, { useState, useEffect } from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import { FiSearch, FiPlus, FiX, FiTrash2 } from "react-icons/fi";
import { Pagination, Spin } from "antd";
import { setAuthToken } from "../../../utils/auth";
import { toast } from "react-toastify";
import {
  getAllParameters,
  createParameter,
  deleteParameter,
} from "../../../services/TestOrderService.jsx";
import "./ParameterManagement.css";

const ParameterManagement = () => {
  const [parameters, setParameters] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [parameterToDelete, setParameterToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    parameterName: "",
    referenceRange: "",
    unit: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchParameters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchDebounce]);

  const fetchParameters = async () => {
    setIsLoading(true);
    try {
      const query = {
        page,
        pageSize,
      };
      if (searchDebounce) {
        query.search = searchDebounce;
      }
      const { items, meta } = await getAllParameters(query);
      setParameters(items);
      setTotal(meta?.totalItems ?? items?.length ?? 0);
    } catch (error) {
      console.error("Error fetching parameters:", error);
      toast.error("Không thể tải danh sách chỉ số xét nghiệm");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle open modal for create
  const handleOpenCreateModal = () => {
    setFormData({
      parameterName: "",
      referenceRange: "",
      unit: "",
    });
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      parameterName: "",
      referenceRange: "",
      unit: "",
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle save parameter
  const handleSaveParameter = async () => {
    if (!formData.parameterName || !formData.referenceRange || !formData.unit) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // Validate referenceRange format (should be like "7 - 56" or "7-56")
    const rangePattern = /^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/;
    const match = formData.referenceRange.trim().match(rangePattern);
    if (!match) {
      toast.error("Khoảng tham chiếu không đúng định dạng! (VD: 7 - 56)");
      return;
    }

    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    if (min >= max) {
      toast.error("Giá trị tối thiểu phải nhỏ hơn giá trị tối đa!");
      return;
    }

    setIsSubmitting(true);

    try {
      if (
        parameters.find(
          (p) =>
            p.parameterName?.toLowerCase() ===
            formData.parameterName.trim().toLowerCase()
        )
      ) {
        toast.error("Tên chỉ số đã tồn tại!");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        parameterName: formData.parameterName.trim(),
        referenceRange: formData.referenceRange.trim(),
        unit: formData.unit.trim(),
      };

      await createParameter(payload);
      toast.success("Thêm chỉ số xét nghiệm thành công!");
      await fetchParameters(); // Refresh the list
      handleCloseModal();
    } catch (error) {
      console.error("Error saving parameter:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể lưu chỉ số xét nghiệm";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (newPage, newPageSize) => {
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
    } else {
      setPage(newPage);
    }
  };

  // Handle delete parameter
  const handleDeleteParameter = (parameter) => {
    setParameterToDelete(parameter);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!parameterToDelete) return;
    const parameterId =
      parameterToDelete.parameterId ??
      parameterToDelete.id ??
      parameterToDelete.Id;
    if (!parameterId) return;

    setIsDeleting(true);
    try {
      await deleteParameter(parameterId);
      toast.success("Đã xóa chỉ số xét nghiệm thành công!");
      fetchParameters();
      setIsDeleteModalOpen(false);
      setParameterToDelete(null);
    } catch (error) {
      console.error("Error deleting parameter:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể xóa chỉ số xét nghiệm";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setParameterToDelete(null);
  };

  return (
    <AdminLayout
      pageTitle="Quản lý chỉ số xét nghiệm"
      breadcrumbs={[
        { name: "Tổng quan", link: "/admin/dashboard" },
        { name: "Quản lý chỉ số xét nghiệm" },
      ]}
    >
      <div className="parameters-container">
        <div className="parameters-header">
          <div className="parameters-header-left">
            <h1>Quản lý chỉ số xét nghiệm</h1>
            <p>Quản lý các chỉ số và thông số xét nghiệm</p>
          </div>
          <button
            className="add-parameter-button"
            onClick={handleOpenCreateModal}
          >
            <FiPlus size={20} />
            <span>Thêm chỉ số xét nghiệm</span>
          </button>
        </div>

        <div className="parameters-content">
          <div className="parameters-controls">
            <div className="search-section">
              <div className="search-box">
                <FiSearch size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên chỉ số hoặc đơn vị..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="page-info">
              <span>
                Hiển thị {parameters.length} / {total || 0} chỉ số
              </span>
            </div>
          </div>

          {/* Parameters Table */}
          <div className="parameters-table-container">
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : (
              <table className="parameters-table">
                <thead>
                  <tr>
                    <th>Tên chỉ số</th>
                    <th>Khoảng tham chiếu</th>
                    <th>Đơn vị</th>
                    <th>Giá trị nhỏ nhất</th>
                    <th>Giá trị lớn nhất</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.length > 0 ? (
                    parameters.map((param) => (
                      <tr key={param.parameterId}>
                        <td>
                          <span className="parameter-name">
                            {param.parameterName}
                          </span>
                        </td>
                        <td>
                          <span className="normal-range">
                            {param.referenceRange}
                          </span>
                        </td>
                        <td>{param.unit}</td>
                        <td>{param.minRange ?? "-"}</td>
                        <td>{param.maxRange ?? "-"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-button delete"
                              onClick={() => handleDeleteParameter(param)}
                              title="Xóa chỉ số"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", padding: "40px" }}
                      >
                        {searchInput
                          ? "Không tìm thấy chỉ số xét nghiệm nào"
                          : "Chưa có chỉ số xét nghiệm nào"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="parameters-pagination">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50", "100"]}
              showTotal={(tot, range) =>
                tot > 0
                  ? `${range[0]}-${range[1]} của ${tot} chỉ số`
                  : "0 chỉ số"
              }
            />
          </div>
        </div>
      </div>

      {/* Parameter Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="parameter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm chỉ số xét nghiệm</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Row 1: Parameter Name - full width */}
              <div className="form-group">
                <label className="form-label">Tên chỉ số</label>
                <input
                  type="text"
                  name="parameterName"
                  className="form-input"
                  placeholder="VD: ALT (SGPT)"
                  value={formData.parameterName}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Row 2: Reference Range and Unit - 2 columns */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Khoảng tham chiếu</label>
                  <input
                    type="text"
                    name="referenceRange"
                    className="form-input"
                    placeholder="VD: 7 - 56"
                    value={formData.referenceRange}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  <small
                    style={{
                      color: "#6b7280",
                      fontSize: "12px",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    Định dạng: số - số (VD: 7 - 56)
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Đơn vị</label>
                  <input
                    type="text"
                    name="unit"
                    className="form-input"
                    placeholder="VD: U/L"
                    value={formData.unit}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-button cancel"
                onClick={handleCloseModal}
              >
                Hủy
              </button>
              <button
                className="modal-button primary"
                onClick={handleSaveParameter}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && parameterToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div
            className="parameter-modal delete-confirm-modal"
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
                Bạn có chắc chắn muốn xóa chỉ số xét nghiệm{" "}
                <strong>{parameterToDelete.parameterName}</strong> không?
              </p>
              <p
                style={{ color: "#ef4444", fontSize: "14px", marginTop: "8px" }}
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
    </AdminLayout>
  );
};

export default ParameterManagement;
