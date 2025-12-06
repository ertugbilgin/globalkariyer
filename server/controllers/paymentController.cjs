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
            success_url: `${FRONTEND_URL}/?payment_success=true&feature=${productType}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/?payment_cancelled=true`,
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

            console.log(`✅ Existing user updated: ${email}`);
        }

        // Send welcome email for premium purchases (both new and existing users)
        if (productType === 'premium') {
            try {
                await sendWelcomeEmail(email);
                console.log(`✅ Welcome email sent to ${email}`);
            } catch (emailError) {
                console.error(`⚠️ Failed to send welcome email: ${emailError.message}`);
                // Don't throw - email is non-critical
            }
        }

        // Log transaction (idempotent - check if already exists)
        const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('stripe_session_id', session.id)
            .single();

        if (!existingTransaction) {
            const { data: transactionData, error: transactionError } = await supabase
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
                })
                .select();

            if (transactionError) {
                console.error('❌ Failed to log transaction:', transactionError);
                // Don't throw - continue to send emails
            } else {
                console.log(`✅ Transaction logged for ${email}`, transactionData);
            }
        } else {
            console.log(`ℹ️ Transaction already exists for session ${session.id}, skipping`);
        }

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
                subscription_id: session.subscription,
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

// Create Stripe Customer Portal session
const createPortalSession = async (req, res) => {
    try {
        const { session_id, email } = req.body;

        if (!session_id && !email) {
            return res.status(400).json({ error: "Session ID or Email required" });
        }

        let customerId;

        if (session_id) {
            // Retrieve the session to get the customer ID
            const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
            customerId = checkoutSession.customer;
        } else if (email) {
            // Look up user in Supabase to get stripe_customer_id
            const { data: user } = await supabase
                .from('users')
                .select('stripe_customer_id')
                .eq('email', email)
                .single();

            if (user && user.stripe_customer_id) {
                customerId = user.stripe_customer_id;
            }
        }

        if (!customerId) {
            return res.status(404).json({ error: "Customer not found. You may not have an active subscription." });
        }

        // Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${FRONTEND_URL}/`,
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('Portal session error:', error);
        res.status(500).json({ error: "Failed to create portal session" });
    }
};

// Webhook handler for refunds
const handleRefund = async (charge) => {
    try {
        console.log('💸 Processing Refund:', charge.id);
        const paymentIntentId = charge.payment_intent;

        if (!paymentIntentId) {
            console.log('⚠️ No payment intent for refund');
            return;
        }

        // We stored payment_intent_id implicitly or via metadata? 
        // Actually our transactions table has stripe_session_id.
        // We need to match charge -> payment_intent -> session? 
        // Or updated logic: when charge.refunded comes, we usually have payment_intent. 
        // Let's first try to find by payment_intent or related session.

        // BETTER: Use charge.payment_intent to match if we stored it?
        // Wait, our `transactions` table schema might rely on stripe_session_id. 
        // Let's try to query by stripe_session_id if we can get it from payment intent, 
        // OR simply add `stripe_payment_intent_id` to transactions if missing.

        // For now, let's assume we can query via metadata or just search.
        // If we don't have payment_intent in DB, we rely on `stripe_customer_id` + amount? No risky.

        // Plan B: Retrieve Session from Payment Intent?
        // Stripe doesn't easily link back PI -> Session without expansion.

        // SIMPLER APPROACH:
        // Update user status directly if we can identify user.
        const customerId = charge.customer;
        const email = charge.billing_details?.email; // often null in events

        // Let's try to find transaction by `stripe_customer_id` AND `amount`.
        // Or if we stored payment_intent.

        // Let's retrieve the PaymentIntent to see if it has metadata
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        // Usually checkout sessions add metadata to PI.

        // If we can't find exact transaction easily, let's log it.
        // BUT for MVP:
        // Let's look up transaction by stripe_customer_id and status='completed' 
        // ordered by created_at desc (most recent).

        const amountRefunded = charge.amount_refunded / 100;

        // Try to update transaction status
        // We need a reliable way. Let's assume we can try matching by customer_id and amount for now 
        // if we didn't store PI. 
        // (Checking schema: transactions has stripe_session_id, stripe_customer_id).

        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('stripe_customer_id', customerId)
            .eq('amount', amountRefunded) // Match amount
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1);

        if (transactions && transactions.length > 0) {
            const tx = transactions[0];
            await supabase
                .from('transactions')
                .update({ status: 'refunded', refunded_at: new Date().toISOString() })
                .eq('id', tx.id);
            console.log(`✅ Transaction ${tx.id} marked as REFUNDED`);

            // If it was Premium, revoke user status
            if (tx.product_type === 'premium') {
                await supabase
                    .from('users')
                    .update({ is_premium: false })
                    .eq('stripe_customer_id', customerId);
                console.log(`📉 Premium access revoked for customer ${customerId}`);
            }
        } else {
            console.log('⚠️ Could not find matching completed transaction for refund');
        }

    } catch (error) {
        console.error('Refund handler error:', error);
    }
};

module.exports = {
    createCvDownloadSession,
    createCoverLetterSession,
    createInterviewPrepSession,
    createPremiumSession,
    handleCheckoutComplete,
    verifyPayment,
    createPortalSession,
    handleRefund
};
