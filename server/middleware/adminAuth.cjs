const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
    const token = req.headers['x-admin-token'];

    if (!token) {
        return res.status(401).json({ error: 'Admin token required' });
    }

    if (token !== process.env.ADMIN_SECRET_TOKEN) {
        return res.status(403).json({ error: 'Invalid admin token' });
    }

    req.isAdmin = true;
    next();
};

module.exports = { requireAdmin };
