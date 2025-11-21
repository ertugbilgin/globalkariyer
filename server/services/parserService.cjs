function cleanAndParseJSON(rawText) {
    try {
        // 1. Markdown bloklarını temizle
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. İlk '{' ve son '}' arasını al (AI bazen önsöz/sonsöz ekler)
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Hatası:", e.message);
        console.error("Gelen Veri:", rawText); // Debug için logla
        throw new Error("AI yanıtı okunamadı.");
    }
}

module.exports = { cleanAndParseJSON };
