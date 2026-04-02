const Payment = require('../models/payment.model');
const Booking = require('../models/booking.model');
const PendingExpiry = require('../models/pending-expiry.model');
const mongoose = require('mongoose');
const bookingService = require('./booking.service');
const orderService = require('./order.service');
const userService = require('./user.service');
const vnpayService = require('./external/vnpay.service');
const momoService = require('./external/momo.service');
const VnPayLibrary = require('../utils/vnpay.lib');
const { BadRequestError } = require('../exceptions/BadRequestError');
const { ForbiddenError } = require('../exceptions/ForbiddenError');
const emailService = require('./external/email.service');

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const buildUserContext = (userId, roleName) => ({ id: userId, roleName: roleName || 'User' });

const assertExactlyOneTarget = ({ bookingId, orderId }) => {
  if (Boolean(bookingId) === Boolean(orderId)) {
    throw new BadRequestError('Provide exactly one of bookingId or orderId');
  }
};

const resolvePaymentTarget = async ({ bookingId, orderId, userId, roleName }) => {
  assertExactlyOneTarget({ bookingId, orderId });

  if (bookingId) {
    const booking = await bookingService.findById(bookingId, buildUserContext(userId, roleName));
    return {
      bookingId,
      orderId: null,
      amount: Number(booking.totalPrice || 0),
      orderInfo: `Thanh toan dat san ${bookingId}`,
      kind: 'booking',
    };
  }

  const order = await orderService.findById(orderId, buildUserContext(userId, roleName));

  if (order.status === 'Cancelled') {
    throw new BadRequestError('Cannot pay for a cancelled order');
  }

  return {
    bookingId: null,
    orderId,
    amount: Number(order.totalAmount || 0),
    orderInfo: `Thanh toan don do an ${orderId}`,
    kind: 'order',
  };
};

const runPaymentSideEffectsOnSuccess = async (payment, session) => {
  if (payment.bookingId) {
    await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: 'Confirmed' },
      { session }
    );

    await PendingExpiry.deleteOne({ bookingId: payment.bookingId }, { session });
  }
};

