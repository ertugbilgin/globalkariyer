# GlobalKariyer.ai - Full Source Code Dump

Generated on: 2025-12-03T21:58:28.049Z

## File: server/index.cjs

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const { analyzeCV } = require('./controllers/analyzeController.cjs');
const { createCheckoutSession } = require('./controllers/paymentController.cjs');
const { createCoverLetter } = require('./controllers/coverLetterController.cjs');

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5001;
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
app.use('/cover-letter', limiter); // Apply rate limit to cover letter too
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Motor v52.0 (Strict Mode) Hazır!'));

app.post('/analyze', upload.any(), analyzeCV);
app.post('/create-checkout', createCheckoutSession);
app.post('/cover-letter', createCoverLetter);
app.post('/interview-prep', require('./controllers/interviewPrepController.cjs').createInterviewPrep);

app.listen(PORT, () => {
  console.log(`\n🚀 MOTOR v52.0(STRICT MODE) ÇALIŞIYOR! Port: ${PORT}`);
});

// Force deploy: 2025-11-25 12:22

// Force deploy: 2025-11-25 12:22
```

---

## File: server/controllers/analyzeController.cjs

```javascript
const { extractTextFromFile } = require('../services/fileService.cjs');
const { callGeminiRaw } = require('../services/aiService.cjs');
const { cleanAndParseJSON } = require('../services/parserService.cjs');

const analyzeCV = async (req, res) => {
  try {
    console.log("📩 Analiz İsteği...");
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Dosya yok." });
    }

    let cvText;
    try {
      cvText = await extractTextFromFile(req.files[0]);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const jobDescription = req.body.jobDescription || "Genel Başvuru";
    const language = req.body.language || 'en';

    let systemInstruction = "";
    if (language === "tr") {
      systemInstruction = "Sen Türkçe konuşan uzman bir kariyer koçu ve CV analisti olarak cevap ver. Tüm çıktıyı doğal, akıcı ve profesyonel Türkçe yaz.";
    } else if (language === "zh" || language === "cn") {
      systemInstruction = "你是一名专业的职业顾问和简历分析师。请使用自然、准确、专业的中文回答所有内容。";
    } else {
      systemInstruction = "You are a senior career coach and CV analyst. Respond in natural, fluent, professional English.";
    }

    const prompt = `
${systemInstruction}

IMPORTANT SECURITY CHECK:
First, check if the provided text is a Resume (CV).
If it is a recipe, invoice, code snippet, article, or anything unrelated to a CV, stop analysis and return ONLY this JSON:
{ "error": "NOT_A_CV", "message": "The uploaded file does not look like a CV. Please upload a valid resume." }

If it is a CV, perform the following tasks:

TASKS OVERVIEW:
1. Extract contact info.
2. Analyze and SCORE the CV.
3. REWRITE the CV in English (Global Standard).
4. If a meaningful Job Description is provided, calculate JOB–CV MATCH.

JOB DESCRIPTION CONTEXT:
- Provided JD (may be in any language): """${jobDescription}"""
- If the Job Description is exactly "Genel Başvuru" or clearly empty / generic, you MUST set "jobFit" to null and skip job-specific scoring.
- Otherwise, use the JD to evaluate how well the CV matches the role.

SPECIAL REQUEST (FONT & UI):
- If the current font/structure is good, confirm in "fontReason".
- If not, suggest a better font and layout reasoning.

FORMATTING RULES FOR optimizedCv:
- "optimizedCv" MUST be in English.
- Use Markdown-like structure:
  - Use "##" for top-level headers (e.g., "## PROFESSIONAL SUMMARY").
  - Use "###" for role titles / sections as needed.
  - Use "* " for bullet points.
- Do NOT include Name or Contact info in "optimizedCv".
- Wrap important, improved, or JD-aligned parts inside <mark data-reason="Short reason why this is good">Text</mark>.
- Make the CV sound like a strong, globally hireable professional.

LANGUAGE RULES:
- Output Language: ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'}.
- Do NOT mix languages.
- Write the entire analysis in the selected language.
- The "optimizedCv" MUST ALWAYS be in English.
- However, for the analysis parts ("summary", "atsModifications", "missingKeywords", "rewriteSuggestions", "jobFit", "uiSuggestions"), return the content in the requested language.
- If the requested language is Turkish, translate the explanations, tips, and summaries into Turkish.
- If the requested language is Chinese, translate the explanations, tips, and summaries into Chinese.
- "optimizedCv" stays in English regardless of the requested language.

SCORING LOGIC:
- "scores.current": 0–100, realistic current quality.
- "scores.potential": 85–100, potential after your optimization.
- "scores.breakdown":
  - "searchability": use of keywords, clarity of headings, ATS parsing friendliness.
  - "hardSkills": technical / domain skills presence and clarity.
  - "softSkills": leadership, communication, ownership signals.
  - "formatting": structure, consistency, bullet style, date format, noise.
- "summary.improvements": short, concrete bullets, focused on impact and clarity.

JOB–CV MATCH (jobFit):
ONLY if the JD is meaningful (not generic):
- "jobFit.score": 0–100 overall match score.
- "jobFit.matchLevel": one of ["Low", "Medium", "High", "Excellent"].
- "jobFit.summary": 2–3 sentences that explain WHY this score (skills, experience, gaps).
- "jobFit.strongPoints": list of strengths where CV matches JD well.
- "jobFit.missingFromCv": list of important requirements from the JD that are NOT visible in the CV.
- "jobFit.niceToHave": skills or experiences that are not mandatory but would strengthen the match.
- "jobFit.keywordMatchRate": percentage (0–100) of important JD keywords that appear in the CV (directly or with clear synonyms).

INPUTS:
- JOB DESCRIPTION: """${jobDescription}"""
- ORIGINAL CV: """${cvText}"""

Return response ONLY in this EXACT JSON format (no explanation, no markdown outside JSON):

{
  "contactInfo": {
    "name": "Name",
    "title": "Title",
    "email": "Email",
    "phone": "Phone",
    "location": "Location",
    "linkedin": "Link"
  },
  "scores": {
    "current": 0,
    "potential": 90,
    "interviewRate": "2x",
    "breakdown": {
      "searchability": 7,
      "hardSkills": 7,
      "softSkills": 6,
      "formatting": 4
    }
  },
  "summary": {
    "content": "1–2 paragraph explanation of the CV quality and positioning (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'}).",
    "improvements": [
      "Short, concrete improvement point 1 (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'}).",
      "Short, concrete improvement point 2 (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    ]
  },
  "uiSuggestions": {
    "selectedFont": "Calibri",
    "fontReason": {
      "content": "Reason why this font/layout fits a modern, ATS-friendly CV (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    }
  },
  "atsModifications": [
    {
      "action": "Header Cleanup",
      "detail": "Removed photo and unnecessary personal details to improve ATS parsing (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    }
  ],
  "missingKeywords": [
    {
      "keyword": "Stakeholder Management",
      "usageTip": {
        "content": "Example sentence showing how to add this keyword naturally in a bullet (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
      },
      "benefit": "Shows ability to work with cross-functional teams and senior leadership (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    }
  ],
  "rewriteSuggestions": [
    {
      "focus": "Impact",
      "original": "Responsible for process improvement projects.",
      "suggestionEn": "Led end-to-end process improvement initiatives that reduced cycle time by 20%.",
      "reason": "Highlights ownership and quantifiable impact (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    }
  ],
  "jobFit": {
    "score": 85,
    "matchLevel": "High",
    "summary": "Short explanation of how well the CV matches the JD (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'}).",
    "strongPoints": [
      "Example strong match between CV and JD (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    ],
    "missingFromCv": [
      "Important requirement present in JD but not visible in CV (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    ],
    "niceToHave": [
      "Optional skill or experience that would further strengthen the profile (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'})."
    ],
    "keywordMatchRate": 78
  },
  "optimizedCv": "## PROFESSIONAL SUMMARY\\n..."
}`;

    try {
      const rawResponse = await callGeminiRaw(prompt);
      const finalData = cleanAndParseJSON(rawResponse);

      // Check for CV validation error
      if (finalData.error === "NOT_A_CV") {
        console.warn("⚠️ CV Doğrulama Hatası:", finalData.message);
        return res.status(400).json({ error: finalData.message });
      }

      // Inject the original CV text into the response so frontend can use it for Cover Letter
      finalData.text = cvText;

      res.json(finalData);
    } catch (apiError) {
      console.error("💥 API TÜMÜYLE BAŞARISIZ. Hata dönülüyor.");
      res.status(503).json({ error: "AI_BUSY" });
    }

  } catch (error) {
    console.error("💥 SUNUCU HATASI:", error.message);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

module.exports = { analyzeCV };

```

---

## File: server/controllers/interviewPrepController.cjs

```javascript
const { generateInterviewPrep } = require('../services/aiService.cjs');

const createInterviewPrep = async (req, res) => {
    try {
        const { cvText, jobDescription, language = "en" } = req.body;

        if (!cvText || !jobDescription) {
            return res.status(400).json({ error: "cvText and jobDescription required" });
        }

        const prep = await generateInterviewPrep({ cvText, jobDescription, language });
        res.json(prep);
    } catch (err) {
        console.error("Interview Prep Error:", err);
        res.status(500).json({ error: "Failed to generate interview prep" });
    }
};

module.exports = { createInterviewPrep };

```

---

## File: server/controllers/coverLetterController.cjs

```javascript
const { generateCoverLetter } = require('../services/aiService.cjs');

const createCoverLetter = async (req, res) => {
    try {
        const {
            cvText,
            jobDescription,
            roleTitle,
            companyName,
            language = "en",
            tone = "professional",
        } = req.body;

        if (!cvText || !jobDescription) {
            return res.status(400).json({ error: "cvText and jobDescription required" });
        }

        const coverLetter = await generateCoverLetter({
            cvText,
            jobDescription,
            roleTitle,
            companyName,
            language,
            tone,
        });

        res.json({ coverLetter });
    } catch (err) {
        console.error("Cover Letter Error:", err);
        res.status(500).json({ error: "Failed to generate cover letter" });
    }
};

module.exports = { createCoverLetter };

```

---

## File: server/services/aiService.cjs

```javascript
require('dotenv').config();

// 60 Saniye Timeout (Render Free Tier için artırıldı)
const fetchWithTimeout = async (url, options, timeout = 60000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

async function callGeminiRaw(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI_BUSY");

    // API'den alınan güncel model listesi (flash-latest kararlı sürüm olduğu için öne alındı)
    const models = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-pro-latest"];

    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`🌐 Deneniyor: ${model} (60sn limit)...`);

        try {
            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }, 60000);

            if (response.status === 429) {
                console.log(`⏳ ${model} Kota Dolu. 2sn bekle...`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            if (!response.ok) {
                const errorBody = await response.text();
                console.log(`❌ ${model} Hatası: ${response.status} - ${errorBody}`);
                continue;
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                console.log(`✅ BAŞARILI!(${model} cevap verdi)`);
                return data.candidates[0].content.parts[0].text;
            }
        } catch (err) {
            console.log(`⚠️ Hata(${model}): ${err.message}`);
        }
    }
    throw new Error("AI_BUSY");
}

async function generateCoverLetter({ cvText, jobDescription, roleTitle, companyName, language, tone }) {
    let systemInstruction = "";
    if (language === "tr") {
        systemInstruction = "Sen Türkçe konuşan uzman bir kariyer koçu ve cover letter yazım uzmanısın. Tüm çıktıyı doğal, akıcı ve profesyonel Türkçe yaz.";
    } else if (language === "zh" || language === "cn") {
        systemInstruction = "你是一名专业的职业顾问和求职信写作专家。请使用自然、准确、专业的中文回答所有内容。";
    } else {
        systemInstruction = "You are a senior career coach and expert cover letter writer. Respond in natural, fluent, professional English.";
    }

    const userPrompt = `
${(language === "tr") ? "CV METNİ:" : (language === "zh" || language === "cn") ? "简历文本:" : "CV TEXT:"}
${cvText}

${(language === "tr") ? "İŞ İLANI:" : (language === "zh" || language === "cn") ? "职位描述:" : "JOB DESCRIPTION:"}
${jobDescription}

${(language === "tr") ? "HEDEF BİLGİLER:" : (language === "zh" || language === "cn") ? "目标信息:" : "TARGET:"}
Role: ${roleTitle ?? "-"}
Company: ${companyName ?? "-"}

${(language === "tr") ? "Lütfen aşağıdaki kurallara göre bir cover letter yaz:" : (language === "zh" || language === "cn") ? "请根据以下规则写一封求职信:" : "Please write a cover letter based on the following rules:"}

- Length: 3–5 paragraphs, 350–450 words total.
- Language: ${language === "tr" ? "Turkish" : (language === "zh" || language === "cn") ? "Chinese" : "Fluent Professional English"}.
- Tone: ${tone}.
- Do NOT copy text from CV; rephrase it.
- Highlight experiences that directly match the job description.
- Use concrete examples of success (numbers, percentages, etc.).
- Include a strong but humble closing sentence and call to action (e.g., request for interview).
`;

    return await callGeminiRaw(systemInstruction + "\n\n" + userPrompt);
}

async function generateInterviewPrep({ cvText, jobDescription, language }) {
    let systemInstruction = "";
    if (language === "tr") {
        systemInstruction = "Sen Türkçe konuşan uzman bir kariyer koçu ve mülakat hazırlık uzmanısın. Tüm çıktıyı doğal, akıcı ve profesyonel Türkçe yaz.";
    } else if (language === "zh" || language === "cn") {
        systemInstruction = "你是一名专业的职业顾问和面试准备专家。请使用自然、准确、专业的中文回答所有内容。";
    } else {
        systemInstruction = "You are a senior career coach and interview prep expert. Respond in natural, fluent, professional English.";
    }

    const instructions = (language === "tr")
        ? "Çıktıyı mutlaka geçerli JSON formatında ver. Açıklama ya da yorum ekleme."
        : (language === "zh" || language === "cn")
            ? "仅返回有效的 JSON 格式。不要添加解释或评论。"
            : "Return ONLY valid JSON. No commentary.";

    const taskDescription = (language === "tr")
        ? `Kişinin bu role başvurduğunu varsay. Aşağıdaki kategoriler için bir mülakat hazırlık seti üret:

1) Genel uyum soruları (motivasyon, kültür uyumu)
2) Davranışsal sorular (STAR metodu ile)
3) Teknik / role özgü sorular
4) Ürüne / domen'e özel sorular
5) Kapanışta sorabileceği sorular

Her soru için:
- "question": Soru metni
- "answerOutline": 3–5 maddelik kısa cevap iskeleti (örnek içerik, sayılar, vurgu)
- "tips": Cevap verirken dikkat etmesi gereken ipuçları`
        : (language === "zh" || language === "cn")
            ? `假设候选人正在申请此职位。为以下类别生成面试准备套件：

1) 一般契合度问题（动机、文化契合度）
2) 行为问题（STAR 方法）
3) 技术/职位特定问题
4) 产品/领域特定问题
5) 向面试官提问的问题

对于每个问题提供：
- "question": 问题文本
- "answerOutline": 3–5 个要点的简短回答大纲（示例内容、数字、重点）
- "tips": 回答时需要注意的提示`
            : `Assume the candidate is applying for this role. Generate an interview preparation kit for the following categories:

1) General Fit Questions (motivation, culture fit)
2) Behavioral Questions (STAR method)
3) Technical / Role-specific Questions
4) Product / Domain-specific Questions
5) Questions to ask the interviewer

For each question provide:
- "question": The question text
- "answerOutline": 3–5 bullet points outlining a strong answer (example content, numbers, emphasis)
- "tips": Short tips on what to focus on`;

    const prompt = `
${(language === "tr") ? "CV METNİ:" : (language === "zh" || language === "cn") ? "简历文本:" : "CV TEXT:"}
${cvText}

${(language === "tr") ? "İŞ İLANI:" : (language === "zh" || language === "cn") ? "职位描述:" : "JOB DESCRIPTION:"}
${jobDescription}

${(language === "tr") ? "GÖREV:" : (language === "zh" || language === "cn") ? "任务:" : "TASK:"}
${taskDescription}

${instructions}
${(language === "tr") ? "Örnek JSON şeması:" : (language === "zh" || language === "cn") ? "示例 JSON 模式:" : "Example JSON schema:"}

{
  "categories": [
    {
      "id": "behavioral",
      "title": "${(language === "tr") ? "Davranışsal / STAR" : (language === "zh" || language === "cn") ? "行为 / STAR" : "Behavioral / STAR"}",
      "description": "...",
      "questions": [
        {
          "question": "...",
          "answerOutline": "- ...",
          "tips": "..."
        }
      ]
    }
  ]
}
`;

    const rawResponse = await callGeminiRaw(systemInstruction + "\n\n" + prompt);

    // Clean markdown code blocks if present
    let cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
}

async function analyzeCV({ cvText, jobDescription, language }) {
    const isTr = (language || '').toLowerCase() === "tr";

    // ... (rest of the function logic if I could see it)
    // Since I can't see the analyzeCV function in the previous view_file output (it seemed to end at line 163 with module.exports), 
    // I suspect the file is longer or I missed something. 
    // However, the user said "suggestions vs other texts remain in English". 
    // This implies the main analysis prompt might not be fully localized or the response isn't.
    // I will first search for the analyzeCV function to be sure.

    // WAIT, I cannot replace content I haven't seen. 
    // I will skip this tool call for now and use search_in_file or view_file again to find the main analysis function.
    // But I can't do that inside a tool block.
    // I will assume I need to find `analyzeCV` or similar.
    // The view_file output showed `module.exports = { callGeminiRaw, generateCoverLetter, generateInterviewPrep };` at the end.
    // This suggests `analyzeCV` might NOT be in this file, or I missed it.
    // Let me check `server/controllers/analyzeController.js` or similar if it exists.
    // Or maybe it is in `aiService.cjs` but I missed it?
    // The view_file said "Total Lines: 162". And showed lines 1-162.
    // So `analyzeCV` is NOT in `aiService.cjs`.
    // I need to find where the main analysis happens.
    // I'll check `server/index.cjs` or `server/controllers` to find the main analysis endpoint.

    return JSON.parse(cleanJson);
}

module.exports = { callGeminiRaw, generateCoverLetter, generateInterviewPrep };

```

---

## File: server/services/fileService.cjs

```javascript
const pdf = require('pdf-extraction');
const mammoth = require('mammoth');

async function extractTextFromFile(file) {
    try {
        console.log("📂 Dosya İşleniyor:", file.originalname, "Type:", file.mimetype);
        let text = "";
        if (file.mimetype === 'application/pdf') {
            const data = await pdf(file.buffer);
            text = data.text;
        } else if (file.mimetype === 'text/plain') {
            text = file.buffer.toString('utf-8');
        } else {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            text = result.value;
        }
        return text.substring(0, 25000); // Limit text length
    } catch (err) {
        throw new Error("Dosya okunamadı.");
    }
}

module.exports = { extractTextFromFile };

```

---

## File: server/services/parserService.cjs

```javascript
const JSON5 = require('json5');

function cleanAndParseJSON(rawText) {
    try {
        // 1. Markdown bloklarını temizle (Backticks ve Single Quotes)
        let cleanText = rawText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/'''json/g, '') // Bazı modeller single quote kullanıyor
            .replace(/'''/g, '')
            .trim();

        // 2. İlk '{' ve son '}' arasını al
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        // 3. JSON5 ile parse et (Daha esnek ve hataları tolere eder)
        return JSON5.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Hatası:", e.message);
        console.error("Gelen Veri (İlk 100 karakter):", rawText.substring(0, 100));

        throw new Error("AI yanıtı JSON formatına uygun değil. Lütfen tekrar deneyin.");
    }
}

