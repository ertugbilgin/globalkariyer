import { useState, useRef, useEffect } from 'react'
import './index.css'
import './i18n'; // Initialize i18n
import { useReactToPrint } from 'react-to-print'
import { useAnalyze } from './hooks/useAnalyze'
import { generateWordDoc } from './lib/docxGenerator'
import { trackEvent, ANALYTICS_EVENTS } from './lib/analytics'
import Header from './components/Header'
import Landing from './components/Landing'
import UploadSection from './components/UploadSection'
import AnalysisDashboard from './components/AnalysisDashboard'
import CVPreview from './components/CVPreview'
import PaywallModal from './components/PaywallModal'

import CoverLetterModal from './components/CoverLetterModal';
import InterviewPrepModal from './components/InterviewPrepModal';
import JobMatchModal from './components/JobMatchModal';

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
    handleAnalyze,
    calculateJobMatch
  } = useAnalyze();

  const [isPaid, setIsPaid] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null); // 'cv', 'cover_letter', 'interview_prep'

  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);
  const [isJobMatchModalOpen, setIsJobMatchModalOpen] = useState(false);

  const printRef = useRef(null);

  // Check for payment success on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successType = params.get('type');
    if (successType) {
      // In a real app, verify session_id with backend
      // For now, we trust the redirect for this demo
      alert(`Payment Successful for ${successType}! Feature unlocked.`);

      // Clean URL
      window.history.replaceState({}, document.title, "/");

      if (successType === 'cv_download') setIsPaid(true);
      // For others, we might need specific states, but for now let's assume global unlock or specific logic
    }
  }, []);

  const openPaywall = (feature) => {
    setPaywallFeature(feature);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: result?.contactInfo?.name ? `${result.contactInfo.name.replace(/\s+/g, '_')} _Optimized_CV` : 'Optimized_CV',
  });

  const handleDownloadRequest = () => {
    if (isPaid) {
      generateWordDoc(result);
    } else {
      openPaywall('cv');
    }
  };

  // Extract raw text from CV result if available, otherwise use summary as fallback or empty
  const cvText = result?.text || result?.summary?.content || result?.summary?.tr || '';

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      <Header
        result={result}
        onDownload={handleDownloadRequest}
        onOpenCoverLetter={() => setIsCoverLetterOpen(true)}
        onOpenInterviewPrep={() => setIsInterviewPrepOpen(true)}
        onReset={() => { setResult(null); setIsPaid(false); }}
      />

      {paywallFeature && (
        <PaywallModal
          isOpen={!!paywallFeature}
          onClose={() => setPaywallFeature(null)}
          feature={paywallFeature}
        />
      )}

      {/* GLOBAL COVER LETTER MODAL */}
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        cvText={cvText}
        jobDescription={jobDesc}
        onJobDescUpdate={(newJD) => {
          setJobDesc(newJD);
          calculateJobMatch(cvText, newJD);
        }}
        onOpenPaywall={() => openPaywall('cover_letter')}
        isPaid={isPaid}
      />

      {/* GLOBAL INTERVIEW PREP MODAL */}
      <InterviewPrepModal
        isOpen={isInterviewPrepOpen}
        onClose={() => setIsInterviewPrepOpen(false)}
        cvText={cvText}
        jobDescription={jobDesc}
        onJobDescUpdate={(newJD) => {
          setJobDesc(newJD);
          // We don't auto-generate interview prep, but we update the JD context
          // and trigger job match score update if needed
          calculateJobMatch(cvText, newJD);
        }}
        onOpenPaywall={() => openPaywall('interview_prep')}
        isPaid={isPaid}
      />

      {/* GLOBAL JOB MATCH MODAL */}
      <JobMatchModal
        isOpen={isJobMatchModalOpen}
        onClose={() => setIsJobMatchModalOpen(false)}
        initialJobDesc={jobDesc}
        onSubmit={(newJobDesc) => {
          setJobDesc(newJobDesc);
          // Trigger analysis with the new JD
          // We need to ensure 'file' is present or we use 'cvText' if the backend supports it.
          // Currently handleAnalyze uses 'file' from state.
          // If file is missing (e.g. page refresh), we might need to handle it.
          // But for now, assuming flow is: Upload -> Analyze -> Dashboard -> Add JD -> Re-Analyze.
          handleAnalyze(newJobDesc);
        }}
      />

      <main className="max-w-[1600px] mx-auto p-3 md:p-4 lg:p-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className={`lg:col-span-5 space-y-6 ${result ? '' : 'lg:col-start-4 lg:col-span-6'}`}>
            {!result && !loading && !isAiBusy && <Landing />}

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
              <AnalysisDashboard
                result={result}
                jobDesc={jobDesc}
                onReset={() => { setResult(null); setIsPaid(false); }}
                onOpenInterviewPrep={() => setIsInterviewPrepOpen(true)}
                onOpenCoverLetter={() => setIsCoverLetterOpen(true)}
                onOpenJobMatch={() => {
                  trackEvent(ANALYTICS_EVENTS.JOB_MATCH_OPEN);
                  setIsJobMatchModalOpen(true);
                }}
                onDownloadCv={handleDownloadRequest}
              />
            )}
          </div>

          {result && typeof result.optimizedCv === 'string' && !isAiBusy && (
            <CVPreview
              result={result}
              printRef={printRef}
              onDownload={handleDownloadRequest}
              isPaid={isPaid}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App