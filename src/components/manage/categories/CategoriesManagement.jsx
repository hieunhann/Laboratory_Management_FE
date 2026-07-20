import React, { useEffect, useState } from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import { Pagination, Spin } from "antd";
import { setAuthToken } from "../../../utils/auth";
import { toast } from "react-toastify";
import BlogService from "../../../services/BlogService";
import { formatDate1 } from "../../../utils/formatDate";
import "./CategoriesManagement.css";

const DEFAULT_FORM = {
  name: "",
  description: "",
};

// Helper để lấy category ID
const getCategoryId = (category) =>
  category?.categoryId ?? category?.id ?? category?.Id ?? null;

// Helper để lấy category name
const getCategoryName = (category) =>
  category?.name ?? category?.categoryName ?? "";

// Helper để check xem category có đang được sử dụng không
const isCategoryInUse = (category, usedCategoryIds) => {
  const categoryId = getCategoryId(category);
  if (!categoryId) return false;
  const normalizedCategoryId =
    typeof categoryId === "string"
      ? parseInt(categoryId, 10)
      : Number(categoryId);
  return usedCategoryIds.some((id) => Number(id) === normalizedCategoryId);
};

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [originalCreatedDate, setOriginalCreatedDate] = useState(null);

  // Track which categories are being used by blogs (array of categoryIds)
  const [usedCategoryIds, setUsedCategoryIds] = useState([]);

  // Pagination & search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    fetchCategories();
    fetchUsedCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounce]);

  // Fetch which categories are being used by blogs
  const fetchUsedCategories = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);

      // Fetch all blogs to check which categories are in use
      const allBlogs = await BlogService.getAllBlogs({
        page: 1,
        pageSize: 1000,
      });

      // Extract unique categoryIds from blogs
      const usedIdsSet = new Set();
      allBlogs.forEach((blog) => {
        const blogCategoryId =
          blog.categoryId || blog.category?.categoryId || null;
        if (blogCategoryId !== null && blogCategoryId !== undefined) {
          usedIdsSet.add(Number(blogCategoryId));
        }
      });

      // Convert Set to array for state
      const usedIdsArray = Array.from(usedIdsSet);
      setUsedCategoryIds(usedIdsArray);
      console.log("Categories in use:", usedIdsArray);
    } catch (error) {
      console.error("Error fetching used categories:", error);
      // Don't show error to user, just log it
      // If we can't fetch, allow deletion attempts
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const allCategories = await BlogService.getCategories();

      // Filter by search term if exists
      let filteredCategories = allCategories;
      if (searchDebounce) {
        const searchLower = searchDebounce.toLowerCase();
        filteredCategories = allCategories.filter(
          (category) =>
            getCategoryName(category).toLowerCase().includes(searchLower) ||
            (category.description || "").toLowerCase().includes(searchLower)
        );
      }

      // Sort by ID descending (newest first)
      filteredCategories.sort((a, b) => {
        const idA = getCategoryId(a) || 0;
        const idB = getCategoryId(b) || 0;
        return idB - idA;
      });

      setTotal(filteredCategories.length);

      // Pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCategories = filteredCategories.slice(
        startIndex,
        endIndex
      );

      setCategories(paginatedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Không thể tải danh sách danh mục");
      setCategories([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
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

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedCategory(null);
    setOriginalCreatedDate(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    const categoryId = getCategoryId(category);
    if (!categoryId) return;
    setModalMode("edit");
    setSelectedCategory(category);
    // Lưu ngày tạo gốc để giữ nguyên khi cập nhật
    setOriginalCreatedDate(category.createdDate || null);
    setFormData({
      name: getCategoryName(category) || "",
      description: category.description || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setOriginalCreatedDate(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setIsSaving(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Tên danh mục là bắt buộc";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSaveCategory = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const categoryId = getCategoryId(selectedCategory);

      if (modalMode === "create") {
        await BlogService.createCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        toast.success("Thêm danh mục thành công!");
      } else if (categoryId) {
        // Đảm bảo giữ nguyên ngày tạo gốc khi cập nhật
        const categoryWithOriginalDate = {
          ...selectedCategory,
          createdDate: originalCreatedDate || selectedCategory.createdDate,
        };
        await BlogService.updateCategory(
          categoryId,
          {
            name: formData.name.trim(),
            description: formData.description.trim(),
          },
          categoryWithOriginalDate
        );
        toast.success("Cập nhật danh mục thành công!");
      }

      await fetchCategories();
      await fetchUsedCategories(); // Refresh used categories after save
      handleCloseModal();
    } catch (error) {
      console.error("Error saving category:", error);
      // Log detailed error for debugging
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
      // Extract detailed error message
      let errorMessage = "Không thể thực hiện thao tác";

      if (error.response?.data) {
        const errorData = error.response.data;
        // Try different error message formats
        errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.title ||
          (Array.isArray(errorData.errors)
            ? errorData.errors.join(", ")
            : null) ||
          (typeof errorData === "string" ? errorData : null) ||
          `Lỗi ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show more specific message based on mode
      if (!error.response?.data) {
        errorMessage =
          modalMode === "create"
            ? "Không thể thêm danh mục. Vui lòng kiểm tra kết nối mạng."
            : "Không thể cập nhật danh mục. Vui lòng kiểm tra kết nối mạng.";
      }

      toast.error(errorMessage);
      console.error("Full error object:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const categoryId = getCategoryId(categoryToDelete);
    if (!categoryId) {
      toast.error("Không tìm thấy ID danh mục để xóa");
      return;
    }

    // Log để debug
    console.log("Deleting category:", {
      categoryToDelete,
      categoryId,
      categoryIdType: typeof categoryId,
    });

    setIsDeleting(true);
    try {
      await BlogService.deleteCategory(categoryId);
      toast.success("Đã xóa danh mục thành công!");
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      await fetchCategories();
      await fetchUsedCategories(); // Refresh used categories after delete
    } catch (error) {
      console.error("Error deleting category:", error);

      // Extract detailed error message
      let errorMessage = "Không thể xóa danh mục";

      if (error.response) {
        const errorData = error.response.data;
        const status = error.response.status;

        // Handle different error status codes
        if (status === 500) {
          // Check if errorData is empty string, null, or has no useful message
          const hasErrorData =
            errorData &&
            typeof errorData === "object" &&
            (errorData.message || errorData.error);
          const hasErrorString =
            errorData &&
            typeof errorData === "string" &&
            errorData.trim() !== "";

          if (hasErrorData) {
            errorMessage =
              errorData.message ||
              errorData.error ||
              "Lỗi server khi xóa danh mục";
          } else if (hasErrorString) {
            errorMessage = errorData;
          } else {
            // Default message when backend returns 500 with empty data
            errorMessage =
              "Lỗi server khi xóa danh mục. " +
              "Có thể danh mục đang được sử dụng bởi các bài viết hoặc có lỗi xảy ra ở server. " +
              "Vui lòng kiểm tra lại và thử lại sau.";
          }
        } else if (status === 404) {
          errorMessage = "Không tìm thấy danh mục để xóa";
        } else if (status === 403) {
          errorMessage = "Bạn không có quyền xóa danh mục này";
        } else if (status === 400) {
          errorMessage =
            (errorData &&
              typeof errorData === "object" &&
              (errorData.message || errorData.error)) ||
            (errorData &&
            typeof errorData === "string" &&
            errorData.trim() !== ""
              ? errorData
              : null) ||
            "Dữ liệu không hợp lệ để xóa";
        } else {
          errorMessage =
            (errorData &&
              typeof errorData === "object" &&
              (errorData.message || errorData.error)) ||
            (errorData &&
            typeof errorData === "string" &&
            errorData.trim() !== ""
              ? errorData
              : null) ||
            `Lỗi ${status}: Không thể xóa danh mục`;
        }

        // Log full error for debugging
        console.error(
          "Error response data:",
          errorData === ""
            ? "(empty string)"
            : JSON.stringify(errorData, null, 2)
        );
        console.error("Error status:", status);
        console.error("Full error response:", error.response);
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <AdminLayout
      pageTitle="Quản lý danh mục bài viết"
      breadcrumbs={[
        { name: "Tổng quan", link: "/admin/dashboard" },
        { name: "Quản lý danh mục bài viết" },
      ]}
    >
      <div className="categories-container">
        <div className="categories-header">
          <div className="categories-header-left">
            <h1>Quản lý danh mục bài viết</h1>
            <p>Quản lý các danh mục phân loại bài viết</p>
          </div>
          <button
            className="add-category-button"
            onClick={handleOpenCreateModal}
          >
            <FiPlus size={20} />
            <span>Thêm danh mục mới</span>
          </button>
        </div>

        <div className="categories-content">
          <div className="categories-controls">
            <div className="search-section">
              <div className="search-box">
                <FiSearch size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mô tả..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="categories-table-container">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
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
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <tr key={getCategoryId(category)}>
                      <td>
                        <span className="category-name">
                          {getCategoryName(category) || "-"}
                        </span>
                      </td>
                      <td>
                        {category.description ? (
                          <span className="category-desc">
                            {category.description}
                          </span>
                        ) : (
                          <span className="category-desc empty">
                            Chưa có mô tả
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="category-date">
                          {category.createdDate
                            ? formatDate1(category.createdDate)
                            : "-"}
                        </span>
                      </td>
                      <td>
                        <div className="categories-table-actions">
                          <button
                            className="action-button edit"
                            onClick={() => handleOpenEditModal(category)}
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          {!isCategoryInUse(category, usedCategoryIds) && (
                            <button
                              className="action-button delete"
                              onClick={() => handleDeleteCategory(category)}
                              title="Xóa"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          )}
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
                      {searchDebounce
                        ? "Không tìm thấy danh mục nào"
                        : "Chưa có danh mục nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="categories-pagination">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={["10", "20", "50", "100"]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create"
                  ? "Thêm danh mục mới"
                  : "Chỉnh sửa danh mục"}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="category-form">
                <div className="form-group">
                  <label className="form-label">
                    Tên danh mục <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={`form-input ${formErrors.name ? "error" : ""}`}
                    placeholder="VD: Xét nghiệm, Y tế, Tin tức..."
                    value={formData.name}
                    onChange={handleFormChange}
                    disabled={isSaving}
                  />
                  {formErrors.name && (
                    <span className="form-error">{formErrors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    placeholder="Nhập mô tả cho danh mục..."
                    value={formData.description}
                    onChange={handleFormChange}
                    disabled={isSaving}
                    rows={4}
                  />
                </div>

                {modalMode === "edit" && originalCreatedDate && (
                  <div className="form-group">
                    <label className="form-label">Ngày tạo</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formatDate1(originalCreatedDate)}
                      disabled
                      readOnly
                      style={{
                        backgroundColor: "#f5f5f5",
                        cursor: "not-allowed",
                        color: "#666",
                      }}
                    />
                  </div>
                )}
              </div>
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
                onClick={handleSaveCategory}
                disabled={isSaving}
              >
                {isSaving
                  ? "Đang xử lý..."
                  : modalMode === "create"
                  ? "Thêm mới"
                  : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>Xác nhận xóa danh mục</h3>
            </div>
            <div className="delete-modal-body">
              <p>
                Bạn có chắc chắn muốn xóa danh mục{" "}
                <strong>"{getCategoryName(categoryToDelete)}"</strong> không?
              </p>
              <p className="delete-warning">
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="delete-modal-footer">
              <button
                className="modal-button cancel"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="modal-button danger"
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

export default CategoriesManagement;
