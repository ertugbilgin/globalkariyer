import React, { useState, useEffect } from 'react';
import { X, Briefcase, TrendingUp, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function JobMatchModal({ isOpen, onClose, onSubmit, initialJobDesc }) {
    const { t } = useTranslation();
    const [localJobDesc, setLocalJobDesc] = useState(initialJobDesc || "");

    useEffect(() => {
        if (isOpen && initialJobDesc) {
            setLocalJobDesc(initialJobDesc);
        }
    }, [initialJobDesc, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(localJobDesc);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 transform scale-90 md:scale-100 origin-top">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors z-50"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {t('dashboard.jobfit_cta_title', 'Unlock Your Job Match Score')}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                {t('dashboard.jobfit_cta_desc', 'Add a job description to see how well your CV matches the role.')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 uppercase tracking-wider">
                            {t('upload.job_desc_label', 'Job Description')}
                        </label>
                        <div className="relative group">
                            <div className="absolute top-3 left-3 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <textarea
                                value={localJobDesc}
                                onChange={(e) => setLocalJobDesc(e.target.value)}
                                placeholder={t('upload.job_desc_placeholder', 'Paste the job description here...')}
                                className="w-full h-64 bg-slate-950 border-2 border-slate-800 rounded-xl p-4 pl-10 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!localJobDesc?.trim()}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <TrendingUp className="w-5 h-5" />
                            {t('dashboard.jobfit_cta_button', 'Analyze')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
