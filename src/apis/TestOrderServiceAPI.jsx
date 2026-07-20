/* eslint-disable react-refresh/only-export-components */
import api from "../configs/axios";

// ==================== API Base URLs ====================
const BUNDLE_BASE = "testorder/api/TestBundle";
const CATALOG_BUNDLE_BASE = "testorder/api/CatalogBundle";
const CATALOG_BASE = "testorder/api/TestCatalog";
const PARAMETER_BASE = "testorder/api/TestParameter";

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
  const response = await api.get(`${CATALOG_BUNDLE_BASE}/${bundleId}`);
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
  const payload = Array.isArray(catalogIds) ? catalogIds : [];
  const response = await api.delete(`${CATALOG_BUNDLE_BASE}/${bundleId}`, {
    data: payload,
  });
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
  const response = await api.put(
    `${CATALOG_BASE}/${id}/parameters`,
    parameterIds
  );
  return response;
};

export const removeParametersFromCatalog = async (id, parameterIds = []) => {
  if (!id) throw new Error("Catalog ID is required");
  const response = await api.put(
    `${CATALOG_BASE}/${id}/paramters-remove`,
    parameterIds
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
      `testorder/api/Booking?bookingId=${bookingId}`
    );
    return response;
  },

  // Lấy thông tin test catalog
  getTestCatalog: async (catalogId) => {
    const response = await api.get(`testorder/api/TestCatalog/${catalogId}`);
    return response;
  },

  // Lấy thông tin test bundle
  getTestBundle: async (bundleId) => {
    const response = await api.get(`testorder/api/TestBundle/${bundleId}`);
    return response;
  },

  // Tạo VNPay URL
  createVnPayUrl: async (bookingId, amount) => {
    const response = await api.post(`testorder/api/Payment/vnpay-url`, {
      bookingId,
      amount,
    });
    return response;
  },

  // Lấy thông tin số lượng booking của các appointment slots
  getAppointmentSlotCounts: async () => {
    const response = await api.get(
      `testorder/api/AppointmentSlot/count-all?pageNumber=1&pageSize=10000`
    );
    return response;
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
