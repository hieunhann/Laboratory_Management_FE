import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../admin/layout/AdminLayout";
import { FiPlus, FiEdit2, FiSearch, FiX, FiPackage } from "react-icons/fi";
import { Pagination, Spin } from "antd";
import { setAuthToken } from "../../../utils/auth";
import { toast } from "react-toastify";
import {
  getAllCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  addParametersToCatalog,
  removeParametersFromCatalog,
  getAllParameters,
} from "../../../services/TestOrderService.jsx";
import { StatisticsAPI } from "../../../apis/StatisticsAPI";
import "./CatalogsManagement.css";

const DEFAULT_FORM = {
  testName: "",
  catalogName: "",
  description: "",
  price: "",
};

// Helper để lấy tên catalog
const getCatalogName = (catalog) =>
  catalog?.catalogName || catalog?.testName || "";

const getParameterId = (param) =>
  param?.parameterId ?? param?.id ?? param?.Id ?? null;

const getParameterName = (param) => param?.parameterName ?? param?.name ?? "";

// Helper để so sánh parameter theo tên (case-insensitive)
const compareParameterNames = (name1, name2) => {
  if (!name1 || !name2) return false;
  return (
    String(name1).trim().toLowerCase() === String(name2).trim().toLowerCase()
  );
};

const getCatalogId = (catalog) =>
  catalog?.catalogId ?? catalog?.id ?? catalog?.Id ?? null;

