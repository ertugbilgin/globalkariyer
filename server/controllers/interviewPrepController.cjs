const { generateInterviewPrep } = require('../services/aiService.cjs');

const createInterviewPrep = async (req, res) => {
    try {
        const { cvText, jobDescription, language = "en" } = req.body;
        console.log("Interview Prep Request:", { language, cvTextLength: cvText?.length, jobDescLength: jobDescription?.length });

        if (!cvText && !jobDescription) {
            return res.status(400).json({ error: "At least cvText or jobDescription is required" });
        }

        const prep = await generateInterviewPrep({ cvText, jobDescription, language });
        res.json(prep);
    } catch (err) {
        console.error("Interview Prep Error:", err);
        res.status(500).json({ error: "Failed to generate interview prep" });
    }
};

module.exports = { createInterviewPrep };
