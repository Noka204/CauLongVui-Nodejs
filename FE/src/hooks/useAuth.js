import { useMutation } from '@tanstack/react-query';
import * as authService from '../services/auth.service';

/**
 * Hook: Đăng nhập.
 * Sau khi thành công → lưu token vào localStorage.
 * @param {object} options - TanStack Query mutation options
 */
export const useLogin = (options = {}) => {
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data?.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Đăng ký.
 * @param {object} options
 */
export const useRegister = (options = {}) => {
  return useMutation({
    mutationFn: authService.register,
    ...options,
  });
};

/**
 * Hook: Đăng xuất.
 * @param {object} options
 */
export const useLogout = (options = {}) => {
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      options.onSuccess?.();
    },
    ...options,
  });
};