const CatalogsManagement = () => {
  const [catalogs, setCatalogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [formData, setFormData] = useState(DEFAULT_FORM);

  // Pagination & search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Parameters
  const [availableParameters, setAvailableParameters] = useState([]);
  const [parametersLoading, setParametersLoading] = useState(false);
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [initialParameterIds, setInitialParameterIds] = useState([]);
  const [parameterSearch, setParameterSearch] = useState("");

  // Statistics state
  const [catalogsStats, setCatalogsStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    preloadParameters();
    fetchCatalogsStatistics();
  }, []);

  const fetchCatalogsStatistics = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const response = await StatisticsAPI.getCatalogsStatistics();
      if (response?.data) {
        const catalogsData = response.data.data || response.data;
        if (catalogsData && typeof catalogsData === "object") {
          setCatalogsStats(catalogsData);
        }
      }
    } catch (error) {
      console.error("Error fetching catalogs statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchDebounce]);

  const preloadParameters = async () => {
    setParametersLoading(true);
    try {
      const { items } = await getAllParameters({ page: 1, pageSize: 1000 });
      setAvailableParameters(items || []);
    } catch (error) {
      console.error("Error loading parameters:", error);
    } finally {
      setParametersLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    setIsLoading(true);
    try {
      const query = { page, pageSize };
      if (searchDebounce) query.search = searchDebounce;
      const { items, meta } = await getAllCatalogs(query);
      setCatalogs(items || []);
      setTotal(meta?.totalItems ?? items?.length ?? 0);
    } catch (error) {
      console.error("Error fetching catalogs:", error);
      toast.error("Không thể tải danh sách mục xét nghiệm");
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
    setSelectedCatalog(null);
    setFormData({ ...DEFAULT_FORM, catalogName: "" });
    setSelectedParameters([]);
    setInitialParameterIds([]);
    setParameterSearch("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (catalog) => {
    const catalogId = getCatalogId(catalog);
    if (!catalogId) return;
    setModalMode("edit");
    setSelectedCatalog(catalog);
    setIsModalOpen(true);
    setParameterSearch("");
    setIsDetailLoading(true);
    try {
      // Đảm bảo đã có danh sách parameter đầy đủ để map
      let parametersSource = availableParameters;
      if (!parametersSource || parametersSource.length === 0) {
        setParametersLoading(true);
        try {
          const { items } = await getAllParameters({ page: 1, pageSize: 1000 });
          parametersSource = items || [];
          setAvailableParameters(parametersSource);
        } finally {
          setParametersLoading(false);
        }
      }

      const detail = await getCatalogById(catalogId);
      console.log("[CatalogsManagement] API Response detail:", detail);
      const catalogName = getCatalogName(detail) || getCatalogName(catalog);
      setFormData({
        testName: catalogName,
        catalogName: catalogName,
        description: detail?.description || catalog.description || "",
        price: detail?.price ?? catalog.price ?? "",
      });

      // Lấy parameters từ API response
      const detailParameters = detail?.parameters || [];
      console.log(
        "[CatalogsManagement] Parameters from API:",
        detailParameters
      );
      console.log(
        "[CatalogsManagement] Available parameters count:",
        parametersSource.length
      );

      // Map parameters: tìm trong availableParameters dựa trên parameterName
      const mappedParameters = detailParameters
        .map((apiParam) => {
          const apiParamName = getParameterName(apiParam);
          console.log(
            "[CatalogsManagement] Looking for parameter:",
            apiParamName
          );

          // Tìm trong availableParameters theo tên
          const matchedParam = parametersSource.find((availParam) =>
            compareParameterNames(getParameterName(availParam), apiParamName)
          );

          if (matchedParam) {
            console.log(
              "[CatalogsManagement] Found match:",
              getParameterId(matchedParam),
              getParameterName(matchedParam)
            );
            return matchedParam; // Dùng parameter từ availableParameters (có đầy đủ ID và thông tin)
          } else {
            console.log(
              "[CatalogsManagement] No match found for:",
              apiParamName
            );
            // Nếu không tìm thấy, vẫn giữ parameter từ API nhưng cần có ID để hiển thị
            // Tạm thời tạo một object có đủ thông tin từ API
            return {
              ...apiParam,
              id: null, // Không có ID, sẽ bị filter ra
              parameterId: null,
            };
          }
        })
        .filter((param) => {
          // Chỉ giữ lại những parameter có ID (đã match được)
          const hasId = getParameterId(param) != null;
          if (!hasId) {
            console.log(
              "[CatalogsManagement] Filtering out parameter without ID:",
              getParameterName(param)
            );
          }
          return hasId;
        });

      console.log("[CatalogsManagement] Mapped parameters:", mappedParameters);
      setSelectedParameters(mappedParameters);
      setInitialParameterIds(
        mappedParameters
          .map((param) => getParameterId(param))
          .filter((id) => id != null)
      );
    } catch (error) {
      console.error("Error loading catalog detail:", error);
      toast.error("Không thể tải thông tin mục xét nghiệm");
      const catalogName = getCatalogName(catalog);
      setFormData({
        testName: catalogName,
        catalogName: catalogName,
        description: catalog.description || "",
        price: catalog.price ?? "",
      });
      const fallbackParameters = catalog.parameters || [];
      setSelectedParameters(
        fallbackParameters.filter((param) => getParameterId(param) != null)
      );
      setInitialParameterIds(
        fallbackParameters
          .map((param) => getParameterId(param))
          .filter((id) => id != null)
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCatalog(null);
    setFormData(DEFAULT_FORM);
    setSelectedParameters([]);
    setInitialParameterIds([]);
    setIsSaving(false);
    setIsDetailLoading(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Đồng bộ testName và catalogName
      if (name === "testName") {
        updated.catalogName = value;
      } else if (name === "catalogName") {
        updated.testName = value;
      }
      return updated;
    });
  };

  const handleRemoveSelectedParameter = (parameter) => {
    const paramId = getParameterId(parameter);
    const fallbackKey = parameter?.parameterName || parameter?.name;
    setSelectedParameters((prev) =>
      prev.filter((item) => {
        if (paramId) {
          return getParameterId(item) !== paramId;
        }
        return (
          (item?.parameterName || item?.name) !== fallbackKey ||
          (!fallbackKey && item !== parameter)
        );
      })
    );
  };

  const handleClearSelectedParameters = () => {
    if (selectedParameters.length === 0) return;
    setSelectedParameters([]);
  };

  const handleToggleParameter = (parameter) => {
    const paramId = getParameterId(parameter);
    if (!paramId) return;
    const exists = selectedParameters.some(
      (item) => getParameterId(item) === paramId
    );

    if (exists) {
      // Uncheck: Xóa parameter khỏi danh sách (sẽ xử lý API khi lưu)
      setSelectedParameters((prev) =>
        prev.filter((item) => getParameterId(item) !== paramId)
      );
    } else {
      // Check: Thêm parameter vào danh sách
      setSelectedParameters((prev) => [...prev, parameter]);
    }
  };

  const filteredAvailableParameters = useMemo(() => {
    if (!parameterSearch) return availableParameters;
    const query = parameterSearch.toLowerCase();
    return availableParameters.filter((param) => {
      const name = param.parameterName || param.name || "";
      const unit = param.unit || "";
      return (
        name.toLowerCase().includes(query) || unit.toLowerCase().includes(query)
      );
    });
  }, [availableParameters, parameterSearch]);

  const validateForm = () => {
    const catalogName =
      formData.testName?.trim() || formData.catalogName?.trim() || "";
    if (!catalogName && modalMode === "create") {
      toast.error("Tên mục xét nghiệm là bắt buộc");
      return false;
    }
    if (!formData.price && formData.price !== 0) {
      toast.error("Giá là bắt buộc");
      return false;
    }
    return true;
  };

  const handleSaveCatalog = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      let catalogId = getCatalogId(selectedCatalog);
      const catalogName =
        formData.testName?.trim() || formData.catalogName?.trim() || "";

      if (modalMode === "create") {
        const payload = {
          catalogName: catalogName, // Gửi catalogName theo API mới
          testName: catalogName, // Giữ testName để tương thích
          description: formData.description.trim(),
          price: Number(formData.price) || 0,
        };
        const created = await createCatalog(payload);
        catalogId = getCatalogId(created) || catalogId;
      } else if (catalogId) {
        // Gửi đầy đủ các trường khi cập nhật: catalogName, description, price
        const payload = {
          catalogName: catalogName, // Tên mục xét nghiệm
          testName: catalogName, // Giữ testName để tương thích
          description: formData.description.trim(),
          price: Number(formData.price) || 0,
        };
        await updateCatalog(catalogId, payload);
      }

      // Sync danh sách parameters
      if (catalogId) {
        const parameterIds = selectedParameters
          .map((param) => getParameterId(param))
          .filter(Boolean);

        if (modalMode === "create") {
          if (parameterIds.length) {
            await addParametersToCatalog(catalogId, parameterIds);
          }
        } else {
          const initialSet = initialParameterIds.map((id) => String(id));
          const currentSet = parameterIds.map((id) => String(id));

          const paramsToAdd = parameterIds.filter(
            (id) => !initialSet.includes(String(id))
          );
          const paramsToRemove = initialParameterIds.filter(
            (id) => !currentSet.includes(String(id))
          );

          if (paramsToRemove.length) {
            await removeParametersFromCatalog(catalogId, paramsToRemove);
          }
          if (paramsToAdd.length) {
            await addParametersToCatalog(catalogId, paramsToAdd);
          }
        }
      }

      toast.success(
        modalMode === "create"
          ? "Thêm mục xét nghiệm thành công!"
          : "Cập nhật mục xét nghiệm thành công!"
      );
      await fetchCatalogs();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving catalog:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không thể lưu mục xét nghiệm";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      pageTitle="Quản lý mục xét nghiệm"
      breadcrumbs={[
        { name: "Tổng quan", link: "/admin/dashboard" },
        { name: "Quản lý mục xét nghiệm" },
      ]}
    >
      <div className="catalogs-container">
        <div className="catalogs-header">
          <div className="catalogs-header-left">
            <h1>Quản lý mục xét nghiệm</h1>
            <p>Quản lý các danh mục xét nghiệm và chỉ số</p>
          </div>
          <button
            className="add-catalog-button"
            onClick={handleOpenCreateModal}
          >
            <FiPlus size={20} />
            <span>Thêm mục xét nghiệm</span>
          </button>
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
        ) : catalogsStats ? (
          <div className="catalogs-stats-cards">
            <div className="catalogs-stat-card">
              <div className="catalogs-stat-icon" style={{ color: "#3b82f6" }}>
                <FiPackage />
              </div>
              <div className="catalogs-stat-content">
                <div className="catalogs-stat-title">
                  Tổng số mục xét nghiệm
                </div>
                <div className="catalogs-stat-value">
                  {catalogsStats.totalCatalogs || 0}
                </div>
                <div className="catalogs-stat-change">
                  Tất cả mục xét nghiệm
                </div>
              </div>
            </div>

            <div className="catalogs-stat-card">
              <div className="catalogs-stat-icon" style={{ color: "#10b981" }}>
                <FiPackage />
              </div>
              <div className="catalogs-stat-content">
                <div className="catalogs-stat-title">
                  Mục xét nghiệm đang hoạt động
                </div>
                <div className="catalogs-stat-value">
                  {catalogsStats.activeCatalogs || 0}
                </div>
                <div className="catalogs-stat-change">Đang sử dụng</div>
              </div>
            </div>

            <div className="catalogs-stat-card">
              <div className="catalogs-stat-icon" style={{ color: "#ef4444" }}>
                <FiPackage />
              </div>
              <div className="catalogs-stat-content">
                <div className="catalogs-stat-title">
                  Mục xét nghiệm không hoạt động
                </div>
                <div className="catalogs-stat-value">
                  {catalogsStats.inactiveCatalogs || 0}
                </div>
                <div className="catalogs-stat-change">Đã vô hiệu hóa</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="catalogs-content">
          <div className="catalogs-controls">
            <div className="search-section">
              <div className="search-box">
                <FiSearch size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="page-info">
              <span>
                Hiển thị {catalogs.length} / {total || 0} mục
              </span>
            </div>
          </div>

          <div className="catalogs-table-container">
            <table className="catalogs-table">
              <thead>
                <tr>
                  <th>Tên mục xét nghiệm</th>
                  <th>Mô tả</th>
                  <th>Chỉ số xét nghiệm</th>
                  <th>Giá</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "40px" }}>
                      <div style={{ textAlign: "center" }}>
                        <Spin size="large" />
                      </div>
                    </td>
                  </tr>
                ) : catalogs.length > 0 ? (
                  catalogs.map((catalog) => (
                    <tr key={getCatalogId(catalog)}>
                      <td>
                        <span className="catalog-name">
                          {getCatalogName(catalog) || "-"}
                        </span>
                      </td>
                      <td>
                        {catalog.description ? (
                          <span className="catalog-desc">
                            {catalog.description}
                          </span>
                        ) : (
                          <span className="catalog-desc empty">
                            Chưa có mô tả
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="parameters-tags">
                          {catalog.parameters &&
                          catalog.parameters.length > 0 ? (
                            catalog.parameters.slice(0, 3).map((param) => (
                              <span
                                key={getParameterId(param)}
                                className="parameter-tag"
                              >
                                {param.parameterName || param.name || "-"}
                              </span>
                            ))
                          ) : (
                            <span className="no-parameter">Chưa có chỉ số</span>
                          )}
                          {catalog.parameters &&
                            catalog.parameters.length > 3 && (
                              <span className="parameter-tag more">
                                +{catalog.parameters.length - 3}
                              </span>
                            )}
                        </div>
                      </td>
                      <td>
                        <span className="catalog-price">
                          {catalog.price
                            ? `${catalog.price.toLocaleString("vi-VN")} đ`
                            : "-"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-button edit"
                          onClick={() => handleOpenEditModal(catalog)}
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ textAlign: "center", padding: 40 }}
                    >
                      {searchDebounce
                        ? "Không tìm thấy mục xét nghiệm nào"
                        : "Chưa có mục xét nghiệm nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="catalogs-pagination">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50", "100"]}
              showTotal={(tot, range) =>
                tot > 0 ? `${range[0]}-${range[1]} của ${tot} mục` : "0 mục"
              }
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create"
                  ? "Thêm mục xét nghiệm"
                  : "Chỉnh sửa mục xét nghiệm"}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-body">
              {isDetailLoading && (
                <p className="form-hint">Đang tải dữ liệu mục xét nghiệm...</p>
              )}
              <div className="catalog-form-content">
                <div className="catalog-form-left">
                  <div className="form-section">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Tên mục xét nghiệm</label>
                        <input
                          type="text"
                          name="testName"
                          className="form-input"
                          placeholder="VD: Xét nghiệm máu toàn bộ"
                          value={formData.testName}
                          onChange={handleFormChange}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Giá (VNĐ)</label>
                        <input
                          type="number"
                          name="price"
                          className="form-input"
                          placeholder="150000"
                          value={formData.price}
                          onChange={handleFormChange}
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mô tả</label>
                      <textarea
                        name="description"
                        className="form-textarea"
                        placeholder="Nhập mô tả chi tiết cho mục xét nghiệm"
                        value={formData.description}
                        onChange={handleFormChange}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="form-section selected-summary">
                    <div className="selected-summary-header">
                      <h3>Chỉ số đã chọn ({selectedParameters.length})</h3>
                      <button
                        type="button"
                        className="clear-btn"
                        onClick={handleClearSelectedParameters}
                        disabled={isSaving || selectedParameters.length === 0}
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="selected-summary-list">
                      {selectedParameters.length > 0 ? (
                        selectedParameters.map((param) => {
                          const paramId = getParameterId(param);
                          return (
                            <div
                              key={paramId || param.parameterName}
                              className="selected-summary-item"
                            >
                              <div>
                                <span>
                                  {param.parameterName || param.name || "-"}
                                </span>
                                <p>
                                  {param.unit
                                    ? `${param.unit} • ${
                                        param.referenceRange || ""
                                      }`
                                    : param.referenceRange || ""}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleRemoveSelectedParameter(param)
                                }
                                disabled={isSaving}
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="empty-text">
                          Chưa có chỉ số nào được chọn
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="catalog-form-right">
                  <div className="parameter-selector">
                    <div className="parameter-selector-header">
                      <div className="parameter-selector-title">
                        <h4>Chỉ số xét nghiệm</h4>
                        <p>
                          Chọn những chỉ số sẽ áp dụng cho mục xét nghiệm này
                        </p>
                      </div>
                    </div>
                    <div className="parameter-selector-search">
                      <div className="search-box compact">
                        <FiSearch size={16} />
                        <input
                          type="text"
                          placeholder="Tìm kiếm chỉ số..."
                          value={parameterSearch}
                          onChange={(e) => setParameterSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="parameters-selection">
                      {parametersLoading ? (
                        <div style={{ textAlign: "center", padding: "20px" }}>
                          <Spin />
                        </div>
                      ) : filteredAvailableParameters.length > 0 ? (
                        filteredAvailableParameters.map((param) => {
                          const paramId = getParameterId(param);
                          const isSelected = selectedParameters.some(
                            (item) => getParameterId(item) === paramId
                          );
                          return (
                            <div
                              key={paramId}
                              className={`parameter-item ${
                                isSelected ? "selected" : ""
                              }`}
                              onClick={() => handleToggleParameter(param)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                              />
                              <div className="parameter-info">
                                <span className="parameter-title">
                                  {param.parameterName || param.name}
                                </span>
                                <span className="parameter-meta">
                                  {param.unit} • {param.referenceRange}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="empty-text">
                          Không có chỉ số nào phù hợp với tìm kiếm
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
                onClick={handleSaveCatalog}
                disabled={isSaving || isDetailLoading}
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
    </AdminLayout>
  );
};

export default CatalogsManagement;