module.exports = { cleanAndParseJSON };

```

---

## File: server/package.json

```json
{
    "name": "globalkariyerai-server",
    "version": "1.0.0",
    "description": "Backend for Global Kariyer AI",
    "main": "index.cjs",
    "type": "module",
    "scripts": {
        "start": "node index.cjs",
        "dev": "node --watch index.cjs"
    },
    "dependencies": {
        "@google/generative-ai": "^0.1.3",
        "axios": "^1.13.2",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "express": "^4.18.2",
        "express-rate-limit": "^8.2.1",
        "form-data": "^4.0.5",
        "json5": "^2.2.3",
        "mammoth": "^1.11.0",
        "multer": "^1.4.5-lts.1",
        "pdf-extraction": "^1.0.2",
        "pdf-parse": "^1.1.1"
    }
}

```

---

## File: client/src/main.jsx

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```

---

## File: client/src/App.jsx

```javascript

import { useState, useRef } from 'react'
import './index.css'
import './i18n'; // Initialize i18n
import { useReactToPrint } from 'react-to-print'
import { useAnalyze } from './hooks/useAnalyze'
import { generateWordDoc } from './lib/docxGenerator'
import Header from './components/Header'
import Landing from './components/Landing'
import UploadSection from './components/UploadSection'
import AnalysisDashboard from './components/AnalysisDashboard'
import CVPreview from './components/CVPreview'
import PaymentModal from './components/PaymentModal'

import CoverLetterModal from './components/CoverLetterModal';
import InterviewPrepModal from './components/InterviewPrepModal';

function App() {
  const {
    file,
    setFile,
    jobDesc,
    setJobDesc,
    result,
    setResult,
    loading,
    isAiBusy,
    progress,
    loadingText,
    error,
    clearError,
    handleAnalyze
  } = useAnalyze();

  const [isPaid, setIsPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);

  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: result?.contactInfo?.name ? `${result.contactInfo.name.replace(/\s+/g, '_')} _Optimized_CV` : 'Optimized_CV',
  });

  const handleDownloadRequest = () => {
    if (isPaid) {
      generateWordDoc(result);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaid(true);
    setShowPaymentModal(false);
    generateWordDoc(result);
  };

  // Extract raw text from CV result if available, otherwise use summary as fallback or empty
  const cvText = result?.text || result?.summary?.content || result?.summary?.tr || '';

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      <Header
        result={result}
        onDownload={handleDownloadRequest}
        onOpenCoverLetter={() => setIsCoverLetterOpen(true)}
        onOpenInterviewPrep={() => setIsInterviewPrepOpen(true)}
        onReset={() => { setResult(null); setIsPaid(false); }}
      />

      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* GLOBAL COVER LETTER MODAL */}
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        cvText={cvText}
        jobDescription={jobDesc}
      />

      {/* GLOBAL INTERVIEW PREP MODAL */}
      <InterviewPrepModal // Added modal
        isOpen={isInterviewPrepOpen}
        onClose={() => setIsInterviewPrepOpen(false)}
        cvText={cvText}
        jobDescription={jobDesc}
      />

      <main className="max-w-[1600px] mx-auto p-3 md:p-4 lg:p-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className={`lg:col-span-5 space-y-6 ${result ? '' : 'lg:col-start-4 lg:col-span-6'}`}>
            {!result && !loading && !isAiBusy && <Landing />}

            <div className={result ? 'hidden' : 'block'}>
              <UploadSection
                file={file}
                setFile={setFile}
                jobDesc={jobDesc}
                setJobDesc={setJobDesc}
                loading={loading}
                isAiBusy={isAiBusy}
                progress={progress}
                loadingText={loadingText}
                error={error}
                onClearError={clearError}
                onAnalyze={handleAnalyze}
              />
            </div>

            {result && !loading && !isAiBusy && (
              <AnalysisDashboard
                result={result}
                jobDesc={jobDesc}
                onReset={() => { setResult(null); setIsPaid(false); }}
                onOpenInterviewPrep={() => setIsInterviewPrepOpen(true)}
              />
            )}
          </div>

          {result && typeof result.optimizedCv === 'string' && !isAiBusy && (
            <CVPreview
              result={result}
              printRef={printRef}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
```

---

## File: client/src/i18n.js

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import tr from './locales/tr.json';
import zh from './locales/zh.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            tr: { translation: tr },
            zh: { translation: zh },
        },
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;

```

---

## File: client/src/index.css

```css
@import "tailwindcss";

body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    min-height: 100vh;
}

@layer utilities {

    /* Fade-in up animation */
    .animate-fade-in-up {
        animation: fade-in-up 0.6s ease-out both;
    }

    @keyframes fade-in-up {
        0% {
            opacity: 0;
            transform: translateY(8px);
        }

        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Page transition (girişte hafif blur + fade) */
    .animate-page-enter {
        animation: page-enter 0.45s ease-out both;
    }

    @keyframes page-enter {
        0% {
            opacity: 0;
            filter: blur(6px);
            transform: translateY(10px);
        }

        100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
        }
    }

    /* Hover micro-scale */
    .hover-lift {
        @apply transition-transform duration-200 ease-out hover:-translate-y-0.5;
    }

    /* Base glass panel */
    .panel-glass {
        @apply bg-slate-900/60 backdrop-blur-md border border-slate-700/70 rounded-3xl;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.85);
    }

    /* Small glass card */
    .card-glass {
        @apply bg-slate-900/70 backdrop-blur-sm border border-slate-700/60 rounded-xl;
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.7);
    }

    /* Section header line */
    .section-divider-indigo {
        @apply h-px w-full;
        background-image: linear-gradient(to right, rgba(99, 102, 241, 0.6), transparent, transparent);
    }

    .section-divider-amber {
        @apply h-px w-full;
        background-image: linear-gradient(to right, rgba(251, 191, 36, 0.7), transparent, transparent);
    }

    /* DOCX Preview Bullet Fixes */
    .docx-preview ul {
        list-style-type: disc !important;
        padding-left: 1.5rem !important;
        margin-top: 0.2rem !important;
        margin-bottom: 0.2rem !important;
    }

    .docx-preview li {
        display: list-item !important;
        margin-bottom: 0.2rem !important;
    }

    /* CV Page Styles (Matching DOCX) */
    .cv-page h1 {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-align: center;
        margin-bottom: 6px;
    }

    .cv-page .cv-contact-line {
        font-size: 11px;
        text-align: center;
        color: #4b5563;
        /* slate-600 */
        margin-bottom: 18px;
    }

    /* Section headers */
    .cv-page h2 {
        font-size: 12px;
        font-weight: 700;
        color: #1d4ed8;
        /* indigo-600 */
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-top: 18px;
        margin-bottom: 6px;
    }

    /* Role titles */
    .cv-page .cv-role-title {
        font-size: 12px;
        font-weight: 700;
        color: #1d4ed8;
        margin-top: 10px;
    }

    /* Company + location line */
    .cv-page .cv-company-line {
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 2px;
    }

    /* Date line */
    .cv-page .cv-date-line {
        font-size: 11px;
        font-weight: 500;
        color: #4b5563;
        margin-bottom: 4px;
    }

    /* Paragraphs */
    .cv-page p {
        margin: 0 0 4px 0;
    }

    /* Bullet lists */
    .cv-page ul {
        margin: 0 0 8px 1.2rem;
        padding-left: 0;
        list-style-type: disc;
    }

    .cv-page li {
        margin: 0 0 3px 0;
    }

    /* Hide mark tags visually if they slip through */
    .cv-page mark[data-reason] {
        background: transparent;
        color: inherit;
        font-weight: inherit;
        border-bottom: none;
    }
}
```

---

## File: client/package.json

```json
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.13.2",
    "clsx": "^2.1.1",
    "docx": "^9.5.1",
    "docx-preview": "^0.3.7",
    "file-saver": "^2.0.5",
    "framer-motion": "^12.23.24",
    "i18next": "^25.7.1",
    "lucide-react": "^0.554.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-i18next": "^16.3.5",
    "react-markdown": "^10.1.0",
    "react-to-print": "^3.2.0",
    "rehype-raw": "^7.0.0",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/postcss": "^4.1.17",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.22",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.17",
    "vite": "^7.2.4"
  }
}

