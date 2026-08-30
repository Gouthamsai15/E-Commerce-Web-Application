const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants');

// Payment service handling Cash on Delivery and Mock / Online Payment gateways
const processPayment = async (paymentMethod, paymentDetails = {}) => {
    if (paymentMethod === PAYMENT_METHODS.COD) {
        return {
            success: true,
            status: PAYMENT_STATUS.PENDING,
            transactionId: 'COD-' + Date.now(),
            message: 'Cash on Delivery selected. Payment will be collected at delivery.'
        };
    }

    // Basic Online Payment simulation
    if (paymentMethod === PAYMENT_METHODS.ONLINE) {
        const { cardNumber, expMonth, expYear, cvv } = paymentDetails;

        // Basic verification
        if (!cardNumber || !expMonth || !expYear || !cvv) {
            return {
                success: false,
                status: PAYMENT_STATUS.FAILED,
                message: 'Incomplete payment card details provided.'
            };
        }

        // Test payment simulator (Real credentials should be in .env in production)
        return {
            success: true,
            status: PAYMENT_STATUS.PAID,
            transactionId: 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            message: 'Online test payment verified successfully.'
        };
    }

    return {
        success: false,
        status: PAYMENT_STATUS.FAILED,
        message: 'Unsupported payment method.'
    };
};

module.exports = {
    processPayment
};
