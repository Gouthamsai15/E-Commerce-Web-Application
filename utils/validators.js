const mongoose = require('mongoose');

// Simple, brute-force validation functions
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

const isValidPassword = (password) => {
    // Minimum 6 characters for user friendly security
    return password && typeof password === 'string' && password.length >= 6;
};

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const sanitizeString = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.trim();
};

const isValidPositiveNumber = (num) => {
    const parsed = Number(num);
    return !isNaN(parsed) && parsed >= 0;
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidObjectId,
    sanitizeString,
    isValidPositiveNumber
};
