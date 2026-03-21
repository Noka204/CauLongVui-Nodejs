const Payment = require('../models/payment.model');
const Booking = require('../models/booking.model');
const PendingExpiry = require('../models/pending-expiry.model');
const mongoose = require('mongoose');
const bookingService = require('./booking.service');
const userService = require('./user.service');
const vnpayService = require('./external/vnpay.service');
const momoService = require('./external/momo.service');
const VnPayLibrary = require('../utils/vnpay.lib');
const { BadRequestError } = require('../exceptions/BadRequestError');
const { ForbiddenError } = require('../exceptions/ForbiddenError');

/**
 * Create a new payment record
 * @param {Object} paymentData
 * @returns {Promise<Object>}
 */
const create = async (paymentData) => {
  await bookingService.findById(paymentData.bookingId);
  await userService.findById(paymentData.userId);

  return await Payment.create(paymentData);
};

/**
 * Find all payments with pagination
 * @param {Object} query
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const findAll = async (query = {}, user) => {
  const { page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (user && user.roleName !== 'Admin') {
    filter.userId = user.id;
  }

  const items = await Payment.find(filter).skip(skip).limit(limit);
  const total = await Payment.countDocuments(filter);
  return { items, pagination: { page, limit, total } };
};

/**
 * Find payment by ID
 * @param {string} id
 * @param {Object} user 
 * @returns {Promise<Object>}
 */
const findById = async (id, user) => {
  const payment = await Payment.findById(id);
  if (!payment) throw new BadRequestError('Payment record not found');
  
  if (user && user.roleName !== 'Admin' && payment.userId.toString() !== user.id) {
    throw new ForbiddenError('You are not authorized to access this payment');
  }

  return payment;
};

/**
 * Update payment status
 * @param {string} id
 * @param {string} status
 * @returns {Promise<Object>}
 */
const updateStatus = async (id, status) => {
  const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
  if (!payment) throw new BadRequestError('Payment record not found');
  return payment;
};

// ─── VNPay Integration ────────────────────────────────────────────────

/**
 * Create VNPay payment: save Pending record → generate VNPay URL
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {string} params.userId
 * @param {import('express').Request} params.req - Express request for IP
 * @returns {Promise<{ paymentUrl: string, paymentId: string }>}
 */
const createVnpayPayment = async ({ bookingId, userId, req }) => {
  const booking = await bookingService.findById(bookingId);
  await userService.findById(userId);

  const payment = await Payment.create({
    bookingId,
    userId,
    amount: booking.totalPrice,
    paymentMethod: 'VNPay',
    status: 'Pending',
  });

  const ipAddress = VnPayLibrary.getIpAddress(req);

  const paymentUrl = vnpayService.createPaymentUrl({
    orderId: payment._id.toString(),
    amount: booking.totalPrice,
    orderDescription: `Thanh toan dat san ${bookingId}`,
    ipAddress,
  });

  return { paymentUrl, paymentId: payment._id.toString() };
};

/**
 * Handle VNPay return/IPN callback: verify → update Payment + Booking atomically
 * Uses Mongoose Transaction to ensure data consistency
 * @param {Object} query - Express req.query from VNPay callback
 * @returns {Promise<{ isSuccess: boolean, paymentId: string|null, amount: number|null, message: string }>}
 */
