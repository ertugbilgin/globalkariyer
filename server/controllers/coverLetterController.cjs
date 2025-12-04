const { generateCoverLetter } = require('../services/aiService.cjs');

const createCoverLetter = async (req, res) => {
    try {
        const {
            cvText,
            jobDescription,
            roleTitle,
            companyName,
            language = "en",
            tone = "professional",
        } = req.body;

        if (!cvText || !jobDescription) {
            return res.status(400).json({ error: "cvText and jobDescription required" });
        }

        const coverLetter = await generateCoverLetter({
            cvText,
            jobDescription,
            roleTitle,
            companyName,
            language,
            tone,
        });

        res.json({ coverLetter });
    } catch (err) {
        console.error("Cover Letter Error:", err);
        res.status(500).json({ error: "Failed to generate cover letter" });
    }
};

module.exports = { createCoverLetter };
