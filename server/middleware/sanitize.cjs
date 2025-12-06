const validator = require('validator');

// Sanitize and validate request inputs
const sanitizeInput = (req, res, next) => {
    // Sanitize email
    if (req.body.email) {
        req.body.email = validator.normalizeEmail(req.body.email, {
            all_lowercase: true,
            gmail_remove_dots: false
        });

        // Validate email format
        if (!validator.isEmail(req.body.email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Prevent email injection (newlines in email)
        if (req.body.email.includes('\n') || req.body.email.includes('\r')) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
    }

    // Sanitize job description (remove potentially harmful HTML/scripts)
    if (req.body.jobDescription) {
        req.body.jobDescription = validator.escape(req.body.jobDescription);
    }

    // Sanitize text inputs
    if (req.body.companyName) {
        req.body.companyName = validator.escape(req.body.companyName);
    }

    if (req.body.role) {
        req.body.role = validator.escape(req.body.role);
    }

    next();
};

module.exports = { sanitizeInput };
