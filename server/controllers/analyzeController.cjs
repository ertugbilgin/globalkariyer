const { extractTextFromFile } = require('../services/fileService.cjs');
const { callGeminiRaw } = require('../services/aiService.cjs');
const { cleanAndParseJSON } = require('../services/parserService.cjs');

const analyzeCV = async (req, res) => {
    try {
        console.log("📩 Analiz İsteği...");
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Dosya yok." });

        let cvText;
        try {
            cvText = await extractTextFromFile(req.files[0]);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        const jobDescription = req.body.jobDescription || "Genel Başvuru";

        const prompt = `Sen Dünya Standartlarında bir CV Koçu ve ATS Uzmanısın.GÖREVLER: 1. İletişim bilgilerini çıkar.       2. CV'yi analiz et ve SKORLA.       3. CV'yi İngilizce olarak YENİDEN YAZ.ÖZEL İSTEK(FONT):       Eğer CV'nin mevcut fontu/yapısı zaten iyiyse, "fontReason" kısmında bunu onayla. Değilse değiştir.              FORMAT:       - "optimizedCv" içinde önemli yerleri <mark data-reason="Türkçe Sebep">İngilizce Metin</mark> ile sar.       - Başlıkları ##, maddeleri * ile yap.       - İsim/İletişim bilgilerini optimizedCv içine yazma.              İŞ İLANI: ${jobDescription}       MEVCUT CV: ${cvText}              Yanıtı SADECE şu JSON formatında ver:       {         "contactInfo": { "name": "Ad", "title": "Ünvan", "email": "Email", "phone": "Tel", "location": "Konum", "linkedin": "Link" },         "scores": {           "current": (0-100),           "potential": (85-100),           "interviewRate": "Mülakat Şansı (Örn: 3 Kat)",           "breakdown": { "searchability": (0-10), "hardSkills": (0-10), "softSkills": (0-10), "formatting": (0-10) }         },         "summary": { "tr": "Özet", "improvements": ["Madde 1"] },         "uiSuggestions": { "selectedFont": "Font", "fontReason": { "tr": "Neden" } },         "atsModifications": [ { "action": "Başlık", "detail": "Detay" } ],         "missingKeywords": [{ "keyword": "Kelime", "usageTip": { "tr": "İpucu" }, "benefit": "Fayda" }],         "rewriteSuggestions": [{ "focus": "Konu", "original": "Eski", "suggestionEn": "Yeni", "reasonTr": "Neden" }],         "optimizedCv": "## PROFESSIONAL SUMMARY\\\\n..."       }`;

        try {
            const rawResponse = await callGeminiRaw(prompt);
            const finalData = cleanAndParseJSON(rawResponse);
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
