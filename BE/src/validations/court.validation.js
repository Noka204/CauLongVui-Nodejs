const { z } = require('zod');

const basePriceSchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'string') return Number(val);
  return val;
}, z.number().min(0, 'Base Price must be greater than or equal to 0'));

const createCourtSchema = z.object({
  body: z.object({
    courtName: z.string().min(1, 'Court Name is required'),
    description: z.string().optional(),
    basePrice: basePriceSchema.optional().default(80000),
    imageUrl: z.string().optional().nullable(),
    images: z.union([z.string(), z.array(z.string())]).optional(),
    isMaintenance: z
      .preprocess((val) => {
        if (typeof val === 'string') return val === 'true';
        return val;
      }, z.boolean())
      .optional()
      .default(false),
  }),
});

const updateCourtSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Court ID'),
  }),
  body: z.object({
    courtName: z.string().min(1).optional(),
    description: z.string().optional(),
    basePrice: basePriceSchema.optional(),
    imageUrl: z.string().optional().nullable(),
    images: z.union([z.string(), z.array(z.string())]).optional(),
    isMaintenance: z
      .preprocess((val) => {
        if (typeof val === 'string') return val === 'true';
        return val;
      }, z.boolean())
      .optional(),
  }),
});

module.exports = {
  createCourtSchema,
  updateCourtSchema,
};
