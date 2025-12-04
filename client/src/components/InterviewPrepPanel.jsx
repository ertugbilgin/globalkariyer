import { useState } from "react";
import { MessageCircleQuestion, Loader2, Sparkles } from "lucide-react";

export default function InterviewPrepPanel({ cvText, jobDescription }) {
    const [loading, setLoading] = useState(false);
    const [prep, setPrep] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/interview-prep`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cvText,
                    jobDescription,
                    language: "en" // You might want to make this dynamic based on i18n
                }),
            });
            const data = await res.json();
            setPrep(data);
        } catch (error) {
            console.error("Failed to generate interview prep:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel-glass p-4 md:p-6 space-y-4 animate-fade-in-up">
            <div className="mb-2">
                <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    <MessageCircleQuestion className="h-4 w-4 text-sky-400" />
                    Interview Prep
                </div>
                <div className="section-divider-indigo" />
            </div>

            {!prep && (
                <div className="text-center py-6">
                    <p className="text-sm text-slate-400 mb-4">
                        Generate a personalized interview preparation kit based on your CV and this job description.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="
                    inline-flex items-center gap-2 rounded-xl 
                    bg-sky-600 hover:bg-sky-500 
                    px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white 
                    shadow-lg shadow-sky-500/20
                    hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed
                "
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {loading ? "Generating..." : "Generate Interview Questions"}
                    </button>
                </div>
            )}

            {prep && (
                <div className="mt-3 space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {prep.categories?.map((cat) => (
                        <div key={cat.id} className="space-y-3">
                            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur py-2 border-b border-slate-800">
                                <h3 className="text-sm font-bold text-sky-300">{cat.title}</h3>
                                <p className="text-[11px] text-slate-400">{cat.description}</p>
                            </div>

                            <div className="space-y-3">
                                {cat.questions?.map((q, idx) => (
                                    <div key={idx} className="card-glass p-4 border-slate-700/50 hover:border-sky-500/30 transition-colors">
                                        <p className="text-xs font-bold text-slate-100 mb-2 flex gap-2">
                                            <span className="text-sky-500">Q{idx + 1}.</span> {q.question}
                                        </p>

                                        <div className="pl-4 border-l-2 border-slate-700 space-y-2">
                                            <div className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Answer Outline</span>
                                                {q.answerOutline}
                                            </div>

                                            {q.tips && (
                                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-2">
                                                    <p className="text-[10px] text-amber-200 flex gap-1.5 items-start">
                                                        <span className="text-amber-400">💡</span> {q.tips}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setPrep(null)}
                        className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Close & Reset
                    </button>
                </div>
            )}
        </div>
    );
}
