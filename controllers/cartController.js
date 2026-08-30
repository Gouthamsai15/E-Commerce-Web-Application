const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { isValidObjectId } = require('../utils/validators');

// 1. VIEW SHOPPING CART
const index_get = async (req, res, next) => {
    try {
        let items = [];
        let subtotal = 0;

        if (mongoose.connection.readyState === 1 && req.user && req.user._id) {
            let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

            if (cart && cart.items) {
                // Filter out deleted/null products
                const validItems = [];
                for (const item of cart.items) {
                    if (item.product) {
                        const price = item.product.price !== undefined ? item.product.price : (item.price || 0);
                        const itemSubtotal = price * item.quantity;
                        subtotal += itemSubtotal;

                        validItems.push({
                            id: item._id.toString(),
                            product: item.product,
                            quantity: item.quantity,
                            price: price,
                            subtotal: Math.round(itemSubtotal * 100) / 100
                        });
                    }
                }
                items = validItems;
            }
        } else {
            // Session-based cart for guest or offline mode
            const sessionCart = req.session ? req.session.cart : null;
            if (sessionCart && sessionCart.items) {
                items = sessionCart.items.map((item) => {
                    const price = item.price || (item.product ? item.product.price : 0) || 0;
                    const itemSubtotal = price * item.quantity;
                    subtotal += itemSubtotal;
                    return {
                        id: item.productId ? item.productId.toString() : (item.product && item.product._id ? item.product._id.toString() : 'item'),
                        product: item.product,
                        quantity: item.quantity,
                        price: price,
                        subtotal: Math.round(itemSubtotal * 100) / 100
                    };
                });
            }
        }

        const total = Math.round(subtotal * 100) / 100;

        res.render('cart/index', {
            title: 'Your Shopping Cart',
            items,
            subtotal: Math.round(subtotal * 100) / 100,
            total
        });
    } catch (err) {
        next(err);
    }
};

// 2. ADD ITEM TO CART
const add_post = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        const parsedQty = Math.max(1, parseInt(quantity) || 1);

        if (!productId) {
            req.session.errorMessage = 'Please select a product to add to cart.';
            return res.redirect('/products');
        }

        let product = null;
        if (mongoose.connection.readyState === 1 && isValidObjectId(productId)) {
            product = await Product.findById(productId);
        }

        if (!product) {
            req.session.errorMessage = 'Product not found.';
            return res.redirect('/products');
        }

        if (product.stock <= 0) {
            req.session.errorMessage = `Sorry, "${product.name}" is currently out of stock.`;
            return res.redirect(`/products/${productId}`);
        }

        if (mongoose.connection.readyState === 1 && req.user && req.user._id) {
            let cart = await Cart.findOne({ user: req.user._id });
            if (!cart) {
                cart = new Cart({ user: req.user._id, items: [] });
            }

            const existingItemIndex = cart.items.findIndex(
                (item) => item.product && item.product.toString() === product._id.toString()
            );

            if (existingItemIndex > -1) {
                const newTotalQty = cart.items[existingItemIndex].quantity + parsedQty;
                if (newTotalQty > product.stock) {
                    req.session.errorMessage = `Cannot add more. Maximum available stock is ${product.stock}.`;
                    return res.redirect('/cart');
                }
                cart.items[existingItemIndex].quantity = newTotalQty;
                cart.items[existingItemIndex].price = product.price;
            } else {
                if (parsedQty > product.stock) {
                    req.session.errorMessage = `Cannot add requested quantity. Maximum available stock is ${product.stock}.`;
                    return res.redirect(`/products/${productId}`);
                }
                cart.items.push({
                    product: product._id,
                    quantity: parsedQty,
                    price: product.price
                });
            }

            await cart.save();
        } else {
            // Guest session cart
            if (!req.session.cart) {
                req.session.cart = { items: [] };
            }

            const existingIndex = req.session.cart.items.findIndex(
                (i) => (i.productId && i.productId.toString() === product._id.toString()) ||
                       (i.product && i.product._id && i.product._id.toString() === product._id.toString())
            );

            if (existingIndex > -1) {
                req.session.cart.items[existingIndex].quantity += parsedQty;
            } else {
                req.session.cart.items.push({
                    productId: product._id.toString(),
                    product: {
                        _id: product._id.toString(),
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        images: product.images,
                        category: product.category
                    },
                    quantity: parsedQty,
                    price: product.price
                });
            }
        }

        req.session.successMessage = `Added "${product.name}" to your cart.`;
        res.redirect('/cart');
    } catch (err) {
        next(err);
    }
};

// 3. UPDATE ITEM QUANTITY
const update_post = async (req, res, next) => {
    try {
        const { itemId, quantity } = req.body;
        const newQty = parseInt(quantity);

        if (mongoose.connection.readyState === 1 && req.user && req.user._id) {
            const cart = await Cart.findOne({ user: req.user._id });
            if (cart) {
                const itemIndex = cart.items.findIndex(
                    (item) => item._id.toString() === itemId || (item.product && item.product.toString() === itemId)
                );
                if (itemIndex > -1) {
                    if (newQty <= 0) {
                        cart.items.splice(itemIndex, 1);
                    } else {
                        cart.items[itemIndex].quantity = newQty;
                    }
                    await cart.save();
                }
            }
        } else if (req.session && req.session.cart && req.session.cart.items) {
            const itemIndex = req.session.cart.items.findIndex(
                (i) => (i.productId && i.productId.toString() === itemId.toString()) ||
                       (i.product && i.product._id && i.product._id.toString() === itemId.toString())
            );
            if (itemIndex > -1) {
                if (newQty <= 0) {
                    req.session.cart.items.splice(itemIndex, 1);
                } else {
                    req.session.cart.items[itemIndex].quantity = newQty;
                }
            }
        }

        req.session.successMessage = 'Cart updated.';
        res.redirect('/cart');
    } catch (err) {
        next(err);
    }
};

// 4. REMOVE ITEM FROM CART
const remove_post = async (req, res, next) => {
    try {
        const { itemId } = req.body;

        if (mongoose.connection.readyState === 1 && req.user && req.user._id) {
            const cart = await Cart.findOne({ user: req.user._id });
            if (cart) {
                cart.items = cart.items.filter(
                    (item) => item._id.toString() !== itemId && (item.product ? item.product.toString() !== itemId : true)
                );
                await cart.save();
            }
        } else if (req.session && req.session.cart && req.session.cart.items) {
            req.session.cart.items = req.session.cart.items.filter(
                (i) => (i.productId ? i.productId.toString() !== itemId.toString() : true) &&
                       (i.product && i.product._id ? i.product._id.toString() !== itemId.toString() : true)
            );
        }

        req.session.successMessage = 'Item removed from your cart.';
        res.redirect('/cart');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index_get,
    add_post,
    update_post,
    remove_post
};
