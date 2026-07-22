import api, { publicApi } from "../configs/axios";

/**
 * Voucher API Service
 * Handles fetching vouchers and validating discount codes
 */
const VoucherAPI = {
  /**
   * Get all active vouchers
   * @param {number} pageNumber
   * @param {number} pageSize
   * @returns {Promise<Array>} List of voucher DTOs
   */
  getAllVouchers: async (pageNumber = 1, pageSize = 100) => {
    try {
      const response = await publicApi.get(
        `testorder/api/vouchers?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      const resData = response.data;
      if (Array.isArray(resData)) return resData;
      if (resData && Array.isArray(resData.data)) return resData.data;
      if (resData && Array.isArray(resData.items)) return resData.items;
      if (resData && Array.isArray(resData.result)) return resData.result;
      return [];
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      return [];
    }
  },

  /**
   * Get voucher details by ID
   * @param {number} id
   * @returns {Promise<Object>} Voucher DTO
   */
  getVoucherById: async (id) => {
    try {
      const response = await publicApi.get(`testorder/api/vouchers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching voucher ${id}:`, error);
      throw error;
    }
  },

  /**
   * Validate and calculate discount for a voucher code
   * @param {string} code - Voucher code
   * @param {number} orderValue - Current order total amount
   * @returns {Promise<Object>} { isValid, message, discountAmount, finalAmount }
   */
  validateVoucher: async (code, orderValue) => {
    try {
      const response = await publicApi.post("testorder/api/vouchers/validate", {
        code,
        orderValue,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      return {
        isValid: false,
        message: "Không thể xác thực mã giảm giá. Vui lòng thử lại sau.",
        discountAmount: 0,
        finalAmount: orderValue,
      };
    }
  },

  /**
   * Create a new voucher (Admin)
   * @param {Object} voucherData
   * @returns {Promise<Object>} Created Voucher DTO
   */
  createVoucher: async (voucherData) => {
    try {
      const response = await api.post("testorder/api/vouchers", voucherData);
      return response.data;
    } catch (error) {
      console.error("Error creating voucher:", error);
      throw error;
    }
  },

  /**
   * Update an existing voucher (Admin)
   * @param {number} id
   * @param {Object} voucherData
   * @returns {Promise<Object>} Updated Voucher DTO
   */
  updateVoucher: async (id, voucherData) => {
    try {
      const response = await api.put(`testorder/api/vouchers/${id}`, voucherData);
      return response.data;
    } catch (error) {
      console.error(`Error updating voucher ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a voucher (Admin)
   * @param {number} id
   * @returns {Promise<boolean>} Success boolean
   */
  deleteVoucher: async (id) => {
    try {
      await api.delete(`testorder/api/vouchers/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting voucher ${id}:`, error);
      throw error;
    }
  },
};

export default VoucherAPI;
