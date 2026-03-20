const { z } = require('zod');

const dayjs = require('dayjs');

const createTimeSlotSchema = z.object({
  body: z.object({
    startTime: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Invalid start time (HH:00 or HH:30)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Invalid end time (HH:00 or HH:30)'),
    price: z.number().min(0),
    isPeakHour: z.boolean().optional(),
  }).refine((data) => {
    const start = dayjs(`2026-01-01 ${data.startTime}`);
    const end = dayjs(`2026-01-01 ${data.endTime}`);
    return end.diff(start, 'minute') === 30;
  }, {
    message: 'Time slot must be exactly 30 minutes',
    path: ['endTime'],
  }),
});

module.exports = {
  createTimeSlotSchema,
};
