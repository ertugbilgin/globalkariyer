import { useState, useEffect } from "react";
import { Loader2, FileText, Copy, Check, X, Wand2, FileDown, Lock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { generateCoverLetterDoc } from '../lib/docxGenerator';

export default function CoverLetterModal({ isOpen, onClose, result, jobDesc, cvText, onOpenPaywall, hasAccess }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [copied, setCopied] = useState(false);
    const [localJobDesc, setLocalJobDesc] = useState("");
    const [error, setError] = useState(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            // First priority: jobDesc prop
            // Second priority: sessionStorage (for post-payment return)
            const savedJD = sessionStorage.getItem('temp_job_desc');
            const jdToUse = jobDesc || savedJD || "";
            setLocalJobDesc(jdToUse);

            // Restore cover letter from cache if available
            const savedCoverLetter = sessionStorage.getItem('temp_cover_letter');
            if (savedCoverLetter) {
                console.log('✅ Restored cover letter from cache');
                setCoverLetter(savedCoverLetter);
            }

            setError(null);
        }
    }, [isOpen, jobDesc]);

    const handleGenerate = async () => {
        if (!localJobDesc?.trim()) {
            setError(t('cover_letter.error_no_jd', 'Please enter a Job Description first.'));
            return;
        }

        // Enforce Paywall BEFORE generation
        if (!hasAccess && onOpenPaywall) {
            // Save current JD before redirecting to payment
            sessionStorage.setItem('temp_job_desc', localJobDesc);
            onOpenPaywall();
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/cover-letter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cvText,
                    jobDescription: localJobDesc,
                    language: i18n.language,
                    tone: "professional",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate cover letter');
            }

            setCoverLetter(data.coverLetter || "");

            // Cache cover letter to sessionStorage
            sessionStorage.setItem('temp_cover_letter', data.coverLetter || "");
            console.log('💾 Cached cover letter to sessionStorage');

            // Notify parent about the new JD if it changed or wasn't there
            if (onJobDescUpdate && localJobDesc) {
                onJobDescUpdate(localJobDesc);
            }

        } catch (error) {
            console.error("Failed to generate cover letter:", error);
            setError(error.message || t('cover_letter.error_generic', 'Failed to generate cover letter. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 transform scale-90 md:scale-100 origin-top">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors z-50"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                            <Wand2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {t('cover_letter.title', 'Cover Letter Generator')}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {t('cover_letter.desc', 'Generate a tailored cover letter based on your CV and the job description.')}
                            </p>
                        </div>
                    </div>

                    {/* Body */}
                    {!coverLetter ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                    {t('cover_letter.job_desc_label', 'Job Description')}
                                </label>
                                <textarea
                                    className="
                                        w-full rounded-xl bg-slate-950/40 
                                        border border-slate-700/50 
                                        p-4 text-sm text-slate-300 
                                        leading-relaxed min-h-[150px] 
                                        focus:outline-none focus:border-indigo-500/50
                                        custom-scrollbar resize-y
                                        placeholder:text-slate-600
                                    "
                                    placeholder={t('cover_letter.job_desc_placeholder', 'Paste the job description here...')}
                                    value={localJobDesc}
                                    onChange={(e) => setLocalJobDesc(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="
                                    w-full flex items-center justify-center gap-2 rounded-xl 
                                    bg-indigo-600 hover:bg-indigo-500 
                                    px-6 py-4 text-sm font-bold text-white 
                                    shadow-lg shadow-indigo-500/20
                                    hover:-translate-y-0.5 transition-all 
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                "
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    hasAccess ? <Wand2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />
                                )}
                                {loading ? t('cover_letter.generating', 'Generating...') : (hasAccess ? t('cover_letter.generate', 'Generate Cover Letter') : "Unlock Cover Letter")}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    {t('cover_letter.success', 'Cover Letter Generated!')}
                                </h3>
                                <button
                                    onClick={() => setCoverLetter("")}
                                    className="text-xs text-slate-400 hover:text-white underline"
                                >
                                    {t('common.back', 'Back to Edit')}
                                </button>
                            </div>

                            <textarea
                                className="
                                    w-full rounded-xl bg-slate-950/50 
                                    border border-slate-700/50 
                                    p-5 text-sm text-slate-200 
                                    leading-relaxed min-h-[400px] 
                                    focus:outline-none focus:border-indigo-500/50
                                    custom-scrollbar resize-y
                                "
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                            />

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="
                                        flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl 
                                        bg-slate-800 hover:bg-slate-700 
                                        px-4 py-3 text-sm font-semibold text-slate-300 
                                        transition-colors border border-slate-700
                                    "
                                >
                                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy Text')}
                                </button>

                                <button
                                    onClick={() => generateCoverLetterDoc(coverLetter)}
                                    className="
                                        flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl 
                                        bg-indigo-600 hover:bg-indigo-500 
                                        px-4 py-3 text-sm font-semibold text-white 
                                        transition-colors border border-indigo-500/50
                                        shadow-lg shadow-indigo-500/20
                                    "
                                >
                                    <FileDown className="h-4 w-4" />
                                    {t('common.download_docx', 'Download DOCX')}
                                </button>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="
                                        flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl 
                                        bg-slate-800 hover:bg-slate-700 
                                        px-4 py-3 text-sm font-semibold text-slate-300 
                                        transition-colors border border-slate-700
                                    "
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                    {t('common.regenerate', 'Regenerate')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
