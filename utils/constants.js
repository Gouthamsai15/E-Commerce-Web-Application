// Application Constants
const ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

const PAYMENT_METHODS = {
    COD: 'Cash on Delivery',
    ONLINE: 'Online Payment (Card / Test Gateway)'
};

module.exports = {
    ROLES,
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHODS
};
