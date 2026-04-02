const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../exceptions/UnauthorizedError');
const { BadRequestError } = require('../exceptions/BadRequestError');
const roleService = require('./role.service');
const OTP = require('../models/otp.model');
const emailService = require('./external/email.service');
const Role = require('../models/role.model');


/**
 * Handle user login
 * @param {string} phoneNumber 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
const login = async (phoneNumber, password) => {
  const user = await User.findOne({ phoneNumber });
  if (!user) throw new UnauthorizedError('Invalid phone number or password');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Invalid phone number or password');

  const role = await roleService.findById(user.roleId);

  // Payload for JWT Token
  const payload = {
    id: user._id.toString(),
    roleId: user.roleId.toString(),
    roleName: role.roleName
  };

  const JWT_SECRET = env.JWT_SECRET;
  const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  const tokens = { accessToken, refreshToken };
  
  return { user, tokens };
};

/**
 * Handle user registration
 * @param {Object} userData 
 * @returns {Promise<Object>}
 */
const register = async (userData) => {
  const existingUser = await User.findOne({ phoneNumber: userData.phoneNumber });
  if (existingUser) throw new BadRequestError('Phone number already exists');

  // Verify Role exists before assigning
  await roleService.findById(userData.roleId);

  const salt = await bcrypt.genSalt(10);
  userData.passwordHash = await bcrypt.hash(userData.password, salt);
  
  return await User.create(userData);
};

/**
 * Handle user logout
 * @returns {Promise<void>}
 */
const logout = async () => {
  // Logic for token blacklisting if needed
};

/**
 * Tạo OTP và gửi email
 * @param {string} email 
 * @returns {Promise<Object>}
 */
const registerWithEmail = async (email) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new BadRequestError('Email already registered');

  // Random 6 digits OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  await OTP.deleteMany({ email });
  await OTP.create({ email, otpCode });

  try {
    await emailService.sendOtpEmail(email, otpCode);
    return { message: 'OTP sent successfully' };
  } catch (error) {
    // Dev fallback: avoid FE timeout when SMTP is blocked/unavailable on local machine.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[OTP-DEV] Email service unavailable. Using console OTP fallback.');
      console.warn(`[OTP-DEV] ${email} => ${otpCode}`);
      return { message: 'Email service unavailable. OTP has been printed in backend console for development.', devOtp: otpCode };
    }

    throw new BadRequestError('Cannot send OTP email at the moment. Please try again later.');
  }
};

/**
 * Xác thực OTP và đăng ký tài khoản
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
const verifyOtpAndRegister = async (data) => {
  const { email, otpCode, fullName, phoneNumber, password } = data;

  const otpRecord = await OTP.findOne({ email, otpCode });
  if (!otpRecord) throw new BadRequestError('Invalid or expired OTP');

  const existingPhone = await User.findOne({ phoneNumber });
  if (existingPhone) throw new BadRequestError('Phone number already exists');

  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new BadRequestError('Email already registered');

  const role = await Role.findOne({ roleName: 'Customer' });
  if (!role) throw new BadRequestError('Customer role not configured in the system');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  const newUser = await User.create({
    fullName,
    phoneNumber,
    email,
    passwordHash,
    roleId: role._id
  });

  await OTP.deleteMany({ email });

  return newUser;
};

/**
 * Handle user login with email
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
const loginWithEmail = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Invalid email or password');

  const role = await roleService.findById(user.roleId);

  // Payload for JWT Token
  const payload = {
    id: user._id.toString(),
    roleId: user.roleId.toString(),
    roleName: role.roleName
  };

  const JWT_SECRET = env.JWT_SECRET;
  const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  const tokens = { accessToken, refreshToken };
  
  return { user, tokens };
};

module.exports = {
  login,
  register,
  logout,
  registerWithEmail,
  verifyOtpAndRegister,
  loginWithEmail
};
