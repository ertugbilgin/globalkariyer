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

module.exports = { callGeminiRaw };
