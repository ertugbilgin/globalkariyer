const express = require('express');
const { transporter } = require('./services/emailService.cjs');

const router = express.Router();

/**
 * Test SMTP connection
 * GET /api/test-email
 */
router.get('/test-email', async (req, res) => {
    try {
        // Verify SMTP connection
        await transporter.verify();

        res.json({
            success: true,
            message: 'SMTP connection verified successfully',
            config: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                // Don't send password!
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            command: error.command
        });
    }
});

/**
 * Send test email
 * GET /api/test-email/send
 */
router.get('/test-email/send', async (req, res) => {
    try {
        const testEmail = req.query.to || process.env.ADMIN_EMAIL;

        if (!testEmail) {
            return res.status(400).json({ error: 'No recipient email provided' });
        }

        const info = await transporter.sendMail({
            from: `"Test" <${process.env.SMTP_USER}>`,
            to: testEmail,
            subject: 'SMTP Test Email',
            text: 'If you receive this, SMTP is working!',
            html: '<p>If you receive this, <strong>SMTP is working!</strong></p>'
        });

        res.json({
            success: true,
            message: 'Test email sent',
            messageId: info.messageId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});

module.exports = router;
