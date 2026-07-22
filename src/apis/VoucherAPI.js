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
      return response.data || [];
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
};

export default VoucherAPI;
