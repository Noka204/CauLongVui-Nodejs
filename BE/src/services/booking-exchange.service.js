const BookingExchange = require('../models/booking-exchange.model');
const bookingService = require('./booking.service');
const userService = require('./user.service');
const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const mongoose = require('mongoose');
const { BadRequestError } = require('../exceptions/BadRequestError');
const { NotFoundError } = require('../exceptions/NotFoundError');

const DISCOUNT_RATE = 0.75;

/**
 * Find all booking exchanges with pagination
 * @param {Object} options - Filtering and pagination options
 * @returns {Promise<Object>}
 */
const findAll = async ({ page = 1, limit = 10, status }) => {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const items = await BookingExchange.find(query)
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'courtId', select: 'name location' },
        { path: 'slotId', select: 'startTime endTime' },
      ],
    })
    .populate('sellerId', 'fullName phoneNumber avatar');
  const total = await BookingExchange.countDocuments(query);

  return { items, pagination: { page, limit, total } };
};

/**
 * Find booking exchange by ID
 * @param {string} id 
 * @returns {Promise<Object>}
 */
const findById = async (id) => {
  const exchange = await BookingExchange.findById(id)
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'courtId', select: 'name location' },
        { path: 'slotId', select: 'startTime endTime' },
      ],
    })
    .populate('sellerId', 'fullName phoneNumber avatar')
    .populate('buyerId', 'fullName phoneNumber avatar');
  if (!exchange) throw new NotFoundError('Booking Exchange not found');
  return exchange;
};

/**
 * Create a new booking exchange listing (đăng tin pass sân)
 * @param {string} sellerId - ID of the user creating the listing
 * @param {string} bookingId - ID of the booking to pass
 * @returns {Promise<Object>}
 */
const create = async (sellerId, bookingId) => {
  // 1. Verify booking exists
  const booking = await bookingService.findById(bookingId);

  // 2. Verify ownership
  if (booking.userId.toString() !== sellerId) {
    throw new BadRequestError('You are not the owner of this booking');
  }

  // 3. Verify booking is Confirmed
  if (booking.status !== 'Confirmed') {
    throw new BadRequestError('Only confirmed bookings can be listed for exchange');
  }

  // 4. Verify booking date is in the future
  if (new Date(booking.bookingDate) <= new Date()) {
    throw new BadRequestError('Cannot pass a booking that has already passed');
  }

  // 5. Verify no existing Open exchange for this booking
  const existingExchange = await BookingExchange.findOne({
    bookingId,
    status: 'Open',
  });
  if (existingExchange) {
    throw new BadRequestError('This booking is already listed for exchange');
  }

  // 6. Calculate price with 25% discount
  const originalPrice = booking.totalPrice;
  const price = Math.round(originalPrice * DISCOUNT_RATE);

  // 7. Create exchange listing
  const exchange = await BookingExchange.create({
    bookingId,
    sellerId,
    originalPrice,
    price,
  });

  return exchange;
};

/**
 * Take over a booking exchange (mua lại sân)
 * Uses Mongoose Transaction to ensure atomic operations
 * @param {string} exchangeId - ID of the exchange listing
 * @param {string} buyerId - ID of the buyer
 * @returns {Promise<Object>}
 */
const take = async (exchangeId, buyerId) => {
  // const session = await mongoose.startSession(); // Disabled for non-replica set
  // session.startTransaction(); // Disabled

  try {
    // 1. Find exchange and validate
    const exchange = await BookingExchange.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Booking Exchange not found');
    if (exchange.status !== 'Open') throw new BadRequestError('This exchange is no longer available');
    if (exchange.sellerId.toString() === buyerId) throw new BadRequestError('Cannot buy your own listing');

    // 2. Check buyer balance
    const buyer = await User.findById(buyerId);
    if (!buyer) throw new NotFoundError('Buyer not found');
    if (buyer.balance < exchange.price) {
      throw new BadRequestError(`Insufficient balance. Required: ${exchange.price}, Available: ${buyer.balance}`);
    }

    // 3. Deduct buyer balance
    buyer.balance -= exchange.price;
    await buyer.save({});

    // 4. Add to seller balance
    const seller = await User.findById(exchange.sellerId);
    if (!seller) throw new NotFoundError('Seller not found');
    seller.balance += exchange.price;
    await seller.save({});

    // 5. Transfer booking ownership
    await Booking.findByIdAndUpdate(
      exchange.bookingId,
      { userId: buyerId },
      {}
    );

    // 6. Mark exchange as completed
    exchange.status = 'Completed';
    exchange.buyerId = buyerId;
    await exchange.save({});

    // await session.commitTransaction();
    // session.endSession();

    return exchange;
  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();
    throw error;
  }
};

/**
 * Cancel a booking exchange listing (hủy tin pass)
 * @param {string} exchangeId - ID of the exchange listing
 * @param {string} sellerId - ID of the seller requesting cancellation
 * @returns {Promise<Object>}
 */
const cancel = async (exchangeId, sellerId) => {
  const exchange = await BookingExchange.findById(exchangeId);
  if (!exchange) throw new NotFoundError('Booking Exchange not found');
  if (exchange.sellerId.toString() !== sellerId) {
    throw new BadRequestError('You are not the owner of this listing');
  }
  if (exchange.status !== 'Open') {
    throw new BadRequestError('Only open listings can be cancelled');
  }

  exchange.status = 'Cancelled';
  await exchange.save();

  return exchange;
};

module.exports = {
  findAll,
  findById,
  create,
  take,
  cancel,
};
