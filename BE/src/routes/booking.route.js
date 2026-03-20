const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const validate = require('../middlewares/validate.middleware');
const { createBookingSchema, updateBookingStatusSchema, updateBookingSchema } = require('../validations/booking.validation');
const { validateApiKey, verifyToken } = require('../middlewares/auth.middleware');

// Client tạo booking cần JWT token (để lấy userId)
router.post('/', verifyToken, validate(createBookingSchema), bookingController.createBooking);

// Xem booking: public key đủ (đã apply global)
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);

// Update booking: cần JWT (chủ booking)
router.put('/:id', verifyToken, validate(updateBookingSchema), bookingController.updateBooking);

// Admin actions: cần secret key
router.patch('/:id/status', validateApiKey('secret'), validate(updateBookingStatusSchema), bookingController.updateBookingStatus);
router.delete('/:id', validateApiKey('secret'), bookingController.deleteBooking);

module.exports = router;
