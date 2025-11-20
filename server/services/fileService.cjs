const pdf = require('pdf-extraction');
const mammoth = require('mammoth');

async function extractTextFromFile(file) {
    try {
        let text = "";
        if (file.mimetype === 'application/pdf') {
            const data = await pdf(file.buffer);
            text = data.text;
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
