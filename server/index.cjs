const express = require('express');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const { analyzeCV } = require('./controllers/analyzeController.cjs');

const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 5001;
const upload = multer({ storage: multer.memoryStorage() });

// Render/Vercel gibi proxy arkasında çalışırken IP adreslerini doğru almak için gerekli
app.set('trust proxy', 1);

// Rate Limiting (Güvenlik Duvarı)
// Rate Limiting: 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: "Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use('/analyze', limiter); // Apply only to analyze endpoint
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Motor v52.0 (Strict Mode) Hazır!'));

app.post('/analyze', upload.any(), analyzeCV);

app.listen(PORT, () => {
  console.log(`\n🚀 MOTOR v52.0(STRICT MODE) ÇALIŞIYOR! Port: ${PORT}`);
});