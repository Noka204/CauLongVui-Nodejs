const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Object ID');

const paymentTargetSchema = z.object({
  bookingId: objectIdSchema.optional(),
  orderId: objectIdSchema.optional(),
}).refine(
  ({ bookingId, orderId }) => Boolean(bookingId) !== Boolean(orderId),
  {
    message: 'Provide exactly one of bookingId or orderId',
    path: ['bookingId'],
  }
);

const createPaymentSchema = z.object({
  body: paymentTargetSchema.extend({
    amount: z.number().min(0).optional(),
    paymentMethod: z.enum(['MoMo', 'VNPay', 'Cash']),
    gatewayResponse: z.string().optional().nullable(),
  }),
});

const updatePaymentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Pending', 'Success', 'Failed']),
  }),
});

const createVnpaySchema = z.object({
  body: z.object({
    bookingId: objectIdSchema,
  }),
});

const createMomoSchema = z.object({
  body: paymentTargetSchema.extend({
    fullName: z.string().optional(),
  }),
});

module.exports = {
  createPaymentSchema,
  updatePaymentStatusSchema,
  createVnpaySchema,
  createMomoSchema,
};
