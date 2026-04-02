const paymentService = require('../services/payment.service');
const { sendResponse } = require('../utils/response');
const { paymentDto } = require('../dtos/payment.dto');

const createPayment = async (req, res) => {
  const userId = req.user.id;
  const roleName = req.user.roleName;
  const payment = await paymentService.create({ ...req.body, userId, roleName });
  return sendResponse(res, 201, true, 'Payment record created', paymentDto(payment));
};

const getPayments = async (req, res) => {
  const data = await paymentService.findAll(req.query, req.user);
  const items = data.items.map(paymentDto);
  return sendResponse(res, 200, true, 'Get payments success', { ...data, items });
};

const getPaymentById = async (req, res) => {
  const payment = await paymentService.findById(req.params.id, req.user);
  return sendResponse(res, 200, true, 'Get payment detail success', paymentDto(payment));
};

const updatePaymentStatus = async (req, res) => {
  const { status } = req.body;
  const payment = await paymentService.updateStatus(req.params.id, status);
  return sendResponse(res, 200, true, 'Update payment status success', paymentDto(payment));
};

// ------------------------- VNPay handlers -------------------------

const createVnpayPayment = async (req, res) => {
  const userId = req.user.id;
  const { bookingId } = req.body;
  const result = await paymentService.createVnpayPayment({ bookingId, userId, req });
  return sendResponse(res, 201, true, 'VNPay payment URL created', {
    paymentUrl: result.paymentUrl,
    paymentId: result.paymentId,
  });
};

const vnpayReturn = async (req, res) => {
  const result = await paymentService.handleVnpayCallback(req.query);

  const feUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const status = result.isSuccess ? 'success' : 'fail';
  const redirectUrl = `${feUrl}/payment/result?pay=${status}&gw=vnpay&paymentId=${result.paymentId || ''}&amount=${result.amount || ''}`;

  return res.redirect(redirectUrl);
};

const vnpayIpn = async (req, res) => {
  const result = await paymentService.handleVnpayCallback(req.query);
  if (!result.isSuccess) {
    return sendResponse(res, 400, false, result.message, {
      paymentId: result.paymentId,
      amount: result.amount,
    });
  }
  return sendResponse(res, 200, true, 'OK', {
    paymentId: result.paymentId,
    amount: result.amount,
  });
};

// ------------------------- MoMo handlers -------------------------

const createMomoPayment = async (req, res) => {
  const userId = req.user.id;
  const roleName = req.user.roleName;
  const { bookingId, orderId, fullName } = req.body;

  const result = await paymentService.createMomoPayment({
    bookingId,
    orderId,
    userId,
    roleName,
    fullName,
  });

  return sendResponse(res, 201, true, 'MoMo payment URL created', {
    payUrl: result.payUrl,
    paymentId: result.paymentId,
  });
};

const momoCallback = async (req, res) => {
  const result = await paymentService.handleMomoCallback(req.query);

  const feUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const status = result.isSuccess ? 'success' : 'fail';
  const redirectUrl = `${feUrl}/payment/result?pay=${status}&gw=momo&paymentId=${result.paymentId || ''}&amount=${result.amount || ''}`;

  return res.redirect(redirectUrl);
};

const momoNotify = async (req, res) => {
  const result = await paymentService.handleMomoIpn(req.body);
  if (!result.isSuccess) {
    return sendResponse(res, 400, false, result.message);
  }
  return sendResponse(res, 200, true, result.message);
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  createVnpayPayment,
  vnpayReturn,
  vnpayIpn,
  createMomoPayment,
  momoCallback,
  momoNotify,
};
