const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema } = require('../validations/user.validation');
const { validateApiKey, verifyToken } = require('../middlewares/auth.middleware');

// Admin: xem danh sách, tạo user, xóa user
router.get('/', validateApiKey('secret'), userController.getUsers);
router.post('/', validateApiKey('secret'), validate(createUserSchema), userController.createUser);
router.delete('/:id', validateApiKey('secret'), userController.deleteUser);

// User tự xem/sửa profile: cần JWT
router.get('/:id', verifyToken, userController.getUserById);
router.put('/:id', verifyToken, validate(updateUserSchema), userController.updateUser);

module.exports = router;