const handleVnpayCallback = async (query) => {
  const result = vnpayService.verifyReturnUrl(query);

  if (!result.orderId) {
    return { isSuccess: false, paymentId: null, amount: null, message: 'Missing order reference' };
  }

  const payment = await Payment.findById(result.orderId);
  if (!payment) {
    return { isSuccess: false, paymentId: result.orderId, amount: result.amount, message: 'Payment not found' };
  }

  // Idempotent: skip if already settled
  if (payment.status === 'Success') {
    return { isSuccess: true, paymentId: payment._id.toString(), amount: result.amount, message: 'Already settled' };
  }

  if (!result.isSuccess) {
    payment.status = 'Failed';
    payment.transactionRef = result.transactionId || null;
    payment.gatewayResponse = JSON.stringify(query);
    await payment.save();
    return { isSuccess: false, paymentId: payment._id.toString(), amount: result.amount, message: 'VNPay payment failed' };
  }

  // Success: update payment + booking atomically
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    payment.status = 'Success';
    payment.transactionRef = result.transactionId || null;
    payment.gatewayResponse = JSON.stringify(query);
    if (result.amount && result.amount > 0) {
      payment.amount = result.amount;
    }
    await payment.save({ session });

    await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: 'Confirmed' },
      { session }
    );

    await PendingExpiry.deleteOne({ bookingId: payment.bookingId }, { session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  return { isSuccess: true, paymentId: payment._id.toString(), amount: result.amount, message: 'VNPay payment success' };
};

// ─── MoMo Integration ─────────────────────────────────────────────────

/**
 * Create MoMo payment: save Pending record → call MoMo API → return payUrl
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {string} params.userId
 * @param {string} [params.fullName]
 * @returns {Promise<{ payUrl: string|null, paymentId: string }>}
 */
const createMomoPayment = async ({ bookingId, userId, fullName }) => {
  const booking = await bookingService.findById(bookingId);
  const user = await userService.findById(userId);

  const payment = await Payment.create({
    bookingId,
    userId,
    amount: booking.totalPrice,
    paymentMethod: 'MoMo',
    status: 'Pending',
  });

  const customerName = fullName || user.fullName || 'Khách hàng';

  const momoResult = await momoService.createPayment({
    orderId: payment._id.toString(),
    amount: booking.totalPrice,
    orderInfo: `Thanh toan dat san ${bookingId}`,
    fullName: customerName,
  });

  if (!momoResult.payUrl) {
    payment.status = 'Failed';
    payment.gatewayResponse = JSON.stringify(momoResult);
    await payment.save();
    throw new BadRequestError('Cannot create MoMo payment URL');
  }

  payment.transactionRef = momoResult.momoOrderId;
  payment.gatewayResponse = JSON.stringify(momoResult);
  await payment.save();

  return { payUrl: momoResult.payUrl, paymentId: payment._id.toString() };
};

/**
 * Handle MoMo callback: parse query → update Payment + Booking atomically
 * Uses Mongoose Transaction to ensure data consistency
 * @param {Object} query - Express req.query from MoMo redirect
 * @returns {Promise<{ isSuccess: boolean, paymentId: string|null, amount: string, message: string }>}
 */
const handleMomoCallback = async (query) => {
  const result = momoService.verifyCallback(query);

  if (!result.internalOrderId) {
    return { isSuccess: false, paymentId: null, amount: result.amount, message: 'Cannot extract internal order ID' };
  }

  const payment = await Payment.findById(result.internalOrderId);
  if (!payment) {
    return { isSuccess: false, paymentId: result.internalOrderId, amount: result.amount, message: 'Payment not found' };
  }

  // Idempotent
  if (payment.status === 'Success') {
    return { isSuccess: true, paymentId: payment._id.toString(), amount: result.amount, message: 'Already settled' };
  }

  const resultCode = query.resultCode ? Number(query.resultCode) : -1;
  const isMomoSuccess = resultCode === 0;

  if (!isMomoSuccess) {
    payment.status = 'Failed';
    payment.gatewayResponse = JSON.stringify(query);
    await payment.save();
    return { isSuccess: false, paymentId: payment._id.toString(), amount: result.amount, message: 'MoMo payment failed' };
  }

  // Success: update payment + booking atomically
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    payment.status = 'Success';
    payment.transactionRef = result.momoOrderId;
    payment.gatewayResponse = JSON.stringify(query);
    if (result.amount) {
      payment.amount = Number(result.amount);
    }
    await payment.save({ session });

    await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: 'Confirmed' },
      { session }
    );

    await PendingExpiry.deleteOne({ bookingId: payment.bookingId }, { session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  return { isSuccess: true, paymentId: payment._id.toString(), amount: result.amount, message: 'MoMo payment success' };
};

/**
 * Handle MoMo IPN (notify): verify signature → confirm → update DB atomically
 * Uses Mongoose Transaction to ensure data consistency
 * @param {Object} body - MoMo IPN request body
 * @returns {Promise<{ isSuccess: boolean, message: string }>}
 */
const handleMomoIpn = async (body) => {
  const isValidSignature = momoService.verifyIpnSignature(body);
  if (!isValidSignature) {
    return { isSuccess: false, message: 'Invalid signature' };
  }

  // Only process successful payments
  if (body.resultCode !== 0) {
    return { isSuccess: false, message: `MoMo resultCode: ${body.resultCode}` };
  }

  // Confirm with MoMo query API
  const confirmResult = await momoService.confirmOrder(body);
  if (!confirmResult.isSuccess) {
    return { isSuccess: false, message: 'MoMo confirm failed' };
  }

  // Extract internal order ID
  const internalOrderId = momoService.extractInternalOrderId(body);
  if (!internalOrderId) {
    return { isSuccess: false, message: 'Cannot extract internal order ID' };
  }

  const payment = await Payment.findById(internalOrderId);
  if (!payment) {
    return { isSuccess: false, message: 'Payment not found' };
  }

  // Idempotent
  if (payment.status === 'Success') {
    return { isSuccess: true, message: 'Already settled' };
  }

  // Success: update payment + booking atomically
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    payment.status = 'Success';
    payment.transactionRef = body.orderId || null;
    payment.gatewayResponse = JSON.stringify(body);
    if (confirmResult.amount && confirmResult.amount > 0) {
      payment.amount = confirmResult.amount;
    }
    await payment.save({ session });

    await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: 'Confirmed' },
      { session }
    );

    await PendingExpiry.deleteOne({ bookingId: payment.bookingId }, { session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  return { isSuccess: true, message: 'MoMo IPN processed' };
};

module.exports = {
  create,
  findAll,
  findById,
  updateStatus,
  createVnpayPayment,
  handleVnpayCallback,
  createMomoPayment,
  handleMomoCallback,
  handleMomoIpn,
};
