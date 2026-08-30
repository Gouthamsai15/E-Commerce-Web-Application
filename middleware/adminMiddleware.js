// Middleware to restrict access to Admins only
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login?redirect=%2Fadmin');
    }
    if (req.user.role !== 'admin') {
        req.session.errorMessage = 'Access Denied: Administrator privileges required.';
        return res.redirect('/');
    }
    next();
};

module.exports = {
    adminOnly
};


