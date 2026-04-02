import apiClient from './api.client';

/**
 * Lay danh sach thanh toan.
 * @param {object} params
 * @returns {Promise<object>}
 */
export const getPayments = async (params = {}) => {
  const { data } = await apiClient.get('/payments', { params });
  return data.data;
};

/**
 * Lay thong tin thanh toan chi tiet.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getPaymentById = async (id) => {
  const { data } = await apiClient.get(`/payments/${id}`);
  return data.data;
};

/**
 * Tao thanh toan moi.
 * @param {{ bookingId?: string, orderId?: string, paymentMethod: 'MoMo'|'VNPay'|'Cash', amount?: number, gatewayResponse?: string }} paymentData
 * @returns {Promise<object>}
 */
export const createPayment = async (paymentData) => {
  const { data } = await apiClient.post('/payments', paymentData);
  return data.data;
};

/**
 * Tao link thanh toan MoMo.
 * @param {{ bookingId?: string, orderId?: string, fullName?: string }} payload
 * @returns {Promise<{ payUrl: string, paymentId: string }>}
 */
export const createMomoPayment = async (payload) => {
  const { data } = await apiClient.post('/payments/momo/create', payload);
  return data.data;
};

/**
 * Cap nhat trang thai thanh toan.
 * @param {string} id
 * @param {'Pending' | 'Success' | 'Failed'} status
 * @returns {Promise<object>}
 */
export const updatePaymentStatus = async (id, status) => {
  const { data } = await apiClient.patch(`/payments/${id}/status`, { status });
  return data.data;
};
