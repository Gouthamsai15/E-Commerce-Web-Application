// Email Service for transactional emails (Password Reset, Order Confirmations)
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
    // In production, configure with nodemailer or an API (SendGrid, Resend, AWS SES)
    console.log('==================================================');
    console.log(`[EMAIL SERVICE] Sending Password Reset to: ${toEmail}`);
    console.log(`[EMAIL SERVICE] Reset Link: ${resetUrl}`);
    console.log('==================================================');
    return true;
};

const sendOrderConfirmationEmail = async (toEmail, order) => {
    console.log('==================================================');
    console.log(`[EMAIL SERVICE] Order Confirmation sent to: ${toEmail}`);
    console.log(`[EMAIL SERVICE] Order ID: ${order._id}, Total: ₹${order.totalAmount}`);
    console.log('==================================================');
    return true;
};

module.exports = {
    sendPasswordResetEmail,
    sendOrderConfirmationEmail
};
