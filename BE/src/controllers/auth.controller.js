const authService = require('../services/auth.service');
const { sendResponse } = require('../utils/response');
const { userDto } = require('../dtos/user.dto');

const login = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const data = await authService.login(phoneNumber, password);
  return sendResponse(res, 200, true, 'Login success', {
    user: userDto(data.user),
    tokens: data.tokens,
  });
};

const register = async (req, res) => {
  const user = await authService.register(req.body);
  return sendResponse(res, 201, true, 'Registration success', userDto(user));
};

const logout = async (req, res) => {
  await authService.logout();
  return sendResponse(res, 200, true, 'Logout success');
};

const sendOtp = async (req, res) => {
  const { email } = req.body;
  const result = await authService.registerWithEmail(email);
  return sendResponse(res, 200, true, result.message);
};

const verifyOtp = async (req, res) => {
  const user = await authService.verifyOtpAndRegister(req.body);
  return sendResponse(res, 201, true, 'Registration success', userDto(user));
};

const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.loginWithEmail(email, password);
  return sendResponse(res, 200, true, 'Login success', {
    user: userDto(data.user),
    tokens: data.tokens,
  });
};

module.exports = {
  login,
  register,
  logout,
  sendOtp,
  verifyOtp,
  loginWithEmail,
};
