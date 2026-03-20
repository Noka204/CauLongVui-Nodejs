const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
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

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
