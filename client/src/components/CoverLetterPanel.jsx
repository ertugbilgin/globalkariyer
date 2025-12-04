import { useState } from "react";
import { Loader2, FileText, Copy, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function CoverLetterPanel({ cvText, jobDescription }) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [copied, setCopied] = useState(false);
    const [localJobDesc, setLocalJobDesc] = useState(jobDescription || "");
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!localJobDesc?.trim()) {
            setError(t('cover_letter.error_no_jd', 'Please enter a Job Description first.'));
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
                    language: i18n.language === 'tr' ? 'tr' : 'en',
                    tone: "professional",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate cover letter');
            }

            setCoverLetter(data.coverLetter || "");
        } catch (error) {
            console.error("Failed to generate cover letter:", error);
            setError(t('cover_letter.error_generic', 'Failed to generate cover letter. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="panel-glass p-4 md:p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                <FileText className="h-4 w-4 text-indigo-400" />
                {t('cover_letter.title', 'Cover Letter Generator')}
            </div>
            <div className="section-divider-indigo mb-2" />

            <p className="text-xs text-slate-300">
                {t('cover_letter.desc', 'Generate a tailored cover letter based on your CV and the job description.')}
            </p>

            {/* Job Description Input */}
            <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {t('cover_letter.job_desc_label', 'Job Description')}
                </label>
                <textarea
                    className="
                        w-full rounded-xl bg-slate-950/40 
                        border border-slate-700/50 
                        p-3 text-xs text-slate-300 
                        leading-relaxed min-h-[80px] 
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
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {error}
                </div>
            )}

            {!coverLetter && (
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="
                        inline-flex items-center gap-2 rounded-xl 
                        bg-indigo-600 hover:bg-indigo-500 
                        px-4 py-2.5 text-xs font-bold text-white 
                        shadow-lg shadow-indigo-500/20
                        hover:-translate-y-0.5 transition-all 
                        disabled:opacity-60 disabled:cursor-not-allowed
                        w-full justify-center md:w-auto
                    "
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="h-4 w-4" />
                    )}
                    {loading ? t('cover_letter.generating', 'Generating...') : t('cover_letter.generate', 'Generate Cover Letter')}
                </button>
            )}

            {coverLetter && (
                <div className="space-y-3 animate-fade-in">
                    <textarea
                        className="
                            w-full rounded-xl bg-slate-950/50 
                            border border-slate-700/50 
                            p-4 text-xs md:text-sm text-slate-200 
                            leading-relaxed min-h-[300px] 
                            focus:outline-none focus:border-indigo-500/50
                            custom-scrollbar resize-y
                        "
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="
                                inline-flex items-center gap-2 rounded-lg 
                                bg-slate-800 hover:bg-slate-700 
                                px-3 py-2 text-xs font-semibold text-slate-300 
                                transition-colors border border-slate-700
                            "
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy Text')}
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="
                                inline-flex items-center gap-2 rounded-lg 
                                bg-slate-800 hover:bg-slate-700 
                                px-3 py-2 text-xs font-semibold text-slate-300 
                                transition-colors border border-slate-700
                            "
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                            {t('common.regenerate', 'Regenerate')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
