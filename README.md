# 🛒 Full-Stack E-Commerce Web Application

A production-ready **full-stack E-Commerce web application** built with **Node.js, Express.js, MongoDB, Mongoose, and EJS**. The project follows the **MVC architecture** with server-side rendering (SSR), session-based authentication, role-based access control, and secure order processing.

## ✨ Features

* 🔐 User registration, login, logout, and session-based authentication
* 👥 Role-Based Access Control (Customer & Administrator)
* 🛍️ Product catalog with search, category filtering, sorting, and pagination
* 🖼️ External image URL support with live image preview and fallback handling
* 🛒 Persistent user-specific shopping cart
* 💳 Checkout with payment method abstraction
* 📦 Real-time inventory validation and stock deduction
* 🚚 Complete order lifecycle: Pending → Processing → Shipped → Delivered
* ❌ Order cancellation with automatic inventory restoration
* ⭐ Product reviews and 1–5 star ratings
* 👨‍💼 Admin dashboard with sales, orders, customers, and inventory metrics
* ⚙️ Admin CRUD for products, categories, stock, and orders
* 🛡️ Helmet security headers, rate limiting, input validation, and centralized error handling

## 🧰 Tech Stack

**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas, Mongoose ODM
**Frontend:** EJS, HTML, CSS, JavaScript
**Authentication:** Express Session, Cookies, bcrypt, RBAC
**Security:** Helmet.js, Express Rate Limit, Input Sanitization
**Architecture:** MVC + Server-Side Rendering (SSR)

## 📁 Project Structure

```text
config/          # Database configuration
controllers/     # Application/business controllers
middleware/      # Authentication, admin, error & user middleware
models/          # Mongoose database schemas
routes/          # Application routes
services/        # Auth, order, email & payment services
utils/           # Validators, constants & helper utilities
views/           # EJS templates and reusable partials
public/          # CSS and client-side JavaScript
app.js            # Express application configuration
server.js         # Server and database initialization
package.json      # Dependencies and npm scripts
```

The application separates Models, Views, Controllers, middleware, services, and routes for maintainability and scalability.

## 🚀 Getting Started

### Prerequisites

* Node.js 18+ (20+ recommended)
* MongoDB local instance or MongoDB Atlas

### Installation

```bash
git clone <your-repository-url>
cd <project-folder>
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
DBURL=mongodb+srv://<username>:<password>@cluster.mongodb.net/ecommerce
SESSION_SECRET=your_secure_session_secret
```

### Run the Application

```bash
npm run dev
```

For production:

```bash
npm start
```

Open **http://localhost:3000** to access the storefront.
The **Admin Dashboard** is available at **/admin** for authorized administrators.

## 🔒 Security

The application uses secure HTTP headers, rate limiting, password hashing with bcrypt, input validation, session-based authentication, and centralized error handling to provide a safer production-oriented architecture.

## 📌 Project Highlights

This project demonstrates practical implementation of **MVC architecture, MongoDB schema design, authentication, RBAC, persistent carts, inventory management, checkout workflows, order tracking, SSR, and secure Express.js application development**.
