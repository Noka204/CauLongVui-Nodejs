const { z } = require('zod');

const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    amount: z.number().min(0),
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
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

const createMomoSchema = z.object({
  body: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    fullName: z.string().optional(),
  }),
});

module.exports = {
  createPaymentSchema,
  updatePaymentStatusSchema,
  createVnpaySchema,
  createMomoSchema,
};
