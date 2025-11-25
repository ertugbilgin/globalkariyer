```
const JSON5 = require('json5');

function cleanAndParseJSON(rawText) {
    try {
        // 1. Markdown bloklarını temizle (Backticks ve Single Quotes)
        let cleanText = rawText
            .replace(/```json / g, '')
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
