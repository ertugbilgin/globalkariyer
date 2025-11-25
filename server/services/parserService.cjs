function cleanAndParseJSON(rawText) {
    try {
        // 1. Markdown bloklarını temizle
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. İlk '{' ve son '}' arasını al
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        // 3. Yaygın LLM hatalarını düzelt (Unescaped newlines in strings)
        // Özellikle "optimizedCv" gibi uzun metinlerdeki satır sonlarını kaçırabiliyorlar.
        // Bu basit bir regex ile tam çözülemez ama en azından control karakterlerini temizleyebiliriz.
        cleanText = cleanText.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
            switch (char) {
                case '\b': return '\\b';
                case '\f': return '\\f';
                case '\n': return '\\n';
                case '\r': return '\\r';
                case '\t': return '\\t';
                default: return '';
            }
        });

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Hatası:", e.message);
        console.error("Gelen Veri (İlk 100 karakter):", rawText.substring(0, 100));

        // Fallback: Eğer parse edilemezse, en azından kullanıcıya bir hata dön
        // Amaç sunucunun 500 vermesini engellemek değil, kontrollü hata yönetmek.
        // Ancak burada throw etmek controller'da yakalanıyor, o yüzden throw devam etsin.
        throw new Error("AI yanıtı JSON formatına uygun değil. Lütfen tekrar deneyin.");
    }
}

module.exports = { cleanAndParseJSON };
