const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

/**
 * Gateway callback routes - NO API key validation required
 * These endpoints are called directly by VNPay/MoMo gateways
 */

// VNPay return (user redirect) and IPN (server notification)
router.get('/payments/vnpay/return', paymentController.vnpayReturn);
router.get('/payments/vnpay/ipn', paymentController.vnpayIpn);
router.post('/payments/vnpay/ipn', paymentController.vnpayIpn);

// MoMo callback (user redirect) and notify (IPN)
router.get('/payments/momo/callback', paymentController.momoCallback);
router.post('/payments/momo/notify', paymentController.momoNotify);

module.exports = router;
