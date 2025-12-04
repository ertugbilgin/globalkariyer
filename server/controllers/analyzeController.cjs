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
