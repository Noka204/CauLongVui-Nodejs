const { z } = require('zod');

const createReviewSchema = z.object({
  body: z.object({
    courtId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID').optional(), // Tạm thời dùng cho dev/test
  }),
});

const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
};