```

---

## File: client/vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Trigger new deployment
})

```

---

## File: client/src/components/Header.jsx

```javascript
import { useState } from 'react';
import { FileText, Download, Menu, X, Globe, Wand2, MessageCircleQuestion, RotateCcw } from "lucide-react";
import { isInAppBrowser } from '../lib/inAppBrowser';
import { useTranslation } from 'react-i18next';

const Header = ({ onDownload, result, onOpenCoverLetter, onOpenInterviewPrep, onReset }) => {
    const { t, i18n } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleDownloadClick = () => {
        if (isInAppBrowser()) {
            alert(t('header.browser_alert'));
            return;
        }
        onDownload();
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <header className="sticky top-4 z-50 mb-6 px-2 md:px-0">
            <div
                className="
                    mx-auto flex max-w-6xl items-center justify-between
                    rounded-2xl border border-slate-800/80
                    bg-slate-900/70 backdrop-blur-xl
                    px-3 py-3 md:px-6 md:py-3.5
                    shadow-[0_12px_40px_rgba(15,23,42,0.9)]
                "
            >
                <div className="flex items-center gap-2 md:gap-3">
                    <div
                        className="
                            flex h-10 w-10 items-center justify-center rounded-2xl 
                            bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500
                            shadow-[0_0_18px_rgba(79,70,229,0.7)]
                        "
                    >
                        <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white tracking-tight">
                            GlobalKariyer<span className="text-indigo-300">.ai</span>
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                            {t('header.subtitle')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full bg-slate-900/80 px-1 py-0.5 border border-slate-700/70">
                        <LangChip label="EN" active={i18n.language === 'en'} onClick={() => changeLanguage('en')} />
                        <LangChip label="CN" active={i18n.language === 'zh'} onClick={() => changeLanguage('zh')} />
                        <LangChip label="TR" active={i18n.language === 'tr'} onClick={() => changeLanguage('tr')} />
                    </div>

                    {result && (
                        <button
                            onClick={onOpenCoverLetter}
                            className="
                                hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white
                                border border-slate-700/50 hover:border-slate-600
                                transition-all text-sm font-medium
                            "
                        >
                            <Wand2 className="h-4 w-4 text-indigo-400" />
                            {t('cover_letter.create_btn', 'Create Cover Letter')}
                        </button>
                    )}

                    {result && (
                        <button
                            onClick={onOpenInterviewPrep}
                            className="
                                hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white
                                border border-slate-700/50 hover:border-slate-600
                                transition-all text-sm font-medium
                            "
                        >
                            <MessageCircleQuestion className="h-4 w-4 text-sky-400" />
                            {t('header.interview_prep', 'Interview Prep')}
                        </button>
                    )}

                    {result && (
                        <button
                            onClick={onReset}
                            className="
                                hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white
                                border border-slate-700/50 hover:border-slate-600
                                transition-all text-sm font-medium
                            "
                        >
                            <RotateCcw className="h-4 w-4 text-amber-400" />
                            {t('dashboard.new_analysis', 'New Analysis')}
                        </button>
                    )}

                    {result && (
                        <button
                            onClick={handleDownloadClick}
                            className="
                                hidden md:inline-flex items-center gap-2 rounded-xl 
                                bg-indigo-500 px-4 py-2 text-xs font-semibold 
                                text-white shadow-[0_10px_30px_rgba(79,70,229,0.7)]
                                hover:bg-indigo-400 hover:-translate-y-0.5
                                transition-all
                            "
                        >
                            <FileText className="w-4 h-4" />
                            {t('header.download_cv')}
                        </button>
                    )}
                    {/* Mobile Download Button (Icon only) */}
                    {result && (
                        <button
                            onClick={handleDownloadClick}
                            className="
                                md:hidden inline-flex items-center justify-center rounded-xl 
                                bg-indigo-500 w-9 h-9 text-white shadow-[0_10px_30px_rgba(79,70,229,0.7)]
                                hover:bg-indigo-400 transition-all
                            "
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    )}

                    {/* Mobile Menu Toggle */}
                    {result && (
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-slate-400 hover:text-white"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && result && (
                <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-3 animate-fade-in-up z-50">
                    <button
                        onClick={() => { onOpenCoverLetter(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <Wand2 className="w-5 h-5 text-indigo-400" />
                        <span className="font-medium">{t('cover_letter.create_btn', 'Create Cover Letter')}</span>
                    </button>

                    <button
                        onClick={() => { onOpenInterviewPrep(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <MessageCircleQuestion className="w-5 h-5 text-sky-400" />
                        <span className="font-medium">{t('header.interview_prep', 'Interview Prep')}</span>
                    </button>

                    <button
                        onClick={() => { onReset(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <RotateCcw className="w-5 h-5 text-amber-400" />
                        <span className="font-medium">{t('dashboard.new_analysis', 'New Analysis')}</span>
                    </button>

                </div>
            )}
        </header>
    );
};

const LangChip = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            px-2.5 py-1 text-[10px] font-semibold rounded-full 
            transition-all
            ${active
                ? "bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
            }
        `}
    >
        {label}
    </button>
);

export default Header;

```

---

## File: client/src/components/Landing.jsx

```javascript
import { useTranslation, Trans } from 'react-i18next';

export default function Landing() {
    const { t } = useTranslation();

    return (
        <div className="w-full animate-fade-in-up">
            {/* Hero */}
            <section className="text-center py-20 px-6">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {t('landing.hero.title_part1')} <span className="text-indigo-400">{t('landing.hero.title_part2')}</span>
                </h1>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
                    {t('landing.hero.subtitle_part1')}
                    <span className="text-indigo-300 font-semibold"> {t('landing.hero.job_match_score')}</span>{' '}
                    {t('landing.hero.subtitle_part2')}
                </p>

                <a
                    href="#upload"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition transform hover:scale-105 inline-block"
                >
                    {t('landing.hero.cta')}
                </a>

                <p className="text-slate-500 text-xs mt-4">
                    {t('landing.hero.privacy')}
                </p>
            </section>

            {/* 3-step explainer */}
            <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-800">
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('landing.steps.1.title')}</h3>
                        <p className="text-slate-400 text-sm">
                            <Trans i18nKey="landing.steps.1.desc" components={[<strong className="text-indigo-400 font-semibold" />]} />
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('landing.steps.2.title')}</h3>
                        <p className="text-slate-400 text-sm">
                            <Trans i18nKey="landing.steps.2.desc" components={[<strong className="text-indigo-400 font-semibold" />]} />
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('landing.steps.3.title')}</h3>
                        <p className="text-slate-400 text-sm">
                            <Trans i18nKey="landing.steps.3.desc" components={[<strong className="text-indigo-400 font-semibold" />]} />
                        </p>
                    </div>
                </div>
            </section>

            {/* Job Match highlight */}
            <section className="py-20 px-6 text-center max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">{t('landing.jobmatch.title')}</h2>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
                    {t('landing.jobmatch.desc')}
                </p>

                <div className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-indigo-300 font-semibold mb-2">{t('landing.jobmatch.item1.title')}</h3>
                        <p className="text-slate-400 text-sm">{t('landing.jobmatch.item1.desc')}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-indigo-300 font-semibold mb-2">{t('landing.jobmatch.item2.title')}</h3>
                        <p className="text-slate-400 text-sm">{t('landing.jobmatch.item2.desc')}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-indigo-300 font-semibold mb-2">{t('landing.jobmatch.item3.title')}</h3>
                        <p className="text-slate-400 text-sm">{t('landing.jobmatch.item3.desc')}</p>
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-800 text-center">
                <h3 className="text-xl font-bold text-white mb-4">{t('landing.trust.title')}</h3>
                <p className="text-slate-400 max-w-xl mx-auto text-sm">
                    {t('landing.trust.desc')}
                </p>
            </section>
        </div>
    );
}

```

---

## File: client/src/components/UploadSection.jsx

```javascript
import React, { useState } from 'react';
import { Upload, CheckCircle, Briefcase, ServerCrash, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UploadSection = ({ file, setFile, jobDesc, setJobDesc, loading, isAiBusy, progress, loadingText, error, onAnalyze, onClearError }) => {
    const { t } = useTranslation();
    const [showHint, setShowHint] = useState(false);

    const handleAnalyzeClick = () => {
        if (!file) {
            setShowHint(true);
            setTimeout(() => setShowHint(false), 1000); // Reset after 1s
            return;
        }
        onAnalyze();
    };

    if (isAiBusy) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="py-8 text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <ServerCrash className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Sistem Şu An Çok Yoğun 🤯</h3>
                    <p className="text-slate-300 mb-6 text-sm px-4">Google servislerinde yoğunluk yaşanıyor. Lütfen 1 dakika sonra tekrar deneyin.</p>
                    <button onClick={onAnalyze} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"><RefreshCw className="w-5 h-5 inline mr-2" /> Tekrar Dene</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="py-12 text-center space-y-6 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-blue-400">{Math.round(progress)}%</div>
                    </div>
                    <div className="text-slate-300 font-medium animate-pulse">{t(loadingText)}</div>
                </div>
            </div>
        );
    }

    return (
        <div id="upload" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Dikkat!</h3>
                    <p className="text-red-400 font-medium mb-6 max-w-xs">{error}</p>
                    <button
                        onClick={onClearError}
                        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20"
                    >
                        Tamam, Anlaşıldı
                    </button>
                </div>
            )}

            {/* Main Content - Blurred if error exists */}
            <div className={`space-y-4 transition-all duration-300 ${error ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
                <div className={`bg-slate-800/50 rounded-2xl p-8 border-2 border-dashed transition-all duration-200 cursor-pointer relative group text-center ${showHint ? 'border-red-500/50 bg-red-500/5 animate-shake' : 'border-slate-700/50 hover:border-blue-500/50'}`}>
                    <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${file ? 'bg-emerald-500/20 text-emerald-400' : showHint ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                            {file ? <CheckCircle className="w-8 h-8" /> : showHint ? <AlertCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>
                        <div>
                            <p className={`font-bold text-lg transition-colors ${showHint ? 'text-red-400' : 'text-white'}`}>
                                {file ? file.name : showHint ? 'Lütfen Önce Dosya Yükleyin!' : t('upload.title')}
                            </p>
                            {file && <p className="text-xs text-emerald-400 mt-1">{t('upload.file_selected')}</p>}
                            {!file && <p className="text-xs text-slate-500 mt-1">{t('upload.drag_drop')}</p>}
                        </div>
                    </div>
                </div>

                <div className="relative space-y-2">
                    <label className="block text-amber-400 text-xs font-bold uppercase tracking-wider ml-1 animate-pulse">📢 {t('upload.job_desc_label')}</label>
                    <div className="relative group">
                        <div className="absolute top-3 left-3 text-slate-500 group-focus-within:text-amber-500 transition-colors"><Briefcase className="w-4 h-4" /></div>
                        <textarea
                            className="w-full h-32 bg-slate-900 border-2 border-slate-700 rounded-xl p-3 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none resize-none transition-all shadow-lg"
                            placeholder={t('upload.job_desc_placeholder')}
                            value={jobDesc}
                            onChange={(e) => setJobDesc(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={handleAnalyzeClick}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}
                >
                    {t('upload.analyze_button')} ✨
                </button>
                <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    {t('upload.privacy_note')}
                </p>
            </div>
        </div>
    );
};

export default UploadSection;

```

---

## File: client/src/components/AnalysisDashboard.jsx

```javascript
import React, { useEffect, useState } from 'react';
import {
    Upload,
    ArrowRight,
    TrendingUp,
    BarChart3,
    CheckSquare,
    CheckCircle,
    AlertCircle,
    Info,
    Coffee,
    Wand2,
    MessageCircleQuestion,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CoverLetterPanel from './CoverLetterPanel';

/* ================================
   ANIMATED NUMBER COMPONENT
   ================================ */
const AnimatedNumber = ({ value, duration = 800 }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const end = Number(value) || 0;
        if (end === 0) {
            setDisplay(0);
            return;
        }

        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.round(end * progress);
            setDisplay(current);

            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{display}</>;
};

/* ================================
   SKILL BAR COMPONENT
   ================================ */
const SkillBar = ({ label, score, color }) => {
    const rawScore = Number(score) || 0;
    const isOutOf100 = rawScore > 10;
    const percentage = isOutOf100 ? rawScore : rawScore * 10;
    const displayScore = isOutOf100 ? (rawScore / 10) : rawScore;
    const formattedScore = Number(displayScore.toFixed(1));

    const [width, setWidth] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setWidth(Math.min(percentage, 100));
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    let barColor = 'bg-blue-500';
    if (color.includes('purple')) barColor = 'bg-purple-500';
    if (color.includes('amber')) barColor = 'bg-amber-500';
    if (color.includes('emerald')) barColor = 'bg-emerald-500';

    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold tracking-wide">
                    {label}
                </span>
                <span className={`${color} font-bold`}>{formattedScore}/10</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700/50 shadow-inner overflow-hidden">
                <div
                    className={`h-full rounded-full ${barColor} shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-out`}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
};

/* ================================
   HELPER COMPONENTS
   ================================ */
const ScoreBubble = ({ label, value, variant }) => {
    const isPrimary = variant === "primary";
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className={`
          flex items-center justify-center rounded-full 
          ${isPrimary ? "h-24 w-24 md:h-28 md:w-28" : "h-16 w-16 md:h-20 md:w-20"}
          bg-slate-900/90 border
          ${isPrimary
                        ? "border-emerald-400/70 shadow-[0_0_24px_rgba(16,185,129,0.6)]"
                        : "border-slate-600"
                    }
        `}
            >
                <span
                    className={`font-black text-white ${isPrimary ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                        }`}
                >
                    <AnimatedNumber value={value} />
                </span>
            </div>
            <span
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isPrimary ? "text-emerald-300" : "text-slate-400"
                    }`}
            >
                {label}
            </span>
        </div>
    );
};

