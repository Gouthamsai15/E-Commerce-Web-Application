const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// GET / -> Home Page
router.get('/', homeController.index_get);

module.exports = router;
