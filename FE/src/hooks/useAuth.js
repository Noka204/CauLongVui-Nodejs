import { useMutation } from '@tanstack/react-query';
import * as authService from '../services/auth.service';
import { buildUserWithRoleFromToken } from '../utils/auth.utils';

/**
 * Hook: Đăng nhập.
 * Sau khi thành công → lưu token vào localStorage.
 * @param {object} options - TanStack Query mutation options
 */
export const useLogin = (options = {}) => {
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      const accessToken = data?.tokens?.accessToken || data?.token;
      if (accessToken) {
        localStorage.setItem('token', accessToken);
        if (data.user) {
          const userWithRole = buildUserWithRoleFromToken(data.user, accessToken);
          localStorage.setItem('user', JSON.stringify(userWithRole));
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
