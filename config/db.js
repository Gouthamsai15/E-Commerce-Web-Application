const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

let connectionPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const dbUrl = process.env.DBURL;

    if (!dbUrl) {
        throw new Error('DBURL is not configured');
    }

    connectionPromise = mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 10000,
    })
    .then((conn) => {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn.connection;
    })
    .catch((err) => {
        connectionPromise = null;
        console.error(`❌ MongoDB Connection Failed: ${err.message}`);
        throw err;
    });

    return connectionPromise;
};

module.exports = connectDB;