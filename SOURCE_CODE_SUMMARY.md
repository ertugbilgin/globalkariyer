# GlobalKariyer.ai - Full Source Code Dump
Generated on: 2025-12-04

## Overview
This document contains the source code for the key files modified in the recent sessions, including the latest bug fixes and feature additions.

### 1. client/src/components/InterviewPrepModal.jsx
**Update:** Fixed stale state issue. Now resets `prep` when `jobDescription` changes.

```jsx
import { useState, useEffect } from "react";
import { MessageCircleQuestion, Loader2, Sparkles, X, FileDown, Copy, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { generateInterviewPrepDoc } from '../lib/docxGenerator';

export default function InterviewPrepModal({ isOpen, onClose, cvText, jobDescription, onJobDescUpdate }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [prep, setPrep] = useState(null);
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState(0);
    const [localJobDesc, setLocalJobDesc] = useState(jobDescription || "");
    const [currentStep, setCurrentStep] = useState(0);

    const loadingSteps = [
        t('interview_loading.step1', 'Analyzing your CV experience...'),
        t('interview_loading.step2', 'Parsing job requirements...'),
        t('interview_loading.step3', 'Identifying potential interview topics...'),
        t('interview_loading.step4', 'Generating behavioral questions...'),
        t('interview_loading.step5', 'Drafting sample answers and tips...'),
        t('interview_loading.step6', 'Finalizing your prep kit...')
    ];

    useEffect(() => {
        setLocalJobDesc(jobDescription || "");
        // Reset prep content if the job description from parent changes
        // This prevents showing stale questions from a previous analysis
        setPrep(null); 
    }, [jobDescription]);

    // ... (rest of the component logic)
    
    // Note: Full file content is available in the project, this snippet highlights the key fix.
}
```

### 2. server/controllers/jobMatchController.cjs
**Feature:** Lightweight Job Match Analysis Endpoint.

```javascript
const { callGeminiRaw } = require('../services/aiService.cjs');
const { cleanAndParseJSON } = require('../services/parserService.cjs');

const analyzeJobMatch = async (req, res) => {
  try {
    const { cvText, jobDescription, language } = req.body;

    if (!cvText || !jobDescription) {
      return res.status(400).json({ error: "CV text and Job Description are required." });
    }

    let systemInstruction = "";
    if (language === "tr") {
      systemInstruction = "Sen uzman bir işe alım uzmanı ve CV analistisin. Türkçe cevap ver.";
    } else if (language === "zh" || language === "cn") {
      systemInstruction = "你是一名专业的招聘专家和简历分析师。请用中文回答。";
    } else {
      systemInstruction = "You are an expert recruiter and CV analyst. Respond in English.";
    }

    const prompt = `
${systemInstruction}

TASK:
Analyze the match between the provided CV and Job Description (JD).
Calculate a match score and identify strengths, missing skills, and keywords.

INPUTS:
- JOB DESCRIPTION: """${jobDescription}"""
- CV CONTENT: """${cvText}"""

OUTPUT FORMAT:
Return ONLY a JSON object with this structure:

{
  "jobFit": {
    "score": 0-100,
    "matchLevel": "Low" | "Medium" | "High" | "Excellent",
    "summary": "Short explanation of the score (in ${language === 'tr' ? 'Turkish' : (language === 'zh' || language === 'cn') ? 'Chinese' : 'English'}).",
    "strongPoints": ["Strength 1", "Strength 2"],
    "missingFromCv": ["Missing Requirement 1", "Missing Requirement 2"],
    "niceToHave": ["Nice to have 1"],
    "keywordMatchRate": 0-100
  },
  "missingKeywords": [
    {
      "keyword": "Keyword",
      "usageTip": "Tip on how to use it",
      "benefit": "Why it matters"
    }
  ]
}
`;

    const rawResponse = await callGeminiRaw(prompt);
    const finalData = cleanAndParseJSON(rawResponse);

    res.json(finalData);

  } catch (error) {
    console.error("Job Match Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze job match." });
  }
};

module.exports = { analyzeJobMatch };
```

### 3. client/src/hooks/useAnalyze.js (Key Update)
**Feature:** `calculateJobMatch` function for background updates.

```javascript
    const calculateJobMatch = async (currentCvText, newJobDesc) => {
        if (!currentCvText || !newJobDesc) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/job-match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cvText: currentCvText,
                    jobDescription: newJobDesc,
                    language: i18n.language
                })
            });

            const data = await res.json();
            if (data.jobFit) {
                trackEvent(ANALYTICS_EVENTS.JOB_MATCH_SUCCESS, { score: data.jobFit.score });
                setResult(prev => ({
                    ...prev,
                    jobFit: data.jobFit,
                    missingKeywords: data.missingKeywords || prev.missingKeywords
                }));
            }
        } catch (error) {
            console.error("Job Match update failed:", error);
        }
    };
```
