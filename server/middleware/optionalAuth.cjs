const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Optional Auth Middleware
// Checks for token and attaches user if valid.
// Does NOT block request if token is missing or invalid.
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Proceed as guest
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
            // Attach user to request
            req.user = user;
        }

        next();
    } catch (err) {
        // Silently fail auth check and proceed as guest
        console.error('Optional Auth Error:', err.message);
        next();
    }
};

module.exports = { optionalAuth };
