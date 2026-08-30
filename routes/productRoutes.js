const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Product Listing & Search
router.get('/', productController.index_get);
router.get('/search', productController.search_get);

// Product Details
router.get('/:id', productController.show_get);

// Submit Review (Authenticated users only)
router.post('/:id/review', protect, productController.review_post);

module.exports = router;
