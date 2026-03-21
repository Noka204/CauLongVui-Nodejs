const Booking = require('../models/booking.model');
const Payment = require('../models/payment.model');
const PendingExpiry = require('../models/pending-expiry.model');
const timeSlotService = require('./time-slot.service');
const voucherService = require('./voucher.service');
const courtService = require('./court.service');
const userService = require('./user.service');
const { BadRequestError } = require('../exceptions/BadRequestError');
const { ForbiddenError } = require('../exceptions/ForbiddenError');

const BOOKING_EXPIRY_MINUTES = 10;

/**
 * Create a new booking
 * @param {Object} bookingData 
 * @returns {Promise<Object>}
 */
const create = async (bookingData) => {
  // Verify related entities exist (Foreign Key checks)
  await courtService.findById(bookingData.courtId);
  await userService.findById(bookingData.userId);

  // Realtime Double-Booking Check
  const inputDate = new Date(bookingData.bookingDate);
  const startOfDay = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate(), 23, 59, 59, 999));

  const existingBooking = await Booking.findOne({
    courtId: bookingData.courtId,
    slotId: bookingData.slotId,
    bookingDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'Cancelled' },
  });

  if (existingBooking) {
    throw new BadRequestError('This slot is already booked for this court and date');
  }

  // Chuẩn hóa giờ lưu vào DB luôn là 00:00:00 UTC của ngày đó
  bookingData.bookingDate = startOfDay;

  // Calculate Price Server-side (SECURITY: Không tin tưởng client)
  const slot = await timeSlotService.findById(bookingData.slotId);
  let totalPrice = slot.price;
  let discountAmount = 0;

  if (bookingData.voucherId) {
    const voucher = await voucherService.findById(bookingData.voucherId);
    if (!voucher.isActive) throw new BadRequestError('Voucher is not active');
    
    // Calculate valid discount
    if (voucher.discountType === 'Percentage') {
      discountAmount = (totalPrice * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else if (voucher.discountType === 'FixedAmount') {
      discountAmount = voucher.discountValue;
    }
    
    totalPrice -= discountAmount;
    if (totalPrice < 0) totalPrice = 0;
  }

  bookingData.totalPrice = totalPrice;
  bookingData.discountAmount = discountAmount;

  const booking = await Booking.create(bookingData);

  // Tạo PendingExpiry → MongoDB TTL sẽ tự xóa sau 10 phút
  // Khi xóa → Change Stream bắt event → auto-cancel booking
  const expireAt = new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000);
  await PendingExpiry.create({ bookingId: booking._id, expireAt });

  // Socket emit sẽ được xử lý bởi Change Stream watcher (không cần emit thủ công)

  return booking;
};

/**
 * Find all bookings
 * @param {Object} query 
 * @param {Object} user 
 * @returns {Promise<Object>}
 */
const findAll = async (query = {}, user) => {
  const { page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;
  
  // Filter by user unless Admin
  const filter = {};
  if (user && user.roleName !== 'Admin') {
    filter.userId = user.id;
  }

  const items = await Booking.find(filter).skip(skip).limit(limit);
  const total = await Booking.countDocuments(filter);
  return { items, pagination: { page, limit, total } };
};

/**
 * Find booking by ID
 * @param {string} id 
 * @param {Object} user 
 * @returns {Promise<Object>}
 */
const findById = async (id, user) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new BadRequestError('Booking not found');
  
  if (user && user.roleName !== 'Admin' && booking.userId.toString() !== user.id) {
    throw new ForbiddenError('You are not authorized to access this booking');
  }

  return booking;
};

/**
 * Update booking status
 * @param {string} id 
 * @param {string} status 
 * @returns {Promise<Object>}
 */
const updateStatus = async (id, status) => {
  const booking = await Booking.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
  if (!booking) throw new BadRequestError('Booking not found');

  // Nếu Confirmed → xóa PendingExpiry (không cần auto-cancel nữa)
  if (status === 'Confirmed') {
    await PendingExpiry.deleteOne({ bookingId: id });
  }

  // Socket emit sẽ được xử lý bởi Change Stream watcher
  return booking;
};

/**
 * Update booking information
 * @param {string} id 
 * @param {Object} updateData 
 * @param {Object} user 
 * @returns {Promise<Object>}
 */
const update = async (id, updateData, user) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new BadRequestError('Booking not found');

  if (user && user.roleName !== 'Admin' && booking.userId.toString() !== user.id) {
    throw new ForbiddenError('You are not authorized to update this booking');
  }

  const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true });
  return updatedBooking;
};

/**
 * Soft delete booking (kiểm tra ràng buộc trước khi xóa)
 * @param {string} id 
 * @param {Object} user
 * @returns {Promise<void>}
 */
const remove = async (id, user) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new BadRequestError('Booking not found');

  if (user && user.roleName !== 'Admin' && booking.userId.toString() !== user.id) {
    throw new ForbiddenError('You are not authorized to delete this booking');
  }

  // Không cho xóa nếu đã thanh toán thành công
  const hasPaidPayment = await Payment.countDocuments({
    bookingId: id,
    status: 'Success',
  });
  if (hasPaidPayment > 0) {
    throw new BadRequestError('Cannot delete booking: payment has been completed. Please cancel instead.');
  }

  // Soft delete → chuyển trạng thái sang Cancelled
  booking.status = 'Cancelled';
  await booking.save();

  // Xóa PendingExpiry nếu còn
  await PendingExpiry.deleteOne({ bookingId: id });

  // Socket emit sẽ được xử lý bởi Change Stream watcher
};

module.exports = {
  create,
  findAll,
  findById,
  updateStatus,
  update,
  remove,
};

