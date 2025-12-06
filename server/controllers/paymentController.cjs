const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { sendAdminNotification, sendWelcomeEmail } = require('../services/emailService.cjs');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: Get or create Stripe customer for logged-in users
const getOrCreateStripeCustomer = async (user) => {
    if (!user) return null;

    // If user already has customer ID, return it
    if (user.stripe_customer_id) {
        return user.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
    });

    // Save customer ID to database
    await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id);

    return customer.id;
};

// Enhanced session creation with email locking
const createStripeSession = async (req, res, { priceData, mode = 'payment', successPath = '/success', cancelPath = '/cancel', productType }) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY || !stripe) {
            console.error("Missing STRIPE_SECRET_KEY");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const sessionConfig = {
            payment_method_types: ['card'],
            mode: mode,
            line_items: [{
                price_data: priceData,
                quantity: 1,
            }],
            success_url: `${FRONTEND_URL}${successPath}${successPath.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&payment_success=true`,
            cancel_url: `${FRONTEND_URL}${cancelPath}`,
            metadata: { type: productType }
        };

        // IF USER LOGGED IN: Lock email with Customer ID
        if (req.user && req.user.email) {
            const customerId = await getOrCreateStripeCustomer(req.user);
            sessionConfig.customer = customerId; // Email LOCKED
            console.log(`✅ Email locked for user ${req.user.email}`);
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error.message);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
};

// Webhook handler for checkout completion
const handleCheckoutComplete = async (session) => {
    try {
        let email, userId;

        // Get email and user ID - try multiple sources
        if (session.customer) {
            const customer = await stripe.customers.retrieve(session.customer);
            email = customer.email;
            userId = customer.metadata?.user_id;
        } else if (session.customer_details?.email) {
            // Stripe Checkout provides email in customer_details
            email = session.customer_details.email;
        } else if (session.customer_email) {
            email = session.customer_email;
        }

        if (!email) {
            console.error('No email found in session', JSON.stringify(session, null, 2));
            return;
        }

        const productType = session.metadata?.type || 'unknown';
        const amount = (session.amount_total / 100).toFixed(2);

        // Find or create user
        let { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) {
            // AUTO-CREATE USER
            const { data: newUser } = await supabase
                .from('users')
                .insert({
                    email: email,
                    is_premium: productType === 'premium',
                    stripe_customer_id: session.customer,
                    stripe_subscription_id: session.subscription,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            user = newUser;
            console.log(`✅ New user auto-created: ${email}`);

            // Send welcome email
            if (productType === 'premium') {
                await sendWelcomeEmail(email);
            }
        } else {
            // Update existing user
            const updates = {};
            if (productType === 'premium') {
                updates.is_premium = true;
                updates.stripe_subscription_id = session.subscription;
            }
            if (session.customer) {
                updates.stripe_customer_id = session.customer;
            }

            await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);
        }

        // Log transaction
        await supabase
            .from('transactions')
            .insert({
                user_id: user?.id,
                email: email,
                product_type: productType,
                amount: session.amount_total,
                currency: session.currency,
                stripe_session_id: session.id,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                status: 'completed'
            });

        console.log(`✅ Transaction logged for ${email}`);

        // Send admin notification (non-blocking - don't fail if email fails)
        try {
            await sendAdminNotification('new_sale', {
                email: email,
                product_type: productType,
                amount: amount,
                stripe_session_id: session.id
            });
            console.log('✅ Admin notification sent');
        } catch (emailError) {
            console.error('⚠️ Failed to send admin notification (non-critical):', emailError.message);
            // Don't throw - transaction already logged
        }

        console.log(`✅ Transaction logged for ${email}: ${productType} - $${amount}`);
    } catch (error) {
        console.error('Webhook error:', error);
    }
};

// Payment verification endpoint for temp premium access
const verifyPayment = async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ success: false, error: 'Session ID required' });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            res.json({
                success: true,
                email: session.customer_email || (await stripe.customers.retrieve(session.customer)).email,
                type: session.metadata?.type || 'unknown',
                amount: (session.amount_total / 100).toFixed(2)
            });
        } else {
            res.status(400).json({ success: false, error: 'Payment not completed' });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
};

// Product-specific session creators
const createCvDownloadSession = async (req, res) => {
    if (process.env.PAYMENTS_ENABLED !== 'true') {
        return res.status(503).json({ error: "payments_disabled" });
    }
    await createStripeSession(req, res, {
        priceData: {
            currency: 'usd',
            product_data: {
                name: 'Optimized CV Download',
                description: 'Unlock your ATS-optimized, AI-rewritten CV in DOCX format.',
            },
            unit_amount: 499,
        },
        productType: 'cv_download',
        successPath: '/?type=cv_download',
    });
};

const createCoverLetterSession = async (req, res) => {
    if (process.env.PAYMENTS_ENABLED !== 'true') {
        return res.status(503).json({ error: "payments_disabled" });
    }
    await createStripeSession(req, res, {
        priceData: {
            currency: 'usd',
            product_data: {
                name: 'Unlimited Cover Letters',
                description: 'Generate tailored cover letters for every job application.',
            },
            unit_amount: 399,
        },
        productType: 'cover_letter',
        successPath: '/?type=cover_letter',
    });
};

const createInterviewPrepSession = async (req, res) => {
    if (process.env.PAYMENTS_ENABLED !== 'true') {
        return res.status(503).json({ error: "payments_disabled" });
    }
    await createStripeSession(req, res, {
        priceData: {
            currency: 'usd',
            product_data: {
                name: 'Full Interview Prep Kit',
                description: 'Unlock 15-20 tailored questions, STAR answers, and behavioral insights.',
            },
            unit_amount: 699,
        },
        productType: 'interview_prep',
        successPath: '/?type=interview_prep',
    });
};

const createPremiumSession = async (req, res) => {
    if (process.env.PAYMENTS_ENABLED !== 'true') {
        return res.status(503).json({ error: "payments_disabled" });
    }
    const { billing } = req.body;
    const isYearly = billing === 'yearly';

    await createStripeSession(req, res, {
        mode: 'subscription',
        priceData: {
            currency: 'usd',
            product_data: {
                name: 'GoGlobalCV Premium',
                description: 'Unlimited access to CV Analysis, Cover Letters, and Interview Prep.',
            },
            recurring: {
                interval: isYearly ? 'year' : 'month',
            },
            unit_amount: isYearly ? 3999 : 999,
        },
        productType: 'premium',
        successPath: '/?type=premium',
    });
};

module.exports = {
    createCvDownloadSession,
    createCoverLetterSession,
    createInterviewPrepSession,
    createPremiumSession,
    handleCheckoutComplete,
    verifyPayment
};
