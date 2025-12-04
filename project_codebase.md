### client/src/App.jsx
```javascript

import { useState, useRef } from 'react'
import './index.css'
import './i18n'; // Initialize i18n
import { useReactToPrint } from 'react-to-print'
import { useAnalyze } from './hooks/useAnalyze'
import { generateWordDoc } from './lib/docxGenerator'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import UploadSection from './components/UploadSection'
import AnalysisDashboard from './components/AnalysisDashboard'
import CVPreview from './components/CVPreview'
import PaymentModal from './components/PaymentModal'

function App() {
  const {
    file,
    setFile,
    jobDesc,
    setJobDesc,
    result,
    setResult,
    loading,
    isAiBusy,
    progress,
    loadingText,
    error,
    clearError,
    handleAnalyze
  } = useAnalyze();

  const [isPaid, setIsPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: result?.contactInfo?.name ? `${result.contactInfo.name.replace(/\s+/g, '_')} _Optimized_CV` : 'Optimized_CV',
  });

  const handleDownloadRequest = () => {
    if (isPaid) {
      generateWordDoc(result);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaid(true);
    setShowPaymentModal(false);
    generateWordDoc(result);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      <Header result={result} onDownload={handleDownloadRequest} />

      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <main className="max-w-[1600px] mx-auto p-2 md:p-4 lg:p-8 overflow-x-hidden">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className={`lg:col-span-5 space-y-6 ${result ? '' : 'lg:col-start-4 lg:col-span-6'}`}>
            {!result && !loading && !isAiBusy && <HeroSection />}

            <div className={result ? 'hidden' : 'block'}>
              <UploadSection
                file={file}
                setFile={setFile}
                jobDesc={jobDesc}
                setJobDesc={setJobDesc}
                loading={loading}
                isAiBusy={isAiBusy}
                progress={progress}
                loadingText={loadingText}
                error={error}
                onClearError={clearError}
                onAnalyze={handleAnalyze}
              />
            </div>

            {result && !loading && !isAiBusy && (
              <AnalysisDashboard result={result} onReset={() => { setResult(null); setIsPaid(false); }} />
            )}
          </div>

          {result && typeof result.optimizedCv === 'string' && !isAiBusy && (
            <CVPreview
              result={result}
              printRef={printRef}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App```

