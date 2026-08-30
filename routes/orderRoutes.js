const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// User Orders
router.get('/', orderController.index_get);
router.get('/:id', orderController.show_get);

module.exports = router;
