const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Send magic link to user's email
 * Uses Supabase Auth OTP (One-Time Password) email
 */
const sendMagicLink = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email required' });
        }

        // Send magic link via Supabase Auth
        const { error } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase().trim(),
            options: {
                emailRedirectTo: `${FRONTEND_URL}/auth/callback`,
                shouldCreateUser: true // Auto-create user if doesn't exist
            }
        });

        if (error) {
            console.error('Magic link error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Magic link sent to ${email}`);
        res.json({
            success: true,
            message: 'Magic link sent! Check your email.'
        });
    } catch (error) {
        console.error('Send magic link error:', error);
        res.status(500).json({ error: 'Failed to send magic link' });
    }
};

/**
 * Get current user info
 * Requires authentication
 */
const getCurrentUser = async (req, res) => {
    try {
        // req.user is already attached by authenticateUser middleware
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Fetch latest user data from database
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', req.user.email)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Get user error:', error);
            return res.status(500).json({ error: 'Failed to fetch user data' });
        }

        // Return user data (without sensitive fields if any)
        const safeUserData = {
            id: userData?.id,
            email: userData?.email,
            is_premium: userData?.is_premium || false,
            created_at: userData?.created_at
        };

        res.json({ user: safeUserData });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Verify user session and sync with database
 * Called after magic link login to ensure user exists in our database
 */
const verifySession = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify with Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        // Check if user exists in our database
        let { data: userData, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        // If user doesn't exist in our DB, create them
        if (dbError && dbError.code === 'PGRST116') {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    email: user.email,
                    is_premium: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.error('Failed to create user:', createError);
                return res.status(500).json({ error: 'Failed to create user' });
            }

            userData = newUser;
            console.log(`✅ Auto-created user: ${user.email}`);
        }

        res.json({
            user: {
                id: userData.id,
                email: userData.email,
                is_premium: userData.is_premium || false
            }
        });
    } catch (error) {
        console.error('Verify session error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

/**
 * Sign out user
 * Invalidates Supabase session
 */
const signOut = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(200).json({ success: true });
        }

        const token = authHeader.split('Bearer ')[1];

        // Sign out from Supabase Auth
        await supabase.auth.admin.signOut(token);

        console.log('✅ User signed out');
        res.json({ success: true, message: 'Signed out successfully' });
    } catch (error) {
        console.error('Sign out error:', error);
        // Even if signout fails, return success (client will clear local state)
        res.json({ success: true });
    }
};



/**
 * Check user access rights
 * Verifies both Premium status and valid one-time purchases (30 days)
 * Replaces client-side verification to bypass RLS issues with null user_ids in transactions
 */
const checkAccess = async (req, res) => {
    try {
        // req.user is attached by middleware
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const email = req.user.email;
        console.log(`🔐 Access Check for: ${email}`);

        // 1. Check Premium Status from Users Table
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('is_premium')
            .eq('email', email)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('User fetch error:', userError);
        }

        if (user && user.is_premium) {
            console.log(`✅ Premium access confirmed for ${email}`);
            return res.json({
                hasPremiumAccess: true,
                hasCoverLetterAccess: true,
                hasInterviewPrepAccess: true,
                isPaid: true
            });
        }

        // 2. Check Valid Transactions (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('product_type, status, created_at')
            .eq('email', email)
            .eq('status', 'completed')
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (txError) {
            console.error('Transaction fetch error:', txError);
            return res.json({
                hasPremiumAccess: false,
                hasCoverLetterAccess: false,
                hasInterviewPrepAccess: false,
                isPaid: false
            });
        }

        const access = {
            hasPremiumAccess: false,
            hasCoverLetterAccess: false,
            hasInterviewPrepAccess: false,
            isPaid: false
        };

        if (transactions && transactions.length > 0) {
            transactions.forEach(tx => {
                const type = tx.product_type;
                if (type === 'cv_download') access.isPaid = true;
                if (type === 'cover_letter') access.hasCoverLetterAccess = true;
                if (type === 'interview_prep') access.hasInterviewPrepAccess = true;
                if (type === 'premium') { // Just in case
                    access.hasPremiumAccess = true;
                    access.isPaid = true;
                    access.hasCoverLetterAccess = true;
                    access.hasInterviewPrepAccess = true;
                }
            });
        }

        console.log(`ℹ️ Access Report for ${email}:`, JSON.stringify(access));
        res.json(access);

    } catch (error) {
        console.error('Check access error:', error);
        res.status(500).json({ error: 'Failed to check access' });
    }
};

module.exports = {
    sendMagicLink,
    getCurrentUser,
    signOut,
    checkAccess
};
