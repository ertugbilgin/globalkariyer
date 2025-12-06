const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { analyzeCV } = require('./controllers/analyzeController.cjs');
const { createCoverLetter } = require('./controllers/coverLetterController.cjs');
const {
  createCvDownloadSession,
  createCoverLetterSession,
  createInterviewPrepSession,
  createPremiumSession
} = require('./controllers/paymentController.cjs');
const { initCronJobs } = require('./services/cronJobs.cjs');
const { requireAdmin } = require('./middleware/adminAuth.cjs');
const adminController = require('./controllers/adminController.cjs');

const { upload, handleUploadError } = require('./middleware/uploadMiddleware.cjs');
const { sanitizeInput } = require('./middleware/sanitize.cjs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy
app.set('trust proxy', 1);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS configuration
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/analyze', limiter);
app.use('/cover-letter', limiter);
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('✅ Motor v52.0 (Strict Mode) Hazır!'));

// Analysis routes
app.post('/analyze', upload.any(), handleUploadError, sanitizeInput, analyzeCV);
app.post('/cover-letter', createCoverLetter);
app.post('/interview-prep', require('./controllers/interviewPrepController.cjs').createInterviewPrep);
app.post('/job-match', require('./controllers/jobMatchController.cjs').analyzeJobMatch);

// Payment routes
app.post('/pay/cv-download', createCvDownloadSession);
app.post('/pay/cover-letter', createCoverLetterSession);
app.post('/pay/interview-prep', createInterviewPrepSession);
app.post('/pay/premium', createPremiumSession);

// Admin routes
app.get('/api/admin/analytics/overview', requireAdmin, adminController.getAnalyticsOverview);
app.get('/api/admin/analytics/revenue', requireAdmin, adminController.getRevenueBreakdown);
app.get('/api/admin/transactions', requireAdmin, adminController.getTransactions);
app.get('/api/admin/users/stats', requireAdmin, adminController.getUserStats);
app.get('/api/admin/performance', requireAdmin, adminController.getPerformanceMetrics);

// Initialize cron jobs
initCronJobs();

app.listen(PORT, () => {
  console.log(`\n🚀 MOTOR v52.0(STRICT MODE) ÇALIŞIYOR! Port: ${PORT}`);
  console.log(`📊 Admin Analytics: ${process.env.ADMIN_EMAIL ? 'Enabled' : 'Disabled'}`);
  console.log(`📧 Email Notifications: ${process.env.ADMIN_EMAIL || 'Not configured'}`);
});