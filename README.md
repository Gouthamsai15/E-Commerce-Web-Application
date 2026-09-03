================================================================================
                    FULL E-COMMERCE PROJECT REPORT & TECHNICAL GUIDE
================================================================================
Project Name   : Production-Ready Full-Stack E-Commerce Web Application
Architecture   : MVC (Model-View-Controller) Pattern with Server-Side Rendering (SSR)
Backend Stack  : Node.js, Express.js
Database       : MongoDB Atlas with Mongoose ODM
Template Engine: EJS (Embedded JavaScript)
Authentication : Session-based with Cookies, bcrypt password hashing, RBAC (Role-Based Access Control)
Security       : Helmet.js, Express-Rate-Limit, Input Sanitization, Centralized Error Handling

================================================================================
TABLE OF CONTENTS
================================================================================
1. Project Executive Summary & Objectives
2. System Architecture & Request-Response Lifecycle
3. Complete Directory & File Structure
4. Database Models & Schema Design (Mongoose)
5. Core Feature Modules & Code Logic Explanation
   5.1. Authentication & Role-Based Access Control (RBAC)
   5.2. Product Catalog, Categories & Image URL Processing
   5.3. Shopping Cart System (User-Persistent)
   5.4. Checkout, Inventory Validation & Order Processing
   5.5. Order Management & Tracking
   5.6. Admin Dashboard & Inventory Controls
   5.7. Security, Rate Limiting & Error Handling
6. API Route Inventory & Endpoints Matrix
7. Technical Interview Questions & In-Depth Answers (Viva & Interviews)
8. Project Setup, Environment Variables & Execution Guide

================================================================================
1. PROJECT EXECUTIVE SUMMARY & OBJECTIVES
================================================================================
This project is an enterprise-grade, full-stack E-Commerce web application built
using Node.js, Express, MongoDB, and EJS. It is engineered with industry-standard
software design practices, ensuring high maintainability, robust security, and a
frictionless shopping experience.

Key Functional Capabilities:
- Multi-Role Support: Customer and Administrator interfaces with separate privileges.
- Dynamic Catalog: Search, filter by category, sort by price/newest, and pagination.
- Instant Image Loading: Support for external CDN/Image URLs with live admin preview.
- Shopping Cart: Server-side persistent cart tied to authenticated user accounts.
- Transactional Checkout: Multi-step checkout with real-time stock deduction.
- Order Lifecycle Management: Status transitions (Pending -> Processing -> Shipped -> Delivered -> Cancelled).
- Admin Management Suite: Comprehensive CRUD for products, categories, stock updates, and orders.
- Defensive Security: Session store, rate limiting on sensitive routes, HTTP security headers.

================================================================================
2. SYSTEM ARCHITECTURE & REQUEST-RESPONSE LIFECYCLE
================================================================================
The application strictly implements the Model-View-Controller (MVC) architectural pattern:

[ Browser Client ]
       |
       |  (1) HTTP Request (GET / POST)
       v
[ Express Server (app.js) ]
       |
       |  (2) Global Middlewares:
       |      - Helmet (Security headers)
       |      - Morgan (Request logging)
       |      - express.urlencoded / cookieParser
       |      - express-session (Session ID cookie lookup)
       |      - authMiddleware.loadUser (Attaches User doc to req.user)
       |      - userMiddleware.userContext (Exposes user, messages to res.locals)
       v
