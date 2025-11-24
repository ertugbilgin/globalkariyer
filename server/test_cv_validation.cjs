const fs = require('fs');
const path = require('path');

// 1. Create a dummy non-CV file
const filePath = path.join(__dirname, 'recipe.txt');
fs.writeFileSync(filePath, "Mercimek Çorbası Tarifi: 1 bardak mercimek, 1 soğan, 1 havuç. Hepsini kaynatın.");

console.log("🧪 Test Başlıyor: CV Olmayan Dosya Gönderimi...");

async function runTest() {
    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(filePath)], { type: 'text/plain' });
    formData.append('cv', fileBlob, 'recipe.txt');

    try {
        const response = await fetch('http://localhost:5001/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        console.log(`📡 Status Code: ${response.status}`);
        console.log(`📩 Response:`, data);

        if (response.status === 400 && data.error.includes("CV'ye benzemiyor")) {
            console.log("✅ BAŞARILI: Sistem CV olmayan dosyayı reddetti!");
        } else {
            console.error("❌ BAŞARISIZ: Beklenen hata alınamadı.");
        }

    } catch (error) {
        console.error("💥 Hata:", error);
    } finally {
        // Cleanup
        fs.unlinkSync(filePath);
    }
}

runTest();
