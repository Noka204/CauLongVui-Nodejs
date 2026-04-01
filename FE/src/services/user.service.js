import apiClient from './api.client';

/**
 * Lấy danh sách toàn bộ người dùng.
 * @returns {Promise<object>} { items, pagination }
 */
export const getUsers = async (params = {}) => {
  const { data } = await apiClient.get('/users', { params });
  return data.data;
};

/**
 * Lấy thông tin chi tiết người dùng.
 * @param {string} id - User ObjectId
 * @returns {Promise<object>} UserDTO
 */
export const getUserById = async (id) => {
  const { data } = await apiClient.get(`/users/${id}`);
  return data.data;
};

/**
 * Tạo người dùng mới.
 * @param {{ fullName: string, phoneNumber: string, email?: string, password: string, roleId: string }} userData
 * @returns {Promise<object>} UserDTO
 */
export const createUser = async (userData) => {
  const { data } = await apiClient.post('/users', userData);
  return data.data;
};

/**
 * Cập nhật thông tin người dùng.
 * @param {string} id
 * @param {object} userData - Partial UserDTO fields
 * @returns {Promise<object>} UserDTO
 */
export const updateUser = async (id, userData) => {
  const { data } = await apiClient.patch(`/users/${id}`, userData);
  return data.data;
};

/**
 * Xóa người dùng.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const deleteUser = async (id) => {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data.data;
};
