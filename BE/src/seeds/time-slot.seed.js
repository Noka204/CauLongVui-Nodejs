/**
 * Seed script: Tao cac khung gio mac dinh.
 * Chay: node src/seeds/time-slot.seed.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const TimeSlot = require('../models/time-slot.model');

const DEFAULT_SLOTS = [
  { startTime: '06:00', endTime: '07:00', price: 70000, isPeakHour: false },
  { startTime: '07:00', endTime: '08:00', price: 70000, isPeakHour: false },
  { startTime: '08:00', endTime: '09:00', price: 75000, isPeakHour: false },
  { startTime: '09:00', endTime: '10:00', price: 75000, isPeakHour: false },
  { startTime: '10:00', endTime: '11:00', price: 80000, isPeakHour: false },
  { startTime: '11:00', endTime: '12:00', price: 80000, isPeakHour: false },
  { startTime: '12:00', endTime: '13:00', price: 85000, isPeakHour: false },
  { startTime: '13:00', endTime: '14:00', price: 85000, isPeakHour: false },
  { startTime: '14:00', endTime: '15:00', price: 90000, isPeakHour: false },
  { startTime: '15:00', endTime: '16:00', price: 90000, isPeakHour: false },
  { startTime: '16:00', endTime: '17:00', price: 100000, isPeakHour: true },
  { startTime: '17:00', endTime: '18:00', price: 100000, isPeakHour: true },
  { startTime: '18:00', endTime: '19:00', price: 110000, isPeakHour: true },
  { startTime: '19:00', endTime: '20:00', price: 110000, isPeakHour: true },
  { startTime: '20:00', endTime: '21:00', price: 120000, isPeakHour: true },
  { startTime: '21:00', endTime: '22:00', price: 120000, isPeakHour: true },
];

const slotKey = (slot) => `${slot.startTime}-${slot.endTime}`;

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for time-slot seeding...');

    const existing = await TimeSlot.find().lean();
    const existingKeys = new Set(existing.map(slotKey));

    let createdCount = 0;
    for (const slot of DEFAULT_SLOTS) {
      if (existingKeys.has(slotKey(slot))) {
        console.log(`Exists:  ${slot.startTime}-${slot.endTime}`);
        continue;
      }

      await TimeSlot.create(slot);
      createdCount += 1;
      console.log(`Created: ${slot.startTime}-${slot.endTime} | ${slot.price} VND`);
    }

    const allSlots = await TimeSlot.find().sort({ startTime: 1 }).lean();
    console.log(`\nTotal slots in DB: ${allSlots.length} (new: ${createdCount})`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Time-slot seed error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seed();

