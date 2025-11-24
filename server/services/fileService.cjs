const pdf = require('pdf-extraction');
const mammoth = require('mammoth');

async function extractTextFromFile(file) {
    try {
        console.log("📂 Dosya İşleniyor:", file.originalname, "Type:", file.mimetype);
        let text = "";
        if (file.mimetype === 'application/pdf') {
            const data = await pdf(file.buffer);
            text = data.text;
        } else if (file.mimetype === 'text/plain') {
            text = file.buffer.toString('utf-8');
        } else {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            text = result.value;
        }
        return text.substring(0, 25000); // Limit text length
    } catch (err) {
        throw new Error("Dosya okunamadı.");
    }
}

module.exports = { extractTextFromFile };
