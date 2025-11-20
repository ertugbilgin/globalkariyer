function cleanAndParseJSON(rawText) {
    try {
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        try {
            let fixed = rawText.replace(/(?:\r\n|\r|\n)/g, '\\n').replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(fixed);
        } catch (e2) { throw new Error("AI yanıtı okunamadı."); }
    }
}

module.exports = { cleanAndParseJSON };
