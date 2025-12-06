import { useState, useEffect } from "react";
import { MessageCircleQuestion, Loader2, Sparkles, X, FileDown, Copy, Check, Lock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { generateInterviewPrepDoc } from '../lib/docxGenerator';
import { supabase } from '../lib/supabase';

export default function InterviewPrepModal({ isOpen, onClose, cvText, jobDescription, onJobDescUpdate, onOpenPaywall, isPaid }) {
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
        // Only update when modal state changes
        if (isOpen) {
            // Priority: sessionStorage (for after payment) > jobDescription prop
            const savedJD = sessionStorage.getItem('temp_job_desc');
            const jdToUse = savedJD || jobDescription || "";
            console.log('🔍 INTERVIEW PREP: Restoring JD', { savedJD: savedJD?.substring(0, 50), jobDescription: jobDescription?.substring(0, 50) });
            setLocalJobDesc(jdToUse);

            // Restore prep from sessionStorage if available
            const savedPrep = sessionStorage.getItem('temp_interview_prep');
            if (savedPrep) {
                try {
                    const parsedPrep = JSON.parse(savedPrep);
                    console.log('✅ Restored interview prep from cache');
                    setPrep(parsedPrep);
                } catch (e) {
                    console.error('Failed to parse saved prep:', e);
                }
            }
        }
    }, [isOpen, jobDescription]);

    // Simulate progress
    useEffect(() => {
        if (!loading) {
            setProgress(0);
            setCurrentStep(0);
            return;
        }

        // Start with 10% immediately so user sees it's alive
        setProgress(10);

        const interval = setInterval(() => {
            setProgress(prev => {
                // If we are still loading but reached 90%, stay there
                if (prev >= 90) return prev;

                // Faster initial progress
                const increment = prev < 30 ? 2 : prev < 60 ? 1 : 0.5;
                return Math.min(prev + increment, 90);
            });
        }, 100);

        return () => clearInterval(interval);
    }, [loading]);

    // Update steps based on progress
    useEffect(() => {
        if (progress < 15) setCurrentStep(0);
        else if (progress < 30) setCurrentStep(1);
        else if (progress < 50) setCurrentStep(2);
        else if (progress < 70) setCurrentStep(3);
        else if (progress < 85) setCurrentStep(4);
        else setCurrentStep(5);
    }, [progress]);

    const handleGenerate = async () => {
        // Enforce Paywall BEFORE generation
        if (!isPaid && onOpenPaywall) {
            // Save current JD before redirecting to payment
            sessionStorage.setItem('temp_job_desc', localJobDesc);
            onOpenPaywall();
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/interview-prep`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    cvText,
                    jobDescription: localJobDesc,
                    language: i18n.language
                }),
            });
            const data = await res.json();
            setPrep(data);

            // Cache prep to sessionStorage
            sessionStorage.setItem('temp_interview_prep', JSON.stringify(data));
            console.log('💾 Cached interview prep to sessionStorage');

            // Notify parent about the new JD
            if (onJobDescUpdate && localJobDesc) {
                onJobDescUpdate(localJobDesc);
            }
        } catch (error) {
            console.error("Failed to generate interview prep:", error);
        } finally {
            setLoading(false);
            setProgress(100);
        }
    };

    const handleCopy = () => {
        if (!prep) return;
        // Check if user has paid before triggering paywall
        if (!isPaid && onOpenPaywall) {
            onOpenPaywall();
            return;
        }

        // Fallback if no paywall handler (shouldn't happen in this flow)
        let text = "";
        prep.categories.forEach(cat => {
            text += `${cat.title}\n${cat.description}\n\n`;
            cat.questions.forEach((q, i) => {
                text += `Q${i + 1}: ${q.question}\n`;
                text += `Answer Outline:\n${q.answerOutline}\n`;
                if (q.tips) text += `Tip: ${q.tips}\n`;
                text += "\n";
            });
            text += "-------------------\n\n";
        });

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!isPaid && onOpenPaywall) {
            // User hasn't paid, show paywall
            onOpenPaywall();
        } else {
            // User has access, generate the document
            generateInterviewPrepDoc(prep);
        }
    };

    const hasContent = prep?.categories?.length > 0;
    let questionCount = 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl animate-scale-in transform scale-90 md:scale-100 origin-top">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors z-50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                            <MessageCircleQuestion className="h-6 w-6 text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t('interview_prep.title', 'Interview Prep Kit')}</h2>
                            <p className="text-sm text-slate-400">{t('interview_prep.subtitle', 'AI-powered interview questions & answers')}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {(!hasContent && !loading) && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 max-w-2xl mx-auto w-full">
                            <div className="h-20 w-20 rounded-full bg-sky-500/5 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-sky-500/50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">
                                    {prep ? "Generation Failed" : "Ready to Practice?"}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {prep
                                        ? "We couldn't generate questions this time. Please try again."
                                        : "Generate a personalized interview preparation kit based on your CV and the job description."}
                                </p>
                            </div>

                            <div className="w-full space-y-2 text-left">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 ml-1">
                                    {t('cover_letter.job_desc_label', 'Job Description')}
                                </label>
                                <textarea
                                    className="
                                        w-full rounded-xl bg-slate-950/40 
                                        border border-slate-700/50 
                                        p-4 text-sm text-slate-300 
                                        leading-relaxed min-h-[120px] 
                                        focus:outline-none focus:border-sky-500/50
                                        custom-scrollbar resize-y
                                        placeholder:text-slate-600
                                    "
                                    placeholder={t('cover_letter.job_desc_placeholder', 'Paste the job description here...')}
                                    value={localJobDesc}
                                    onChange={(e) => setLocalJobDesc(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                className="
                            w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl 
                            bg-sky-600 hover:bg-sky-500 
                            px-8 py-4 text-sm font-bold uppercase tracking-wider text-white 
                            shadow-lg shadow-sky-500/20
                            hover:-translate-y-0.5 transition-all
                        "
                            >
                                {isPaid ? <Sparkles className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                                {prep ? "Try Again" : (isPaid ? "Generate Interview Questions" : "Unlock Interview Prep")}
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-8">
                            <div className="relative w-full max-w-md">
                                {/* Progress Bar Background */}
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sky-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                {/* Percentage */}
                                <div className="absolute -right-2 -top-6 text-xs font-bold text-sky-400">
                                    {Math.round(progress)}%
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <Loader2 className="h-8 w-8 text-sky-500 animate-spin mx-auto mb-4" />
                                <p className="text-lg font-medium text-white animate-pulse">
                                    {loadingSteps[currentStep]}
                                </p>
                                <p className="text-sm text-slate-400">
                                    Please wait while AI crafts your interview kit...
                                </p>
                            </div>
                        </div>
                    )}

                    {hasContent && (
                        <div className="space-y-8">
                            {prep.categories.map((cat) => (
                                <div key={cat.id} className="space-y-4">
                                    <div className="bg-slate-900/50 py-3 border-b border-slate-800">
                                        <h3 className="text-lg font-bold text-sky-300">{cat.title}</h3>
                                        <p className="text-sm text-slate-400">{cat.description}</p>
                                    </div>

                                    <div className="grid gap-4">
                                        {cat.questions?.map((q, idx) => {
                                            questionCount++;
                                            const isLocked = !isPaid && questionCount > 2;

                                            if (isLocked) {
                                                // Only render one locked card to avoid clutter, or render blurred versions
                                                if (questionCount === 3) {
                                                    return (
                                                        <div
                                                            key="locked-card"
                                                            onClick={onOpenPaywall}
                                                            className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center cursor-pointer group hover:border-sky-500/50 transition-all"
                                                        >
                                                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                                                <div className="p-3 bg-sky-500/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                                    <Lock className="w-6 h-6 text-sky-400" />
                                                                </div>
                                                                <h4 className="text-lg font-bold text-white mb-1">Unlock Full Interview Kit</h4>
                                                                <p className="text-sm text-slate-400 mb-4">Get access to all 15+ tailored questions & answers</p>
                                                                <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-lg transition-colors">
                                                                    Unlock for $6.99
                                                                </button>
                                                            </div>
                                                            {/* Fake content behind blur */}
                                                            <div className="opacity-20 blur-sm select-none">
                                                                <p className="text-sm font-bold text-slate-100 mb-3">Q3. Tell me about a time you failed.</p>
                                                                <div className="pl-4 border-l-2 border-slate-700 space-y-3">
                                                                    <div className="text-sm text-slate-300">Lorem ipsum dolor sit amet...</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null; // Hide subsequent questions
                                            }

                                            return (
                                                <div key={idx} className="card-glass p-5 border-slate-700/50 hover:border-sky-500/30 transition-colors group">
                                                    <p className="text-sm font-bold text-slate-100 mb-3 flex gap-3">
                                                        <span className="text-sky-500 shrink-0">Q{questionCount}.</span>
                                                        {q.question}
                                                    </p>

                                                    <div className="pl-4 border-l-2 border-slate-700 space-y-3 group-hover:border-sky-500/30 transition-colors">
                                                        <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Answer Outline</span>
                                                            {typeof q.answerOutline === 'string'
                                                                ? q.answerOutline
                                                                : Array.isArray(q.answerOutline)
                                                                    ? q.answerOutline.join('\n')
                                                                    : JSON.stringify(q.answerOutline, null, 2)}
                                                        </div>

                                                        {q.tips && (
                                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
                                                                <p className="text-xs text-amber-200 flex gap-2 items-start">
                                                                    <span className="text-amber-400 text-base">💡</span>
                                                                    <span className="mt-0.5">{q.tips}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {hasContent && (
                    <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-wrap gap-3">
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
                            {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy All')}
                        </button>

                        <button
                            onClick={handleDownload}
                            className="
                        flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl 
                        bg-sky-600 hover:bg-sky-500 
                        px-4 py-3 text-sm font-semibold text-white 
                        transition-colors border border-sky-500/50
                        shadow-lg shadow-sky-500/20
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
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {t('common.regenerate', 'Regenerate')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
