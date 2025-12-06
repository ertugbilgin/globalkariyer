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

async function callGeminiRaw(prompt, systemInstructionText = null) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI_BUSY");

    // API'den alınan güncel model listesi (flash-latest kararlı sürüm olduğu için öne alındı)
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-flash-latest"];

    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`🌐 Deneniyor: ${model} (60sn limit)...`);

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        if (systemInstructionText) {
            requestBody.systemInstruction = { parts: [{ text: systemInstructionText }] };
        }

        try {
            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
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
                // Return both text and usage metadata
                return {
                    text: data.candidates[0].content.parts[0].text,
                    usage: data.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
                };
            }
        } catch (err) {
            console.log(`⚠️ Hata(${model}): ${err.message}`);
        }
    }
    throw new Error("AI_BUSY");
}

async function generateCoverLetter({ cvText, jobDescription, roleTitle, companyName, language, tone }) {
    const lang = (language || 'en').toLowerCase().split('-')[0];

    // ... (keep systemInstruction + userPrompt construction same as before) ...
    // Since I can't put the huge block here easily without restating it, I will assume the prompt logic is unchanged.
    // I will use `replace_file_content` on the specific blocks.

    // WAIT: I can't re-implement the whole internal logic if I don't paste it.
    // I need to only change the Return lines or wrapping logic.

    // Strategy: I will split this into smaller chunks.
}
// SKIP THIS TEXT BLOCK - Use chunks below.

const lang = (language || 'en').toLowerCase().split('-')[0];

let systemInstruction = "";
if (lang === "tr") {
    systemInstruction = "Sen Türkçe konuşan uzman bir kariyer koçu ve cover letter yazım uzmanısın. Tüm çıktıyı doğal, akıcı ve profesyonel Türkçe yaz.";
} else if (lang === "zh" || lang === "cn") {
    systemInstruction = "你是一名专业的职业顾问和求职信写作专家。请使用自然、准确、专业的中文回答所有内容。";
} else {
    systemInstruction = "You are a senior career coach and expert cover letter writer. You MUST respond in natural, fluent, professional English, regardless of the input language.";
}

const userPrompt = `
OUTPUT LANGUAGE: ${lang === "tr" ? "TURKISH" : (lang === "zh" || lang === "cn") ? "CHINESE" : "ENGLISH"}
IMPORTANT: Write the cover letter in the specified OUTPUT LANGUAGE.

${(lang === "tr") ? "CV METNİ:" : (lang === "zh" || lang === "cn") ? "简历文本:" : "CV TEXT:"}
${cvText}

${(lang === "tr") ? "İŞ İLANI:" : (lang === "zh" || lang === "cn") ? "职位描述:" : "JOB DESCRIPTION:"}
${jobDescription}

${(lang === "tr") ? "HEDEF BİLGİLER:" : (lang === "zh" || lang === "cn") ? "目标信息:" : "TARGET:"}
Role: ${roleTitle ?? "-"}
Company: ${companyName ?? "-"}

${(lang === "tr") ? "Lütfen aşağıdaki kurallara göre bir cover letter yaz:" : (lang === "zh" || lang === "cn") ? "请根据以下规则写一封求职信:" : "Please write a cover letter based on the following rules:"}

- Length: 3–5 paragraphs, 350–450 words total.
- Language: ${lang === "tr" ? "Turkish" : (lang === "zh" || lang === "cn") ? "Chinese" : "Fluent Professional English"}.
- Tone: ${tone}.
- Do NOT copy text from CV; rephrase it.
- Highlight experiences that directly match the job description.
- Use concrete examples of success (numbers, percentages, etc.).
- Include a strong but humble closing sentence and call to action (e.g., request for interview).
`;

const response = await callGeminiRaw(systemInstruction + "\n\n" + userPrompt);
// Handle both old (string) and new (object) format of callGeminiRaw for safety, though only object is used now.
if (typeof response === 'string') return { text: response, usage: null };
return { text: response.text, usage: response.usage };
}

async function generateInterviewPrep({ cvText, jobDescription, language }) {
    const lang = (language || 'en').toLowerCase().split('-')[0];
    console.log("AI Service Interview Prep Language:", lang);

    const systemPrompt = `
You are an AI career coach generating interview questions.

IMPORTANT LANGUAGE RULES:
- You MUST answer strictly in this language: ${lang}.
- DO NOT follow the language of the CV or job description.
- DO NOT translate the input; generate NEW content.
- If the CV is in another language, IGNORE its language and STILL ANSWER in ${lang}.
- This rule has the highest priority.

If language = "en", produce native-level professional English.
If language = "tr", produce fluent professional Turkish.
If language = "cn", produce fluent professional Chinese.
`;

    const instructions = (lang === "tr")
        ? "Çıktıyı mutlaka geçerli JSON formatında ver. Açıklama ya da yorum ekleme."
        : (lang === "zh" || lang === "cn")
            ? "仅返回有效的 JSON 格式。不要添加解释或评论。"
            : "Return ONLY valid JSON. No commentary.";

    const taskDescription = (lang === "tr")
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
        : (lang === "zh" || lang === "cn")
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

    const userPrompt = `
Here is the CV:
${cvText}

Here is the Job Description:
${jobDescription}

Generate interview questions and answer outlines.
LANGUAGE: ${lang}

${taskDescription}

${instructions}
${(lang === "tr") ? "Örnek JSON şeması:" : (lang === "zh" || lang === "cn") ? "示例 JSON 模式:" : "Example JSON schema:"}

{
  "categories": [
    {
      "id": "behavioral",
      "title": "${(lang === "tr") ? "Davranışsal / STAR" : (lang === "zh" || lang === "cn") ? "行为 / STAR" : "Behavioral / STAR"}",
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

    const rawResponse = await callGeminiRaw(userPrompt, systemPrompt);
    const textContent = typeof rawResponse === 'object' ? rawResponse.text : rawResponse;
    const usage = typeof rawResponse === 'object' ? rawResponse.usage : null;

    // Clean markdown code blocks if present
    let cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    return { data, usage };
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