[ Router Layer (routes/*.js) ] ---> [ Route-Level Guards (e.g. requireAuth, requireAdmin) ]
       |
       |  (3) Matched Route Controller
       v
[ Controller Layer (controllers/*.js) ]
       |
       | <----> [ Models / Database (models/*.js) via Mongoose ]
       | <----> [ Business Services (services/*.js) ]
       |
       |  (4) Controller fetches/mutates data and calls res.render()
       v
[ View Layer (views/*.ejs) ]
       |
       |  (5) EJS parses templates + partials (navbar, footer, flash alerts) into HTML
       v
[ Browser Client ]  <--- (6) Rendered HTML Response

================================================================================
3. COMPLETE DIRECTORY & FILE STRUCTURE
================================================================================
.
├── config/
│   └── db.js                 # MongoDB connection logic via Mongoose with auto-reconnect
├── controllers/
│   ├── adminController.js    # Admin dashboard, product CRUD, category CRUD, order management
│   ├── authController.js     # User registration, login, logout, profile management
│   ├── cartController.js     # Add to cart, update quantity, remove item, view cart
│   ├── checkoutController.js # Checkout page render, shipping form, order creation
│   ├── homeController.js     # Storefront homepage, featured items, category landing
│   ├── orderController.js    # User orders list, order tracking/detail view, order cancellation
│   └── productController.js  # Product listing, search, category filter, product details & reviews
├── middleware/
│   ├── adminMiddleware.js    # Restricts routes to users with role === 'admin'
│   ├── authMiddleware.js     # Authenticates sessions; redirects unauthenticated users to login
│   ├── errorMiddleware.js    # 404 Not Found handler and global 500 error handler
│   ├── uploadMiddleware.js   # Multer file upload setup (fallback storage)
│   └── userMiddleware.js     # Injects session messages, cart counts, and auth state into res.locals
├── models/
│   ├── Cart.js               # Cart schema (items subdocuments, references Product and User)
│   ├── Category.js           # Category schema (name, description, slug)
│   ├── Order.js              # Order schema (orderItems snapshot, shippingAddress, payment, status)
│   ├── Product.js            # Product schema (name, price, stock, category, images array)
│   ├── Review.js             # Product reviews and star ratings schema
│   └── User.js               # User schema (name, email, hashed password, role, addresses)
├── public/
│   ├── css/
│   │   └── style.css         # Clean, responsive CSS with CSS variables, flexbox, and grid
│   └── js/
│       └── main.js           # Client-side helpers, navbar dropdown toggle, toast dismissers
├── routes/
│   ├── adminRoutes.js        # Admin endpoints protected by requireAdmin middleware
│   ├── authRoutes.js         # Authentication routes (/auth/login, /auth/register, /auth/logout)
│   ├── cartRoutes.js         # Cart operations (/cart, /cart/add, /cart/update, /cart/remove)
│   ├── checkoutRoutes.js     # Checkout process (/checkout, /checkout/place-order)
│   ├── homeRoutes.js         # Storefront landing (/ and /about)
│   ├── orderRoutes.js        # Customer order views (/orders, /orders/:id)
│   ├── productRoutes.js      # Public product views (/products, /products/:id, /products/:id/review)
│   └── userRoutes.js         # User profile views (/user/profile, /user/edit-profile)
├── services/
│   ├── authService.js        # bcrypt password hashing and verification methods
│   ├── emailService.js       # Transactional order confirmation notifications
│   ├── orderService.js       # Business logic for stock verification and order totals calculation
│   └── paymentService.js     # Payment processing mock/abstraction layer
├── utils/
│   ├── asyncHandler.js       # Wrapper to catch async exceptions and forward to next(err)
│   ├── constants.js          # App-wide constants (Order statuses, Roles, Pagination defaults)
│   ├── createAdmin.js        # Script/utility to bootstrap initial Admin accounts
│   ├── generateToken.js      # Cryptographic token generator utilities
│   └── validators.js         # Sanitizers and regex validators for emails, strings, and numbers
├── views/
│   ├── admin/                # Admin views (dashboard, products list, product-form, orders)
│   ├── auth/                 # Login and Register pages
│   ├── cart/                 # Cart overview and quantity controls
│   ├── checkout/             # Address selection and checkout confirmation
│   ├── errors/               # 404 and 500 error pages
│   ├── orders/               # Orders list, order details, tracking view
│   ├── partials/             # Reusable EJS components (navbar, footer, product-card, flash-messages)
│   ├── products/             # Product catalog, single product detail, search results
│   └── user/                 # Profile view and address editor
├── app.js                    # Express application configuration and middleware pipeline
├── server.js                 # Server initialization, DB connection bootstrap, and port listening
└── package.json              # Project dependencies and npm scripts

================================================================================
4. DATABASE MODELS & SCHEMA DESIGN (MONGOOSE)
================================================================================

1. User Schema (`models/User.js`):
   - `name`: { type: String, required: true, trim: true }
   - `email`: { type: String, required: true, unique: true, lowercase: true, trim: true }
   - `password`: { type: String, required: true } (Stored as bcrypt hash with salt rounds = 10)
   - `role`: { type: String, enum: ['customer', 'admin'], default: 'customer' }
   - `addresses`: [{
       street: String, city: String, state: String, postalCode: String, country: String, isDefault: Boolean
     }]
   - `createdAt`, `updatedAt`: Timestamps

2. Product Schema (`models/Product.js`):
   - `name`: { type: String, required: true, trim: true }
   - `description`: { type: String, required: true }
   - `price`: { type: Number, required: true, min: 0 }
   - `category`: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
   - `stock`: { type: Number, required: true, min: 0, default: 0 }
   - `images`: [{ type: String }] (Stores web image URLs or relative upload paths)
   - `featured`: { type: Boolean, default: false }
   - `createdAt`, `updatedAt`: Timestamps

3. Category Schema (`models/Category.js`):
   - `name`: { type: String, required: true, unique: true, trim: true }
   - `description`: { type: String }
   - `slug`: { type: String, unique: true, lowercase: true }

4. Cart Schema (`models/Cart.js`):
   - `user`: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
   - `items`: [{
       product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
       quantity: { type: Number, required: true, min: 1, default: 1 },
       price: { type: Number, required: true }
     }]
   - `totalAmount`: { type: Number, default: 0 }
   - `updatedAt`: { type: Date, default: Date.now }

5. Order Schema (`models/Order.js`):
   - `user`: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
   - `orderItems`: [{
       product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
       name: String,
       price: Number,
       quantity: Number,
       image: String
     }]  // Embedded snapshot prevents historic order corruption if product is later edited/deleted
   - `shippingAddress`: {
       street: String, city: String, state: String, postalCode: String, country: String
     }
   - `paymentMethod`: { type: String, enum: ['COD', 'CARD', 'UPI'], default: 'COD' }
   - `paymentStatus`: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }
   - `orderStatus`: {
       type: String,
       enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
       default: 'Pending'
     }
   - `totalAmount`: { type: Number, required: true }
   - `createdAt`, `updatedAt`: Timestamps

6. Review Schema (`models/Review.js`):
   - `product`: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
   - `user`: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
   - `rating`: { type: Number, required: true, min: 1, max: 5 }
   - `comment`: { type: String, required: true }
   - `createdAt`: { type: Date, default: Date.now }

================================================================================
5. CORE FEATURE MODULES & CODE LOGIC EXPLANATION
================================================================================

5.1. Authentication & Role-Based Access Control (RBAC)
------------------------------------------------------
- Registration: Validates name, email, and password complexity (>= 6 chars). Checks for existing user. Hashes the password using `bcrypt.hash(password, 10)`. Creates user record and generates an empty Cart for them.
- Login: Authenticates email + password using `bcrypt.compare()`. On success, stores `req.session.userId = user._id` and `req.session.role = user.role`.
- Session Management: Configured using `express-session` and `connect-mongo`. Sessions are validated on every request via `loadUser` middleware which retrieves the user document and sets `req.user`.
- Role Guarding: `requireAdmin` middleware checks if `req.user && req.user.role === 'admin'`. If false, renders an access-denied error or redirects to login.

5.2. Product Catalog, Search & Image URL Processing
---------------------------------------------------
- Public Catalog (`/products`): Supports category filtering via MongoDB query (`{ category: categoryId }`), keyword search via regular expressions (`{ name: { $regex: keyword, $options: 'i' } }`), and sorting (`price-asc`, `price-desc`, `newest`).
- Direct Image URL Feature: In the Admin product creation/edit form (`product-form.ejs`), administrators can input any web image URL (Unsplash, CDN, cloud storage). The frontend includes a live JavaScript `img.onload` preview box with instant presets (Headphones, Watch, Sneakers, Camera). Controllers extract `imageUrl` and store it in `product.images[0]`.
- Resilient Image Fallback: All product cards and detail pages contain `onerror="this.onerror=null;this.src='fallback_url';"` to prevent broken image icons if an external URL becomes unreachable.

5.3. Shopping Cart System (User-Persistent)
------------------------------------------
- Database Backed: Each user has a single persistent `Cart` document in MongoDB.
- Add to Cart: When a user clicks "Add to Cart", the controller checks if the product is already in the `items` array. If found, it increments `quantity`; otherwise, it pushes a new item. It calculates the updated cart total and saves the cart.
- Quantity Controls: Users can increment, decrement, or remove items directly in the cart view (`/cart`).

5.4. Checkout, Inventory Validation & Order Processing
------------------------------------------------------
- Pre-Order Stock Validation: When user initiates checkout (`/checkout/place-order`), the server queries the database for each item in the cart to ensure current `stock >= cartItem.quantity`.
- Atomic Stock Deduction: If valid, the system iterates over items and deducts stock (`product.stock -= quantity; await product.save();`).
- Snapshot Creation: Copies product name, price, quantity, and image into the `Order.orderItems` array. This ensures that future changes to product prices or names do not alter past invoices.
- Cart Clearing: Clears the user's cart (`cart.items = []; cart.totalAmount = 0; await cart.save();`).

5.5. Order Management & Tracking
--------------------------------
- Customer View (`/orders`): Displays all historical orders for the logged-in user with order status pills (Pending, Processing, Shipped, Delivered, Cancelled).
- Order Details (`/orders/:id`): Displays itemized invoice, delivery address, payment method, and real-time status tracker.
- Cancellation Logic: Customers can cancel an order if its status is still "Pending" or "Processing". When cancelled, the controller automatically restores inventory back to the `Product` collection.

5.6. Admin Dashboard & Inventory Controls
-----------------------------------------
- Dashboard Metrics (`/admin`): Real-time aggregation of total sales revenue, total orders count, product inventory count, and registered customer count.
- Order Status Management (`/admin/orders/:id/status`): Administrators can transition order statuses through the fulfillment lifecycle.
- Product CRUD (`/admin/products`): Full creation, editing, deletion, and stock replenishment.

5.7. Security, Rate Limiting & Error Handling
---------------------------------------------
- Helmet.js: Sets standard HTTP security headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security).
- Rate Limiting: `express-rate-limit` prevents brute-force login attempts and DDoS attacks on auth routes.
- Sanitization: All user inputs are trimmed and validated before database persistence.
- Centralized Error Handling: Uncaught exceptions trigger `errorMiddleware.js`, logging the error and displaying a friendly 500 error page to users without leaking sensitive stack traces.

================================================================================
6. API ROUTE INVENTORY & ENDPOINTS MATRIX
================================================================================

Route Path                     HTTP    Access Level    Description
--------------------------------------------------------------------------------
/                              GET     Public          Home landing page
/products                      GET     Public          Product catalog with search & filter
/products/:id                  GET     Public          Single product detail page
/products/:id/review           POST    Customer/Admin  Submit review & star rating
/auth/register                 GET     Guest           Registration page
/auth/register                 POST    Guest           Process new user account creation
/auth/login                    GET     Guest           Sign in page
/auth/login                    POST    Guest           Authenticate user session
/auth/logout                   POST    Authenticated   Destroy session and clear cookie
/cart                          GET     Customer/Admin  View shopping cart
/cart/add                      POST    Customer/Admin  Add item to cart
/cart/update                   POST    Customer/Admin  Update cart item quantity
/cart/remove                   POST    Customer/Admin  Remove specific item from cart
/checkout                      GET     Customer/Admin  Checkout review and address form
/checkout/place-order          POST    Customer/Admin  Validate stock, deduct inventory & create order
/orders                        GET     Customer/Admin  List current user's orders
/orders/:id                    GET     Customer/Admin  Order detail and receipt
/orders/:id/cancel             POST    Customer/Admin  Cancel pending order and refund inventory
/user/profile                  GET     Customer/Admin  User profile view
/user/edit-profile             GET     Customer/Admin  Edit personal info & address form
/user/edit-profile             POST    Customer/Admin  Save updated profile details
/admin                         GET     Admin Only      Admin analytics dashboard
/admin/products                GET     Admin Only      Admin product management table
/admin/products/new            GET     Admin Only      New product form (Image URL supported)
/admin/products                POST    Admin Only      Save newly created product
/admin/products/:id/edit       GET     Admin Only      Edit product details form
/admin/products/:id            POST    Admin Only      Update existing product
/admin/products/:id/delete     POST    Admin Only      Delete product from catalog
/admin/orders                  GET     Admin Only      Admin order fulfillment board
/admin/orders/:id/status       POST    Admin Only      Update order status (Shipped/Delivered)
/admin/categories              GET     Admin Only      Category list & creation form
/admin/categories              POST    Admin Only      Create new category

================================================================================
7. TECHNICAL INTERVIEW QUESTIONS & IN-DEPTH ANSWERS (VIVA & INTERVIEWS)
================================================================================

Q1: Why did you choose the Model-View-Controller (MVC) architecture for this project?
Answer:
The MVC pattern provides a clean separation of concerns:
- Model: Manages data schemas, business entities, and database queries (Mongoose models).
- View: Handles presentation logic and rendering HTML for the user (EJS templates).
- Controller: Contains business logic, receives HTTP requests, interacts with models, and passes data to views.
This separation increases modularity, makes unit testing easier, and allows multiple developers to work on frontend templates and backend logic simultaneously without code conflicts.

---

Q2: How does authentication and session management work in your application?
Answer:
We use stateful, session-based authentication:
1. When a user submits credentials on `/auth/login`, the server queries the `User` model and verifies the password using `bcrypt.compare()`.
2. On successful verification, Express creates a session record stored in MongoDB (via `connect-mongo`) and writes a signed session ID into an HTTP-only cookie in the user's browser.
3. On every subsequent request, the browser transmits the session cookie.
4. The `loadUser` middleware reads the session ID, finds the session in MongoDB, loads the corresponding `User` object, and attaches it to `req.user`.

---

Q3: Why did you choose bcrypt for password storage, and what is a salt?
Answer:
Plaintext passwords should never be stored due to database leak vulnerabilities. bcrypt is an adaptive cryptographic hash function based on the Blowfish cipher:
- Salt: A cryptographically random string generated and prepended to the password before hashing. This ensures that two users with identical passwords produce completely different hashes, neutralizing precomputed Rainbow Table attacks.
- Cost Factor / Salt Rounds: bcrypt uses an adjustable work factor (we use 10 rounds, meaning 2^10 hashing iterations). This makes brute-force and hardware dictionary attacks computationally prohibitive.

---

Q4: How do you handle race conditions or concurrent orders for low-stock items?
Answer:
In e-commerce, two users might attempt to buy the last remaining unit of an item simultaneously.
In our application, we perform pre-order validation during checkout:
1. The checkout controller inspects the live database inventory for each item in the cart (`product.stock >= cartItem.quantity`).
2. If any item is out of stock, checkout aborts immediately with a clear error message.
3. During placement, inventory is updated atomically (`$inc: { stock: -qty }` or saving updated model stock).
4. If an order is cancelled while in Pending/Processing state, the controller increments stock back into the database to ensure inventory consistency.

---

Q5: Why did you snapshot product details inside the Order document instead of just storing Product ObjectIDs?
Answer:
This is a critical database design decision called "Data Denormalization / Historical Snapshotting":
If an Order only stored references (ObjectIDs) to the Product model, any future price increase, name change, or product deletion would retroactively mutate past customer receipts and invoices.
By embedding an `orderItems` array containing `{ name, price, quantity, image }` directly in the `Order` document at the exact second of purchase, historical order records remain immutable, accurate, and audit-compliant forever.

---

Q6: How does the application handle image storage with URLs?
Answer:
Instead of requiring local disk storage or complex multi-part uploads, the Admin portal allows administrators to supply standard web image URLs (e.g. Unsplash, Cloudinary, AWS S3, Imgur).
- The Admin UI provides an interactive live preview using JavaScript event listeners (`input` and `change`) on the URL field with instant preset options.
- The backend stores the validated URL string in the `images` array of the `Product` document.
- Across the storefront (catalog, product details, cart, and admin tables), `<img>` tags feature an `onerror` handler that seamlessly replaces broken external links with a styled placeholder image.

---

Q7: What is the role of Middleware in Express.js? Explain the custom middlewares in this project.
Answer:
Middleware functions in Express are functions that have access to the request object (`req`), response object (`res`), and the `next` function in the application's request-response cycle. They can execute code, modify request/response objects, end the cycle, or call `next()`.
Our custom middlewares include:
1. `authMiddleware.js`: Checks if `req.session.userId` exists; attaches `req.user` or redirects unauthenticated visitors to `/auth/login`.
2. `adminMiddleware.js`: Verifies `req.user.role === 'admin'`; restricts admin routes and returns 403 Forbidden for unauthorized users.
3. `userMiddleware.js`: Injects `user`, `cartCount`, and flash messages (`successMessage`, `errorMessage`) into `res.locals` so all EJS templates can access them without controller repetition.
4. `errorMiddleware.js`: Catches 404 (Not Found) routes and global 500 server errors, ensuring user-friendly error pages.

---

Q8: How do you protect the application against common security threats (XSS, CSRF, DDoS)?
Answer:
1. XSS (Cross-Site Scripting): EJS by default escapes HTML tags (using `<%= %>`), preventing injected scripts from executing. Sensitive cookies are marked `HttpOnly` so client JavaScript cannot access them.
2. Brute-Force & DDoS: We utilize `express-rate-limit` to restrict excessive repeated requests on authentication and checkout endpoints.
3. HTTP Headers: We use `helmet` to set security headers such as `X-Content-Type-Options: nosniff` and `X-Frame-Options`.
4. Parameter Pollution & Injection: Mongoose schemas enforce strict typing, rejecting non-schema properties and sanitizing queries against NoSQL injection.

---

Q9: What is the difference between Server-Side Rendering (SSR with EJS) and Single Page Applications (SPA with React/Vue)?
Answer:
- SSR (Server-Side Rendering): The server compiles the database data directly into ready-to-display HTML pages before sending them to the browser.
  - Advantages: Excellent initial page load speed, superior SEO indexing (search engine crawlers receive complete HTML), simpler state architecture, and no heavy client-side JavaScript bundles.
- SPA (Single Page Application): The server sends a bare HTML shell and JavaScript bundle; the browser renders views and fetches data via REST/GraphQL APIs.
  - Advantages: Smooth transitions without full page reloads for complex web apps.
For this e-commerce project, SSR with EJS delivers optimal SEO for product pages, fast initial rendering, and robust server-authoritative security.

---

Q10: What is the purpose of Mongoose `lean()` and when should you use it?
Answer:
By default, Mongoose queries return full Mongoose Documents equipped with internal getters, setters, change tracking, and helper methods (`.save()`, `.populate()`).
Using `.lean()` tells Mongoose to bypass hydrating full documents and return plain JavaScript Objects (POJOs):
- Memory & Performance: `.lean()` queries are 3x to 5x faster and consume significantly less memory.
- Usage: We use `.lean()` for read-only operations (e.g., rendering product catalog, displaying order history, fetching categories) where document mutation methods are not required.

================================================================================
8. PROJECT SETUP, ENVIRONMENT VARIABLES & EXECUTION GUIDE
================================================================================

Step 1: Prerequisites
- Node.js (version 18+ or 20+ recommended)
- MongoDB Database (Local MongoDB instance or MongoDB Atlas Connection String)

Step 2: Environment Configuration (.env)
Create a `.env` file in the root directory:
--------------------------------------------------------------------------------
PORT=3000
NODE_ENV=development
DBURL=mongodb+srv://<username>:<password>@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
SESSION_SECRET=super_secret_session_key_change_in_production
--------------------------------------------------------------------------------

Step 3: Installation & Start Scripts
- Install dependencies:
  $ npm install

- Run in Development Mode:
  $ npm run dev

- Run Linter / Syntax Verification:
  $ npm run lint

- Production Start:
  $ npm start

Access the application in your browser:
Storefront: http://localhost:3000
Admin Portal: http://localhost:3000/admin (requires admin user login)
================================================================================
                          END OF PROJECT DOCUMENTATION
================================================================================
