require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const createInitialAdmin = require('./utils/createAdmin');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        await createInitialAdmin();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(
                `🚀 Server running on http://localhost:${PORT}`
            );
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
};

startServer();