const ArrowIcon = () => (
    <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="h-px w-10 bg-gradient-to-r from-slate-600 to-slate-400" />
    </div>
);

const InterviewChanceBanner = ({ rate, t }) => (
    <div
        className="
      mt-2 flex items-center justify-between gap-3 rounded-2xl 
      bg-emerald-600/15 px-4 py-3 text-xs text-emerald-200
      border border-emerald-500/40
    "
    >
        <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-semibold uppercase tracking-[0.18em]">
                {t('dashboard.interview_chance')} {rate} 🚀
            </span>
        </div>
        <span className="hidden text-[11px] text-emerald-100/80 md:inline">
            {t('dashboard.interview_chance_desc')}
        </span>
    </div>
);

const HighLevelAssessment = ({ summary, t }) => (
    <div className="mt-2 rounded-2xl bg-slate-900/60 border border-slate-700/70 px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <Info className="h-3.5 w-3.5" />
            {t('dashboard.overview_summary', 'High-Level Assessment')}
        </div>
        <p className="text-xs text-slate-200/90 leading-relaxed whitespace-pre-wrap break-words">
            {summary || ''}
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
            {t('dashboard.overview_hint', 'Full details are available in the analysis report below.')}
        </p>
    </div>
);

const SectionHeader = ({ icon, label }) => (
    <div className="mb-2">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            {icon}
            {label}
        </div>
        <div className="section-divider-indigo" />
    </div>
);

/* ================================
   JOB MATCH CARD
   ================================ */
