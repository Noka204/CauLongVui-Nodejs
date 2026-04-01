import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as courtService from '../services/court.service';

const QUERY_KEY = ['courts'];

/**
 * Hook: Lấy danh sách sân đấu.
 * Trả về { data, isLoading, isError, error, refetch }.
 */
export const useCourts = (params = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => courtService.getCourts(params),
  });
};

/**
 * Hook: Lấy chi tiết sân đấu.
 * @param {string} id
 */
export const useCourtDetail = (id) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => courtService.getCourtById(id),
    enabled: !!id,
  });
};

/**
 * Hook: Tạo sân đấu mới (hỗ trợ FormData).
 * Sau khi thành công → invalidate danh sách sân.
 */
export const useCreateCourt = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courtService.createCourt,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Cập nhật sân đấu.
 * @param {object} options
 */
export const useUpdateCourt = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => courtService.updateCourt(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Xóa sân đấu (Soft Delete).
 */
export const useDeleteCourt = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courtService.deleteCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.();
    },
    onError: options.onError,
  });
};
