const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const { isValidObjectId, sanitizeString } = require('../utils/validators');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../utils/constants');

// 1. ADMIN DASHBOARD
const dashboard_get = async (req, res, next) => {
    try {
        const [totalUsers, totalProducts, totalOrders, totalCategories, recentOrders, allOrders] =
            await Promise.all([
                User.countDocuments(),
                Product.countDocuments(),
                Order.countDocuments(),
                Category.countDocuments(),
                Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5).lean(),
                Order.find().select('totalAmount paymentStatus orderStatus').lean()
            ]);

        // Calculate total revenue from paid or confirmed orders
        const totalRevenue = allOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            totalUsers,
            totalProducts,
            totalOrders,
            totalCategories,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            recentOrders
        });
    } catch (err) {
        next(err);
    }
};

// 2. PRODUCT MANAGEMENT
const products_get = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit) || 1;

        const products = await Product.find()
            .populate('category')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.render('admin/products', {
            title: 'Manage Products',
            products,
            currentPage: page,
            totalPages,
            totalProducts
        });
    } catch (err) {
        next(err);
    }
};

const product_new_get = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        res.render('admin/product-form', {
            title: 'Add New Product',
            isEdit: false,
            product: {},
            categories
        });
    } catch (err) {
        next(err);
    }
};

const product_create_post = async (req, res, next) => {
    try {
        const { name, description, price, category, stock, imageUrl } = req.body;

        if (!name || !description || !price || !category || stock === undefined) {
            req.session.errorMessage = 'Please provide all required product fields.';
            return res.redirect('/admin/products/new');
        }

        const imagePaths = [];
        const cleanImageUrl = imageUrl ? imageUrl.trim() : '';

        if (cleanImageUrl) {
            imagePaths.push(cleanImageUrl);
        } else if (req.file) {
            imagePaths.push(`/uploads/${req.file.filename}`);
        } else {
            // Default placeholder if no image URL or file provided
            imagePaths.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80');
        }

        await Product.create({
            name: sanitizeString(name),
            description: sanitizeString(description),
            price: parseFloat(price),
            category,
            stock: parseInt(stock),
            images: imagePaths
        });

        req.session.successMessage = 'Product created successfully.';
        res.redirect('/admin/products');
    } catch (err) {
        next(err);
    }
};

const product_edit_get = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.redirect('/admin/products');

        const [product, categories] = await Promise.all([
            Product.findById(id).lean(),
            Category.find().sort({ name: 1 }).lean()
        ]);

        if (!product) return res.redirect('/admin/products');

        res.render('admin/product-form', {
            title: `Edit Product - ${product.name}`,
            isEdit: true,
            product,
            categories
        });
    } catch (err) {
        next(err);
    }
};

const product_update_post = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, stock, imageUrl } = req.body;

        if (!isValidObjectId(id)) return res.redirect('/admin/products');

        const updateData = {
            name: sanitizeString(name),
            description: sanitizeString(description),
            price: parseFloat(price),
            category,
            stock: parseInt(stock)
        };

        const cleanImageUrl = imageUrl ? imageUrl.trim() : '';
        if (cleanImageUrl) {
            updateData.images = [cleanImageUrl];
        } else if (req.file) {
            updateData.images = [`/uploads/${req.file.filename}`];
        }

        await Product.findByIdAndUpdate(id, updateData);

        req.session.successMessage = 'Product updated successfully.';
        res.redirect('/admin/products');
    } catch (err) {
        next(err);
    }
};

const product_delete_post = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (isValidObjectId(id)) {
            await Product.findByIdAndDelete(id);
            req.session.successMessage = 'Product deleted successfully.';
        }
        res.redirect('/admin/products');
    } catch (err) {
        next(err);
    }
};

// 3. CATEGORY MANAGEMENT
const categories_get = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        res.render('admin/categories', {
            title: 'Manage Categories',
            categories
        });
    } catch (err) {
        next(err);
    }
};

const category_new_get = (req, res) => {
    res.render('admin/category-form', {
        title: 'Add New Category',
        isEdit: false,
        category: {}
    });
};

const category_create_post = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const sanitizedName = sanitizeString(name);

        if (!sanitizedName) {
            req.session.errorMessage = 'Category name is required.';
            return res.redirect('/admin/categories/new');
        }

        const existingCategory = await Category.findOne({ name: sanitizedName });
        if (existingCategory) {
            req.session.errorMessage = 'A category with this name already exists.';
            return res.redirect('/admin/categories/new');
        }

        await Category.create({
            name: sanitizedName,
            description: sanitizeString(description)
        });

        req.session.successMessage = 'Category created successfully.';
        res.redirect('/admin/categories');
    } catch (err) {
        next(err);
    }
};

const category_edit_get = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.redirect('/admin/categories');

        const category = await Category.findById(id).lean();
        if (!category) return res.redirect('/admin/categories');

        res.render('admin/category-form', {
            title: `Edit Category - ${category.name}`,
            isEdit: true,
            category
        });
    } catch (err) {
        next(err);
    }
};

const category_update_post = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!isValidObjectId(id)) return res.redirect('/admin/categories');

        await Category.findByIdAndUpdate(id, {
            name: sanitizeString(name),
            description: sanitizeString(description),
            slug: sanitizeString(name).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
        });

        req.session.successMessage = 'Category updated successfully.';
        res.redirect('/admin/categories');
    } catch (err) {
        next(err);
    }
};

const category_delete_post = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (isValidObjectId(id)) {
            // Check if products belong to this category
            const count = await Product.countDocuments({ category: id });
            if (count > 0) {
                req.session.errorMessage = `Cannot delete category: ${count} product(s) are assigned to it.`;
                return res.redirect('/admin/categories');
            }

            await Category.findByIdAndDelete(id);
            req.session.successMessage = 'Category deleted successfully.';
        }
        res.redirect('/admin/categories');
    } catch (err) {
        next(err);
    }
};

// 4. ORDER MANAGEMENT
const orders_get = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit) || 1;

        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.render('admin/orders', {
            title: 'Manage Customer Orders',
            orders,
            totalOrders,
            currentPage: page,
            totalPages
        });
    } catch (err) {
        next(err);
    }
};

const order_show_get = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.redirect('/admin/orders');

        const order = await Order.findById(id).populate('user', 'name email').lean();
        if (!order) return res.redirect('/admin/orders');

        res.render('admin/order-show', {
            title: `Admin - Order #${order._id.toString().slice(-8).toUpperCase()}`,
            order,
            orderStatuses: Object.values(ORDER_STATUS),
            paymentStatuses: Object.values(PAYMENT_STATUS)
        });
    } catch (err) {
        next(err);
    }
};

const order_status_post = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { orderStatus, paymentStatus } = req.body;

        if (!isValidObjectId(id)) return res.redirect('/admin/orders');

        await Order.findByIdAndUpdate(id, {
            orderStatus,
            paymentStatus
        });

        req.session.successMessage = 'Order status updated successfully.';
        res.redirect(`/admin/orders/${id}`);
    } catch (err) {
        next(err);
    }
};

// 5. USER MANAGEMENT
const users_get = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit) || 1;

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.render('admin/users', {
            title: 'Registered Users',
            users,
            totalUsers,
            currentPage: page,
            totalPages
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    dashboard_get,
    products_get,
    product_new_get,
    product_create_post,
    product_edit_get,
    product_update_post,
    product_delete_post,
    categories_get,
    category_new_get,
    category_create_post,
    category_edit_get,
    category_update_post,
    category_delete_post,
    orders_get,
    order_show_get,
    order_status_post,
    users_get
};
