import {
  getAllBundles as getAllBundlesAPI,
  getAllBundlesWithActive,
  getBundleById as getBundleByIdAPI,
  createBundle as createBundleAPI,
  updateBundle as updateBundleAPI,
  deleteBundle as deleteBundleAPI,
  getCatalogsOfBundle as getCatalogsOfBundleAPI,
  addCatalogsToBundle as addCatalogsToBundleAPI,
  removeCatalogsFromBundle as removeCatalogsFromBundleAPI,
  getAllCatalogs as getAllCatalogsAPI,
  getCatalogById as getCatalogByIdAPI,
  createCatalog as createCatalogAPI,
  updateCatalog as updateCatalogAPI,
  addParametersToCatalog as addParametersToCatalogAPI,
  removeParametersFromCatalog as removeParametersFromCatalogAPI,
  deleteCatalogParameter as deleteCatalogParameterAPI,
  getAllParameters as getAllParametersAPI,
  getParameterById as getParameterByIdAPI,
  createParameter as createParameterAPI,
  updateParameter as updateParameterAPI,
  deleteParameter as deleteParameterAPI,
  bookingService as bookingServiceAPI,
} from "../apis/TestOrderServiceAPI.jsx";
import { setAuthToken } from "../utils/auth";

// ==================== Helper Functions ====================
export const extractItemsAndMeta = (response, fallbackQuery = {}) => {
  const data = response?.data;
  let items = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (Array.isArray(data?.data?.items)) {
    items = data.data.items;
  } else if (Array.isArray(data?.data?.data)) {
    items = data.data.data;
  } else if (Array.isArray(data?.data)) {
    items = data.data;
  } else if (Array.isArray(data?.items)) {
    items = data.items;
  } else if (data) {
    items = Array.isArray(data) ? data : data.items || [];
  }

  const meta = data?.meta || {
    totalItems: data?.totalItems ?? items.length ?? 0,
    page: fallbackQuery.page ?? 1,
    pageSize: fallbackQuery.pageSize ?? items.length ?? 0,
  };

  return { items, meta };
};

// ==================== Bundle Service ====================
export const getAllBundles = async (params = {}) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    // Lấy bundles từ TestBundle API (chứa tất cả bundles, kể cả chưa có catalog)
    const testBundleResponse = await getAllBundlesWithActive(params);
    const testBundles = extractItemsAndMeta(testBundleResponse, params);

    // Lấy thông tin catalogs từ CatalogBundle API để merge
    // Lưu ý: CatalogBundle API chỉ trả về bundles có catalogs
    // Nên cần lấy với pageSize lớn để đảm bảo lấy được tất cả
    let catalogBundles = { items: [], meta: { totalItems: 0 } };
    try {
      // Lấy tất cả bundles có catalogs (không giới hạn pagination)
      const catalogBundleParams = {
        ...params,
        page: 1,
        pageSize: 1000, // Lấy số lượng lớn để đảm bảo lấy được tất cả
      };
      const catalogBundleResponse = await getAllBundlesAPI(catalogBundleParams);
      catalogBundles = extractItemsAndMeta(
        catalogBundleResponse,
        catalogBundleParams
      );
    } catch (error) {
      // Silently fallback to TestBundle data only
    }

    // Helper function để so sánh bundle ID một cách an toàn
    const compareBundleIds = (id1, id2) => {
      if (!id1 || !id2) return false;
      // Convert về string để so sánh (xử lý cả số và string)
      return String(id1) === String(id2);
    };

    // Merge: lấy tất cả bundles từ TestBundle và thêm catalogs từ CatalogBundle
    const mergedBundles = testBundles.items.map((testBundle) => {
      const testBundleId = testBundle.bundleId ?? testBundle.id;

      // Tìm bundle tương ứng trong CatalogBundle response
      const catalogBundle = catalogBundles.items.find((cb) => {
        const catalogBundleId = cb.bundleId ?? cb.id;
        return compareBundleIds(testBundleId, catalogBundleId);
      });

      // Nếu tìm thấy catalogBundle, merge catalogs
      // Nếu không tìm thấy, bundle này chưa có catalogs (hoặc không có trong CatalogBundle response)
      const mergedBundle = {
        ...testBundle,
        // Thêm catalogs từ CatalogBundle nếu có, nếu không thì dùng từ testBundle hoặc mảng rỗng
        catalogs: catalogBundle?.catalogs ?? testBundle.catalogs ?? [],
        // Ưu tiên isActive từ TestBundle
        isActive: testBundle.isActive ?? catalogBundle?.isActive ?? true,
      };

      return mergedBundle;
    });

    return {
      items: mergedBundles,
      meta: testBundles.meta, // Sử dụng meta từ TestBundle vì nó chứa tất cả bundles
    };
  } catch (error) {
    // Fallback: thử lấy từ CatalogBundle nếu TestBundle lỗi
    try {
      const catalogBundleResponse = await getAllBundlesAPI(params);
      const catalogBundles = extractItemsAndMeta(catalogBundleResponse, params);
      return catalogBundles;
    } catch (fallbackError) {
      throw error; // Throw error gốc
    }
  }
};

