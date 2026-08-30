const mongoose = require('mongoose');
const User = require('../models/User');

// Middleware to load user from session or auth cookie if logged in
const loadUser = async (req, res, next) => {
    try {
        let userId = req.session && req.session.userId ? req.session.userId : null;
        if (!userId && req.cookies && req.cookies.auth_uid) {
            userId = req.cookies.auth_uid;
            if (req.session) {
                req.session.userId = userId;
            }
        }

        if (mongoose.connection.readyState === 1 && userId) {
            const user = await User.findById(userId).select('-password').lean();
            if (user) {
                req.user = user;
                res.locals.user = user;
            } else {
                // User no longer exists in DB
                if (req.session) req.session.userId = null;
                res.clearCookie('auth_uid', { sameSite: 'none', secure: true });
                req.user = null;
                res.locals.user = null;
            }
        } else {
            req.user = null;
            res.locals.user = null;
        }
    } catch (err) {
        console.error('Error in loadUser middleware:', err.message);
        req.user = null;
        res.locals.user = null;
    }
    next();
};

// Middleware to protect routes that require authentication
const protect = (req, res, next) => {
    if (!req.user) {
        // Save current URL for redirect after login
        if (req.originalUrl && req.method === 'GET') {
            return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
        }
        return res.redirect('/auth/login');
    }
    next();
};

module.exports = {
    loadUser,
    protect
};
