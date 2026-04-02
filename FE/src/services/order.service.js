import apiClient from './api.client';

/**
 * Lay danh sach food order.
 * @param {object} params
 * @returns {Promise<{ items: object[], pagination: object }>}
 */
export const getOrders = async (params = {}) => {
  const { data } = await apiClient.get('/orders', { params });
  return data.data;
};

/**
 * Lay chi tiet order.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getOrderById = async (id) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data;
};

/**
 * Tao order do an/nuoc.
 * @param {{ customerName: string, bookingId?: string, courtId?: string, items: Array<{ productId: string, quantity: number }> }} payload
 * @returns {Promise<object>}
 */
export const createOrder = async (payload) => {
  const { data } = await apiClient.post('/orders', payload);
  return data.data;
};

/**
 * Cap nhat trang thai order (staff/admin).
 * @param {string} id
 * @param {'Pending'|'Completed'|'Cancelled'} status
 * @returns {Promise<object>}
 */
export const updateOrderStatus = async (id, status) => {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
  return data.data;
};
