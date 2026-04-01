const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    default: 'Confirmed',
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Expired'],
  },
}, { timestamps: true });

// Double-booking check: courtId + slotId + bookingDate (Unique for active statuses)
bookingSchema.index(
  { courtId: 1, slotId: 1, bookingDate: 1 },
  { 
    unique: true, 
    // MongoDB partial indexes don't support $ne well. Use $in for allowed statuses.
    partialFilterExpression: { status: { $in: ['Pending', 'Confirmed'] } },
    name: 'unique_court_slot_date'
  }
);
// User's bookings (mới nhất trước)
bookingSchema.index({ userId: 1, createdAt: -1 });
// Lọc theo trạng thái + ngày (admin dashboard)
bookingSchema.index({ status: 1, bookingDate: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