### client/src/components/Header.jsx
```javascript
import { Globe, FileText } from 'lucide-react';
import { isInAppBrowser } from '../lib/inAppBrowser';
import { useTranslation } from 'react-i18next';

const Header = ({ result, onDownload }) => {
    const { t, i18n } = useTranslation();

    const handleDownloadClick = () => {
        if (isInAppBrowser()) {
            alert(t('header.browser_alert'));
            return;
        }
        onDownload();
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-xl font-bold text-white tracking-tight">GlobalKariyer<span className="text-blue-400">.ai</span></h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{t('header.subtitle')}</p>
                    </div>
                    <div className="sm:hidden">
                        <h1 className="text-lg font-bold text-white tracking-tight">GlobalKariyer<span className="text-blue-400">.ai</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button onClick={() => changeLanguage('en')} className={`text-xs font-bold px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>EN</button>
                        <button onClick={() => changeLanguage('zh')} className={`text-xs font-bold px-2 py-1 rounded ${i18n.language === 'zh' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>CN</button>
                        <button onClick={() => changeLanguage('tr')} className={`text-xs font-bold px-2 py-1 rounded ${i18n.language === 'tr' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>TR</button>
                    </div>

                    {result && (
                        <button onClick={handleDownloadClick} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20 hover:scale-105 text-sm whitespace-nowrap">
                            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">{t('header.download_cv')}</span><span className="sm:hidden">{t('header.download')}</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
```

### client/src/components/HeroSection.jsx
```javascript
import React from 'react';
import { useTranslation } from 'react-i18next';

const HeroSection = () => {
    const { t } = useTranslation();

    return (
        <div className="text-center space-y-6 mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                {t('hero.title_part1')} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{t('hero.title_part2')}</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
                {t('hero.description')}
            </p>
        </div>
    );
};

export default HeroSection;
```

### client/src/components/UploadSection.jsx
```javascript
import React, { useState } from 'react';
import { Upload, CheckCircle, Briefcase, ServerCrash, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UploadSection = ({ file, setFile, jobDesc, setJobDesc, loading, isAiBusy, progress, loadingText, error, onAnalyze, onClearError }) => {
    const { t } = useTranslation();
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
                    <div className="text-slate-300 font-medium animate-pulse">{t(loadingText)}</div>
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
                                {file ? file.name : showHint ? 'Lütfen Önce Dosya Yükleyin!' : t('upload.title')}
                            </p>
                            {file && <p className="text-xs text-emerald-400 mt-1">{t('upload.file_selected')}</p>}
                            {!file && <p className="text-xs text-slate-500 mt-1">{t('upload.drag_drop')}</p>}
                        </div>
                    </div>
                </div>

                <div className="relative space-y-2">
                    <label className="block text-amber-400 text-xs font-bold uppercase tracking-wider ml-1 animate-pulse">📢 {t('upload.job_desc_label')}</label>
                    <div className="relative group">
                        <div className="absolute top-3 left-3 text-slate-500 group-focus-within:text-amber-500 transition-colors"><Briefcase className="w-4 h-4" /></div>
                        <textarea
                            className="w-full h-32 bg-slate-900 border-2 border-slate-700 rounded-xl p-3 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none resize-none transition-all shadow-lg"
                            placeholder={t('upload.job_desc_placeholder')}
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
                    {t('upload.analyze_button')} ✨
                </button>
                <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    {t('upload.privacy_note')}
                </p>
            </div>
        </div>
    );
};

export default UploadSection;
```

### client/src/components/AnalysisDashboard.jsx
```javascript
import React from 'react';
import { Upload, ArrowRight, TrendingUp, BarChart3, CheckSquare, CheckCircle, AlertCircle, Info, Coffee } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SkillBar = ({ label, score, color }) => {
    const safeScore = Number(score) || 0;
    let barColor = "bg-blue-500";
    if (color.includes("purple")) barColor = "bg-purple-500";
    if (color.includes("amber")) barColor = "bg-amber-500";
    if (color.includes("emerald")) barColor = "bg-emerald-500";

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold tracking-wide">{label}</span>
                <span className={`${color} font-bold`}>{safeScore}/10</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700/50 shadow-inner overflow-hidden">
                <div className={`h-full rounded-full ${barColor} shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-out`} style={{ width: `${Math.min(safeScore * 10, 100)}%` }}></div>
            </div>
        </div>
    );
};

const AnalysisDashboard = ({ result, onReset }) => {
    const { t } = useTranslation();
    const currentScore = result?.scores?.current || 50;
    const potentialScore = result?.scores?.potential || 85;

    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={onReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700"><Upload className="w-4 h-4" /> {t('dashboard.new_analysis')}</button>

            <div className="bg-slate-800/60 rounded-3xl p-4 md:p-6 border border-slate-700">
                <div className="flex items-center justify-between gap-2 md:gap-4 mb-6">
                    <div className="flex flex-col items-center"><div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full border-4 border-slate-600 bg-slate-800"><span className="text-lg md:text-xl font-bold text-slate-400">{currentScore}</span></div><span className="text-[10px] uppercase font-bold text-slate-500 mt-2">{t('dashboard.current')}</span></div>
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
                    <div className="flex flex-col items-center"><div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full border-4 border-emerald-500 bg-slate-800 shadow-lg shadow-emerald-500/20"><span className="text-2xl md:text-3xl font-black text-white">{potentialScore}</span></div><span className="text-[10px] uppercase font-bold text-emerald-400 mt-2">{t('dashboard.potential')}</span></div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-emerald-400 mb-1">{t('dashboard.interview_chance')} {result.scores?.interviewRate || "High"} 🚀</h4>
                        <p className="text-xs text-emerald-200/80 leading-relaxed break-words">{t('dashboard.interview_chance_desc')}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6 bg-slate-900/40 p-4 md:p-5 rounded-xl border border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4"><BarChart3 className="w-3 h-3" /> {t('dashboard.ats_analysis')}</h4>
                    <SkillBar label={t('dashboard.searchability')} score={result.scores?.breakdown?.searchability} color="text-blue-400" />
                    <SkillBar label={t('dashboard.hard_skills')} score={result.scores?.breakdown?.hardSkills} color="text-purple-400" />
                    <SkillBar label={t('dashboard.soft_skills')} score={result.scores?.breakdown?.softSkills} color="text-amber-400" />
                    <SkillBar label={t('dashboard.formatting')} score={result.scores?.breakdown?.formatting} color="text-emerald-400" />
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border-l-4 border-blue-500 text-sm text-slate-300 mb-2 overflow-hidden">
                    <strong className="block mb-1 text-blue-400 text-xs uppercase tracking-wider font-bold">{t('dashboard.analysis_report')}</strong>
                    <div className="break-words whitespace-pre-wrap text-xs md:text-sm">{result.summary?.content || result.summary?.tr}</div>
                    <div className="mt-3 pt-3 border-t border-slate-700"><strong className="block mb-1 text-emerald-400 text-xs uppercase tracking-wider font-bold">🚀 {t('dashboard.improvements')}</strong><ul className="space-y-1">{result.summary?.improvements?.map((imp, i) => (<li key={i} className="flex items-start gap-2 text-xs text-slate-400"><span className="text-emerald-500 mt-0.5 shrink-0">•</span> <span className="flex-1 min-w-0 break-words">{imp}</span></li>))}</ul></div>
                </div>
            </div>

            {result.atsModifications && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-4 md:p-6">
                    <h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2 mb-4"><CheckSquare className="w-4 h-4" /> {t('dashboard.ats_check')}</h3>
                    <ul className="space-y-2">
                        {result.atsModifications.map((item, i) => (
                            <li key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-800/50 transition-colors"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><div className="flex-1 min-w-0"><p className="text-xs text-slate-300 break-words">{item.detail || item.action}</p></div></li>
                        ))}
                    </ul>
                </div>
            )}

            {result.missingKeywords?.length > 0 && (
                <div className="bg-amber-900/10 border border-amber-500/20 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-amber-400 uppercase mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {t('dashboard.suggested_keywords')}</h3>
                    <div className="space-y-3">
                        {result.missingKeywords.map((item, i) => (
                            <div key={i} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                                <div className="text-amber-200 font-bold text-sm mb-2">{item.keyword}</div>
                                <div className="text-xs text-emerald-300 bg-emerald-900/20 p-2 rounded mb-2 border border-emerald-500/20"><span className="font-bold">{t('dashboard.example')}</span> "{item.usageTip?.content || item.usageTip?.tr || item.usageTip}"</div>
                                <div className="flex items-start gap-1.5 mt-2 border-t border-slate-800 pt-2"><Info className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" /><p className="text-xs text-slate-400 font-medium">{item.benefit}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Support Section */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 opacity-50"></div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <Coffee className="w-5 h-5 text-amber-400" />
                        {t('dashboard.support_title')}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
                        {t('dashboard.support_desc')}
                    </p>
                    <a
                        href="https://www.buymeacoffee.com/ertugbilgin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-slate-900 font-bold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/20"
                    >
                        <Coffee className="w-5 h-5" />
                        {t('dashboard.buy_coffee')}
                    </a>
                </div>
                {/* Decorative background elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all duration-700"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
            </div>
        </div>
    );
};

export default AnalysisDashboard;
```

### client/src/components/CVPreview.jsx
```javascript
import React, { useEffect, useRef } from 'react';
import { LayoutTemplate, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { renderAsync } from 'docx-preview';
import { generateDocxBlob } from '../lib/docxGenerator';

const CVPreview = ({ result, printRef }) => {
    const { t } = useTranslation();
    const containerRef = useRef(null);

    useEffect(() => {
        const renderDocx = async () => {
            if (result && containerRef.current) {
                try {
                    const blob = await generateDocxBlob(result);
                    if (blob) {
                        await renderAsync(blob, containerRef.current, containerRef.current, {
                            className: 'docx-preview',
                            inWrapper: false,
                            ignoreWidth: false,
                            ignoreHeight: false,
                            ignoreFonts: false,
                            breakPages: true,
                            ignoreLastRenderedPageBreak: true,
                            experimental: true,
                            trimXmlDeclaration: true,
                            useBase64URL: true,
                            renderChanges: false,
                            debug: false,
                        });
                    }
                } catch (error) {
                    console.error("Error rendering DOCX preview:", error);
                }
            }
        };

        renderDocx();
    }, [result]);

    return (
        <div className="lg:col-span-7 sticky top-24">
            <div className="bg-slate-800 rounded-t-xl p-3 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> {t('preview')}</span>
            </div>

            {result.uiSuggestions?.fontReason?.tr && (
                <div className="bg-blue-900/20 border-x border-blue-500/20 p-3 flex items-start gap-3">
                    <Wand2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-200">
                        <span className="font-bold text-blue-400">Font Seçimi ({result.uiSuggestions.selectedFont}):</span> {result.uiSuggestions.fontReason.tr}
                    </div>
                </div>
            )}

            <div className="bg-slate-900/50 p-1 md:p-8 rounded-b-xl border border-slate-800 overflow-hidden">
                {/* Mobile Wrapper: Scrollable container for all screens */}
                <div className="relative w-full h-[500px] sm:h-[600px] md:h-[800px] lg:h-[1000px] overflow-y-auto custom-scrollbar bg-slate-900/50 flex justify-center">
                    {/* CV Container: Scaled to fit different screens */}
                    <div ref={printRef} className="origin-top transform transition-transform duration-300
                        scale-[0.4] 
                        sm:scale-[0.55] 
                        md:scale-[0.65] 
                        lg:scale-[0.8] 
                        xl:scale-[0.9] 
                        2xl:scale-100
                        mb-10">
                        <div ref={containerRef} className="bg-white shadow-2xl min-h-[297mm]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVPreview;
```

### client/src/components/PaymentModal.jsx
```javascript
import React, { useState } from 'react';
import { X, Check, Lock, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentModal = ({ onClose, onSuccess, price = "4.99" }) => {
    const { t } = useTranslation();
    const [processing, setProcessing] = useState(false);

    const handlePay = () => {
        setProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            onSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        {t('payment.unlock_title', 'Unlock Your CV')}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-slate-600 mb-4">
                            {t('payment.description', 'Get your ATS-optimized, professionally formatted CV now.')}
                        </p>
                        <div className="text-4xl font-black text-slate-900 mb-1">
                            ${price}
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                            {t('payment.one_time', 'One-time payment')}
                        </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_docx', 'Download editable .docx file')}
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_ats', 'ATS Optimization applied')}
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_format', 'Professional formatting')}
                        </li>
                    </ul>

                    {/* Mock Card Form */}
                    <div className="space-y-3 opacity-50 pointer-events-none select-none grayscale" aria-hidden="true">
                        <div className="h-10 bg-slate-100 rounded border border-slate-200 w-full"></div>
                        <div className="flex gap-3">
                            <div className="h-10 bg-slate-100 rounded border border-slate-200 w-1/2"></div>
                            <div className="h-10 bg-slate-100 rounded border border-slate-200 w-1/2"></div>
                        </div>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('payment.processing', 'Processing...')}
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                {t('payment.pay_button', 'Pay & Download')}
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                        {t('payment.secure_note', 'Secured by Lemon Squeezy. 100% Money-back guarantee.')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
```

### client/src/hooks/useAnalyze.js
```javascript
import { useState, useEffect } from 'react';
import { trackEvent, ANALYTICS_EVENTS } from '../lib/analytics';

export const useAnalyze = () => {
    const [file, setFile] = useState(null);
    const [jobDesc, setJobDesc] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAiBusy, setIsAiBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("loading.start");

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    // 90%'a kadar yavaş yavaş gel
                    if (prev >= 90) {
                        return 90;
                    }
                    // İlk 30% hızlı, sonra yavaşlayan bir artış
                    const increment = prev < 30 ? 2 : prev < 60 ? 0.5 : 0.2;
                    return prev + increment;
                });
            }, 100);

            // Mesajları döngüsel olarak değiştir
            const messageInterval = setInterval(() => {
                setProgress((currentProgress) => {
                    if (currentProgress >= 90) {
                        setLoadingText((prevText) => {
                            const messages = [
                                "loading.step3",
                                "loading.step4",
                                "loading.step5",
                                "loading.step6",
                                "loading.step7",
                                "loading.step8"
                            ];
                            const currentIndex = messages.indexOf(prevText);
                            const nextIndex = (currentIndex + 1) % messages.length;
                            return messages[nextIndex];
                        });
                    } else if (currentProgress < 30) {
                        setLoadingText("loading.step1");
                    } else if (currentProgress < 60) {
                        setLoadingText("loading.step2");
                    } else {
                        setLoadingText("loading.step3");
                    }
                    return currentProgress;
                });
            }, 3000); // Her 3 saniyede bir mesaj değişsin

            return () => {
                clearInterval(interval);
                clearInterval(messageInterval);
            };
        } else {
            setProgress(0);
            setLoadingText("loading.start");
        }
    }, [loading]);

    const handleAnalyze = async () => {
        if (!file) return;

        trackEvent(ANALYTICS_EVENTS.CV_UPLOAD, { file_type: file.type });

        setLoading(true);
        setError(null);
        setIsAiBusy(false);
        let currentBusyState = false; // Local flag to avoid stale closure
        setResult(null);
        setProgress(0);

        const formData = new FormData();
        formData.append('cv', file);
        formData.append('jobDescription', jobDesc);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/analyze`, { method: 'POST', body: formData });
            const data = await res.json();

            if (res.status === 503 || data.error === "AI_BUSY") {
                trackEvent(ANALYTICS_EVENTS.SYSTEM_BUSY);
                setIsAiBusy(true);
                currentBusyState = true;
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error(data.error || 'Sunucu hatası.');

            trackEvent(ANALYTICS_EVENTS.ANALYSIS_SUCCESS, {
                score_current: data.scores?.current,
                score_potential: data.scores?.potential
            });

            setProgress(100);
            setTimeout(() => setResult(data), 500);
        } catch (err) {
            trackEvent(ANALYTICS_EVENTS.ANALYSIS_FAIL, { error: err.message });
            setError(err.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            if (!currentBusyState) setTimeout(() => setLoading(false), 500);
        }
    };

    return {
        file,
        setFile,
        jobDesc,
        setJobDesc,
        result,
        setResult,
        loading,
        error,
        isAiBusy,
        progress,
        loadingText,
        loadingText,
        handleAnalyze,
        clearError: () => {
            setError(null);
            setFile(null);
        }
    };
};
```

### client/src/lib/docxGenerator.js
```javascript
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from 'docx'
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

import { saveAs } from 'file-saver';

export const generateDocxBlob = async (result) => {
    if (!result) return null;
    const lines = result.optimizedCv.split('\n');
    const docChildren = [];
    const fontName = result.uiSuggestions?.selectedFont || "Arial";
    const themeColor = "2E74B5"; // Word Blue

    docChildren.push(new Paragraph({ children: [new TextRun({ text: result.contactInfo?.name || "Name", bold: true, font: fontName, size: 32, color: "000000" })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));

    const contactParts = [];
    if (result.contactInfo?.location) contactParts.push(new TextRun({ text: `${result.contactInfo.location} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.email) contactParts.push(new TextRun({ text: `${result.contactInfo.email} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.phone) contactParts.push(new TextRun({ text: `${result.contactInfo.phone} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.linkedin) {
        contactParts.push(new ExternalHyperlink({ children: [new TextRun({ text: "LinkedIn", style: "Hyperlink", font: fontName, size: 20, color: themeColor })], link: result.contactInfo.linkedin }));
    }
    docChildren.push(new Paragraph({ children: contactParts, alignment: AlignmentType.CENTER, spacing: { after: 300 } }));

    lines.forEach(line => {
        const cleanLine = line.replace(/<[^>]*>/g, '').trim();
        if (!cleanLine) return;

        if (cleanLine.startsWith('## ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('## ', '').toUpperCase(), bold: true, font: fontName, size: 24, color: themeColor })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
                border: { bottom: { color: themeColor, space: 1, value: "single", size: 6 } }
            }));
        } else if (cleanLine.startsWith('### ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('### ', ''), bold: true, font: fontName, size: 22 })],
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
            }));
        } else if (cleanLine.startsWith('#### ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('#### ', ''), bold: true, font: fontName, size: 20, italics: true })],
                heading: HeadingLevel.HEADING_4,
                spacing: { before: 160, after: 80 }
            }));
        } else {
            // Bullet point kontrolü: Hem '* ' hem de '- ' ile başlayanları yakala
            const isBullet = cleanLine.startsWith('* ') || cleanLine.startsWith('- ') || cleanLine.startsWith('• ');

            // Bullet işaretini metinden temizle
            let content = cleanLine;
            if (isBullet) {
                content = cleanLine.replace(/^[\*\-\•]\s+/, '');
            }

            const textRuns = [];
            const parts = content.split(/(\*\*.*?\*\*)/g);

            parts.forEach(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true, font: fontName, size: 22 }));
                } else if (part) {
                    textRuns.push(new TextRun({ text: part, font: fontName, size: 22 }));
                }
            });

            docChildren.push(new Paragraph({
                children: textRuns,
                bullet: isBullet ? { level: 0 } : undefined,
                spacing: { after: 100 }
            }));
        }
    });

    const doc = new Document({ sections: [{ children: docChildren }], styles: { default: { document: { run: { font: fontName } } } } });

    const blob = await Packer.toBlob(doc);
    const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return new Blob([blob], { type: mimeType });
};

