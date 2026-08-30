const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Home page controller
const index_get = async (req, res, next) => {
    try {
        let categories = [];
        let featuredProducts = [];
        let newArrivals = [];

        if (mongoose.connection.readyState === 1) {
            // Fetch categories for banner & filters
            categories = await Category.find().sort({ name: 1 }).lean();

            // Fetch latest featured products
            featuredProducts = await Product.find()
                .populate('category')
                .sort({ rating: -1, createdAt: -1 })
                .limit(8)
                .lean();

            // Fetch latest new arrivals
            newArrivals = await Product.find()
                .populate('category')
                .sort({ createdAt: -1 })
                .limit(8)
                .lean();
        }

        res.render('home/index', {
            title: 'Welcome to ModernShop - Quality Products Online',
            categories,
            featuredProducts,
            newArrivals
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index_get
};

