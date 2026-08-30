const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Shopping Cart Management
router.get('/', cartController.index_get);
router.post('/add', cartController.add_post);
router.post('/update', cartController.update_post);
router.post('/remove', cartController.remove_post);

module.exports = router;