export const generateWordDoc = async (result) => {
    if (!result) return;
    trackEvent(ANALYTICS_EVENTS.DOWNLOAD_WORD);

    const newBlob = await generateDocxBlob(result);
    if (!newBlob) return;

    // Sanitize filename
    const safeName = (result.contactInfo?.name || "CV").replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${safeName}_Optimized.docx`;

    saveAs(newBlob, fileName);
};
```

### client/src/i18n.js
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import tr from './locales/tr.json';
import zh from './locales/zh.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            tr: { translation: tr },
            zh: { translation: zh },
        },
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
```

### server/index.cjs
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const { analyzeCV } = require('./controllers/analyzeController.cjs');
const { createCheckoutSession } = require('./controllers/paymentController.cjs');

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5001;
const upload = multer({ storage: multer.memoryStorage() });

// Render/Vercel gibi proxy arkasında çalışırken IP adreslerini doğru almak için gerekli
app.set('trust proxy', 1);

// Rate Limiting (Güvenlik Duvarı)
// Rate Limiting: 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: "Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use('/analyze', limiter); // Apply only to analyze endpoint
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Motor v52.0 (Strict Mode) Hazır!'));

app.post('/analyze', upload.any(), analyzeCV);
app.post('/create-checkout', createCheckoutSession);

app.listen(PORT, () => {
  console.log(`\n🚀 MOTOR v52.0(STRICT MODE) ÇALIŞIYOR! Port: ${PORT}`);
});

// Force deploy: 2025-11-25 12:22

// Force deploy: 2025-11-25 12:22```

