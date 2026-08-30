require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const createInitialAdmin = require('./utils/createAdmin');

// Port 3000 is required by the infrastructure reverse proxy
const PORT = 3000;

// Prevent unhandled promise rejections or driver network errors from crashing the process
process.on('unhandledRejection', (reason) => {
    console.warn('⚠️ [Unhandled Rejection Notice]:', reason && reason.message ? reason.message : reason);
});

process.on('uncaughtException', (err) => {
    console.warn('⚠️ [Uncaught Exception Notice]:', err.message);
});

// Start server
const startServer = async () => {
    try {
        // Attempt MongoDB Atlas connection in background
        connectDB().then(async (connected) => {
            if (connected) {
                await createInitialAdmin();
            }
        }).catch((err) => {
            console.warn('MongoDB initial connection notice:', err.message);
        });

        // Listen immediately on Port 3000 on all network interfaces
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://localhost:${PORT} [0.0.0.0:${PORT}]`);
        });
    } catch (err) {
        console.error(`Failed to start server: ${err.message}`);
        process.exit(1);
    }
};

startServer();
