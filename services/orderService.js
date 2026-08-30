const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Verifies inventory and server-calculated prices, then creates the Order safely
const createOrderFromCart = async (userId, shippingAddress, paymentMethod, paymentStatus = 'pending') => {
    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Your shopping cart is empty.');
    }

    const orderItems = [];
    let calculatedTotal = 0;

    // 2. Validate every item against live database Product (never trust client)
    for (const item of cart.items) {
        const product = item.product;

        if (!product) {
            throw new Error('One or more products in your cart are no longer available.');
        }

        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${item.quantity}`);
        }

        const itemPrice = product.price; // Get authoritative price from database
        const itemSubtotal = itemPrice * item.quantity;
        calculatedTotal += itemSubtotal;

        orderItems.push({
            product: product._id,
            name: product.name,
            quantity: item.quantity,
            price: itemPrice,
            subtotal: itemSubtotal
        });
    }

    // 3. Atomically decrement stock
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity }
        });
    }

    // 4. Create Order
    const order = await Order.create({
        user: userId,
        items: orderItems,
        shippingAddress: {
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            street: shippingAddress.street.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            postalCode: shippingAddress.postalCode.trim(),
            country: shippingAddress.country.trim()
        },
        paymentMethod,
        paymentStatus,
        orderStatus: 'pending',
        totalAmount: Math.round(calculatedTotal * 100) / 100
    });

    // 5. Clear the user's cart
    cart.items = [];
    await cart.save();

    return order;
};

module.exports = {
    createOrderFromCart
};
