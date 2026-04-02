const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate.middleware');
const { createProductSchema, updateProductSchema } = require('../validations/product.validation');
const { validateApiKey } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin only actions
router.post('/', validateApiKey('secret'), upload.single('image'), validate(createProductSchema), productController.createProduct);
router.put('/:id', validateApiKey('secret'), upload.single('image'), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', validateApiKey('secret'), productController.deleteProduct);

module.exports = router;
