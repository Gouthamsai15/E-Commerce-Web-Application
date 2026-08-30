const mongoose = require('mongoose');
const Cart = require('../models/Cart');

// Middleware to attach cart count and flash messages to views
const userContext = async (req, res, next) => {
    // 1. Flash messages handling via session
    if (req.session) {
        res.locals.successMessage = req.session.successMessage || null;
        res.locals.errorMessage = req.session.errorMessage || null;
        // Clear flash messages after assigning to locals
        delete req.session.successMessage;
        delete req.session.errorMessage;
    } else {
        res.locals.successMessage = null;
        res.locals.errorMessage = null;
    }

    // 2. Cart count for navbar badge (supports both MongoDB Cart and guest session cart)
    res.locals.cartCount = 0;
    if (mongoose.connection.readyState === 1 && req.user && req.user._id) {
        try {
            const cart = await Cart.findOne({ user: req.user._id }).select('items').lean();
            if (cart && cart.items) {
                res.locals.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
            }
        } catch (err) {
            console.error('Error fetching cart count:', err.message);
        }
    } else if (req.session && req.session.cart && req.session.cart.items) {
        res.locals.cartCount = req.session.cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    next();
};

module.exports = {
    userContext
};
