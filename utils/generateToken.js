const crypto = require('crypto');

// Generate random secure hex token and its sha256 hash for reset password
const generateResetToken = () => {
    // Generate 32 bytes of secure random hex string
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing in database
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    return {
        resetToken, // Unhashed token sent via email/link to user
        hashedToken // Hashed token stored in database
    };
};

// Hash an existing token to compare against stored hash
const hashToken = (token) => {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
};

module.exports = {
    generateResetToken,
    hashToken
};
