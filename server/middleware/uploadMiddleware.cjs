const multer = require('multer');

const storage = multer.memoryStorage();

// File validation
const fileFilter = (req, file, cb) => {
    // Allowed MIME types
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'text/plain'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'), false);
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5 // Max 5 files per request
    }
});

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    if (err) {
        return res.status(400).json({ error: err.message });
    }

    next();
};

module.exports = { upload, handleUploadError };
