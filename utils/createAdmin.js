const bcrypt = require('bcrypt');
const User = require('../models/User');

// Seed an initial Admin account if one doesn't exist
const createInitialAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admingsr@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Gouthamsai@15';
        const adminName = process.env.ADMIN_NAME || 'System Administrator';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
        if (existingAdmin) {
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await User.create({
            name: adminName,
            email: adminEmail.toLowerCase(),
            password: hashedPassword,
            role: 'admin'
        });

        console.log(`[Admin Seeder] Created initial admin: ${adminEmail}`);
    } catch (err) {
        console.warn(`[Admin Seeder Note]: ${err.message}`);
    }
};

module.exports = createInitialAdmin;
