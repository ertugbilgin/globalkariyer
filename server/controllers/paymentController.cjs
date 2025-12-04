const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const createStripeSession = async (req, res, { priceData, mode = 'payment', successPath = '/success', cancelPath = '/cancel' }) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("Missing STRIPE_SECRET_KEY");
            return res.status(500).json({ error: "Server configuration error: Missing Stripe keys." });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: mode,
            line_items: [
                {
                    price_data: priceData,
                    quantity: 1,
                },
            ],
            success_url: `${FRONTEND_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}${cancelPath}`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error.message);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
};

// 1. CV Download - $4.99
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
            unit_amount: 499, // $4.99
        },
        successPath: '/success?type=cv_download',
    });
};

// 2. Cover Letter - $3.99
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
            unit_amount: 399, // $3.99
        },
        successPath: '/success?type=cover_letter',
    });
};

// 3. Interview Prep - $6.99
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
            unit_amount: 699, // $6.99
        },
        successPath: '/success?type=interview_prep',
    });
};

// 4. Premium Subscription - $9.99/month
const createPremiumSession = async (req, res) => {
    if (process.env.PAYMENTS_ENABLED !== 'true') {
        return res.status(503).json({ error: "payments_disabled" });
    }
    const { billing } = req.body; // 'monthly' or 'yearly'
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
            unit_amount: isYearly ? 3999 : 999, // $39.99/year or $9.99/month
        },
        successPath: '/success?type=premium',
    });
};

module.exports = {
    createCvDownloadSession,
    createCoverLetterSession,
    createInterviewPrepSession,
    createPremiumSession
};
