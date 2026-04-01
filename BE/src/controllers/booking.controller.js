const bookingService = require('../services/booking.service');
const { sendResponse } = require('../utils/response');

const { bookingDto } = require('../dtos/booking.dto');

const createBooking = async (req, res) => {
  // Lấy userId từ token (req.user) nếu có Auth middleware, 
  // hoặc từ body (req.body.userId) dùng tạm cho test Postman
  const userId = req.user?.id || req.body.userId;
  
  if (!userId) {
    return sendResponse(res, 400, false, 'User ID is required (Please provide in Auth token or body)');
  }

  const booking = await bookingService.create({ ...req.body, userId });
  return sendResponse(res, 201, true, 'Create booking success', bookingDto(booking));
};

const getBookings = async (req, res) => {
  const data = await bookingService.findAll(req.query, req.user);
  const items = data.items.map(bookingDto);
  return sendResponse(res, 200, true, 'Get bookings success', { ...data, items });
};

const getBookedSlotsByCourtAndDate = async (req, res) => {
  const data = await bookingService.findBookedSlotsByCourtDate(req.query);
  return sendResponse(res, 200, true, 'Get booked slots success', data);
};

const getBookingById = async (req, res) => {
  const booking = await bookingService.findById(req.params.id, req.user);
  return sendResponse(res, 200, true, 'Get booking detail success', bookingDto(booking));
};

const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const booking = await bookingService.updateStatus(req.params.id, status);
  return sendResponse(res, 200, true, 'Update booking status success', bookingDto(booking));
};

const updateBooking = async (req, res) => {
  const booking = await bookingService.update(req.params.id, req.body, req.user);
  return sendResponse(res, 200, true, 'Update booking success', bookingDto(booking));
};

const deleteBooking = async (req, res) => {
  await bookingService.remove(req.params.id, req.user);
  return sendResponse(res, 200, true, 'Delete booking success');
};

module.exports = {
  createBooking,
  getBookings,
  getBookedSlotsByCourtAndDate,
  getBookingById,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
};
