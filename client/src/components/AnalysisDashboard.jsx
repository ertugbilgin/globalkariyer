import React, { useEffect, useState } from 'react';
import {
    Upload,
    ArrowRight,
    TrendingUp,
    BarChart3,
    CheckSquare,
    CheckCircle,
    AlertCircle,
    Info,
    Coffee,
    Wand2,
    MessageCircleQuestion,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CoverLetterPanel from './CoverLetterPanel';

/* ================================
   ANIMATED NUMBER COMPONENT
   ================================ */
const AnimatedNumber = ({ value, duration = 800 }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const end = Number(value) || 0;
        if (end === 0) {
            setDisplay(0);
            return;
        }

        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.round(end * progress);
            setDisplay(current);

            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{display}</>;
};

/* ================================
   SKILL BAR COMPONENT
   ================================ */
const SkillBar = ({ label, score, color }) => {
    const rawScore = Number(score) || 0;
    const isOutOf100 = rawScore > 10;
    const percentage = isOutOf100 ? rawScore : rawScore * 10;
    const displayScore = isOutOf100 ? (rawScore / 10) : rawScore;
    const formattedScore = Number(displayScore.toFixed(1));

    const [width, setWidth] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setWidth(Math.min(percentage, 100));
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    let barColor = 'bg-blue-500';
    if (color.includes('purple')) barColor = 'bg-purple-500';
    if (color.includes('amber')) barColor = 'bg-amber-500';
    if (color.includes('emerald')) barColor = 'bg-emerald-500';

    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold tracking-wide">
                    {label}
                </span>
                <span className={`${color} font-bold`}>{formattedScore}/10</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700/50 shadow-inner overflow-hidden">
                <div
                    className={`h-full rounded-full ${barColor} shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-out`}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
};

/* ================================
   HELPER COMPONENTS
   ================================ */
const ScoreBubble = ({ label, value, variant }) => {
    const isPrimary = variant === "primary";
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className={`
          flex items-center justify-center rounded-full 
          ${isPrimary ? "h-24 w-24 md:h-28 md:w-28" : "h-16 w-16 md:h-20 md:w-20"}
          bg-slate-900/90 border
          ${isPrimary
                        ? "border-emerald-400/70 shadow-[0_0_24px_rgba(16,185,129,0.6)]"
                        : "border-slate-600"
                    }
        `}
            >
                <span
                    className={`font-black text-white ${isPrimary ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                        }`}
                >
                    <AnimatedNumber value={value} />
                </span>
            </div>
            <span
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isPrimary ? "text-emerald-300" : "text-slate-400"
                    }`}
            >
                {label}
            </span>
        </div>
    );
};

const ArrowIcon = () => (
    <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="h-px w-10 bg-gradient-to-r from-slate-600 to-slate-400" />
    </div>
);

const InterviewChanceBanner = ({ rate, t }) => (
    <div
        className="
      mt-2 flex items-center justify-between gap-3 rounded-2xl 
      bg-emerald-600/15 px-4 py-3 text-xs text-emerald-200
      border border-emerald-500/40
    "
    >
        <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-semibold uppercase tracking-[0.18em]">
                {t('dashboard.interview_chance')} {rate} 🚀
            </span>
        </div>
        <span className="hidden text-[11px] text-emerald-100/80 md:inline">
            {t('dashboard.interview_chance_desc')}
        </span>
    </div>
);

const HighLevelAssessment = ({ summary, t }) => (
    <div className="mt-2 rounded-2xl bg-slate-900/60 border border-slate-700/70 px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <Info className="h-3.5 w-3.5" />
            {t('dashboard.overview_summary', 'High-Level Assessment')}
        </div>
        <p className="text-xs text-slate-200/90 leading-relaxed whitespace-pre-wrap break-words">
            {summary || ''}
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
            {t('dashboard.overview_hint', 'Full details are available in the analysis report below.')}
        </p>
    </div>
);

const SectionHeader = ({ icon, label }) => (
    <div className="mb-2">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            {icon}
            {label}
        </div>
        <div className="section-divider-indigo" />
    </div>
);

/* ================================
   JOB MATCH CARD
   ================================ */
const JobMatchCard = ({ score, matchLevel, keywordRate, jobFit, t, onReset, onOpenJobMatch }) => {
    // If score is 0 or missing, show CTA state
    if (!score || score === 0) {
        return (
            <div className="panel-glass p-6 space-y-4 animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {t('dashboard.jobfit_cta_title', 'Unlock Your Job Match Score')}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            {t('dashboard.jobfit_cta_desc', 'Add a job description to see how well your CV matches the role.')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onOpenJobMatch}
                    className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                    <TrendingUp className="w-5 h-5" />
                    {t('dashboard.jobfit_cta_button', 'Analyze with Job Description')}
                </button>
            </div>
        );
    }

    const level = matchLevel || (score >= 90 ? "Excellent" : "High");

    return (
        <div className="relative animate-fade-in-up">
            {/* Turuncu blur blob */}
            <div className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-orange-500/25 blur-3xl" />
            <div
                className="
          relative panel-glass p-4 md:p-6 space-y-4
          bg-slate-950/80 border-indigo-700/60
          hover:border-orange-400/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]
          hover-lift w-full overflow-hidden
        "
            >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-6">
                    {/* Hero Score */}
                    <div
                        className="
              relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full
              bg-gradient-to-br from-orange-500 to-orange-400
              shadow-[0_0_32px_rgba(249,115,22,0.7)]
              border-4 border-orange-300
            "
                    >
                        <span className="text-3xl font-black text-white">
                            <AnimatedNumber value={score} />
                        </span>
                    </div>

                    <div className="space-y-2 text-center md:text-left w-full">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span
                                className="
                    inline-flex items-center px-3 py-1 rounded-full 
                    bg-orange-500/20 text-orange-200 text-[11px] 
                    border border-orange-400/60 font-semibold uppercase tracking-[0.18em]
                  "
                            >
                                {t('dashboard.jobfit_level_label', 'Match Level')}: {level}
                            </span>
                        </div>

                        <p className="text-xs text-slate-300/90 leading-relaxed break-words">
                            {t('dashboard.jobfit_desc_dynamic', { level: level })}
                            {/* Fallback text if translation missing */}
                            {!t('dashboard.jobfit_desc_dynamic', { returnObjects: true, defaultValue: false }) &&
                                "This score reflects how well your skills and experience align with the job requirements."}
                        </p>

                        {keywordRate != null && (
                            <p className="text-xs text-slate-400">
                                {t('dashboard.jobfit_keyword_rate', 'Keyword coverage')}:{" "}
                                <span className="font-semibold text-orange-300">
                                    {keywordRate}%
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Strong / Missing / Nice-to-have columns */}
                <div className="grid md:grid-cols-3 gap-4 text-xs">
                    {jobFit?.strongPoints?.length > 0 && (
                        <div className="card-glass p-3 border-emerald-500/30 hover:border-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] hover-lift">
                            <div className="text-emerald-300 font-semibold mb-1 flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3" />
                                {t('dashboard.jobfit_strong', 'Strong Matches')}
                            </div>
                            <ul className="space-y-1 list-disc list-inside marker:text-emerald-300">
                                {jobFit.strongPoints.slice(0, 3).map((p, i) => (
                                    <li key={i} className="text-slate-100">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {jobFit?.missingFromCv?.length > 0 && (
                        <div className="card-glass p-3 border-amber-500/40 hover:border-amber-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.35)] hover-lift">
                            <div className="text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3" />
                                {t('dashboard.jobfit_missing', 'Missing from CV')}
                            </div>
                            <ul className="space-y-1 list-disc list-inside marker:text-amber-300">
                                {jobFit.missingFromCv.slice(0, 3).map((p, i) => (
                                    <li key={i} className="text-slate-100">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {jobFit?.niceToHave?.length > 0 && (
                        <div className="card-glass p-3 border-blue-500/40 hover:border-blue-300 hover:shadow-[0_0_12px_rgba(59,130,246,0.35)] hover-lift">
                            <div className="text-blue-300 font-semibold mb-1 flex items-center gap-1.5">
                                <Info className="w-3 h-3" />
                                {t('dashboard.jobfit_nice', 'Nice-to-have')}
                            </div>
                            <ul className="space-y-1 list-disc list-inside marker:text-blue-300">
                                {jobFit.niceToHave.slice(0, 3).map((p, i) => (
                                    <li key={i} className="text-slate-100">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ================================
   SUGGESTED KEYWORDS SECTION
   ================================ */
const SuggestedKeywordsSection = ({ missingKeywords, t }) => {
    if (!missingKeywords || missingKeywords.length === 0) return null;

    return (
        <div className="panel-glass p-4 md:p-6 space-y-4 animate-fade-in-up w-full overflow-hidden">
            <div className="mb-2">
                <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    <Info className="h-4 w-4 text-amber-400" />
                    {t('dashboard.suggested_keywords')}
                </div>
                <div className="section-divider-amber" />
            </div>

            <div className="space-y-3">
                {missingKeywords.map((item, i) => (
                    <SuggestedKeywordCard
                        key={i}
                        title={item.keyword}
                        example={item.usageTip?.content || item.usageTip?.tr || item.usageTip}
                        description={item.benefit}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
};

const SuggestedKeywordCard = ({ title, example, description, t }) => (
    <div
        className="
      card-glass p-3 md:p-4 
      border-slate-700/70 
      hover:border-amber-400/60 hover:shadow-[0_0_18px_rgba(251,191,36,0.3)]
      hover-lift
    "
    >
        <h4 className="text-sm font-semibold text-amber-300 mb-1">{title}</h4>
        <div className="mb-2 rounded-md bg-emerald-600/15 px-3 py-2 text-[11px] leading-relaxed text-emerald-100 border border-emerald-500/40 break-words">
            <span className="font-semibold text-emerald-200 mr-1">{t('dashboard.example', 'Example')}:</span>
            "
            <span
                dangerouslySetInnerHTML={{
                    __html: example,
                }}
            />
            "
        </div>
        {description && <p className="text-[11px] text-slate-300">{description}</p>}
    </div>
);


/* ================================
   COVER LETTER CARD
   ================================ */
const CoverLetterCard = ({ onOpen, t }) => (
    <div className="panel-glass p-4 md:p-6 space-y-4 animate-fade-in-up relative overflow-hidden group cursor-pointer w-full" onClick={onOpen}>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wand2 className="w-24 h-24 text-indigo-400" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Wand2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                    {t('cover_letter.title', 'Cover Letter Generator')}
                </h3>
            </div>

            <p className="text-sm text-slate-400 mb-4 max-w-md break-words">
                {t('cover_letter.subtitle', 'Generate a tailored cover letter based on your CV and the job description.')}
            </p>

            <button
                onClick={(e) => { e.stopPropagation(); onOpen(); }}
                className="
                    inline-flex items-center gap-2 px-4 py-2
                    bg-indigo-600 hover:bg-indigo-500 
                    text-white text-xs font-bold uppercase tracking-wider 
                    rounded-xl shadow-lg shadow-indigo-500/20
                    transition-all hover:-translate-y-0.5
                "
            >
                <Wand2 className="w-4 h-4" />
                {t('cover_letter.create_btn', 'Create Cover Letter')}
            </button>
        </div>
    </div>
);

/* ================================
   INTERVIEW PREP CARD (Dashboard Entry)
   ================================ */
const InterviewPrepCard = ({ onOpen, t }) => (
    <div className="panel-glass p-4 md:p-6 space-y-4 animate-fade-in-up relative overflow-hidden group cursor-pointer w-full" onClick={onOpen}>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageCircleQuestion className="w-24 h-24 text-sky-400" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300">
                    <MessageCircleQuestion className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                    {t('header.interview_prep', 'Interview Prep')}
                </h3>
            </div>

            <p className="text-sm text-slate-400 mb-4 max-w-md break-words">
                {t('dashboard.interview_prep_desc', 'Generate personalized interview questions and answers based on your CV and this job description.')}
            </p>

            <button
                onClick={(e) => { e.stopPropagation(); onOpen(); }}
                className="
                    inline-flex items-center gap-2 px-4 py-2
                    bg-sky-600 hover:bg-sky-500 
                    text-white text-xs font-bold uppercase tracking-wider 
                    rounded-xl shadow-lg shadow-sky-500/20
                    transition-all hover:-translate-y-0.5
                "
            >
                <Wand2 className="w-4 h-4" />
                {t('dashboard.generate_questions', 'Generate Questions')}
            </button>
        </div>
    </div>
);

/* ================================
   MAIN DASHBOARD COMPONENT
   ================================ */
const AnalysisDashboard = ({ result, jobDesc, onReset, onOpenInterviewPrep, onOpenCoverLetter, onOpenJobMatch }) => {
    const { t } = useTranslation();

    const currentScore = result?.scores?.current || 50;
    const potentialScore = result?.scores?.potential || 85;
    const interviewRate = result?.scores?.interviewRate || '2x';
    const summaryText = result?.summary?.content || result?.summary?.tr || '';

    const jobFit = result?.jobFit || {};
    const jobFitScore = jobFit?.score ?? 0;
    const jobFitMatchLevel = jobFit?.matchLevel || '';
    const jobFitKeywordRate = jobFit?.keywordMatchRate ?? null;
    const hasJobFit = Boolean(jobFit && typeof jobFit.score === 'number');
    const missingKeywords = result?.missingKeywords || jobFit?.missingKeywords || [];

    const atsMods = result?.atsModifications || [];

    // Extract raw text from CV result if available, otherwise use summary as fallback or empty
    // Ideally, the backend should return the full CV text or we use the summary.
    // Since we don't have the full CV text in 'result' explicitly shown in previous files, 
    // we might need to rely on what's available. 
    // However, the user prompt implies we send "cvText". 
    // If 'result' contains the parsed text, we use it. 
    // Let's assume result.text or result.rawText exists, or use summary.
    // Checking previous AnalysisDashboard, it uses result.summary.content.
    // I will use summaryText as cvText for now if raw text isn't there.
    const cvText = result?.text || summaryText;

    return (
        <div className="space-y-6 animate-page-enter relative">
            {/* New Analysis Button (Desktop) */}

            <div className="space-y-6">
                {/* TOP SCORE PANEL */}
                <div className="panel-glass p-4 space-y-4 animate-fade-in-up relative w-full overflow-hidden">
                    <div className="flex items-center justify-center gap-4 md:gap-8 pt-2">
                        <ScoreBubble
                            label={t("dashboard.current", "Initial Score")}
                            value={currentScore}
                            variant="secondary"
                        />
                        <ArrowIcon />
                        <ScoreBubble
                            label={t("dashboard.cv_health_score", "CV Health Score")}
                            value={potentialScore}
                            variant="primary"
                        />
                    </div>

                    <InterviewChanceBanner rate={interviewRate} t={t} />

                    <HighLevelAssessment summary={summaryText} t={t} />
                </div>

                {/* ACTION CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InterviewPrepCard onOpen={onOpenInterviewPrep} t={t} />
                    <CoverLetterCard onOpen={onOpenCoverLetter} t={t} />
                </div>

                {/* ATS ANALYSIS PANEL */}
                <div className="panel-glass p-4 md:p-6 space-y-5 animate-fade-in-up w-full overflow-hidden">
                    <SectionHeader
                        icon={<BarChart3 className="h-4 w-4" />}
                        label={t("dashboard.ats_detailed_analysis", "ATS Detailed Analysis")}
                    />

                    {/* SkillBars */}
                    <div className="space-y-3 bg-slate-900/40 p-4 md:p-5 rounded-xl border border-slate-700/50">
                        <SkillBar label={t('dashboard.searchability')} score={result.scores?.breakdown?.searchability} color="text-blue-400" />
                        <SkillBar label={t('dashboard.hard_skills')} score={result.scores?.breakdown?.hardSkills} color="text-purple-400" />
                        <SkillBar label={t('dashboard.soft_skills')} score={result.scores?.breakdown?.softSkills} color="text-amber-400" />
                        <SkillBar label={t('dashboard.formatting')} score={result.scores?.breakdown?.formatting} color="text-emerald-400" />
                    </div>

                    {/* ATS Check List */}
                    {atsMods.length > 0 && (
                        <div className="bg-slate-900/40 p-4 md:p-5 rounded-xl border border-slate-700/50">
                            <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2 mb-3 tracking-wider">
                                <CheckSquare className="w-4 h-4" />
                                {t('dashboard.ats_check')}
                            </h3>
                            <div className="section-divider-indigo mb-3" />
                            <ul className="space-y-2">
                                {atsMods.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-300 break-words">
                                            {item.detail || item.action}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* JOB MATCH CARD */}
                <JobMatchCard
                    score={jobFitScore}
                    matchLevel={jobFitMatchLevel}
                    jobFit={jobFit}
                    keywordRate={jobFitKeywordRate}
                    onOpenJobMatch={onOpenJobMatch}
                    t={t}
                    onReset={onReset}
                />

                {/* SUGGESTED KEYWORDS */}
                <SuggestedKeywordsSection missingKeywords={missingKeywords} t={t} />
            </div>
        </div>
    );
};

export default AnalysisDashboard;
