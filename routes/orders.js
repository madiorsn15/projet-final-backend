const express = require('express');
const ordersController = require('../controllers/ordersController');
const { protect, requireRole } = require('../middleware/auth');
const { validateOrder, validateOrderStatus, validateMongoId } = require('../middleware/validation');

const router = express.Router();

router.post('/', protect, validateOrder, ordersController.createOrder);
router.get('/me', protect, ordersController.getMyOrders);
router.get('/seller', protect, requireRole('vendeur', 'admin'), ordersController.getSellerOrders);
router.patch('/:id/status', protect, validateMongoId, validateOrderStatus, ordersController.updateOrderStatus);
router.get('/', protect, requireRole('admin'), ordersController.getAllOrders);

module.exports = router;
