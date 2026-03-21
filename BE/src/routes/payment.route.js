const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const validate = require('../middlewares/validate.middleware');
const {
  createPaymentSchema,
  updatePaymentStatusSchema,
  createVnpaySchema,
  createMomoSchema,
} = require('../validations/payment.validation');
const { validateApiKey, verifyToken } = require('../middlewares/auth.middleware');

// ─── CRUD cơ bản ──────────────────────────────────────────────────────
router.get('/', verifyToken, paymentController.getPayments);
router.get('/:id', verifyToken, paymentController.getPaymentById);
router.post('/', verifyToken, validate(createPaymentSchema), paymentController.createPayment);
router.patch('/:id/status', validateApiKey('secret'), validate(updatePaymentStatusSchema), paymentController.updatePaymentStatus);

// ─── VNPay (cần JWT để lấy userId) ───────────────────────────────────
router.post('/vnpay/create', verifyToken, validate(createVnpaySchema), paymentController.createVnpayPayment);

// ─── MoMo (cần JWT để lấy userId) ────────────────────────────────────
router.post('/momo/create', verifyToken, validate(createMomoSchema), paymentController.createMomoPayment);

module.exports = router;
