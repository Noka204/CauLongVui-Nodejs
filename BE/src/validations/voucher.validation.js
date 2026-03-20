const { z } = require('zod');

const createVoucherSchema = z.object({
  body: z.object({
    voucherCode: z.string().min(1).max(20).uppercase(),
    description: z.string().optional(),
    discountType: z.enum(['Percentage', 'FixedAmount']),
    discountValue: z.number().min(0),
    minOrderValue: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    usageLimit: z.number().int().min(1).optional(),
    maxUsagePerUser: z.number().int().min(1).optional(),
    targetUserId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const updateVoucherSchema = z.object({
  body: createVoucherSchema.shape.body.partial(),
});

module.exports = {
  createVoucherSchema,
  updateVoucherSchema,
};
