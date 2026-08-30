const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User Registration
router.get('/register', authController.register_get);
router.post('/register', authController.register_post);

// User Login
router.get('/login', authController.login_get);
router.post('/login', authController.login_post);

// User Logout
router.post('/logout', authController.logout_post);

// Password Reset
router.get('/forgot-password', authController.forgot_password_get);
router.post('/forgot-password', authController.forgot_password_post);
router.post('/reset-password', authController.reset_password_post);

module.exports = router;
