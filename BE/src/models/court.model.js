const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  courtName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  basePrice: {
    type: Number,
    min: 0,
    default: 80000,
  },
  images: {
    type: [String],
    default: [],
  },
  imageUrl: {
    type: String,
    default: null,
  },
  isMaintenance: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'deleted'],
  },
}, { timestamps: true });

const Court = mongoose.model('Court', courtSchema);

module.exports = Court;
