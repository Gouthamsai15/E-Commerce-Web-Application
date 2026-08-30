const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
            maxlength: [60, 'Name cannot exceed 60 characters']
        },
        email: {
            type: String,
            required: [true, 'Please provide an email address'],
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters']
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        phone: {
            type: String,
            trim: true,
            default: ''
        },
        address: {
            street: { type: String, trim: true, default: '' },
            city: { type: String, trim: true, default: '' },
            state: { type: String, trim: true, default: '' },
            postalCode: { type: String, trim: true, default: '' },
            country: { type: String, trim: true, default: '' }
        },
        passwordResetToken: {
            type: String,
            default: undefined
        },
        passwordResetExpires: {
            type: Date,
            default: undefined
        }
    },
    {
        timestamps: true
    }
);

// Indexes are created automatically by unique: true on email

module.exports = mongoose.model('User', userSchema);
