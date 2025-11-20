const express = require('express');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const { analyzeCV } = require('./controllers/analyzeController.cjs');

const app = express();
const PORT = process.env.PORT || 5001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Motor v52.0 (Strict Mode) Hazır!'));

app.post('/analyze', upload.any(), analyzeCV);

app.listen(PORT, () => {
  console.log(`\n🚀 MOTOR v52.0(STRICT MODE) ÇALIŞIYOR! Port: ${PORT}`);
});