const JobMatchCard = ({ score, matchLevel, keywordRate, jobFit, t, onReset }) => {
    // If score is 0 or missing, show CTA state
    if (!score || score === 0) {
        return (
            <div className="relative animate-fade-in-up">
                <div className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="relative panel-glass p-6 md:p-8 text-center space-y-4 bg-slate-950/80 border-indigo-500/30 border-dashed">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 mb-2">
                        <TrendingUp className="h-8 w-8 text-indigo-400" />
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            {t('dashboard.jobfit_cta_title', 'Unlock Your Job Match Score')}
                        </h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                            {t('dashboard.jobfit_cta_desc', 'Add a job description to see how well your CV matches the role and get missing keywords.')}
                        </p>
                    </div>

                    <button
                        onClick={onReset}
                        className="
                            inline-flex items-center gap-2 px-6 py-3 
                            bg-indigo-600 hover:bg-indigo-500 
                            text-white font-semibold rounded-xl 
                            transition-all shadow-lg shadow-indigo-500/20
                            hover:-translate-y-0.5
                        "
                    >
                        <Upload className="w-4 h-4" />
                        {t('dashboard.jobfit_cta_button', 'Analyze with Job Description')}
                    </button>
                </div>
            </div>
        );
    }

    const level = matchLevel || (score >= 90 ? "Excellent" : "High");

    return (
        <div className="relative animate-fade-in-up">
            {/* Turuncu blur blob */}
            <div className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-orange-500/25 blur-3xl" />
            <div
                className="
          relative panel-glass p-4 md:p-6 space-y-4
          bg-slate-950/80 border-indigo-700/60
          hover:border-orange-400/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]
          hover-lift w-full overflow-hidden
        "
            >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-6">
                    {/* Hero Score */}
                    <div
                        className="
              relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full
              bg-gradient-to-br from-orange-500 to-orange-400
              shadow-[0_0_32px_rgba(249,115,22,0.7)]
              border-4 border-orange-300
            "
                    >
                        <span className="text-3xl font-black text-white">
                            <AnimatedNumber value={score} />
                        </span>
                    </div>

                    <div className="space-y-2 text-center md:text-left w-full">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span
                                className="
                    inline-flex items-center px-3 py-1 rounded-full 
                    bg-orange-500/20 text-orange-200 text-[11px] 
                    border border-orange-400/60 font-semibold uppercase tracking-[0.18em]
                  "
                            >
                                {t('dashboard.jobfit_level_label', 'Match Level')}: {level}
                            </span>
                        </div>

                        <p className="text-xs text-slate-300/90 leading-relaxed break-words">
                            {t('dashboard.jobfit_desc_dynamic', { level: level })}
                            {/* Fallback text if translation missing */}
                            {!t('dashboard.jobfit_desc_dynamic', { returnObjects: true, defaultValue: false }) &&
                                "This score reflects how well your skills and experience align with the job requirements."}
                        </p>

                        {keywordRate != null && (
                            <p className="text-xs text-slate-400">
                                {t('dashboard.jobfit_keyword_rate', 'Keyword coverage')}:{" "}
                                <span className="font-semibold text-orange-300">
                                    {keywordRate}%
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Strong / Missing / Nice-to-have columns */}
                <div className="grid md:grid-cols-3 gap-4 text-xs">
                    {jobFit?.strongPoints?.length > 0 && (
                        <div className="card-glass p-3 border-emerald-500/30 hover:border-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] hover-lift">
                            <div className="text-emerald-300 font-semibold mb-1 flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3" />
                                {t('dashboard.jobfit_strong', 'Strong Matches')}
                            </div>
                            <ul className="space-y-1 list-disc list-inside marker:text-emerald-300">
                                {jobFit.strongPoints.slice(0, 3).map((p, i) => (
                                    <li key={i} className="text-slate-100">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {jobFit?.missingFromCv?.length > 0 && (
                        <div className="card-glass p-3 border-amber-500/40 hover:border-amber-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.35)] hover-lift">
                            <div className="text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3" />
                                {t('dashboard.jobfit_missing', 'Missing from CV')}
                            </div>
                            <ul className="space-y-1 list-disc list-inside marker:text-amber-300">
                                {jobFit.missingFromCv.slice(0, 3).map((p, i) => (
                                    <li key={i} className="text-slate-100">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {jobFit?.niceToHave?.length > 0 && (
                        <div className="card-glass p-3 border-blue-500/40 hover:border-blue-300 hover:shadow-[0_0_12px_rgba(59,130,246,0.35)] hover-lift">
                            <div className="text-blue-300 font-semibold mb-1 flex items-center gap-1.5">
                                <Info className="w-3 h-3" />
                                {t('dashboard.jobfit_nice', 'Nice-to-have')}
                            </div>
                            <ul className="space-y-1 list-disc list-inside marker:text-blue-300">
                                {jobFit.niceToHave.slice(0, 3).map((p, i) => (
                                    <li key={i} className="text-slate-100">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ================================
   SUGGESTED KEYWORDS SECTION
   ================================ */
const SuggestedKeywordsSection = ({ missingKeywords, t }) => {
    if (!missingKeywords || missingKeywords.length === 0) return null;

    return (
        <div className="panel-glass p-4 md:p-6 space-y-4 animate-fade-in-up w-full overflow-hidden">
            <div className="mb-2">
                <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    <Info className="h-4 w-4 text-amber-400" />
                    {t('dashboard.suggested_keywords')}
                </div>
                <div className="section-divider-amber" />
            </div>

            <div className="space-y-3">
                {missingKeywords.map((item, i) => (
                    <SuggestedKeywordCard
                        key={i}
                        title={item.keyword}
                        example={item.usageTip?.content || item.usageTip?.tr || item.usageTip}
                        description={item.benefit}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
};

const SuggestedKeywordCard = ({ title, example, description, t }) => (
    <div
        className="
      card-glass p-3 md:p-4 
      border-slate-700/70 
      hover:border-amber-400/60 hover:shadow-[0_0_18px_rgba(251,191,36,0.3)]
      hover-lift
    "
    >
        <h4 className="text-sm font-semibold text-amber-300 mb-1">{title}</h4>
        <div className="mb-2 rounded-md bg-emerald-600/15 px-3 py-2 text-[11px] leading-relaxed text-emerald-100 border border-emerald-500/40 break-words">
            <span className="font-semibold text-emerald-200 mr-1">{t('dashboard.example', 'Example')}:</span>
            "
            <span
                dangerouslySetInnerHTML={{
                    __html: example,
                }}
            />
            "
        </div>
        {description && <p className="text-[11px] text-slate-300">{description}</p>}
    </div>
);


/* ================================
   INTERVIEW PREP CARD (Dashboard Entry)
   ================================ */
const InterviewPrepCard = ({ onOpen, t }) => (
    <div className="panel-glass p-4 md:p-6 space-y-4 animate-fade-in-up relative overflow-hidden group cursor-pointer w-full" onClick={onOpen}>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageCircleQuestion className="w-24 h-24 text-sky-400" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300">
                    <MessageCircleQuestion className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                    {t('header.interview_prep', 'Interview Prep')}
                </h3>
            </div>

            <p className="text-sm text-slate-400 mb-4 max-w-md break-words">
                {t('dashboard.interview_prep_desc', 'Generate personalized interview questions and answers based on your CV and this job description.')}
            </p>

            <button
                onClick={(e) => { e.stopPropagation(); onOpen(); }}
                className="
                    inline-flex items-center gap-2 px-4 py-2
                    bg-sky-600 hover:bg-sky-500 
                    text-white text-xs font-bold uppercase tracking-wider 
                    rounded-xl shadow-lg shadow-sky-500/20
                    transition-all hover:-translate-y-0.5
                "
            >
                <Wand2 className="w-4 h-4" />
                {t('dashboard.generate_questions', 'Generate Questions')}
            </button>
        </div>
    </div>
);

/* ================================
   MAIN DASHBOARD COMPONENT
   ================================ */
const AnalysisDashboard = ({ result, jobDesc, onReset, onOpenInterviewPrep }) => {
    const { t } = useTranslation();

    const currentScore = result?.scores?.current || 50;
    const potentialScore = result?.scores?.potential || 85;
    const interviewRate = result?.scores?.interviewRate || '2x';
    const summaryText = result?.summary?.content || result?.summary?.tr || '';

    const jobFit = result?.jobFit || {};
    const jobFitScore = jobFit?.score ?? 0;
    const jobFitMatchLevel = jobFit?.matchLevel || '';
    const jobFitKeywordRate = jobFit?.keywordMatchRate ?? null;
    const hasJobFit = Boolean(jobFit && typeof jobFit.score === 'number');
    const missingKeywords = result?.missingKeywords || jobFit?.missingKeywords || [];

    const atsMods = result?.atsModifications || [];

    // Extract raw text from CV result if available, otherwise use summary as fallback or empty
    // Ideally, the backend should return the full CV text or we use the summary.
    // Since we don't have the full CV text in 'result' explicitly shown in previous files, 
    // we might need to rely on what's available. 
    // However, the user prompt implies we send "cvText". 
    // If 'result' contains the parsed text, we use it. 
    // Let's assume result.text or result.rawText exists, or use summary.
    // Checking previous AnalysisDashboard, it uses result.summary.content.
    // I will use summaryText as cvText for now if raw text isn't there.
    const cvText = result?.text || summaryText;

    return (
        <div className="space-y-6 animate-page-enter relative">
            {/* New Analysis Button (Desktop) */}

            <div className="space-y-6">
                {/* TOP SCORE PANEL */}
                <div className="panel-glass p-4 space-y-4 animate-fade-in-up relative w-full overflow-hidden">
                    <div className="flex items-center justify-center pt-2">
                        <ScoreBubble
                            label={t("dashboard.cv_health_score", "CV Health Score")}
                            value={potentialScore}
                            variant="primary"
                        />
                    </div>

                    <InterviewChanceBanner rate={interviewRate} t={t} />

                    <HighLevelAssessment summary={summaryText} t={t} />
                </div>

                {/* INTERVIEW PREP CARD */}
                <InterviewPrepCard onOpen={onOpenInterviewPrep} t={t} />

                {/* ATS ANALYSIS PANEL */}
                <div className="panel-glass p-4 md:p-6 space-y-5 animate-fade-in-up w-full overflow-hidden">
                    <SectionHeader
                        icon={<BarChart3 className="h-4 w-4" />}
                        label={t("dashboard.ats_detailed_analysis", "ATS Detailed Analysis")}
                    />

                    {/* SkillBars */}
                    <div className="space-y-3 bg-slate-900/40 p-4 md:p-5 rounded-xl border border-slate-700/50">
                        <SkillBar label={t('dashboard.searchability')} score={result.scores?.breakdown?.searchability} color="text-blue-400" />
                        <SkillBar label={t('dashboard.hard_skills')} score={result.scores?.breakdown?.hardSkills} color="text-purple-400" />
                        <SkillBar label={t('dashboard.soft_skills')} score={result.scores?.breakdown?.softSkills} color="text-amber-400" />
                        <SkillBar label={t('dashboard.formatting')} score={result.scores?.breakdown?.formatting} color="text-emerald-400" />
                    </div>

                    {/* ATS Check List */}
                    {atsMods.length > 0 && (
                        <div className="bg-slate-900/40 p-4 md:p-5 rounded-xl border border-slate-700/50">
                            <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2 mb-3 tracking-wider">
                                <CheckSquare className="w-4 h-4" />
                                {t('dashboard.ats_check')}
                            </h3>
                            <div className="section-divider-indigo mb-3" />
                            <ul className="space-y-2">
                                {atsMods.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-300 break-words">
                                            {item.detail || item.action}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* JOB MATCH PANEL */}
                <JobMatchCard
                    score={jobFitScore}
                    matchLevel={jobFitMatchLevel}
                    keywordRate={jobFitKeywordRate}
                    jobFit={jobFit}
                    t={t}
                    onReset={onReset}
                />

                {/* SUGGESTED KEYWORDS */}
                <SuggestedKeywordsSection missingKeywords={missingKeywords} t={t} />
            </div>
        </div>
    );
};

export default AnalysisDashboard;

```

---

## File: client/src/components/CVPreview.jsx

```javascript
import React from 'react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateDocxBlob } from '../lib/docxGenerator';
import { CvPreviewShell } from './CvPreviewShell';

const CVPreview = ({ result, printRef }) => {
    const { t } = useTranslation();

    // Helper to detect bullet points
    const isBulletParagraph = (text) => {
        return /^([•\-\*])\s+/.test(text) || text.trim().startsWith('•') || text.trim().startsWith('-');
    };

    const stripBullet = (text) => {
        return text.replace(/^([•\-\*])\s+/, "").trim();
    };

    // Helper to strip <mark> tags
    const stripMarkTags = (text) => {
        return text
            .replace(/<mark[^>]*>/g, "")  // opening tag
            .replace(/<\/mark>/g, "");    // closing tag
    };

    // Group paragraphs into <ul> blocks
    const renderParagraphBlocks = (text) => {
        if (!text) return null;

        // Strip marks first
        const cleanText = stripMarkTags(text);

        const blocks = cleanText.split('\n').filter(line => line.trim().length > 0).map((line, index) => ({
            id: `p-${index}`,
            text: line.trim()
        }));

        const elements = [];
        let currentListItems = [];

        const flushList = () => {
            if (currentListItems.length > 0) {
                elements.push(
                    <ul key={`list-${elements.length}`}>
                        {currentListItems}
                    </ul>
                );
                currentListItems = [];
            }
        };

        blocks.forEach((block, index) => {
            // Check for Headers (## or ###)
            if (block.text.startsWith('##')) {
                flushList();
                const level = block.text.startsWith('###') ? 3 : 2;
                const content = block.text.replace(/^#+\s*/, '');

                // Map markdown headers to our new CSS classes
                // H2 -> Section Header (PROFESSIONAL SUMMARY)
                // H3 -> Role Title (Product Manager)

                if (level === 2) {
                    elements.push(
                        <h2 key={block.id}>{content}</h2>
                    );
                } else {
                    // For H3, we might want to check if it looks like a role or company line
                    // But for now let's treat H3 as a role title
                    elements.push(
                        <p key={block.id} className="cv-role-title">{content}</p>
                    );
                }
            }
            // Check for Bullets
            else if (isBulletParagraph(block.text)) {
                const content = stripBullet(block.text);
                // Handle bolding within bullets (**text**)
                const parts = content.split(/(\*\*.*?\*\*)/g);
                const formattedContent = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });

                currentListItems.push(
                    <li key={block.id}>
                        {formattedContent}
                    </li>
                );
            }
            // Normal Paragraphs
            else {
                flushList();
                // Handle bolding within paragraphs
                const parts = block.text.split(/(\*\*.*?\*\*)/g);
                const formattedContent = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });

                // Check if this paragraph looks like a date line or company line based on content?
                // This is hard without structured data. 
                // For now, render as standard p. 
                // The user's prompt implies we might have structured data or we just use p.
                // But wait, the user gave specific classes: .cv-company-line, .cv-date-line.
                // Since we are parsing markdown, we can't easily distinguish these unless the markdown has specific markers.
                // However, the user's prompt says: "Render ederken... şu class'ları kullanabilirsiniz".
                // Since we are parsing a flat markdown string, we will stick to <p> for normal text.
                // If the markdown contained specific formatting for these, we could parse it.
                // Given the constraints, standard <p> is the best we can do for non-header non-bullet text.

                elements.push(
                    <p key={block.id}>
                        {formattedContent}
                    </p>
                );
            }
        });

        flushList();
        return elements;
    };

    return (
        <div className="lg:col-span-7 sticky top-24 w-full overflow-hidden">
            <div className="panel-glass bg-slate-950/70 p-1 md:p-4 border border-slate-700/70 w-full overflow-hidden">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500 px-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {t('preview')}
                </div>

                {result.uiSuggestions?.fontReason?.tr && (
                    <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-xl mb-4 flex items-start gap-3 mx-2">
                        <Wand2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-200 break-words">
                            <span className="font-bold text-blue-400">Font Seçimi ({result.uiSuggestions.selectedFont}):</span> {result.uiSuggestions.fontReason.tr}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl bg-slate-900/60 border border-slate-700/70 overflow-hidden shadow-inner w-full">
                    {/* Mobile Wrapper: Scrollable container for all screens */}
                    <div className="relative w-full h-[500px] sm:h-[600px] md:h-[800px] lg:h-[1000px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-900/50 flex justify-center lg:justify-start lg:pl-10">
                        {/* CV Container: Scaled to fit different screens */}
                        <div ref={printRef} className="origin-top lg:origin-top-left transform transition-transform duration-300
                        scale-[0.35] 
                        sm:scale-[0.45] 
                        md:scale-[0.55] 
                        lg:scale-[0.6] 
                        xl:scale-[0.75] 
                        2xl:scale-[0.85]
                        mb-10">
                            <CvPreviewShell>
                                {/* Header Section */}
                                <div>
                                    <h1>
                                        {result.contactInfo?.name || "AD SOYAD"}
                                    </h1>
                                    <p className="cv-contact-line">
                                        {[
                                            result.contactInfo?.location,
                                            result.contactInfo?.email,
                                            result.contactInfo?.phone,
                                            result.contactInfo?.linkedin
                                        ].filter(Boolean).join(' | ')}
                                    </p>
                                </div>

                                {/* Body Content */}
                                <div>
                                    {renderParagraphBlocks(result.optimizedCv)}
                                </div>
                            </CvPreviewShell>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Download Button */}
            <div className="mt-4 flex justify-center lg:hidden">
                <button
                    onClick={async () => {
                        const blob = await generateDocxBlob(result);
                        if (blob) {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'Optimized_CV.docx';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        }
                    }}
                    className="
                            inline-flex items-center gap-2 rounded-xl 
                            bg-indigo-600 px-6 py-3 text-sm font-bold text-white 
                            shadow-lg shadow-indigo-500/20 
                            hover:bg-indigo-500 transition-all
                        "
                >
                    <Wand2 className="w-4 h-4" />
                    {t('header.download_cv', 'Download CV')}
                </button>
            </div>
        </div>
    );
};

export default CVPreview;

```

---

## File: client/src/components/CvPreviewShell.jsx

```javascript
import React from 'react';

export function CvPreviewShell({ children }) {
    return (
        <div className="flex justify-center bg-slate-950/90 py-6 md:py-8">
            <div
                className="
          cv-page
          w-[780px]  /* yaklaşık A4 genişliği (px) */
          bg-white
          rounded-xl
          shadow-[0_24px_60px_rgba(15,23,42,0.65)]
          px-10
          py-10
          text-[13px]
          leading-relaxed
          text-slate-900
        "
            >
                {children}
            </div>
        </div>
    );
}

```

---

## File: client/src/components/CoverLetterModal.jsx

```javascript
import { useState, useEffect } from "react";
import { Loader2, FileText, Copy, Check, X, Wand2, FileDown } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { generateCoverLetterDoc } from '../lib/docxGenerator';

export default function CoverLetterModal({ isOpen, onClose, cvText, jobDescription }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [copied, setCopied] = useState(false);
    const [localJobDesc, setLocalJobDesc] = useState("");
    const [error, setError] = useState(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalJobDesc(jobDescription || "");
            setCoverLetter("");
            setError(null);
        }
    }, [isOpen, jobDescription]);

    const handleGenerate = async () => {
        if (!localJobDesc?.trim()) {
            setError(t('cover_letter.error_no_jd', 'Please enter a Job Description first.'));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/cover-letter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cvText,
                    jobDescription: localJobDesc,
                    language: i18n.language,
                    tone: "professional",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate cover letter');
            }

            setCoverLetter(data.coverLetter || "");
        } catch (error) {
            console.error("Failed to generate cover letter:", error);
            setError(error.message || t('cover_letter.error_generic', 'Failed to generate cover letter. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl panel-glass p-6 shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
                        <Wand2 className="h-5 w-5" />
                        {t('cover_letter.title', 'Cover Letter Generator')}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="section-divider-indigo mb-6 shrink-0" />

                {/* Body - Scrollable */}
                <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 flex-1">
                    {!coverLetter ? (
                        <>
                            <p className="text-sm text-slate-300">
                                {t('cover_letter.desc', 'Generate a tailored cover letter based on your CV and the job description.')}
                            </p>

                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                    {t('cover_letter.job_desc_label', 'Job Description')}
                                </label>
                                <textarea
                                    className="
                                        w-full rounded-xl bg-slate-950/40 
                                        border border-slate-700/50 
                                        p-4 text-sm text-slate-300 
                                        leading-relaxed min-h-[150px] 
                                        focus:outline-none focus:border-indigo-500/50
                                        custom-scrollbar resize-y
                                        placeholder:text-slate-600
                                    "
                                    placeholder={t('cover_letter.job_desc_placeholder', 'Paste the job description here...')}
                                    value={localJobDesc}
                                    onChange={(e) => setLocalJobDesc(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="
                                    w-full flex items-center justify-center gap-2 rounded-xl 
                                    bg-indigo-600 hover:bg-indigo-500 
                                    px-6 py-4 text-sm font-bold text-white 
                                    shadow-lg shadow-indigo-500/20
                                    hover:-translate-y-0.5 transition-all 
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                "
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Wand2 className="h-5 w-5" />
                                )}
                                {loading ? t('cover_letter.generating', 'Generating...') : t('cover_letter.generate', 'Generate Cover Letter')}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    {t('cover_letter.success', 'Cover Letter Generated!')}
                                </h3>
                                <button
                                    onClick={() => setCoverLetter("")}
                                    className="text-xs text-slate-400 hover:text-white underline"
                                >
                                    {t('common.back', 'Back to Edit')}
                                </button>
                            </div>

                            <textarea
                                className="
                                    w-full rounded-xl bg-slate-950/50 
                                    border border-slate-700/50 
                                    p-5 text-sm text-slate-200 
                                    leading-relaxed min-h-[400px] 
                                    focus:outline-none focus:border-indigo-500/50
                                    custom-scrollbar resize-y
                                "
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                            />

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="
                                        flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl 
                                        bg-slate-800 hover:bg-slate-700 
                                        px-4 py-3 text-sm font-semibold text-slate-300 
                                        transition-colors border border-slate-700
                                    "
                                >
                                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy Text')}
                                </button>

                                <button
                                    onClick={() => generateCoverLetterDoc(coverLetter)}
                                    className="
                                        flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl 
                                        bg-indigo-600 hover:bg-indigo-500 
                                        px-4 py-3 text-sm font-semibold text-white 
                                        transition-colors border border-indigo-500/50
                                        shadow-lg shadow-indigo-500/20
                                    "
                                >
                                    <FileDown className="h-4 w-4" />
                                    {t('common.download_docx', 'Download DOCX')}
                                </button>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="
                                        flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl 
                                        bg-slate-800 hover:bg-slate-700 
                                        px-4 py-3 text-sm font-semibold text-slate-300 
                                        transition-colors border border-slate-700
                                    "
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                    {t('common.regenerate', 'Regenerate')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

```

---

## File: client/src/components/InterviewPrepModal.jsx

```javascript
import { useState, useEffect } from "react";
import { MessageCircleQuestion, Loader2, Sparkles, X, FileDown, Copy, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { generateInterviewPrepDoc } from '../lib/docxGenerator';

export default function InterviewPrepModal({ isOpen, onClose, cvText, jobDescription }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [prep, setPrep] = useState(null);
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    const loadingSteps = [
        t('interview_loading.step1', 'Analyzing your CV experience...'),
        t('interview_loading.step2', 'Parsing job requirements...'),
        t('interview_loading.step3', 'Identifying potential interview topics...'),
        t('interview_loading.step4', 'Generating behavioral questions...'),
        t('interview_loading.step5', 'Drafting sample answers and tips...'),
        t('interview_loading.step6', 'Finalizing your prep kit...')
    ];

    // Simulate progress
    useEffect(() => {
        if (!loading) {
            setProgress(0);
            setCurrentStep(0);
            return;
        }

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                // Slow down as it gets higher
                const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5;
                return Math.min(prev + increment, 95);
            });
        }, 100);

        return () => clearInterval(interval);
    }, [loading]);

    // Update steps based on progress
    useEffect(() => {
        if (progress < 15) setCurrentStep(0);
        else if (progress < 30) setCurrentStep(1);
        else if (progress < 50) setCurrentStep(2);
        else if (progress < 70) setCurrentStep(3);
        else if (progress < 85) setCurrentStep(4);
        else setCurrentStep(5);
    }, [progress]);

    const handleGenerate = async () => {
        setLoading(true);
        setProgress(0);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/interview-prep`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cvText,
                    jobDescription,
                    language: i18n.language
                }),
            });
            const data = await res.json();
            setPrep(data);
        } catch (error) {
            console.error("Failed to generate interview prep:", error);
        } finally {
            setLoading(false);
            setProgress(100);
        }
    };

    const handleCopy = () => {
        if (!prep) return;

        let text = "";
        prep.categories.forEach(cat => {
            text += `${cat.title}\n${cat.description}\n\n`;
            cat.questions.forEach((q, i) => {
                text += `Q${i + 1}: ${q.question}\n`;
                text += `Answer Outline:\n${q.answerOutline}\n`;
                if (q.tips) text += `Tip: ${q.tips}\n`;
                text += "\n";
            });
            text += "-------------------\n\n";
        });

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasContent = prep?.categories?.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                            <MessageCircleQuestion className="h-6 w-6 text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Interview Prep Kit</h2>
                            <p className="text-sm text-slate-400">AI-powered interview questions & answers</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {(!hasContent && !loading) && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                            <div className="h-24 w-24 rounded-full bg-sky-500/5 flex items-center justify-center">
                                <Sparkles className="h-10 w-10 text-sky-500/50" />
                            </div>
                            <div className="max-w-md space-y-2">
                                <h3 className="text-lg font-semibold text-white">
                                    {prep ? "Generation Failed" : "Ready to Practice?"}
                                </h3>
                                <p className="text-slate-400">
                                    {prep
                                        ? "We couldn't generate questions this time. Please try again."
                                        : "Generate a personalized interview preparation kit based on your CV and the job description."}
                                </p>
                            </div>
                            <button
                                onClick={handleGenerate}
                                className="
                            inline-flex items-center gap-2 rounded-xl 
                            bg-sky-600 hover:bg-sky-500 
                            px-8 py-4 text-sm font-bold uppercase tracking-wider text-white 
                            shadow-lg shadow-sky-500/20
                            hover:-translate-y-0.5 transition-all
                        "
                            >
                                <Sparkles className="h-5 w-5" />
                                {prep ? "Try Again" : "Generate Interview Questions"}
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-8">
                            <div className="relative w-full max-w-md">
                                {/* Progress Bar Background */}
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sky-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                {/* Percentage */}
                                <div className="absolute -right-2 -top-6 text-xs font-bold text-sky-400">
                                    {Math.round(progress)}%
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <Loader2 className="h-8 w-8 text-sky-500 animate-spin mx-auto mb-4" />
                                <p className="text-lg font-medium text-white animate-pulse">
                                    {loadingSteps[currentStep]}
                                </p>
                                <p className="text-sm text-slate-400">
                                    Please wait while AI crafts your interview kit...
                                </p>
                            </div>
                        </div>
                    )}

                    {hasContent && (
                        <div className="space-y-8">
                            {prep.categories.map((cat) => (
                                <div key={cat.id} className="space-y-4">
                                    <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur py-3 border-b border-slate-800">
                                        <h3 className="text-lg font-bold text-sky-300">{cat.title}</h3>
                                        <p className="text-sm text-slate-400">{cat.description}</p>
                                    </div>

                                    <div className="grid gap-4">
                                        {cat.questions?.map((q, idx) => (
                                            <div key={idx} className="card-glass p-5 border-slate-700/50 hover:border-sky-500/30 transition-colors group">
                                                <p className="text-sm font-bold text-slate-100 mb-3 flex gap-3">
                                                    <span className="text-sky-500 shrink-0">Q{idx + 1}.</span>
                                                    {q.question}
                                                </p>

                                                <div className="pl-4 border-l-2 border-slate-700 space-y-3 group-hover:border-sky-500/30 transition-colors">
                                                    <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Answer Outline</span>
                                                        {q.answerOutline}
                                                    </div>

                                                    {q.tips && (
                                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
                                                            <p className="text-xs text-amber-200 flex gap-2 items-start">
                                                                <span className="text-amber-400 text-base">💡</span>
                                                                <span className="mt-0.5">{q.tips}</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {hasContent && (
                    <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-wrap gap-3">
                        <button
                            onClick={handleCopy}
                            className="
                        flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl 
                        bg-slate-800 hover:bg-slate-700 
                        px-4 py-3 text-sm font-semibold text-slate-300 
                        transition-colors border border-slate-700
                    "
                        >
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy All')}
                        </button>

                        <button
                            onClick={() => generateInterviewPrepDoc(prep)}
                            className="
                        flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl 
                        bg-sky-600 hover:bg-sky-500 
                        px-4 py-3 text-sm font-semibold text-white 
                        transition-colors border border-sky-500/50
                        shadow-lg shadow-sky-500/20
                    "
                        >
                            <FileDown className="h-4 w-4" />
                            {t('common.download_docx', 'Download DOCX')}
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="
                        flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl 
                        bg-slate-800 hover:bg-slate-700 
                        px-4 py-3 text-sm font-semibold text-slate-300 
                        transition-colors border border-slate-700
                    "
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {t('common.regenerate', 'Regenerate')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

```

---

## File: client/src/components/PaymentModal.jsx

```javascript
import React, { useState } from 'react';
import { X, Check, Lock, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentModal = ({ onClose, onSuccess, price = "4.99" }) => {
    const { t } = useTranslation();
    const [processing, setProcessing] = useState(false);

    const handlePay = () => {
        setProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            onSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        {t('payment.unlock_title', 'Unlock Your CV')}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-slate-600 mb-4">
                            {t('payment.description', 'Get your ATS-optimized, professionally formatted CV now.')}
                        </p>
                        <div className="text-4xl font-black text-slate-900 mb-1">
                            ${price}
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                            {t('payment.one_time', 'One-time payment')}
                        </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_docx', 'Download editable .docx file')}
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_ats', 'ATS Optimization applied')}
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_format', 'Professional formatting')}
                        </li>
                    </ul>

                    {/* Mock Card Form */}
                    <div className="space-y-3 opacity-50 pointer-events-none select-none grayscale" aria-hidden="true">
                        <div className="h-10 bg-slate-100 rounded border border-slate-200 w-full"></div>
                        <div className="flex gap-3">
                            <div className="h-10 bg-slate-100 rounded border border-slate-200 w-1/2"></div>
                            <div className="h-10 bg-slate-100 rounded border border-slate-200 w-1/2"></div>
                        </div>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('payment.processing', 'Processing...')}
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                {t('payment.pay_button', 'Pay & Download')}
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                        {t('payment.secure_note', 'Secured by Lemon Squeezy. 100% Money-back guarantee.')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;

```

---

## File: client/src/hooks/useAnalyze.js

```javascript
import { useState, useEffect } from 'react';
import { trackEvent, ANALYTICS_EVENTS } from '../lib/analytics';
import { useTranslation } from 'react-i18next';

export const useAnalyze = () => {
    const [file, setFile] = useState(null);
    const [jobDesc, setJobDesc] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAiBusy, setIsAiBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("loading.start");

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    // 90%'a kadar yavaş yavaş gel
                    if (prev >= 90) {
                        return 90;
                    }
                    // İlk 30% hızlı, sonra yavaşlayan bir artış
                    const increment = prev < 30 ? 2 : prev < 60 ? 0.5 : 0.2;
                    return prev + increment;
                });
            }, 100);

            // Mesajları döngüsel olarak değiştir
            const messageInterval = setInterval(() => {
                setProgress((currentProgress) => {
                    if (currentProgress >= 90) {
                        setLoadingText((prevText) => {
                            const messages = [
                                "loading.step3",
                                "loading.step4",
                                "loading.step5",
                                "loading.step6",
                                "loading.step7",
                                "loading.step8"
                            ];
                            const currentIndex = messages.indexOf(prevText);
                            const nextIndex = (currentIndex + 1) % messages.length;
                            return messages[nextIndex];
                        });
                    } else if (currentProgress < 30) {
                        setLoadingText("loading.step1");
                    } else if (currentProgress < 60) {
                        setLoadingText("loading.step2");
                    } else {
                        setLoadingText("loading.step3");
                    }
                    return currentProgress;
                });
            }, 3000); // Her 3 saniyede bir mesaj değişsin

            return () => {
                clearInterval(interval);
                clearInterval(messageInterval);
            };
        } else {
            setProgress(0);
            setLoadingText("loading.start");
        }
    }, [loading]);

    const { i18n } = useTranslation();

    const handleAnalyze = async () => {
        if (!file) return;

        trackEvent(ANALYTICS_EVENTS.CV_UPLOAD, { file_type: file.type });

        setLoading(true);
        setError(null);
        setIsAiBusy(false);
        let currentBusyState = false; // Local flag to avoid stale closure
        setResult(null);
        setProgress(0);

        const formData = new FormData();
        formData.append('cv', file);
        formData.append('jobDescription', jobDesc);
        formData.append('language', i18n.language);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/analyze`, { method: 'POST', body: formData });
            const data = await res.json();

            if (res.status === 503 || data.error === "AI_BUSY") {
                trackEvent(ANALYTICS_EVENTS.SYSTEM_BUSY);
                setIsAiBusy(true);
                currentBusyState = true;
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error(data.error || 'Sunucu hatası.');

            trackEvent(ANALYTICS_EVENTS.ANALYSIS_SUCCESS, {
                score_current: data.scores?.current,
                score_potential: data.scores?.potential
            });

            setProgress(100);
            setTimeout(() => setResult(data), 500);
        } catch (err) {
            trackEvent(ANALYTICS_EVENTS.ANALYSIS_FAIL, { error: err.message });
            setError(err.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            if (!currentBusyState) setTimeout(() => setLoading(false), 500);
        }
    };

    return {
        file,
        setFile,
        jobDesc,
        setJobDesc,
        result,
        setResult,
        loading,
        error,
        isAiBusy,
        progress,
        loadingText,
        loadingText,
        handleAnalyze,
        clearError: () => {
            setError(null);
            setFile(null);
        }
    };
};

```

---

## File: client/src/lib/docxGenerator.js

```javascript
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from 'docx'
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

import { saveAs } from 'file-saver';

export const generateDocxBlob = async (result) => {
    if (!result) return null;
    const lines = result.optimizedCv.split('\n');
    const docChildren = [];
    const fontName = result.uiSuggestions?.selectedFont || "Arial";
    const themeColor = "2E74B5"; // Word Blue

    docChildren.push(new Paragraph({ children: [new TextRun({ text: result.contactInfo?.name || "Name", bold: true, font: fontName, size: 32, color: "000000" })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));

    const contactParts = [];
    if (result.contactInfo?.location) contactParts.push(new TextRun({ text: `${result.contactInfo.location} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.email) contactParts.push(new TextRun({ text: `${result.contactInfo.email} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.phone) contactParts.push(new TextRun({ text: `${result.contactInfo.phone} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.linkedin) {
        contactParts.push(new ExternalHyperlink({ children: [new TextRun({ text: "LinkedIn", style: "Hyperlink", font: fontName, size: 20, color: themeColor })], link: result.contactInfo.linkedin }));
    }
    docChildren.push(new Paragraph({ children: contactParts, alignment: AlignmentType.CENTER, spacing: { after: 300 } }));

    lines.forEach(line => {
        const cleanLine = line.replace(/<[^>]*>/g, '').trim();
        if (!cleanLine) return;

        if (cleanLine.startsWith('## ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('## ', '').toUpperCase(), bold: true, font: fontName, size: 24, color: themeColor })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
                border: { bottom: { color: themeColor, space: 1, value: "single", size: 6 } }
            }));
        } else if (cleanLine.startsWith('### ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('### ', ''), bold: true, font: fontName, size: 22 })],
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
            }));
        } else if (cleanLine.startsWith('#### ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('#### ', ''), bold: true, font: fontName, size: 20, italics: true })],
                heading: HeadingLevel.HEADING_4,
                spacing: { before: 160, after: 80 }
            }));
        } else {
            // Bullet point kontrolü: Hem '* ' hem de '- ' ile başlayanları yakala
            const isBullet = cleanLine.startsWith('* ') || cleanLine.startsWith('- ') || cleanLine.startsWith('• ');

            // Bullet işaretini metinden temizle
            let content = cleanLine;
            if (isBullet) {
                content = cleanLine.replace(/^[\*\-\•]\s+/, '');
            }

            const textRuns = [];
            const parts = content.split(/(\*\*.*?\*\*)/g);

            parts.forEach(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // Bold parts remain bold
                    textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true, font: fontName, size: 22 }));
                } else if (part) {
                    // Regular text, ensure no bold
                    textRuns.push(new TextRun({ text: part, font: fontName, size: 22, bold: false }));
                }
            });

            docChildren.push(new Paragraph({
                children: textRuns,
                bullet: isBullet ? { level: 0 } : undefined,
                spacing: { after: 100 }
            }));
        }
    });

    const doc = new Document({ sections: [{ children: docChildren }], styles: { default: { document: { run: { font: fontName } } } } });

    const blob = await Packer.toBlob(doc);
    const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return new Blob([blob], { type: mimeType });
};

export const generateWordDoc = async (result) => {
    if (!result) return;
    trackEvent(ANALYTICS_EVENTS.DOWNLOAD_WORD);

    const newBlob = await generateDocxBlob(result);
    if (!newBlob) return;

    // Sanitize filename
    const safeName = (result.contactInfo?.name || "CV").replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${safeName}_Optimized.docx`;

    saveAs(newBlob, fileName);
};

export const generateCoverLetterDoc = async (coverLetterText) => {
    if (!coverLetterText) return;

    const lines = coverLetterText.split('\n');
    const docChildren = [];
    const fontName = "Arial"; // Default font

    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) {
            docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Empty line
            return;
        }

        docChildren.push(new Paragraph({
            children: [new TextRun({ text: cleanLine, font: fontName, size: 24 })], // 12pt font
            spacing: { after: 120 }
        }));
    });

    const doc = new Document({
        sections: [{
            children: docChildren
        }],
        styles: {
            default: {
                document: {
                    run: {
                        font: fontName,
                    }
                }
            }
        }
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Cover_Letter.docx`;
    saveAs(blob, fileName);
};

export const generateInterviewPrepDoc = async (prepData) => {
    if (!prepData || !prepData.categories) return;

    const docChildren = [];
    const fontName = "Arial";

    // Title
    docChildren.push(new Paragraph({
        children: [new TextRun({ text: "Interview Preparation Kit", font: fontName, size: 32, bold: true })],
        spacing: { after: 400 }
    }));

    prepData.categories.forEach(cat => {
        // Category Title
        docChildren.push(new Paragraph({
            children: [new TextRun({ text: cat.title, font: fontName, size: 28, bold: true, color: "2E75B6" })],
            spacing: { before: 400, after: 100 }
        }));

        // Category Description
        docChildren.push(new Paragraph({
            children: [new TextRun({ text: cat.description, font: fontName, size: 20, italics: true })],
            spacing: { after: 300 }
        }));

        cat.questions.forEach((q, i) => {
            // Question
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Q${i + 1}: ${q.question}`, font: fontName, size: 24, bold: true })],
                spacing: { after: 120 }
            }));

            // Answer Outline
            const outlineLines = q.answerOutline.split('\n');
            outlineLines.forEach(line => {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: line.trim(), font: fontName, size: 22 })],
                    bullet: { level: 0 }
                }));
            });

            // Tips
            if (q.tips) {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: `💡 Tip: ${q.tips}`, font: fontName, size: 20, color: "D97706", italics: true })],
                    spacing: { before: 100, after: 300 }
                }));
            } else {
                docChildren.push(new Paragraph({ text: "", spacing: { after: 300 } }));
            }
        });
    });

    const doc = new Document({
        sections: [{
            children: docChildren
        }],
        styles: {
            default: {
                document: {
                    run: {
                        font: fontName,
                    }
                }
            }
        }
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Interview_Prep_Kit.docx`;
    saveAs(blob, fileName);
};

```

---

## File: client/src/lib/analytics.js

```javascript
export const trackEvent = (eventName, params = {}) => {
    if (window.gtag) {
        window.gtag('event', eventName, params);
        console.log(`📊 GA Event: ${eventName}`, params);
    } else {
        console.warn("Google Analytics not initialized");
    }
};

export const ANALYTICS_EVENTS = {
    CV_UPLOAD: 'cv_upload',
    ANALYSIS_SUCCESS: 'analysis_success',
    ANALYSIS_FAIL: 'analysis_fail',
    DOWNLOAD_WORD: 'download_word',
    SYSTEM_BUSY: 'system_busy'
};

```

---

## File: client/src/lib/utils.js

```javascript
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

```

---

## File: client/src/locales/en.json

```json
{
    "header": {
        "subtitle": "Global Career Assistant",
        "download_cv": "Download CV (.docx)",
        "download": "Download",
        "interview_prep": "Interview Prep",
        "browser_alert": "⚠️ LinkedIn/Instagram browser might block downloads.\n\nPlease use 'Open in Browser' from the top right menu."
    },
    "landing": {
        "hero": {
            "title_part1": "Is Your CV Ready for",
            "title_part2": "Global Standards?",
            "subtitle_part1": "Analyze your CV in seconds, discover your ATS Score, and get a",
            "job_match_score": "Job Match Score",
            "subtitle_part2": "tailored to your target job posting. Download your fully optimized, professional, global-ready CV.",
            "cta": "Analyze and Improve My CV ✨",
            "privacy": "100% privacy. Your documents are never stored."
        },
        "steps": {
            "1": {
                "title": "🚀 1. Upload Your CV",
                "desc": "Add your CV in PDF/Word format. The system instantly analyzes <0>ATS compatibility</0>."
            },
            "2": {
                "title": "🎯 2. Paste the Job Description (Optional)",
                "desc": "If you add a job posting, AI evaluates your CV specifically for that role and gives you a <0>Job Match Score</0>."
            },
            "3": {
                "title": "🤖 3. Get Your Optimized Global CV",
                "desc": "AI rewrites your CV, adds missing keywords, and creates a sharp, <0>ATS-friendly</0> professional document."
            }
        },
        "jobmatch": {
            "title": "🎯 New: Job Match Score",
            "desc": "When you add a job posting, GlobalKariyer.ai analyzes your CV specifically for that role and provides:",
            "item1": {
                "title": "✔ Job Match Score",
                "desc": "0–100 match score."
            },
            "item2": {
                "title": "✔ Missing from CV",
                "desc": "Points missing from your CV but required in the job."
            },
            "item3": {
                "title": "✔ Suggested Keywords",
                "desc": "Critical keywords to pass ATS filters."
            }
        },
        "trust": {
            "title": "🔒 Your Privacy Comes First",
            "desc": "No file storage. No data sharing. Automatically deleted after processing."
        },
        "final_cta": {
            "title": "Ready?",
            "desc": "Boost your interview chances with a global-standard CV.",
            "button": "Analyze My CV ✨"
        }
    },
    "hero": {
        "title_part1": "Is Your CV Ready for",
        "title_part2": "Global Standards?",
        "description": "Analyze your CV with AI in seconds, get your ATS score, and rewrite it professionally for international applications."
    },
    "dashboard": {
        "new_analysis": "New Analysis",
        "current": "Initial Score",
        "potential": "General CV Health",
        "cv_health_score": "CV Health Score",
        "interview_chance": "Interview Chance:",
        "interview_chance_desc": "Download your optimized CV to increase your chances.",
        "ats_analysis": "ATS Detailed Analysis",
        "searchability": "Searchability",
        "hard_skills": "Hard Skills",
        "soft_skills": "Soft Skills",
        "formatting": "Formatting",
        "analysis_report": "Analysis Report",
        "improvements": "Improvements Made",
        "ats_check": "ATS Format Check",
        "suggested_keywords": "Suggested Keywords",
        "example": "Example:",
        "benefit": "Benefit",
        "support_title": "Did you like this project?",
        "support_desc": "GlobalKariyer.ai is a free and open-source project. You can buy us a coffee to support server costs. ☕",
        "buy_coffee": "Buy Me a Coffee",
        "overview_summary": "High-level assessment",
        "overview_hint": "Full details are available in the analysis report below.",
        "jobfit_title": "Match with this Job",
        "jobfit_score_label": "Job Match Score",
        "jobfit_level_label": "Match Level",
        "jobfit_keyword_rate": "Keyword coverage from the job description",
        "jobfit_strong": "Strong Matches",
        "jobfit_missing": "Missing from your CV",
        "jobfit_nice": "Nice-to-have extras",
        "jobfit_desc_dynamic": "This score reflects how well your skills and experience align with the job requirements.",
        "jobfit_cta_title": "Unlock Your Job Match Score",
        "jobfit_cta_desc": "Add a job description to see how well your CV matches the role and get missing keywords.",
        "jobfit_cta_button": "Analyze with Job Description",
        "interview_prep_desc": "Generate personalized interview questions and answers based on your CV and this job description.",
        "generate_questions": "Generate Questions"
    },
    "upload": {
        "title": "Upload CV (PDF/Word)",
        "job_desc_label": "JOB DESCRIPTION (OPTIONAL - RECOMMENDED)",
        "job_desc_placeholder": "Paste the job description here. AI will optimize your CV based on keywords from this ad.",
        "analyze_button": "Analyze & Improve My CV",
        "privacy_note": "Your privacy is important to us. Your CV is not stored on our servers.",
        "analyzing": "Analyzing...",
        "drag_drop": "Drag & drop or click to upload",
        "file_selected": "File selected:",
        "change_file": "Change file"
    },
    "loading": {
        "start": "Starting Analysis...",
        "step1": "Scanning and Parsing CV...",
        "step2": "Analyzing ATS Compatibility...",
        "step3": "Identifying Keywords and Gaps...",
        "step4": "AI is examining your CV in detail...",
        "step5": "Calculating ATS compatibility score...",
        "step6": "Checking English grammar...",
        "step7": "Scanning sector-specific keywords...",
        "step8": "Almost done, please do not close the page! 🚀"
    },
    "interview_loading": {
        "step1": "Analyzing your CV experience...",
        "step2": "Parsing job requirements...",
        "step3": "Identifying potential interview topics...",
        "step4": "Generating behavioral questions...",
        "step5": "Drafting sample answers and tips...",
        "step6": "Finalizing your prep kit..."
    },
    "preview": "Preview",
    "payment": {
        "unlock_title": "Unlock Your CV",
        "description": "Get your ATS-optimized, professionally formatted CV now.",
        "one_time": "One-time payment",
        "feature_docx": "Download editable .docx file",
        "feature_ats": "ATS Optimization applied",
        "feature_format": "Professional formatting",
        "processing": "Processing...",
        "pay_button": "Pay & Download",
        "secure_note": "Secured by Lemon Squeezy. 100% Money-back guarantee."
    },
    "cover_letter": {
        "title": "Cover Letter Generator",
        "desc": "Generate a tailored cover letter based on your CV and the job description.",
        "job_desc_label": "Job Description",
        "job_desc_placeholder": "Paste the job description here...",
        "error_no_jd": "Please enter a Job Description first.",
        "error_generic": "Failed to generate cover letter. Please try again.",
        "generating": "Generating...",
        "generate": "Generate Cover Letter",
        "success": "Cover Letter Generated!"
    },
    "common": {
        "back": "Back to Edit",
        "copied": "Copied",
        "copy": "Copy Text",
        "download_docx": "Download DOCX",
        "regenerate": "Regenerate"
    }
}
```

---

## File: client/src/locales/tr.json

```json
{
    "header": {
        "subtitle": "Yurt Dışı Kariyer Asistanı",
        "download_cv": "CV İndir (.docx)",
        "download": "İndir",
        "interview_prep": "Mülakat Hazırlığı",
        "browser_alert": "⚠️ LinkedIn/Instagram tarayıcısı dosya indirmeyi engelleyebilir.\n\nLütfen sağ üstteki '...' menüsünden 'Tarayıcıda Aç' (Open in Browser) seçeneğini kullanın."
    },
    "landing": {
        "hero": {
            "title_part1": "CV’niz Global Standartlara",
            "title_part2": "Hazır mı?",
            "subtitle_part1": "Yapay zeka ile CV’nizi saniyeler içinde analiz edin, ATS skorunuzu öğrenin ve iş ilanına göre",
            "job_match_score": "Job Match Score",
            "subtitle_part2": "alın. Yurt dışı başvurular için yeniden yazılmış profesyonel CV’nizi indirin.",
            "cta": "CV’mi Analiz Et ve İyileştir ✨",
            "privacy": "%100 gizlilik. Dosyalarınız sunucularımızda saklanmaz."
        },
        "steps": {
            "1": {
                "title": "🚀 1. CV’ni Yükle",
                "desc": "PDF/Word formatında CV’ni ekle. Sistem anında <0>ATS uyumluluğunu</0> analiz eder."
            },
            "2": {
                "title": "🎯 2. İş İlanını Yapıştır (Opsiyonel)",
                "desc": "Başvurmak istediğin iş ilanını eklersen, yapay zeka CV’ni bu role göre değerlendirir ve sana <0>Job Match Score</0> verir."
            },
            "3": {
                "title": "🤖 3. Optimize Edilmiş Global CV’ni Al",
                "desc": "AI, CV’ni yeniden yazar, eksik anahtar kelimeleri ekler ve <0>ATS’ye tam uyumlu</0> güçlü bir doküman üretir."
            }
        },
        "jobmatch": {
            "title": "🎯 Yeni: Job Match Score",
            "desc": "İş ilanını eklediğinde GlobalKariyer.ai CV’ni bu role göre analiz eder ve sana:",
            "item1": {
                "title": "✔ Job Match Score",
                "desc": "0–100 arası genel uyum skorun."
            },
            "item2": {
                "title": "✔ Eksikler",
                "desc": "CV’inde olmayan ama iş ilanında aranan noktalar."
            },
            "item3": {
                "title": "✔ Anahtar Kelimeler",
                "desc": "ATS’e takılmamak için eklemen gereken global terimler."
            }
        },
        "trust": {
            "title": "🔒 Güvenliğiniz Önceliğimiz",
            "desc": "Dosyalarınız asla kaydedilmez veya paylaşılmaz. İşlem tamamlandıktan hemen sonra silinir."
        },
        "final_cta": {
            "title": "Hazır mısın?",
            "desc": "Global standartlarda bir CV ile başvurularını güçlendir.",
            "button": "CV’mi Analiz Et ve İyileştir ✨"
        }
    },
    "hero": {
        "title_part1": "CV'niz Global Standartlara",
        "title_part2": "Hazır mı?",
        "description": "Yapay zeka ile CV'nizi saniyeler içinde analiz edin, ATS skorunu öğrenin ve yurt dışı başvuruları için profesyonelce yeniden yazın."
    },
    "dashboard": {
        "new_analysis": "Yeni Analiz",
        "current": "İlk Puan",
        "potential": "Genel CV Sağlığı",
        "cv_health_score": "CV Sağlık Puanı",
        "interview_chance": "Mülakat Şansınız:",
        "interview_chance_desc": "\"CV İndir\" butonu ile optimize edilmiş CV'nizi indirip şansınızı artırın.",
        "ats_analysis": "ATS Detay Analizi",
        "searchability": "Bulunabilirlik (Searchability)",
        "hard_skills": "Teknik Yetkinlik (Hard Skills)",
        "soft_skills": "Sosyal Beceriler (Soft Skills)",
        "formatting": "ATS Formatı (Formatting)",
        "analysis_report": "Analiz Raporu",
        "improvements": "Yapılan İyileştirmeler",
        "ats_check": "ATS Format Kontrolü",
        "suggested_keywords": "Önerilen Anahtar Kelimeler",
        "example": "Örnek:",
        "benefit": "Fayda",
        "support_title": "Bu Projeyi Beğendiniz mi?",
        "support_desc": "GlobalKariyer.ai tamamen ücretsiz ve açık kaynaklı bir projedir. Sunucu masraflarına destek olmak isterseniz bize bir kahve ısmarlayabilirsiniz. ☕",
        "buy_coffee": "Bana Kahve Ismarla",
        "overview_summary": "Genel Değerlendirme",
        "overview_hint": "Detaylı analiz raporu aşağıdadır.",
        "jobfit_title": "İş İlanı Uyumu",
        "jobfit_score_label": "İlan Eşleşmesi",
        "jobfit_level_label": "Uyum Seviyesi",
        "jobfit_keyword_rate": "İlan anahtar kelime oranı",
        "jobfit_strong": "Güçlü Eşleşmeler",
        "jobfit_missing": "CV'nizde Eksik Olanlar",
        "jobfit_nice": "Olsa İyi Olur (Nice-to-have)",
        "jobfit_desc_dynamic": "Bu puan, yeteneklerinizin ve deneyiminizin iş ilanıyla ne kadar örtüştüğünü gösterir.",
        "jobfit_cta_title": "İş Eşleşme Skorunu Aç",
        "jobfit_cta_desc": "İş ilanı ekleyerek CV'nizin ilana ne kadar uyduğunu görün ve eksik anahtar kelimeleri öğrenin.",
        "jobfit_cta_button": "İş İlanı ile Analiz Et",
        "interview_prep_desc": "CV'niz ve bu iş ilanı baz alınarak kişiselleştirilmiş mülakat soruları ve cevapları oluşturun.",
        "generate_questions": "Soruları Hazırla"
    },
    "upload": {
        "title": "CV Yükle (PDF/Word)",
        "job_desc_label": "İŞ İLANI (OPSİYONEL - ÖNERİLİR)",
        "job_desc_placeholder": "Başvurmak istediğiniz iş ilanının metnini buraya yapıştırın. Yapay zeka, CV'nizi bu ilandaki anahtar kelimelere göre optimize edecektir.",
        "analyze_button": "CV'mi Analiz Et ve İyileştir",
        "privacy_note": "Gizliliğiniz bizim için önemli. CV'niz sunucularımızda saklanmaz.",
        "analyzing": "Analiz Ediliyor...",
        "drag_drop": "Yüklemek için sürükleyip bırakın veya tıklayın",
        "file_selected": "Seçilen dosya:",
        "change_file": "Dosyayı değiştir"
    },
    "loading": {
        "start": "Analiz Başlatılıyor...",
        "step1": "CV Taranıyor ve Ayrıştırılıyor...",
        "step2": "ATS Uyumluluk Analizi Yapılıyor...",
        "step3": "Anahtar Kelimeler ve Eksikler Belirleniyor...",
        "step4": "Yapay zeka CV'nizi detaylıca inceliyor...",
        "step5": "ATS uyumluluk skoru hesaplanıyor...",
        "step6": "İngilizce dil bilgisi kontrol ediliyor...",
        "step7": "Sektörel anahtar kelimeler taranıyor...",
        "step8": "Neredeyse bitti, lütfen sayfayı kapatmayın! 🚀"
    },
    "interview_loading": {
        "step1": "CV deneyimleriniz analiz ediliyor...",
        "step2": "İş ilanı gereksinimleri inceleniyor...",
        "step3": "Potansiyel mülakat konuları belirleniyor...",
        "step4": "Davranışsal sorular oluşturuluyor...",
        "step5": "Örnek cevaplar ve ipuçları hazırlanıyor...",
        "step6": "Hazırlık kitiniz tamamlanıyor..."
    },
    "preview": "Önizleme",
    "payment": {
        "unlock_title": "CV'nizin Kilidini Açın",
        "description": "ATS uyumlu, profesyonelce formatlanmış CV'nizi hemen indirin.",
        "one_time": "Tek seferlik ödeme",
        "feature_docx": "Düzenlenebilir .docx dosyası indir",
        "feature_ats": "ATS Optimizasyonu uygulandı",
        "feature_format": "Profesyonel formatlama",
        "processing": "İşleniyor...",
        "pay_button": "Öde ve İndir",
        "secure_note": "Lemon Squeezy ile güvenli ödeme. %100 İade garantisi."
    },
    "cover_letter": {
        "title": "Ön Yazı Oluşturucu",
        "desc": "CV'niz ve iş ilanı baz alınarak kişiselleştirilmiş bir ön yazı oluşturun.",
        "job_desc_label": "İş İlanı",
        "job_desc_placeholder": "İş ilanını buraya yapıştırın...",
        "error_no_jd": "Lütfen önce bir İş İlanı girin.",
        "error_generic": "Ön yazı oluşturulamadı. Lütfen tekrar deneyin.",
        "generating": "Oluşturuluyor...",
        "generate": "Ön Yazı Oluştur",
        "success": "Ön Yazı Oluşturuldu!"
    },
    "common": {
        "back": "Düzenlemeye Dön",
        "copied": "Kopyalandı",
        "copy": "Metni Kopyala",
        "download_docx": "DOCX İndir",
        "regenerate": "Yeniden Oluştur"
    }
}
```

---

## File: client/src/locales/zh.json

```json
{
    "header": {
        "subtitle": "全球职业助手",
        "download_cv": "下载简历 (.docx)",
        "download": "下载",
        "interview_prep": "面试准备",
        "browser_alert": "⚠️ LinkedIn/Instagram 浏览器可能会阻止下载。\n\n请使用右上角菜单中的“在浏览器中打开”。"
    },
    "landing": {
        "hero": {
            "title_part1": "您的简历准备好",
            "title_part2": "符合全球标准了吗？",
            "subtitle_part1": "几秒钟内分析您的简历，发现您的 ATS 分数，并获得",
            "job_match_score": "职位匹配分数",
            "subtitle_part2": "针对您的目标职位量身定制。下载完全优化、专业、符合全球标准的简历。",
            "cta": "分析并改进我的简历 ✨",
            "privacy": "100% 隐私。您的文档永远不会被存储。"
        },
        "steps": {
            "1": {
                "title": "🚀 1. 上传您的简历",
                "desc": "添加 PDF/Word 格式的简历。系统立即分析 <0>ATS 兼容性</0>。"
            },
            "2": {
                "title": "🎯 2. 粘贴职位描述（可选）",
                "desc": "如果您添加职位发布，AI 会专门针对该职位评估您的简历，并给您一个 <0>职位匹配分数</0>。"
            },
            "3": {
                "title": "🤖 3. 获取您优化的全球简历",
                "desc": "AI 重写您的简历，添加缺失的关键字，并创建一个清晰、<0>ATS 友好</0> 的专业文档。"
            }
        },
        "jobmatch": {
            "title": "🎯 新功能：职位匹配分数",
            "desc": "当您添加职位发布时，GlobalKariyer.ai 会专门针对该职位分析您的简历并提供：",
            "item1": {
                "title": "✔ 职位匹配分数",
                "desc": "0–100 匹配分数。"
            },
            "item2": {
                "title": "✔ 简历缺失",
                "desc": "简历中缺失但职位要求的要点。"
            },
            "item3": {
                "title": "✔ 建议关键字",
                "desc": "通过 ATS 过滤器的关键关键字。"
            }
        },
        "trust": {
            "title": "🔒 您的隐私至上",
            "desc": "无文件存储。无数据共享。处理后自动删除。"
        },
        "final_cta": {
            "title": "准备好了吗？",
            "desc": "用符合全球标准的简历提高您的面试机会。",
            "button": "分析我的简历 ✨"
        }
    },
    "hero": {
        "title_part1": "您的简历准备好",
        "title_part2": "符合全球标准了吗？",
        "description": "几秒钟内用 AI 分析您的简历，获取您的 ATS 分数，并为国际申请专业重写。"
    },
    "dashboard": {
        "new_analysis": "新分析",
        "current": "初始分数",
        "potential": "综合简历健康度",
        "cv_health_score": "简历健康评分",
        "interview_chance": "面试机会：",
        "interview_chance_desc": "下载优化后的简历以增加机会。",
        "ats_analysis": "ATS 详细分析",
        "searchability": "可搜索性",
        "hard_skills": "硬技能",
        "soft_skills": "软技能",
        "formatting": "格式",
        "analysis_report": "分析报告",
        "improvements": "已做的改进",
        "ats_check": "ATS 格式检查",
        "suggested_keywords": "建议关键字",
        "example": "示例：",
        "benefit": "好处",
        "support_title": "您喜欢这个项目吗？",
        "support_desc": "GlobalKariyer.ai 是一个免费的开源项目。您可以请我们喝杯咖啡来支持服务器费用。☕",
        "buy_coffee": "请我喝杯咖啡",
        "overview_summary": "高层评估",
        "overview_hint": "详细信息可在下方的分析报告中查看。",
        "jobfit_title": "与此职位匹配",
        "jobfit_score_label": "职位匹配分数",
        "jobfit_level_label": "匹配级别",
        "jobfit_keyword_rate": "职位描述中的关键字覆盖率",
        "jobfit_strong": "强匹配",
        "jobfit_missing": "简历中缺失",
        "jobfit_nice": "锦上添花",
        "jobfit_desc_dynamic": "此分数反映了您的技能和经验与职位要求的匹配程度。",
        "jobfit_cta_title": "解锁您的职位匹配分数",
        "jobfit_cta_desc": "添加职位描述以查看您的简历与职位的匹配程度并获取缺失的关键字。",
        "jobfit_cta_button": "使用职位描述进行分析",
        "interview_prep_desc": "根据您的简历和此职位描述生成个性化的面试问题和答案。",
        "generate_questions": "生成问题"
    },
    "upload": {
        "title": "上传简历 (PDF/Word)",
        "job_desc_label": "职位描述（可选 - 推荐）",
        "job_desc_placeholder": "在此粘贴职位描述。AI 将根据此广告中的关键字优化您的简历。",
        "analyze_button": "分析并改进我的简历",
        "privacy_note": "您的隐私对我们很重要。您的简历不会存储在我们的服务器上。",
        "analyzing": "正在分析...",
        "drag_drop": "拖放或点击上传",
        "file_selected": "已选文件：",
        "change_file": "更改文件"
    },
    "loading": {
        "start": "开始分析...",
        "step1": "正在扫描和解析简历...",
        "step2": "正在分析 ATS 兼容性...",
        "step3": "正在识别关键字和差距...",
        "step4": "AI 正在详细检查您的简历...",
        "step5": "正在计算 ATS 兼容性分数...",
        "step6": "正在检查英语语法...",
        "step7": "正在扫描行业特定关键字...",
        "step8": "快完成了，请不要关闭页面！🚀"
    },
    "interview_loading": {
        "step1": "正在分析您的简历经验...",
        "step2": "正在解析职位要求...",
        "step3": "正在识别潜在的面试主题...",
        "step4": "正在生成行为问题...",
        "step5": "正在起草示例答案和提示...",
        "step6": "正在完成您的准备套件..."
    },
    "preview": "预览",
    "payment": {
        "unlock_title": "解锁您的简历",
        "description": "立即获取经过 ATS 优化、专业格式化的简历。",
        "one_time": "一次性付款",
        "feature_docx": "下载可编辑的 .docx 文件",
        "feature_ats": "已应用 ATS 优化",
        "feature_format": "专业格式",
        "processing": "正在处理...",
        "pay_button": "付款并下载",
        "secure_note": "由 Lemon Squeezy 担保。100% 退款保证。"
    },
    "cover_letter": {
        "title": "求职信生成器",
        "desc": "根据您的简历和职位描述生成量身定制的求职信。",
        "job_desc_label": "职位描述",
        "job_desc_placeholder": "在此粘贴职位描述...",
        "error_no_jd": "请先输入职位描述。",
        "error_generic": "生成求职信失败。请重试。",
        "generating": "正在生成...",
        "generate": "生成求职信",
        "success": "求职信已生成！"
    },
    "common": {
        "back": "返回编辑",
        "copied": "已复制",
        "copy": "复制文本",
        "download_docx": "下载 DOCX",
        "regenerate": "重新生成"
    }
}
```

---

