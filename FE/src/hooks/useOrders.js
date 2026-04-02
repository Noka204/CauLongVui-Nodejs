import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as orderService from '../services/order.service';

const QUERY_KEY = ['orders'];

export const useOrders = (params = {}, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => orderService.getOrders(params),
    ...options,
  });
};

export const useOrderDetail = (id, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => orderService.getOrderById(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateOrder = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

export const useUpdateOrderStatus = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => orderService.updateOrderStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};
