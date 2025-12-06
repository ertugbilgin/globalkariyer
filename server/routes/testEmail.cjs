const express = require('express');
const { Resend } = require('resend');

const router = express.Router();

/**
 * Test Resend Configuration
 * GET /api/test-email
 */
router.get('/test-email', async (req, res) => {
    try {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error('RESEND_API_KEY is missing in environment variables');
        }

        // Resend doesn't have a verify method like SMTP, so we just check config
        res.json({
            success: true,
            message: 'Resend configured successfully',
            config: {
                provider: 'Resend',
                key_configured: true,
                key_prefix: apiKey.substring(0, 5) + '...'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Send test email via Resend
 * GET /api/test-email/send
 */
router.get('/test-email/send', async (req, res) => {
    try {
        const testEmail = req.query.to || process.env.ADMIN_EMAIL;
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'RESEND_API_KEY is missing' });
        }

        if (!testEmail) {
            return res.status(400).json({ error: 'No recipient email provided' });
        }

        const resend = new Resend(apiKey);

        const data = await resend.emails.send({
            from: 'GoGlobalCV Test <test@goglobalcv.com>',
            to: testEmail,
            subject: 'Resend API Test',
            html: '<p>If you receive this, <strong>Resend API is working!</strong> 🚀</p>'
        });

        res.json({
            success: true,
            message: 'Test email sent via Resend',
            id: data.id,
            details: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error
        });
    }
});

module.exports = router;
