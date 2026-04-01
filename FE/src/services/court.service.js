import apiClient from './api.client';

/**
 * Helper: Chuyển object courtData thành FormData cho multipart/form-data.
 * @param {object} courtData - Dữ liệu sân, images là File[] nếu có.
 * @returns {FormData}
 */
const toFormData = (courtData) => {
  const formData = new FormData();
  Object.entries(courtData).forEach(([key, value]) => {
    if (key === 'images' && Array.isArray(value)) {
      value.forEach((file) => formData.append('images', file));
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
};

/**
 * Lấy danh sách toàn bộ sân đấu.
 * @returns {Promise<object>} { items, pagination }
 */
export const getCourts = async (params = {}) => {
  const { data } = await apiClient.get('/courts', { params });
  return data.data;
};

/**
 * Lấy thông tin chi tiết sân đấu.
 * @param {string} id - Court ObjectId
 * @returns {Promise<object>} CourtDTO
 */
export const getCourtById = async (id) => {
  const { data } = await apiClient.get(`/courts/${id}`);
  return data.data;
};

/**
 * Tạo sân đấu mới (hỗ trợ multi-image upload).
 * @param {object} courtData - { courtName, description?, images?: File[] }
 * @returns {Promise<object>} CourtDTO
 */
export const createCourt = async (courtData) => {
  const formData = toFormData(courtData);
  const { data } = await apiClient.post('/courts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

/**
 * Cập nhật thông tin sân đấu (hỗ trợ thay thế ảnh).
 * @param {string} id - Court ObjectId
 * @param {object} courtData - Partial fields + images?: File[]
 * @returns {Promise<object>} CourtDTO
 */
export const updateCourt = async (id, courtData) => {
  const formData = toFormData(courtData);
  const { data } = await apiClient.put(`/courts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

/**
 * Xóa sân đấu (Soft Delete).
 * @param {string} id - Court ObjectId
 * @returns {Promise<object>}
 */
export const deleteCourt = async (id) => {
  const { data } = await apiClient.delete(`/courts/${id}`);
  return data.data;
};
