import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as bookingService from '../services/booking.service';

const QUERY_KEY = ['bookings'];

/**
 * Hook: Get booking list
 */
export const useBookings = (params = {}, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => bookingService.getBookings(params),
    ...options,
  });
};

/**
 * Hook: Get booking detail
 */
export const useBookingDetail = (id, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook: Get booked slots by court and date
 */
export const useBookingAvailability = (courtId, bookingDate) => {
  return useQuery({
    queryKey: ['booking-availability', courtId, bookingDate],
    queryFn: () => bookingService.getBookedSlotsAvailability(courtId, bookingDate),
    enabled: !!courtId && !!bookingDate,
  });
};

/**
 * Hook: Create booking
 */
export const useCreateBooking = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booking-availability'] });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Update booking
 */
export const useUpdateBooking = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bookingService.updateBooking(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booking-availability'] });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Update booking status
 */
export const useUpdateBookingStatus = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => bookingService.updateBookingStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booking-availability'] });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

/**
 * Hook: Delete booking
 */
export const useDeleteBooking = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['booking-availability'] });
      options.onSuccess?.();
    },
    onError: options.onError,
  });
};
