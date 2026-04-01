import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as timeSlotService from '../services/time-slot.service';

const QUERY_KEY = ['time-slots'];

export const useTimeSlots = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: timeSlotService.getTimeSlots,
  });
};

export const useTimeSlotDetail = (id) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => timeSlotService.getTimeSlotById(id),
    enabled: !!id,
  });
};

export const useCreateTimeSlot = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: timeSlotService.createTimeSlot,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

export const useUpdateTimeSlot = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => timeSlotService.updateTimeSlot(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

export const useDeleteTimeSlot = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: timeSlotService.deleteTimeSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      options.onSuccess?.();
    },
    onError: options.onError,
  });
};