### server/controllers/analyzeController.cjs
```javascript
const { extractTextFromFile } = require('../services/fileService.cjs');
const { callGeminiRaw } = require('../services/aiService.cjs');
const { cleanAndParseJSON } = require('../services/parserService.cjs');

const analyzeCV = async (req, res) => {
    try {
        console.log("📩 Analiz İsteği...");
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Dosya yok." });

        let cvText;
        try {
            cvText = await extractTextFromFile(req.files[0]);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        const jobDescription = req.body.jobDescription || "Genel Başvuru";

        const language = req.body.language || 'en';

        const prompt = `You are a World-Class CV Coach and ATS Expert.
        
        IMPORTANT SECURITY CHECK:
        First, check if the provided text is a Resume (CV).
        If it is a recipe, invoice, code snippet, article, or anything unrelated to a CV, stop analysis and return ONLY this JSON:
        { "error": "NOT_A_CV", "message": "The uploaded file does not look like a CV. Please upload a valid resume." }

        If it is a CV, perform the following tasks:

        TASKS: 
        1. Extract contact info.
        2. Analyze and SCORE the CV.
        3. REWRITE the CV in English (Global Standard).

        SPECIAL REQUEST (FONT):
        If the current font/structure is good, confirm in "fontReason". If not, suggest a change.

        FORMAT:
        - Wrap important parts in "optimizedCv" with <mark data-reason="Reason">Text</mark>.
        - Use ## for headers, * for bullets.
        - Do NOT include Name/Contact info in optimizedCv.

        JOB DESCRIPTION: ${jobDescription}
        MEVCUT CV: ${cvText}

        Return response ONLY in this JSON format:
        {
          "contactInfo": { "name": "Name", "title": "Title", "email": "Email", "phone": "Phone", "location": "Location", "linkedin": "Link" },
          "scores": {
            "current": (0-100),
            "potential": (85-100),
            "interviewRate": "Interview Chance (e.g. 3x)",
            "breakdown": { "searchability": (0-10), "hardSkills": (0-10), "softSkills": (0-10), "formatting": (0-10) }
          },
          "summary": { "content": "Summary", "improvements": ["Item 1"] },
          "uiSuggestions": { "selectedFont": "Font", "fontReason": { "content": "Reason" } },
          "atsModifications": [ { "action": "Header", "detail": "Detail" } ],
          "missingKeywords": [{ "keyword": "Keyword", "usageTip": { "content": "Tip" }, "benefit": "Benefit" }],
          "rewriteSuggestions": [{ "focus": "Topic", "original": "Old", "suggestionEn": "New", "reason": "Reason" }],
          "optimizedCv": "## PROFESSIONAL SUMMARY\\n..."
        }`;

        try {
            const rawResponse = await callGeminiRaw(prompt);
            const finalData = cleanAndParseJSON(rawResponse);

            // Check for CV validation error
            if (finalData.error === "NOT_A_CV") {
                console.warn("⚠️ CV Doğrulama Hatası:", finalData.message);
                return res.status(400).json({ error: finalData.message });
            }

            res.json(finalData);
        } catch (apiError) {
            console.error("💥 API TÜMÜYLE BAŞARISIZ. Hata dönülüyor.");
            res.status(503).json({ error: "AI_BUSY" });
        }

    } catch (error) {
        console.error("💥 SUNUCU HATASI:", error.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
};

module.exports = { analyzeCV };
```

