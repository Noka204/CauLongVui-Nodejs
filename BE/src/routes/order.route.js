const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate.middleware');
const { createOrderSchema, updateOrderStatusSchema, returnEquipmentSchema } = require('../validations/order.validation');
const { validateApiKey, verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, orderController.getOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.post('/', verifyToken, validate(createOrderSchema), orderController.createOrder);

// Status update (Secret key required)
router.patch('/:id/status', validateApiKey('secret'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);

// Return equipment (Secret key required depending on business logic, maybe admin only or cashier)
router.patch('/:id/return', validateApiKey('secret'), validate(returnEquipmentSchema), orderController.returnEquipment);

module.exports = router;
