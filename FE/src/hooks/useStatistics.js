import { useQuery } from '@tanstack/react-query';
import * as statisticsService from '../services/statistics.service';

export const useOverview = () => {
  return useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: statisticsService.getOverview,
  });
};

export const useRevenueByMonth = (year) => {
  return useQuery({
    queryKey: ['statistics', 'revenue', year],
    queryFn: () => statisticsService.getRevenueByMonth(year),
  });
};

export const useTopCourts = (limit = 5) => {
  return useQuery({
    queryKey: ['statistics', 'top-courts', limit],
    queryFn: () => statisticsService.getTopCourts(limit),
  });
};

export const useBookingStatusDistribution = () => {
  return useQuery({
    queryKey: ['statistics', 'booking-status'],
    queryFn: statisticsService.getBookingStatusDistribution,
  });
};
