const { z } = require('zod');

const createCourtSchema = z.object({
  body: z.object({
    courtName: z.string().min(1, 'Court Name is required'),
    description: z.string().optional(),
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
