const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a product name'],
            trim: true,
            maxlength: [150, 'Product name cannot exceed 150 characters']
        },
        description: {
            type: String,
            required: [true, 'Please provide a product description'],
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'Please provide a product price'],
            min: [0, 'Price cannot be negative']
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Please specify a category']
        },
        images: {
            type: [String],
            default: []
        },
        stock: {
            type: Number,
            required: [true, 'Please specify stock quantity'],
            min: [0, 'Stock cannot be negative'],
            default: 0
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        numberOfReviews: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Performance Indexes
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
