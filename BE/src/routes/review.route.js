const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const validate = require('../middlewares/validate.middleware');
const { createReviewSchema, updateReviewSchema } = require('../validations/review.validation');
const { validateApiKey, verifyToken } = require('../middlewares/auth.middleware');

// Xem review: public key đủ
router.get('/court/:courtId', reviewController.getReviewsByCourt);

// Tạo review: cần JWT (lấy userId)
router.post('/', verifyToken, validate(createReviewSchema), reviewController.createReview);

// Sửa review: cần JWT (chủ review)
router.put('/:id', verifyToken, validate(updateReviewSchema), reviewController.updateReview);

// Xóa review: cần secret key (admin)
router.delete('/:id', validateApiKey('secret'), reviewController.deleteReview);

module.exports = router;
