const mongoose = require('mongoose');

// Disable query buffering so that operations fail fast when disconnected rather than hanging
mongoose.set('bufferCommands', false);

// Connect to MongoDB Atlas
const connectDB = async () => {
    const dbUrl = process.env.DBURL;

    if (!dbUrl || dbUrl.includes('YOUR_USER') || dbUrl.includes('YOUR_MONGODB_ATLAS_CONNECTION_STRING') || dbUrl.includes('<username>') || dbUrl.includes('cluster0.mongodb.net')) {
        console.warn('⚠️ [MongoDB Notice]: Running in fallback mode with sample catalog. To connect live Atlas DB, set DBURL in .env.');
        return false;
    }

    try {
        const conn = await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 3000
        });
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        return true;
    } catch (err) {
        console.warn(`⚠️ [MongoDB Connection Notice]: Could not connect to Atlas (${err.message}). Continuing with in-memory session/sample mode.`);
        return false;
    }
};

module.exports = connectDB;

