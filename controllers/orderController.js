const Order = require('../models/Order');
const { isValidObjectId } = require('../utils/validators');

// 1. LIST LOGGED-IN USER ORDERS
const index_get = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.render('orders/index', {
            title: 'My Orders',
            orders
        });
    } catch (err) {
        next(err);
    }
};

// 2. VIEW SINGLE ORDER DETAILS (WITH STRICT OWNERSHIP CHECK)
const show_get = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(404).render('errors/404', {
                title: 'Order Not Found',
                url: req.originalUrl
            });
        }

        const order = await Order.findById(id).populate('items.product').lean();

        if (!order) {
            return res.status(404).render('errors/404', {
                title: 'Order Not Found',
                url: req.originalUrl
            });
        }

        // STRICT SECURITY CHECK: Ensure order belongs to logged-in user or an Admin
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).render('errors/500', {
                title: 'Access Denied',
                message: '403 Forbidden: You do not have permission to view this order.'
            });
        }

        res.render('orders/show', {
            title: `Order #${order._id.toString().slice(-8).toUpperCase()}`,
            order
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index_get,
    show_get
};
