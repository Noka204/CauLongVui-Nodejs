import apiClient from './api.client';

/**
 * Lấy danh sách voucher.
 * @returns {Promise<object>}
 */
export const getVouchers = async (params = {}) => {
  const { data } = await apiClient.get('/vouchers', { params });
  return data.data;
};

/**
 * Lấy thông tin voucher chi tiết.
 * @param {string} id
 * @returns {Promise<object>} VoucherDTO
 */
export const getVoucherById = async (id) => {
  const { data } = await apiClient.get(`/vouchers/${id}`);
  return data.data;
};

/**
 * Tạo voucher mới.
 * @param {{ voucherCode: string, discountType: 'Percentage'|'FixedAmount', discountValue: number, startDate: string, endDate: string, ... }} voucherData
 * @returns {Promise<object>} VoucherDTO
 */
export const createVoucher = async (voucherData) => {
  const { data } = await apiClient.post('/vouchers', voucherData);
  return data.data;
};

/**
 * Cập nhật voucher.
 * @param {string} id
 * @param {object} voucherData - Partial fields
 * @returns {Promise<object>} VoucherDTO
 */
export const updateVoucher = async (id, voucherData) => {
  const { data } = await apiClient.put(`/vouchers/${id}`, voucherData);
  return data.data;
};

/**
 * Xóa voucher.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const deleteVoucher = async (id) => {
  const { data } = await apiClient.delete(`/vouchers/${id}`);
  return data.data;
};
