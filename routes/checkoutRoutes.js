const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// Multi-step Checkout Flow
router.get('/address', checkoutController.address_get);
router.post('/address', checkoutController.address_post);

router.get('/payment', checkoutController.payment_get);
router.post('/payment', checkoutController.payment_post);

router.get('/success', checkoutController.success_get);

module.exports = router;