const sendBookingConfirmationEmailIfNeeded = async (payment) => {
  if (!payment.bookingId) return;

  try {
    const user = await userService.findById(payment.userId);
    const booking = await bookingService.findById(payment.bookingId);
    if (user && user.email) {
      booking.customerName = user.fullName;
      await emailService.sendBookingConfirmationEmail(user.email, booking, { name: 'He thong Cau Long Vui' });
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

/**
 * Create a new payment record
 * @param {Object} paymentData
 * @returns {Promise<Object>}
 */
const create = async (paymentData) => {
  const { bookingId, orderId, userId, roleName, paymentMethod, gatewayResponse, amount: clientAmount } = paymentData;

  await userService.findById(userId);
  const target = await resolvePaymentTarget({ bookingId, orderId, userId, roleName });

  if (Number.isFinite(clientAmount) && Number(clientAmount) !== target.amount) {
    throw new BadRequestError('Amount mismatch with server calculated amount');
  }

  if (paymentMethod === 'VNPay' && target.kind === 'order') {
    throw new BadRequestError('VNPay is currently only available for court booking');
  }

  return Payment.create({
    bookingId: target.bookingId,
    orderId: target.orderId,
    userId,
    amount: target.amount,
    paymentMethod,
    gatewayResponse: gatewayResponse || null,
  });
};

/**
 * Find all payments with pagination and optional filters
 * @param {Object} query
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const findAll = async (query = {}, user) => {
  const page = toPositiveInteger(query.page, 1);
  const limit = toPositiveInteger(query.limit, 10);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.bookingId) filter.bookingId = query.bookingId;
  if (query.orderId) filter.orderId = query.orderId;

  if (user && user.roleName !== 'Admin') {
    filter.userId = user.id;
  }

  const items = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(id).session(session);
    if (!payment) throw new BadRequestError('Payment record not found');

    payment.status = status;
    await payment.save({ session });

    if (status === 'Success') {
      await runPaymentSideEffectsOnSuccess(payment, session);
    }

    await session.commitTransaction();
    session.endSession();

    return payment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ------------------------- VNPay integration -------------------------

/**
 * Create VNPay payment: save Pending record then generate VNPay URL
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {string} params.userId
 * @param {import('express').Request} params.req
 * @returns {Promise<{ paymentUrl: string, paymentId: string }>}
 */
const createVnpayPayment = async ({ bookingId, userId, req }) => {
  const booking = await bookingService.findById(bookingId, buildUserContext(userId, 'User'));
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
 * Handle VNPay return/IPN callback
 * @param {Object} query
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

  if (result.amount && result.amount !== payment.amount) {
    payment.status = 'Failed';
    payment.gatewayResponse = JSON.stringify({ ...query, error: 'Amount mismatch' });
    await payment.save();
    return { isSuccess: false, paymentId: payment._id.toString(), amount: result.amount, message: 'Amount mismatch' };
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    payment.status = 'Success';
    payment.transactionRef = result.transactionId || null;
    payment.gatewayResponse = JSON.stringify(query);
    await payment.save({ session });

    await runPaymentSideEffectsOnSuccess(payment, session);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  await sendBookingConfirmationEmailIfNeeded(payment);

  return { isSuccess: true, paymentId: payment._id.toString(), amount: result.amount, message: 'VNPay payment success' };
};

// ------------------------- MoMo integration -------------------------

/**
 * Create MoMo payment: save Pending record then call MoMo API and return payUrl
 * @param {Object} params
 * @param {string} [params.bookingId]
 * @param {string} [params.orderId]
 * @param {string} params.userId
 * @param {string} [params.roleName]
 * @param {string} [params.fullName]
 * @returns {Promise<{ payUrl: string|null, paymentId: string }>}
 */
const createMomoPayment = async ({ bookingId, orderId, userId, roleName, fullName }) => {
  const user = await userService.findById(userId);
  const target = await resolvePaymentTarget({ bookingId, orderId, userId, roleName });

  const payment = await Payment.create({
    bookingId: target.bookingId,
    orderId: target.orderId,
    userId,
    amount: target.amount,
    paymentMethod: 'MoMo',
    status: 'Pending',
  });

  const customerName = fullName || user.fullName || 'Khach hang';

  const momoResult = await momoService.createPayment({
    orderId: payment._id.toString(),
    amount: target.amount,
    orderInfo: target.orderInfo,
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
 * Handle MoMo callback
 * @param {Object} query
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

    await runPaymentSideEffectsOnSuccess(payment, session);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  await sendBookingConfirmationEmailIfNeeded(payment);

  return { isSuccess: true, paymentId: payment._id.toString(), amount: result.amount, message: 'MoMo payment success' };
};

/**
 * Handle MoMo IPN (notify)
 * @param {Object} body
 * @returns {Promise<{ isSuccess: boolean, message: string }>}
 */
const handleMomoIpn = async (body) => {
  const isValidSignature = momoService.verifyIpnSignature(body);
  if (!isValidSignature) {
    return { isSuccess: false, message: 'Invalid signature' };
  }

  if (body.resultCode !== 0) {
    return { isSuccess: false, message: `MoMo resultCode: ${body.resultCode}` };
  }

  const confirmResult = await momoService.confirmOrder(body);
  if (!confirmResult.isSuccess) {
    return { isSuccess: false, message: 'MoMo confirm failed' };
  }

  const internalOrderId = momoService.extractInternalOrderId(body);
  if (!internalOrderId) {
    return { isSuccess: false, message: 'Cannot extract internal order ID' };
  }

  const payment = await Payment.findById(internalOrderId);
  if (!payment) {
    return { isSuccess: false, message: 'Payment not found' };
  }

  if (payment.status === 'Success') {
    return { isSuccess: true, message: 'Already settled' };
  }

  if (confirmResult.amount && confirmResult.amount !== payment.amount) {
    payment.status = 'Failed';
    payment.gatewayResponse = JSON.stringify({ ...body, error: 'Amount mismatch' });
    await payment.save();
    return { isSuccess: false, message: 'Amount mismatch' };
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    payment.status = 'Success';
    payment.transactionRef = body.orderId || null;
    payment.gatewayResponse = JSON.stringify(body);
    await payment.save({ session });

    await runPaymentSideEffectsOnSuccess(payment, session);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  await sendBookingConfirmationEmailIfNeeded(payment);

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
