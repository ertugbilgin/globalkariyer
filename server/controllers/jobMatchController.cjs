const { callGeminiRaw } = require('../services/aiService.cjs');
const { cleanAndParseJSON } = require('../services/parserService.cjs');

const analyzeJobMatch = async (req, res) => {
    try {
        const { cvText, jobDescription, language } = req.body;

        if (!cvText || !jobDescription) {
            return res.status(400).json({ error: "CV text and Job Description are required." });
        }

        let systemInstruction = "";
        if (language === "tr") {
            systemInstruction = "Sen uzman bir işe alım uzmanı ve CV analistisin. Türkçe cevap ver.";
        } else if (language === "zh" || language === "cn") {
            systemInstruction = "你是一名专业的招聘专家和简历分析师。请用中文回答。";
        } else {
            systemInstruction = "You are an expert recruiter and CV analyst. Respond in English.";
        }

        const prompt = `
${systemInstruction}

TASK:
Analyze the match between the provided CV and Job Description (JD).
Calculate a match score and identify strengths, missing skills, and keywords.

INPUTS:
- JOB DESCRIPTION: """${jobDescription}"""
- CV CONTENT: """${cvText}"""

OUTPUT FORMAT:
Return ONLY a JSON object with this structure:

{
  "jobFit": {
    "score": 0-100,
    "matchLevel": "Low" | "Medium" | "High" | "Excellent",
    "summary": "Short explanation of the score (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'}).",
    "strongPoints": ["Strength 1", "Strength 2"],
    "missingFromCv": ["Missing Requirement 1", "Missing Requirement 2"],
    "niceToHave": ["Nice to have 1"],
    "keywordMatchRate": 0-100
  },
  "missingKeywords": [
    {
      "keyword": "Keyword",
      "usageTip": "Tip on how to use it",
      "benefit": "Why it matters"
    }
  ]
}
`;

        const rawResponse = await callGeminiRaw(prompt);
        const finalData = cleanAndParseJSON(rawResponse);

        res.json(finalData);

    } catch (error) {
        console.error("Job Match Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze job match." });
    }
};

module.exports = { analyzeJobMatch };
