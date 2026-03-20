const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const upload = require('../middlewares/upload.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');

// Upload files: cần JWT (chỉ user đã login mới upload)
router.post('/images', verifyToken, upload.array('images', 10), fileController.uploadImages);
router.post('/avatar', verifyToken, upload.single('avatar'), fileController.uploadAvatar);

module.exports = router;
