const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const validate = require('../middlewares/validate.middleware');
const {
  createBookingSchema,
  updateBookingStatusSchema,
  updateBookingSchema,
  getBookedSlotsSchema,
} = require('../validations/booking.validation');
const { validateApiKey, verifyToken } = require('../middlewares/auth.middleware');

// Public availability: booked slots by court and date
router.get('/availability', validate(getBookedSlotsSchema), bookingController.getBookedSlotsByCourtAndDate);

// Client creates booking with JWT (userId from token)
router.post('/', verifyToken, validate(createBookingSchema), bookingController.createBooking);

// View bookings: owner or admin
router.get('/', verifyToken, bookingController.getBookings);
router.get('/:id', verifyToken, bookingController.getBookingById);

// Update booking: owner via JWT
router.put('/:id', verifyToken, validate(updateBookingSchema), bookingController.updateBooking);

// Admin actions: secret key
router.patch('/:id/status', validateApiKey('secret'), validate(updateBookingStatusSchema), bookingController.updateBookingStatus);
router.delete('/:id', validateApiKey('secret'), bookingController.deleteBooking);

module.exports = router;
