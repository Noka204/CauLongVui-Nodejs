import apiClient from './api.client';

/**
 * Lay danh sach san pham.
 * @param {object} params
 * @returns {Promise<{ items: object[], pagination: object }>}
 */
export const getProducts = async (params = {}) => {
  const { data } = await apiClient.get('/products', { params });
  return data.data;
};

/**
 * Lay chi tiet san pham.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const getProductById = async (id) => {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
};

/**
 * Tao san pham.
 * @param {{ name: string, price: number, stockQuantity: number, type: 'Food'|'Drink'|'Equipment', image?: string|null, status?: 'Active'|'Inactive' }} payload
 * @returns {Promise<object>}
 */
export const createProduct = async (payload) => {
  const { data } = await apiClient.post('/products', payload);
  return data.data;
};

/**
 * Cap nhat san pham.
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const updateProduct = async (id, payload) => {
  const { data } = await apiClient.put(`/products/${id}`, payload);
  return data.data;
};

/**
 * Xoa mem san pham (Inactive).
 * @param {string} id
 * @returns {Promise<object>}
 */
export const deleteProduct = async (id) => {
  const { data } = await apiClient.delete(`/products/${id}`);
  return data.data;
};
