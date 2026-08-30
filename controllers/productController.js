const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { isValidObjectId, sanitizeString } = require('../utils/validators');

// 1. PRODUCT LISTING WITH FILTERING, SORTING, PAGINATION
const index_get = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        const categorySlug = req.query.category || '';
        const sortOption = req.query.sort || 'newest';
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 0;

        let currentCategory = null;
        let products = [];
        let categories = [];
        let totalProducts = 0;
        let totalPages = 1;

        if (mongoose.connection.readyState === 1) {
            const query = {};

            // Category filter by Slug or Category ID
            if (categorySlug) {
                currentCategory = await Category.findOne({
                    $or: [{ slug: categorySlug }, ...(isValidObjectId(categorySlug) ? [{ _id: categorySlug }] : [])]
                }).lean();

                if (currentCategory) {
                    query.category = currentCategory._id;
                }
            }

            // Price range filter
            if (minPrice > 0 || maxPrice > 0) {
                query.price = {};
                if (minPrice > 0) query.price.$gte = minPrice;
                if (maxPrice > 0) query.price.$lte = maxPrice;
            }

            // Sort configuration
            let sortCriteria = { createdAt: -1 };
            if (sortOption === 'price_asc') sortCriteria = { price: 1 };
            if (sortOption === 'price_desc') sortCriteria = { price: -1 };
            if (sortOption === 'rating') sortCriteria = { rating: -1 };
            if (sortOption === 'name') sortCriteria = { name: 1 };

            totalProducts = await Product.countDocuments(query);
            totalPages = Math.ceil(totalProducts / limit) || 1;

            products = await Product.find(query)
                .populate('category')
                .sort(sortCriteria)
                .skip(skip)
                .limit(limit)
                .lean();

            categories = await Category.find().sort({ name: 1 }).lean();
        }

        res.render('products/index', {
            title: currentCategory ? `${currentCategory.name} - Products` : 'All Products',
            products,
            categories,
            currentCategory,
            categorySlug,
            sortOption,
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            currentPage: page,
            totalPages,
            totalProducts
        });
    } catch (err) {
        next(err);
    }
};

// 2. PRODUCT SEARCH
const search_get = async (req, res, next) => {
    try {
        const searchQuery = sanitizeString(req.query.q);
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        if (!searchQuery) {
            return res.redirect('/products');
        }

        let products = [];
        let categories = [];
        let totalProducts = 0;
        let totalPages = 1;

        if (mongoose.connection.readyState === 1) {
            const query = {
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } }
                ]
            };

            totalProducts = await Product.countDocuments(query);
            totalPages = Math.ceil(totalProducts / limit) || 1;

            products = await Product.find(query)
                .populate('category')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            categories = await Category.find().sort({ name: 1 }).lean();
        }

        res.render('products/search', {
            title: `Search Results for "${searchQuery}"`,
            searchQuery,
            products,
            categories,
            currentPage: page,
            totalPages,
            totalProducts
        });
    } catch (err) {
        next(err);
    }
};

// 3. PRODUCT DETAILS
const show_get = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            req.session.errorMessage = 'Invalid product ID.';
            return res.redirect('/products');
        }

        let product = null;
        let reviews = [];
        let relatedProducts = [];

        if (mongoose.connection.readyState === 1) {
            product = await Product.findById(id).populate('category').lean();
            if (product) {
                reviews = await Review.find({ product: id })
                    .populate('user', 'name')
                    .sort({ createdAt: -1 })
                    .lean();

                if (product.category && product.category._id) {
                    relatedProducts = await Product.find({
                        category: product.category._id,
                        _id: { $ne: product._id }
                    })
                        .limit(4)
                        .lean();
                }
            }
        }

        if (!product) {
            req.session.errorMessage = 'Product not found.';
            return res.redirect('/products');
        }

        res.render('products/show', {
            title: `${product.name} - Details`,
            product,
            reviews,
            relatedProducts
        });
    } catch (err) {
        next(err);
    }
};

// 4. ADD REVIEW
const review_post = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (!isValidObjectId(id)) {
            req.session.errorMessage = 'Invalid product ID.';
            return res.redirect('/products');
        }

        const parsedRating = parseInt(rating);
        if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
            req.session.errorMessage = 'Please provide a valid rating between 1 and 5 stars.';
            return res.redirect(`/products/${id}`);
        }

        const sanitizedComment = sanitizeString(comment);
        if (!sanitizedComment) {
            req.session.errorMessage = 'Please provide a review comment.';
            return res.redirect(`/products/${id}`);
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            user: req.user._id,
            product: id
        });

        if (existingReview) {
            req.session.errorMessage = 'You have already reviewed this product.';
            return res.redirect(`/products/${id}`);
        }

        // Create review
        await Review.create({
            user: req.user._id,
            product: id,
            rating: parsedRating,
            comment: sanitizedComment
        });

        // Recalculate average rating for product
        const allReviews = await Review.find({ product: id });
        const totalScore = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const avgRating = totalScore / allReviews.length;

        await Product.findByIdAndUpdate(id, {
            rating: Math.round(avgRating * 10) / 10,
            numberOfReviews: allReviews.length
        });

        req.session.successMessage = 'Your review has been submitted successfully!';
        res.redirect(`/products/${id}`);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index_get,
    search_get,
    show_get,
    review_post
};
