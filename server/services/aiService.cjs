require('dotenv').config();

// 20 Saniye Kesin Timeout
const fetchWithTimeout = async (url, options, timeout = 20000) => {
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
    if (!apiKey) throw new Error("AI_BUSY"); // API Key yoksa busy hatası dön

    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`🌐 Deneniyor: ${model} (20sn limit)...`);

        try {
            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }, 20000);

            if (response.status === 429) {
                console.log(`⏳ ${model} Kota Dolu. 1.5sn bekle...`);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            if (!response.ok) {
                console.log(`❌ ${model} Hatası: ${response.status}`);
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
    // Hiçbiri çalışmazsa buraya düşer
    throw new Error("AI_BUSY");
}

module.exports = { callGeminiRaw };
