import apiClient from './api.client';

export const getOverview = async () => {
  const { data } = await apiClient.get('/statistics/overview');
  return data.data;
};

export const getRevenueByMonth = async (year) => {
  const { data } = await apiClient.get('/statistics/revenue', {
    params: year ? { year } : undefined,
  });
  return data.data;
};

export const getTopCourts = async (limit = 5) => {
  const { data } = await apiClient.get('/statistics/top-courts', {
    params: { limit },
  });
  return data.data;
};

export const getBookingStatusDistribution = async () => {
  const { data } = await apiClient.get('/statistics/booking-status');
  return data.data;
};
