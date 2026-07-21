/* eslint-disable react-refresh/only-export-components */
import api from "../configs/axios";

// ==================== API Base URLs ====================
const BUNDLE_BASE = "testorder/api/test-bundles";
const CATALOG_BUNDLE_BASE = "testorder/api/catalog-bundles";
const CATALOG_BASE = "testorder/api/test-catalogs";
const PARAMETER_BASE = "testorder/api/test-parameters";

// ==================== Bundle Service APIs ====================
export const getAllBundles = async (params = {}) => {
  const response = await api.get(CATALOG_BUNDLE_BASE, { params });
  return response;
};

export const getAllBundlesWithActive = async (params = {}) => {
  const response = await api.get(BUNDLE_BASE, { params });
  return response;
};

export const getBundleById = async (id) => {
  if (!id) throw new Error("Bundle ID is required");
  const response = await api.get(`${BUNDLE_BASE}/${id}`);
  return response;
};

export const createBundle = async (payload) => {
  const response = await api.post(BUNDLE_BASE, payload);
  return response;
};

export const updateBundle = async (id, payload) => {
  if (!id) throw new Error("Bundle ID is required");
  const response = await api.put(`${BUNDLE_BASE}/${id}`, payload);
  return response;
};

export const deleteBundle = async (id) => {
  if (!id) throw new Error("Bundle ID is required");
  const response = await api.delete(`${BUNDLE_BASE}/${id}`);
  return response;
};

export const getCatalogsOfBundle = async (bundleId) => {
  if (!bundleId) throw new Error("Bundle ID is required");
  const response = await api.get(`${BUNDLE_BASE}/${bundleId}/catalogs`);
  return response;
};

export const addCatalogsToBundle = async (bundleId, catalogIds = []) => {
  if (!bundleId) throw new Error("Bundle ID is required");
  const payload = {
    bundleId,
    catalogId: catalogIds,
  };
  const response = await api.post(CATALOG_BUNDLE_BASE, payload);
  return response;
};

export const removeCatalogsFromBundle = async (bundleId, catalogIds = []) => {
  if (!bundleId) throw new Error("Bundle ID is required");
  const ids = Array.isArray(catalogIds) ? catalogIds : [];
  const params = new URLSearchParams();
  ids.forEach((id) => params.append("catalogId", id));
  const response = await api.delete(`${CATALOG_BUNDLE_BASE}/${bundleId}?${params.toString()}`);
  return response;
};

// ==================== Catalog Service APIs ====================
export const getAllCatalogs = async (params = {}) => {
  const response = await api.get(CATALOG_BASE, { params });
  return response;
};

export const getCatalogById = async (id) => {
  if (!id) throw new Error("Catalog ID is required");
  const response = await api.get(`${CATALOG_BASE}/${id}`);
  return response;
};

export const createCatalog = async (payload) => {
  const response = await api.post(CATALOG_BASE, payload);
  return response;
};

export const updateCatalog = async (id, payload) => {
  if (!id) throw new Error("Catalog ID is required");
  const response = await api.put(`${CATALOG_BASE}/${id}`, payload);
  return response;
};

export const addParametersToCatalog = async (id, parameterIds = []) => {
  if (!id) throw new Error("Catalog ID is required");
  const response = await api.post(
    `${CATALOG_BASE}/${id}/parameters`,
    parameterIds
  );
  return response;
};

export const removeParametersFromCatalog = async (id, parameterIds = []) => {
  if (!id) throw new Error("Catalog ID is required");
  const response = await api.delete(
    `${CATALOG_BASE}/${id}/parameters`,
    { data: parameterIds }
  );
  return response;
};

export const deleteCatalogParameter = async (catalogId, parameterId) => {
  if (!catalogId) throw new Error("Catalog ID is required");
  if (!parameterId) throw new Error("Parameter ID is required");
  const response = await api.delete(`${CATALOG_BASE}/${catalogId}/parameter`, {
    data: { parameterId },
  });
  return response;
};

// ==================== Parameter Service APIs ====================
export const getAllParameters = async (params = {}) => {
  const response = await api.get(PARAMETER_BASE, { params });
  return response;
};

export const getParameterById = async (id) => {
  if (!id) throw new Error("Parameter ID is required");
  const response = await api.get(`${PARAMETER_BASE}/${id}`);
  return response;
};

export const createParameter = async (payload) => {
  if (!payload) throw new Error("Payload is required");
  const response = await api.post(PARAMETER_BASE, payload);
  return response;
};

export const updateParameter = async (id, payload) => {
  if (!id) throw new Error("Parameter ID is required");
  const response = await api.put(`${PARAMETER_BASE}/${id}`, payload);
  return response;
};

export const deleteParameter = async (id) => {
  if (!id) throw new Error("Parameter ID is required");
  const response = await api.delete(`${PARAMETER_BASE}/${id}`);
  return response;
};

// ==================== Booking Service APIs ====================
export const bookingService = {
  // Lấy thông tin booking theo ID
  getBookingById: async (bookingId) => {
    const response = await api.get(
      `testorder/api/bookings/${bookingId}`
    );
    return response;
  },

  // Lấy thông tin test catalog
  getTestCatalog: async (catalogId) => {
    const response = await api.get(`testorder/api/test-catalogs/${catalogId}`);
    return response;
  },

  // Lấy thông tin test bundle
  getTestBundle: async (bundleId) => {
    const response = await api.get(`testorder/api/test-bundles/${bundleId}`);
    return response;
  },

  // Tạo VNPay URL
  createVnPayUrl: async (bookingId, amount) => {
    const response = await api.post(`testorder/api/payments/vnpay-url`, {
      bookingId,
      amount,
      returnUrl: window.location.origin + "/booking/successBooking",
    });
    return response;
  },

  // Lấy thông tin số lượng booking của các appointment slots
  getAppointmentSlotCounts: async (page = 1, size = 10000) => {
    return await api.get(
      `/testorder/api/appointment-slots/bookings-count-summary?pageNumber=${page}&pageSize=${size}`
    );
  },
};

// ==================== Default Export ====================
const TestOrderServiceAPI = {
  // Bundle APIs
  getAllBundles,
  getAllBundlesWithActive,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  getCatalogsOfBundle,
  addCatalogsToBundle,
  removeCatalogsFromBundle,
  // Catalog APIs
  getAllCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  addParametersToCatalog,
  removeParametersFromCatalog,
  deleteCatalogParameter,
  // Parameter APIs
  getAllParameters,
  getParameterById,
  createParameter,
  // Booking Service
  bookingService,
};

export default TestOrderServiceAPI;
