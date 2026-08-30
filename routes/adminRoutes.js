const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/uploadMiddleware');

// Admin Dashboard
router.get('/', adminController.dashboard_get);

// Product Management
router.get('/products', adminController.products_get);
router.get('/products/new', adminController.product_new_get);
router.post('/products', upload.single('image'), adminController.product_create_post);
router.get('/products/:id/edit', adminController.product_edit_get);
router.post('/products/:id/update', upload.single('image'), adminController.product_update_post);
router.post('/products/:id/delete', adminController.product_delete_post);

// Category Management
router.get('/categories', adminController.categories_get);
router.get('/categories/new', adminController.category_new_get);
router.post('/categories', adminController.category_create_post);
router.get('/categories/:id/edit', adminController.category_edit_get);
router.post('/categories/:id/update', adminController.category_update_post);
router.post('/categories/:id/delete', adminController.category_delete_post);

// Order Management
router.get('/orders', adminController.orders_get);
router.get('/orders/:id', adminController.order_show_get);
router.post('/orders/:id/status', adminController.order_status_post);

// User Management
router.get('/users', adminController.users_get);

module.exports = router;
