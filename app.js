require("dotenv").config();
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");

const app = express();

// Trust proxy for reverse proxy environments (Cloud Run / AI Studio preview)
app.set("trust proxy", 1);

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
    crossOriginResourcePolicy: false,
  }),
);

app.use(morgan("dev"));

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "E-commerce ModernShop platform is running successfully",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use(cookieParser());

let sessionStore;
const dbUrl = process.env.DBURL;
const isPlaceholderDb =
  !dbUrl ||
  dbUrl.includes("YOUR_USER") ||
  dbUrl.includes("YOUR_MONGODB_ATLAS_CONNECTION_STRING") ||
  dbUrl.includes("<username>");

if (!isPlaceholderDb) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: dbUrl,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    });
    if (sessionStore && typeof sessionStore.on === "function") {
      sessionStore.on("error", (err) => {
        console.warn(
          "⚠️ [Session Store Notice]: MongoStore encountered an error:",
          err.message,
        );
      });
    }
  } catch (storeErr) {
    console.warn(
      "⚠️ [Session Store Warning]: Could not initialize MongoStore, falling back to MemoryStore:",
      storeErr.message,
    );
  }
}

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "modernshop_secure_session_key_987654321",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const { loadUser } = require("./middleware/authMiddleware");
const { userContext } = require("./middleware/userMiddleware");

app.use(loadUser);
app.use(userContext);

const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { protect } = require("./middleware/authMiddleware");
const { adminOnly } = require("./middleware/adminMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

app.use("/", homeRoutes);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/checkout", protect, checkoutRoutes);
app.use("/orders", protect, orderRoutes);
app.use("/user", protect, userRoutes);
app.use("/admin", protect, adminOnly, adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
