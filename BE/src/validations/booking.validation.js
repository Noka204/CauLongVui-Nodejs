const { z } = require('zod');

const createBookingSchema = z.object({
  body: z.object({
    courtId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Court ID'),
    slotId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Slot ID'),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    voucherId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID').optional(), // Tạm thời dùng cho dev/test
  }),
});

const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Pending', 'Confirmed', 'Cancelled', 'Expired']),
  }),
});

const updateBookingSchema = z.object({
  body: z.object({
    courtId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    slotId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    voucherId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
  }),
});

const getBookedSlotsSchema = z.object({
  query: z.object({
    courtId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Court ID'),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  }),
});

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
  updateBookingSchema,
  getBookedSlotsSchema,
};
