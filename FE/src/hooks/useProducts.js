import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productService from '../services/product.service';

const QUERY_KEY = ['products'];

export const useProducts = (params = {}, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => productService.getProducts(params),
    ...options,
  });
};

export const useProductDetail = (id, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateProduct = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.createProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

export const useUpdateProduct = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

export const useDeleteProduct = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};
