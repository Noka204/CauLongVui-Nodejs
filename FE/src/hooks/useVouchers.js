import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as voucherService from '../services/voucher.service';

const QUERY_KEY = ['vouchers'];

/**
 * Hook: Lấy danh sách voucher.
 */
export const useVouchers = (params = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => voucherService.getVouchers(params),
  });
};

/**
 * Hook: Tạo voucher mới.
 */
export const useCreateVoucher = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voucherService.createVoucher,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Cập nhật voucher.
 */
export const useUpdateVoucher = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => voucherService.updateVoucher(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Xóa voucher.
 */
export const useDeleteVoucher = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voucherService.deleteVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.();
    },
    onError: options.onError,
  });
};
