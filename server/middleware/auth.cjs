const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY // Public anon key, not service key
);

/**
 * Authentication middleware
 * Verifies JWT token from Supabase Auth
 * Attaches user data to req.user
 */
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify token with Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth error:', error?.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Fetch full user data from our users table
        const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows
            console.error('Database error fetching user:', dbError);
        }

        // Attach user to request
        req.user = userData || {
            email: user.email,
            id: user.id,
            is_premium: false
        };

        next();
    } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't fail if missing
 * Useful for endpoints that work for both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split('Bearer ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            req.user = null;
            return next();
        }

        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        req.user = userData || { email: user.email, id: user.id };
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateUser,
    optionalAuth
};
