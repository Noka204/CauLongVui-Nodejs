import apiClient from './api.client';

/**
 * Đăng nhập bằng số điện thoại và mật khẩu.
 * @param {{ phoneNumber: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 */
export const login = async (credentials) => {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data.data;
};

/**
 * Đăng ký tài khoản mới.
 * @param {{ fullName: string, phoneNumber: string, email?: string, password: string, roleId: string }} userData
 * @returns {Promise<object>} UserDTO
 */
export const register = async (userData) => {
  const { data } = await apiClient.post('/auth/register', userData);
  return data.data;
};

/**
 * Đăng xuất (phía client xóa token).
 * @returns {Promise<void>}
 */
export const logout = async () => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Gửi OTP về Gmail.
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const sendOtp = async (email) => {
  const { data } = await apiClient.post('/auth/send-otp', { email });
  return data;
};

/**
 * Xác thực OTP và Đăng ký.
 * @param {object} userData
 * @returns {Promise<object>} UserDTO
 */
export const verifyOtp = async (userData) => {
  const { data } = await apiClient.post('/auth/verify-otp', userData);
  return data.data;
};

/**
 * Đăng nhập bằng Gmail và mật khẩu.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 */
export const loginWithEmail = async (credentials) => {
  const { data } = await apiClient.post('/auth/login-email', credentials);
  return data.data;
};
