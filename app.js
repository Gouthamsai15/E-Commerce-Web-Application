require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');

const app = express();

// Trust proxy for reverse proxy environments (Cloud Run / AI Studio preview)
app.set('trust proxy', 1);

// ==========================================
// 1. SECURITY & LOGGING MIDDLEWARE
// ==========================================
// Configure Helmet without blocking iframe embedding in AI Studio preview
app.use(
    helmet({
        contentSecurityPolicy: false,
        frameguard: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false
    })
);

// Request logger for development
app.use(morgan('dev'));

// ==========================================
// 2. BODY & COOKIE PARSING MIDDLEWARE
// ==========================================
// Parse incoming form submissions (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse incoming JSON data (application/json)
app.use(express.json({ limit: '10mb' }));

// Parse Cookie header and populate req.cookies
app.use(cookieParser());

// ==========================================
// 3. SESSION CONFIGURATION
// ==========================================
// Configure session store: use MongoDB (connect-mongo) only if a valid connection string is present
let sessionStore;
const dbUrl = process.env.DBURL;
const isPlaceholderDb = !dbUrl || 
    dbUrl.includes('YOUR_USER') || 
    dbUrl.includes('YOUR_MONGODB_ATLAS_CONNECTION_STRING') ||
    dbUrl.includes('<username>');

if (!isPlaceholderDb) {
    try {
        sessionStore = MongoStore.create({
            mongoUrl: dbUrl,
            collectionName: 'sessions',
            ttl: 14 * 24 * 60 * 60 // 14 days in seconds
        });
        if (sessionStore && typeof sessionStore.on === 'function') {
            sessionStore.on('error', (err) => {
                console.warn('⚠️ [Session Store Notice]: MongoStore encountered an error:', err.message);
            });
        }
    } catch (storeErr) {
        console.warn('⚠️ [Session Store Warning]: Could not initialize MongoStore, falling back to MemoryStore:', storeErr.message);
    }
}

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'modernshop_secure_session_key_987654321',
        resave: false,
        saveUninitialized: false,
        store: sessionStore, // Falls back to MemoryStore in dev if store is undefined
        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    })
);

// ==========================================
// 4. STATIC FILES & VIEW ENGINE
// ==========================================
// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the template rendering engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 5. GLOBAL TEMPLATE VARIABLES & CONTEXT MIDDLEWARE
// ==========================================
const { loadUser } = require('./middleware/authMiddleware');
const { userContext } = require('./middleware/userMiddleware');

// Load user from database session into req.user & res.locals.user
app.use(loadUser);
// Inject user flash messages, cart count, and request state
app.use(userContext);

// Ensure uploads folder is accessible
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ==========================================
// 6. APPLICATION ROUTES
// ==========================================
const homeRoutes = require('./routes/homeRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { protect } = require('./middleware/authMiddleware');
const { adminOnly } = require('./middleware/adminMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Mount routes
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', protect, checkoutRoutes);
app.use('/orders', protect, orderRoutes);
app.use('/user', protect, userRoutes);
app.use('/admin', protect, adminOnly, adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'E-commerce ModernShop platform is running successfully',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ==========================================
// 7. ERROR HANDLING MIDDLEWARE
// ==========================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;