### server/controllers/paymentController.cjs
```javascript
const axios = require('axios');

const createCheckoutSession = async (req, res) => {
    try {
        const { variantId } = req.body; // Optional: if we have multiple products

        // Use environment variables or fallback to the one provided in guide
        const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;
        const VARIANT_ID = variantId || process.env.LEMON_SQUEEZY_VARIANT_ID;
        const API_KEY = process.env.LEMON_SQUEEZY_API_KEY;

        if (!STORE_ID || !VARIANT_ID || !API_KEY) {
            console.error("Missing Lemon Squeezy keys");
            return res.status(500).json({ error: "Server configuration error: Missing payment keys." });
        }

        const response = await axios.post(
            'https://api.lemonsqueezy.com/v1/checkouts',
            {
                data: {
                    type: "checkouts",
                    attributes: {
                        checkout_data: {
                            custom: {
                                user_id: "guest_user" // We can track user ID here if we had auth
                            }
                        }
                    },
                    relationships: {
                        store: {
                            data: {
                                type: "stores",
                                id: STORE_ID.toString()
                            }
                        },
                        variant: {
                            data: {
                                type: "variants",
                                id: VARIANT_ID.toString()
                            }
                        }
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                }
            }
        );

        const checkoutUrl = response.data.data.attributes.url;
        res.json({ url: checkoutUrl });

    } catch (error) {
        console.error("Lemon Squeezy Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
};

module.exports = { createCheckoutSession };
```

