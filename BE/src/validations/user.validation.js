const { z } = require('zod');

const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full Name is required'),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').max(15),
    email: z.string().email().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Role ID'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(1),
    password: z.string().min(1),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).optional(),
    phoneNumber: z.string().min(10).max(15).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  }),
});

const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otpCode: z.string().length(6, 'OTP must be 6 digits'),
    fullName: z.string().min(1, 'Full Name is required'),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').max(15),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const loginWithEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});


module.exports = {
  createUserSchema,
  loginSchema,
  updateUserSchema,
  sendOtpSchema,
  verifyOtpSchema,
  loginWithEmailSchema,
};
