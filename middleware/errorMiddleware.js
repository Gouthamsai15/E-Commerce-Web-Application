// 404 Not Found Middleware
const notFound = (req, res, next) => {
    res.status(404).render('errors/404', {
        title: 'Page Not Found - 404',
        url: req.originalUrl
    });
};

// Centralized 500 & Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    console.error('Application Error:', err);

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'An unexpected server error occurred.';

    // Mongoose Bad ObjectId (CastError)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found with the specified ID.';
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `An entry with this ${field} already exists.`;
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(', ');
    }

    // Multer Upload Errors
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size is too large. Maximum allowed size is 5MB.';
        }
    }

    res.status(statusCode).render('errors/500', {
        title: `Error ${statusCode}`,
        statusCode,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
};

module.exports = {
    notFound,
    errorHandler
};
