const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const { createOrderFromCart } = require('../services/orderService');
const { processPayment } = require('../services/paymentService');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { PAYMENT_METHODS } = require('../utils/constants');
const { sanitizeString } = require('../utils/validators');

// 1. CHECKOUT ADDRESS PAGE
const address_get = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart || cart.items.length === 0) {
            req.session.errorMessage = 'Your cart is empty. Please add items before checking out.';
            return res.redirect('/cart');
        }

        const user = await User.findById(req.user._id).lean();

        // Default to session address if user previously entered one, or fallback to user model's saved address
        const shippingAddress = req.session.shippingAddress || {
            fullName: (user && user.name) || '',
            phone: (user && user.phone) || '',
            street: (user && user.address && user.address.street) || '',
            city: (user && user.address && user.address.city) || '',
            state: (user && user.address && user.address.state) || '',
            postalCode: (user && user.address && user.address.postalCode) || '',
            country: (user && user.address && user.address.country) || 'India'
        };

        res.render('checkout/address', {
            title: 'Checkout - Shipping Address',
            shippingAddress
        });
    } catch (err) {
        next(err);
    }
};

const address_post = async (req, res, next) => {
    try {
        const { fullName, phone, street, city, state, postalCode, country, saveToProfile } = req.body;

        if (!fullName || !phone || !street || !city || !state || !postalCode || !country) {
            req.session.errorMessage = 'Please fill in all required shipping address fields.';
            return res.redirect('/checkout/address');
        }

        const addressData = {
            fullName: sanitizeString(fullName),
            phone: sanitizeString(phone),
            street: sanitizeString(street),
            city: sanitizeString(city),
            state: sanitizeString(state),
            postalCode: sanitizeString(postalCode),
            country: sanitizeString(country)
        };

        req.session.shippingAddress = addressData;

        // Persist default address in User Profile for maximum resilience
        await User.findByIdAndUpdate(req.user._id, {
            phone: addressData.phone,
            address: {
                street: addressData.street,
                city: addressData.city,
                state: addressData.state,
                postalCode: addressData.postalCode,
                country: addressData.country
            }
        });

        // Explicitly wait for session to persist before redirecting
        if (req.session) {
            await new Promise((resolve) => req.session.save(resolve));
        }

        res.redirect('/checkout/payment');
    } catch (err) {
        next(err);
    }
};

// 2. CHECKOUT PAYMENT PAGE
const payment_get = async (req, res, next) => {
    try {
        let shippingAddress = req.session.shippingAddress;

        // Fallback: If session address is not in memory, recover from User document
        if (!shippingAddress) {
            const user = await User.findById(req.user._id).lean();
            if (user && user.address && user.address.street) {
                shippingAddress = {
                    fullName: user.name || '',
                    phone: user.phone || '',
                    street: user.address.street || '',
                    city: user.address.city || '',
                    state: user.address.state || '',
                    postalCode: user.address.postalCode || '',
                    country: user.address.country || 'India'
                };
                req.session.shippingAddress = shippingAddress;
                if (req.session) {
                    await new Promise((resolve) => req.session.save(resolve));
                }
            }
        }

        if (!shippingAddress) {
            req.session.errorMessage = 'Please provide your shipping address first.';
            return res.redirect('/checkout/address');
        }

        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            req.session.errorMessage = 'Your cart is empty.';
            return res.redirect('/cart');
        }

        // Calculate authoritative total
        let subtotal = 0;
        const validItems = cart.items.filter((item) => item.product !== null);
        for (const item of validItems) {
            subtotal += item.product.price * item.quantity;
        }

        res.render('checkout/payment', {
            title: 'Checkout - Payment',
            shippingAddress,
            items: validItems,
            total: Math.round(subtotal * 100) / 100,
            paymentMethods: PAYMENT_METHODS
        });
    } catch (err) {
        next(err);
    }
};

const payment_post = async (req, res, next) => {
    try {
        const { paymentMethod, cardNumber, expMonth, expYear, cvv } = req.body;

        let shippingAddress = req.session.shippingAddress;
        if (!shippingAddress) {
            const user = await User.findById(req.user._id).lean();
            if (user && user.address && user.address.street) {
                shippingAddress = {
                    fullName: user.name || '',
                    phone: user.phone || '',
                    street: user.address.street || '',
                    city: user.address.city || '',
                    state: user.address.state || '',
                    postalCode: user.address.postalCode || '',
                    country: user.address.country || 'India'
                };
            }
        }

        if (!shippingAddress) {
            req.session.errorMessage = 'Shipping address missing. Please enter your address.';
            return res.redirect('/checkout/address');
        }

        // 1. Process payment via paymentService
        const paymentResult = await processPayment(paymentMethod, {
            cardNumber,
            expMonth,
            expYear,
            cvv
        });

        if (!paymentResult.success) {
            req.session.errorMessage = paymentResult.message || 'Payment failed. Please check your details.';
            return res.redirect('/checkout/payment');
        }

        // 2. Create Order atomically with stock decrement via orderService
        const order = await createOrderFromCart(
            req.user._id,
            shippingAddress,
            paymentMethod,
            paymentResult.status
        );

        // 3. Send email confirmation
        await sendOrderConfirmationEmail(req.user.email, order);

        // 4. Save orderId in session and clear temporary shippingAddress
        req.session.lastOrderId = order._id;
        delete req.session.shippingAddress;

        if (req.session) {
            await new Promise((resolve) => req.session.save(resolve));
        }

        res.redirect('/checkout/success');
    } catch (err) {
        req.session.errorMessage = err.message || 'Failed to place order.';
        res.redirect('/checkout/payment');
    }
};

// 3. CHECKOUT SUCCESS PAGE
const success_get = async (req, res, next) => {
    try {
        const orderId = req.session.lastOrderId;
        if (!orderId) {
            return res.redirect('/orders');
        }

        const order = await Order.findById(orderId).lean();
        if (!order) {
            return res.redirect('/orders');
        }

        res.render('checkout/success', {
            title: 'Order Placed Successfully!',
            order
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    address_get,
    address_post,
    payment_get,
    payment_post,
    success_get
};
