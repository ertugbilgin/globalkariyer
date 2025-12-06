import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';

const CircularProgress = ({ score }) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    let color = "text-red-500";
    if (score >= 70) color = "text-green-500";
    else if (score >= 40) color = "text-yellow-500";

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="64"
                    cy="64"
                />
                <motion.circle
                    className={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="64"
                    cy="64"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-bold ${color}`}>{score}</span>
                <span className="text-xs text-gray-500 uppercase font-medium">Skor</span>
            </div>
        </div>
    );
};

// Highlight important keywords in text
const highlightText = (text) => {
    if (!text || typeof text !== 'string') return text;

    const patterns = [
        // Numbers with units (10 years, 3X, 80%)
        { regex: /\b(\d+(\.\d+)?)\+?\s*(years?|months?|%|X)\b/gi, className: 'font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent' },
        // Company names (common Turkish ones)
        { regex: /\b(ING|Hepsipay|PayU|Klarna|Stripe|Garanti|İş Bankası|Akbank|YKB|TEB|ING Turkey)\b/g, className: 'font-semibold text-sky-600' },
        // Technical acronyms (2+ capital letters)
        { regex: /\b([A-Z]{2,})\b/g, className: 'font-semibold text-emerald-600' },
        // Action verbs
        { regex: /\b(Led|Managed|Improved|Architected|Developed|Launched|Delivered|Built|Scaled|Optimized|Created|Designed)\b/g, className: 'font-semibold text-indigo-600' },
    ];

    let highlightedText = text;
    const parts = [];
    let lastIndex = 0;

    // Find all matches
    const matches = [];
    patterns.forEach(({ regex, className }) => {
        const regexCopy = new RegExp(regex.source, regex.flags);
        let match;
        while ((match = regexCopy.exec(text)) !== null) {
            matches.push({
                index: match.index,
                length: match[0].length,
                text: match[0],
                className
            });
        }
    });

    // Sort by index
    matches.sort((a, b) => a.index - b.index);

    // Remove overlaps (keep first match)
    const filteredMatches = [];
    let lastEnd = -1;
    matches.forEach(match => {
        if (match.index >= lastEnd) {
            filteredMatches.push(match);
            lastEnd = match.index + match.length;
        }
    });

    // Build parts array
    filteredMatches.forEach((match, idx) => {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        // Add highlighted match
        parts.push(
            <span key={`highlight-${idx}`} className={match.className}>
                {match.text}
            </span>
        );
        lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
};

const ResultCard = ({ result }) => {
    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
        >
            <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                    <div className="flex-shrink-0">
                        <CircularProgress score={result.score} />
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analiz Sonucu</h2>
                        <p className="text-gray-600 leading-relaxed">{highlightText(result.summary)}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-red-50 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Eksik Anahtar Kelimeler</h3>
                        </div>
                        <ul className="space-y-3">
                            {result.missingKeywords?.map((keyword, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-700 bg-white p-3 rounded-xl shadow-sm border border-red-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                                    <span>{highlightText(keyword)}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-blue-50 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Lightbulb className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Geliştirme Önerileri</h3>
                        </div>
                        <ul className="space-y-3">
                            {result.recommendations?.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-700 bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                                    <ArrowRight className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                                    <span>{highlightText(rec)}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default ResultCard;
