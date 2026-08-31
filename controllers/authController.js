const User = require('../models/User');
const Cart = require('../models/Cart');
const { hashPassword, comparePassword } = require('../services/authService');
const { sendPasswordResetEmail } = require('../services/emailService');
const { generateResetToken, hashToken } = require('../utils/generateToken');
const { isValidEmail, isValidPassword, sanitizeString } = require('../utils/validators');

// 1. REGISTER
const register_get = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }
    res.render('auth/register', {
        title: 'Create Account',
        formData: {}
    });
};

const register_post = async (req, res, next) => {
    try {
        let { name, email, password, confirmPassword } = req.body;

        name = sanitizeString(name);
        email = sanitizeString(email).toLowerCase();

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            req.session.errorMessage = 'All fields are required.';
            return res.status(400).render('auth/register', {
                title: 'Create Account',
                formData: { name, email }
            });
        }

        if (!isValidEmail(email)) {
            req.session.errorMessage = 'Please enter a valid email address.';
            return res.status(400).render('auth/register', {
                title: 'Create Account',
                formData: { name, email }
            });
        }

        if (!isValidPassword(password)) {
            req.session.errorMessage = 'Password must be at least 6 characters long.';
            return res.status(400).render('auth/register', {
                title: 'Create Account',
                formData: { name, email }
            });
        }

        if (password !== confirmPassword) {
            req.session.errorMessage = 'Passwords do not match.';
            return res.status(400).render('auth/register', {
                title: 'Create Account',
                formData: { name, email }
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.session.errorMessage = 'An account with this email already exists.';
            return res.status(400).render('auth/register', {
                title: 'Create Account',
                formData: { name, email }
            });
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user'
        });

        // Initialize empty Cart for user
        await Cart.create({ user: newUser._id, items: [] });

        req.session.successMessage = 'Registration successful! Please log in to continue.';
        res.redirect('/auth/login');
    } catch (err) {
        next(err);
    }
};

// 2. LOGIN
const login_get = (req, res) => {
    const redirectUrl = req.query.redirect || req.query.redirectUrl || '';

    // If user is already logged in
    if (req.session && req.session.userId) {
        if (req.user && req.user.role === 'admin') {
            if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/auth/')) {
                return res.redirect(redirectUrl);
            }
            return res.redirect('/admin');
        }

        if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/auth/') && !redirectUrl.startsWith('/admin')) {
            return res.redirect(redirectUrl);
        }
        return res.redirect('/');
    }

    res.render('auth/login', {
        title: 'Sign In',
        redirectUrl,
        formData: {}
    });
};

const login_post = async (req, res, next) => {
    try {
        let { email, password, redirectUrl } = req.body;
        if (!redirectUrl && req.query && (req.query.redirect || req.query.redirectUrl)) {
            redirectUrl = req.query.redirect || req.query.redirectUrl;
        }

        email = sanitizeString(email || '').toLowerCase().trim();
        password = password ? String(password) : '';

        if (!email || !password) {
            return res.status(400).render('auth/login', {
                title: 'Sign In',
                redirectUrl,
                formData: { email },
                errorMessage: 'Please provide both email and password.'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('auth/login', {
                title: 'Sign In',
                redirectUrl,
                formData: { email },
                errorMessage: 'Invalid email or password.'
            });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).render('auth/login', {
                title: 'Sign In',
                redirectUrl,
                formData: { email },
                errorMessage: 'Invalid email or password.'
            });
        }

        // Save guest cart items before session regeneration
        const guestCart = req.session ? req.session.cart : null;

        // Session regeneration to prevent session fixation attacks
        req.session.regenerate(async (err) => {
            if (err) return next(err);

            req.session.userId = user._id;
            req.session.successMessage = `Welcome back, ${user.name}!`;

            // Merge guest cart items into database cart
            if (guestCart && guestCart.items && guestCart.items.length > 0) {
                try {
                    let userCart = await Cart.findOne({ user: user._id });
                    if (!userCart) {
                        userCart = new Cart({ user: user._id, items: [] });
                    }
                    for (const gItem of guestCart.items) {
                        const existingIdx = userCart.items.findIndex(
                            (it) => it.product && it.product.toString() === gItem.productId.toString()
                        );
                        if (existingIdx > -1) {
                            userCart.items[existingIdx].quantity += gItem.quantity;
                        } else {
                            userCart.items.push({
                                product: gItem.productId,
                                quantity: gItem.quantity,
                                price: gItem.price
                            });
                        }
                    }
                    await userCart.save();
                } catch (cartMergeErr) {
                    console.warn('[Cart Merge Notice]:', cartMergeErr.message);
                }
            }

            // Set resilient authentication cookie for cross-context iframe compatibility
            res.cookie('auth_uid', user._id.toString(), {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
            });

            // Explicitly save the regenerated session before sending redirect
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.warn('[Session Save Notice]:', saveErr.message);
                }

                // If logged in user is admin
                if (user.role === 'admin') {
                    if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/auth/')) {
                        return res.redirect(redirectUrl);
                    }
                    return res.redirect('/admin');
                }

                // Standard customer redirect
                if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/auth/')) {
                    if (redirectUrl === '/admin' || redirectUrl.startsWith('/admin/')) {
                        return res.redirect('/');
                    }
                    return res.redirect(redirectUrl);
                }
                return res.redirect('/');
            });
        });
    } catch (err) {
        next(err);
    }
};

// 3. LOGOUT
const logout_post = (req, res, next) => {
    res.clearCookie('auth_uid', { sameSite: 'none', secure: true, path: '/' });
    res.clearCookie('connect.sid', { sameSite: 'none', secure: true, path: '/' });
    
    if (req.session) {
        req.session.destroy((err) => {
            if (err) return next(err);
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
};

// 4. USER PROFILE & EDIT PROFILE (Kept in authController to respect "no extra controller files" rule)
const profile_get = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password').lean();
        res.render('user/profile', {
            title: 'My Profile',
            user
        });
    } catch (err) {
        next(err);
    }
};

const edit_profile_get = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password').lean();
        res.render('user/edit-profile', {
            title: 'Edit Profile',
            user
        });
    } catch (err) {
        next(err);
    }
};

const edit_profile_post = async (req, res, next) => {
    try {
        const { name, phone, street, city, state, postalCode, country } = req.body;

        if (!name || name.trim() === '') {
            req.session.errorMessage = 'Name is required.';
            return res.redirect('/user/edit-profile');
        }

        await User.findByIdAndUpdate(req.user._id, {
            name: sanitizeString(name),
            phone: sanitizeString(phone),
            address: {
                street: sanitizeString(street),
                city: sanitizeString(city),
                state: sanitizeString(state),
                postalCode: sanitizeString(postalCode),
                country: sanitizeString(country)
            }
        });

        req.session.successMessage = 'Profile updated successfully.';
        res.redirect('/user/profile');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register_get,
    register_post,
    login_get,
    login_post,
    logout_post,
    profile_get,
    edit_profile_get,
    edit_profile_post
};
