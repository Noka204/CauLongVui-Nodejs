const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['MoMo', 'VNPay', 'Cash'],
  },
  transactionRef: {
    type: String,
    default: null,
  },
  gatewayResponse: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Success', 'Failed'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

paymentSchema.pre('validate', function ensureSinglePaymentTarget(next) {
  const hasBooking = Boolean(this.bookingId);
  const hasOrder = Boolean(this.orderId);

  if (hasBooking === hasOrder) {
    this.invalidate('bookingId', 'Payment must reference exactly one target: bookingId or orderId');
  }

  return next();
});

// Lookup by booking
paymentSchema.index({ bookingId: 1, status: 1 });
// Lookup by food order
paymentSchema.index({ orderId: 1, status: 1 });
// Payment history by user
paymentSchema.index({ userId: 1, createdAt: -1 });
// Filter by status and method
paymentSchema.index({ status: 1, paymentMethod: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
