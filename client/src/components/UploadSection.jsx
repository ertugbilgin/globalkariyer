import React, { useState } from 'react';
import { Upload, CheckCircle, Briefcase, ServerCrash, RefreshCw, AlertCircle } from 'lucide-react';

const UploadSection = ({ file, setFile, jobDesc, setJobDesc, loading, isAiBusy, progress, loadingText, error, onAnalyze, onClearError }) => {
    const [showHint, setShowHint] = useState(false);

    const handleAnalyzeClick = () => {
        if (!file) {
            setShowHint(true);
            setTimeout(() => setShowHint(false), 1000); // Reset after 1s
            return;
        }
        onAnalyze();
    };

    if (isAiBusy) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="py-8 text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <ServerCrash className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Sistem Şu An Çok Yoğun 🤯</h3>
                    <p className="text-slate-300 mb-6 text-sm px-4">Google servislerinde yoğunluk yaşanıyor. Lütfen 1 dakika sonra tekrar deneyin.</p>
                    <button onClick={onAnalyze} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"><RefreshCw className="w-5 h-5 inline mr-2" /> Tekrar Dene</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="py-12 text-center space-y-6 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-blue-400">{Math.round(progress)}%</div>
                    </div>
                    <div className="text-slate-300 font-medium animate-pulse">{loadingText}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Dikkat!</h3>
                    <p className="text-red-400 font-medium mb-6 max-w-xs">{error}</p>
                    <button
                        onClick={onClearError}
                        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20"
                    >
                        Tamam, Anlaşıldı
                    </button>
                </div>
            )}

            {/* Main Content - Blurred if error exists */}
            <div className={`space-y-4 transition-all duration-300 ${error ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
                <div className={`bg-slate-800/50 rounded-2xl p-8 border-2 border-dashed transition-all duration-200 cursor-pointer relative group text-center ${showHint ? 'border-red-500/50 bg-red-500/5 animate-shake' : 'border-slate-700/50 hover:border-blue-500/50'}`}>
                    <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${file ? 'bg-emerald-500/20 text-emerald-400' : showHint ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                            {file ? <CheckCircle className="w-8 h-8" /> : showHint ? <AlertCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>
                        <div>
                            <p className={`font-bold text-lg transition-colors ${showHint ? 'text-red-400' : 'text-white'}`}>
                                {file ? file.name : showHint ? 'Lütfen Önce Dosya Yükleyin!' : 'CV Yükle (PDF/Word)'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative space-y-2">
                    <label className="block text-amber-400 text-xs font-bold uppercase tracking-wider ml-1 animate-pulse">📢 İş İlanı (Opsiyonel - Önerilir)</label>
                    <div className="relative group">
                        <div className="absolute top-3 left-3 text-slate-500 group-focus-within:text-amber-500 transition-colors"><Briefcase className="w-4 h-4" /></div>
                        <textarea
                            className="w-full h-32 bg-slate-900 border-2 border-slate-700 rounded-xl p-3 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none resize-none transition-all shadow-lg"
                            placeholder="Başvurmak istediğiniz iş ilanının metnini buraya yapıştırın. Yapay zeka, CV'nizi bu ilandaki anahtar kelimelere göre optimize edecektir."
                            value={jobDesc}
                            onChange={(e) => setJobDesc(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={handleAnalyzeClick}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}
                >
                    CV'mi Analiz Et ve İyileştir ✨
                </button>
                <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    Gizliliğiniz bizim için önemli. CV'niz sunucularımızda saklanmaz.
                </p>
            </div>
        </div>
    );
};

export default UploadSection;