export const getBundleById = async (id) => {
  if (!id) throw new Error("Bundle ID is required");
  try {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await getBundleByIdAPI(id);
    if (response?.status === 204 || !response?.data) {
      return null;
    }
    const data = response?.data;
    return data?.data || data;
  } catch (error) {
    if (error.response?.status === 204 || error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createBundle = async (payload) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await createBundleAPI(payload);

    // Xử lý trường hợp 204 No Content - API thành công nhưng không trả về data
    if (response?.status === 204) {
      // Thử lấy bundleId từ Location header nếu có
      const location =
        response?.headers?.location ||
        response?.headers?.Location ||
        response?.headers?.["location"] ||
        response?.headers?.["Location"];

      if (location) {
        // Thử nhiều pattern để extract ID
        const patterns = [
          /\/(\d+)$/, // /123
          /\/([0-9a-fA-F-]+)$/, // UUID hoặc GUID
          /id[=:](\d+)/i, // id=123 hoặc id:123
        ];

        for (const pattern of patterns) {
          const match = location.match(pattern);
          if (match && match[1]) {
            const bundleId = match[1];
            return { id: bundleId, bundleId: bundleId };
          }
        }
      }

      // Nếu không có Location header, trả về null để component xử lý
      return null;
    }

    const data = response?.data;
    const result = data?.data || data;
    return result;
  } catch (error) {
    // Xử lý trường hợp 204 trong error response
    if (error.response?.status === 204) {
      const location =
        error.response?.headers?.location ||
        error.response?.headers?.Location ||
        error.response?.headers?.["location"] ||
        error.response?.headers?.["Location"];

      if (location) {
        const patterns = [/\/(\d+)$/, /\/([0-9a-fA-F-]+)$/, /id[=:](\d+)/i];

        for (const pattern of patterns) {
          const match = location.match(pattern);
          if (match && match[1]) {
            const bundleId = match[1];
            return { id: bundleId, bundleId: bundleId };
          }
        }
      }
      return null;
    }
    throw error;
  }
};

export const updateBundle = async (id, payload) => {
  if (!id) throw new Error("Bundle ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await updateBundleAPI(id, payload);
  const data = response?.data;
  return data?.data || data;
};

export const deleteBundle = async (id) => {
  if (!id) throw new Error("Bundle ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await deleteBundleAPI(id);
  const data = response?.data;
  return data?.data || data;
};

export const getCatalogsOfBundle = async (bundleId) => {
  if (!bundleId) throw new Error("Bundle ID is required");

  try {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await getCatalogsOfBundleAPI(bundleId);

    // Xử lý trường hợp 204 No Content - bundle không có catalogs
    if (response?.status === 204 || !response?.data) {
      return null;
    }

    // Response trả về là array: [{bundleId, bundleName, description, price, catalogs: [...]}]
    const data = response?.data;

    // Nếu là array, trả về phần tử đầu tiên (chứa thông tin bundle và catalogs)
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    // Nếu là object trực tiếp
    else if (data && typeof data === "object") {
      // Thử các trường hợp nested
      if (Array.isArray(data.data) && data.data.length > 0) {
        return data.data[0];
      } else if (data.data && typeof data.data === "object") {
        return data.data;
      }
      return data;
    }

    return null;
  } catch (error) {
    // Xử lý trường hợp 204, 404 hoặc các lỗi khác
    if (error.response?.status === 204 || error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const addCatalogsToBundle = async (bundleId, catalogIds = []) => {
  if (!bundleId) throw new Error("Bundle ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await addCatalogsToBundleAPI(bundleId, catalogIds);
  const data = response?.data;
  return data?.data || data;
};

export const removeCatalogsFromBundle = async (bundleId, catalogIds = []) => {
  if (!bundleId) throw new Error("Bundle ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await removeCatalogsFromBundleAPI(bundleId, catalogIds);
  const data = response?.data;
  return data?.data || data;
};

// ==================== Catalog Service ====================
export const getAllCatalogs = async (params = {}) => {
  // Đảm bảo luôn có page và pageSize - logic xử lý params
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...params,
  };

  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await getAllCatalogsAPI(queryParams);
  const data = response?.data;

  // Xử lý response mới với catalogDTOs
  let items = [];

  if (Array.isArray(data?.catalogDTOs)) {
    items = data.catalogDTOs;
  } else if (Array.isArray(data?.data?.catalogDTOs)) {
    items = data.data.catalogDTOs;
  } else if (Array.isArray(data)) {
    items = data;
  } else if (Array.isArray(data?.data)) {
    items = data.data;
  } else if (Array.isArray(data?.items)) {
    items = data.items;
  }

  // Meta từ response mới
  const meta = data?.meta || data?.data?.meta || {
    totalItems: data?.totalItems ?? data?.data?.totalItems ?? items.length ?? 0,
    page: data?.page ?? data?.data?.page ?? queryParams.page ?? 1,
    pageSize: data?.pageSize ?? data?.data?.pageSize ?? queryParams.pageSize ?? items.length ?? 0,
    totalPages:
      data?.totalPages ??
      data?.data?.totalPages ??
      Math.ceil(
        (data?.totalItems ?? data?.data?.totalItems ?? items.length) /
          (data?.pageSize ?? data?.data?.pageSize ?? queryParams.pageSize)
      ),
  };

  return { items, meta };
};

export const getCatalogById = async (id) => {
  if (!id) throw new Error("Catalog ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await getCatalogByIdAPI(id);
  const data = response?.data;
  return data?.data || data;
};

export const createCatalog = async (payload) => {
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await createCatalogAPI(payload);
  const data = response?.data;
  return data?.data || data;
};

export const updateCatalog = async (id, payload) => {
  if (!id) throw new Error("Catalog ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await updateCatalogAPI(id, payload);
  const data = response?.data;
  return data?.data || data;
};

export const addParametersToCatalog = async (id, parameterIds = []) => {
  if (!id) throw new Error("Catalog ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await addParametersToCatalogAPI(id, parameterIds);
  const data = response?.data;
  return data?.data || data;
};

export const removeParametersFromCatalog = async (id, parameterIds = []) => {
  if (!id) throw new Error("Catalog ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await removeParametersFromCatalogAPI(id, parameterIds);
  const data = response?.data;
  return data?.data || data;
};

export const deleteCatalogParameter = async (catalogId, parameterId) => {
  if (!catalogId) throw new Error("Catalog ID is required");
  if (!parameterId) throw new Error("Parameter ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await deleteCatalogParameterAPI(catalogId, parameterId);
  const data = response?.data;
  return data?.data || data;
};

// ==================== Parameter Service ====================
export const getAllParameters = async (params = {}) => {
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await getAllParametersAPI(params);
  return extractItemsAndMeta(response, params);
};

export const getParameterById = async (id) => {
  if (!id) throw new Error("Parameter ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await getParameterByIdAPI(id);
  const data = response?.data;
  if (data?.data) return data.data;
  return data;
};

export const createParameter = async (payload) => {
  if (!payload) throw new Error("Payload is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await createParameterAPI(payload);
  return response?.data;
};

export const updateParameter = async (id, payload) => {
  if (!id) throw new Error("Parameter ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await updateParameterAPI(id, payload);
  const data = response?.data;
  return data?.data || data;
};

export const deleteParameter = async (id) => {
  if (!id) throw new Error("Parameter ID is required");
  const token = localStorage.getItem("accessToken");
  if (token) setAuthToken(token);
  const response = await deleteParameterAPI(id);
  const data = response?.data;
  return data?.data || data;
};

// ==================== Booking Service ====================
export const bookingService = {
  // Lấy thông tin booking theo ID
  getBookingById: async (bookingId) => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await bookingServiceAPI.getBookingById(bookingId);
    return response?.data || response;
  },

  // Lấy thông tin test catalog
  getTestCatalog: async (catalogId) => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await bookingServiceAPI.getTestCatalog(catalogId);
    return response?.data || response;
  },

  // Lấy thông tin test bundle
  getTestBundle: async (bundleId) => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await bookingServiceAPI.getTestBundle(bundleId);
    return response?.data || response;
  },

  // Tạo VNPay URL
  createVnPayUrl: async (bookingId, amount) => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await bookingServiceAPI.createVnPayUrl(bookingId, amount);
    return response?.data || response;
  },

  // Lấy thông tin số lượng booking của các appointment slots
  getAppointmentSlotCounts: async () => {
    const token = localStorage.getItem("accessToken");
    if (token) setAuthToken(token);
    const response = await bookingServiceAPI.getAppointmentSlotCounts();
    return response?.data || response;
  },
};

export const ManagerAppointmentSchedule = {};
