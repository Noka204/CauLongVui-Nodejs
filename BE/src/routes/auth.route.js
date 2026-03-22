const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { loginSchema, createUserSchema, sendOtpSchema, verifyOtpSchema, loginWithEmailSchema } = require('../validations/user.validation');

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(createUserSchema), authController.register);
router.post('/logout', authController.logout);

router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/login-email', validate(loginWithEmailSchema), authController.loginWithEmail);

module.exports = router;
