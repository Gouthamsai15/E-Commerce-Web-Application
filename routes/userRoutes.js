const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User Profile & Settings
router.get('/profile', authController.profile_get);
router.get('/edit-profile', authController.edit_profile_get);
router.post('/edit-profile', authController.edit_profile_post);

module.exports = router;
