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
  const [paywallFeature, setPaywallFeature] = useState(null);

  // Feature unlock states
  const [hasCoverLetterAccess, setHasCoverLetterAccess] = useState(false);
  const [hasInterviewPrepAccess, setHasInterviewPrepAccess] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);
  const [isJobMatchModalOpen, setIsJobMatchModalOpen] = useState(false);

  const printRef = useRef(null);

  // Persist feature access to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('feature_access', JSON.stringify({
      hasCoverLetterAccess,
      hasInterviewPrepAccess,
      hasPremiumAccess,
      isPaid
    }));
  }, [hasCoverLetterAccess, hasInterviewPrepAccess, hasPremiumAccess, isPaid]);

  // Restore feature access on mount
  useEffect(() => {
    const saved = localStorage.getItem('feature_access');
    if (saved) {
      try {
        const { hasCoverLetterAccess: cl, hasInterviewPrepAccess: ip, hasPremiumAccess: pm, isPaid: pd } = JSON.parse(saved);
        setHasCoverLetterAccess(cl || false);
        setHasInterviewPrepAccess(ip || false);
        setHasPremiumAccess(pm || false);
        setIsPaid(pd || false);
        console.log('✅ Restored feature access from localStorage');
      } catch (e) {
        console.error('Failed to restore feature access:', e);
      }
    }
  }, []);

  // Check for payment success and restore analysis state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get('payment_success');
    const paymentCancelled = params.get('payment_cancelled');
    const purchasedFeature = params.get('feature'); // NOT 'type'!

    console.log('🔍 Payment check:', { paymentSuccess, paymentCancelled, purchasedFeature });

    // Handle payment cancellation - restore state and show message
    if (paymentCancelled === 'true') {
      // Restore analysis state from sessionStorage
      const savedResult = sessionStorage.getItem('temp_analysis') || sessionStorage.getItem('result');
      const savedJobDesc = sessionStorage.getItem('temp_job_desc') || sessionStorage.getItem('jobDesc');

      if (savedResult) {
        try {
          const parsedResult = JSON.parse(savedResult);
          setResult(parsedResult);
          console.log('✅ Analysis state restored after payment cancellation');
        } catch (e) {
          console.error('Failed to parse saved result:', e);
        }
      }

      if (savedJobDesc) {
        setJobDesc(savedJobDesc);
      }

      // Show friendly message
      alert('Payment cancelled. No worries - your analysis is still here!');

      // Clean URL
      window.history.replaceState({}, document.title, "/");
      return; // Exit early, don't process payment success
    }

    // FIXED: Check for 'feature' param, not 'type'
    if (paymentSuccess === 'true' && purchasedFeature) {
      console.log('✅ Payment success detected, restoring state...');

      // Restore analysis state - check both old and new keys for backwards compatibility
      const savedResult = sessionStorage.getItem('temp_analysis') || sessionStorage.getItem('result');
      const savedJobDesc = sessionStorage.getItem('temp_job_desc') || sessionStorage.getItem('jobDesc');

      console.log('🔍 sessionStorage check:', {
        hasTempAnalysis: !!sessionStorage.getItem('temp_analysis'),
        hasResult: !!sessionStorage.getItem('result'),
        hasTempJobDesc: !!sessionStorage.getItem('temp_job_desc'),
        hasJobDesc: !!sessionStorage.getItem('jobDesc')
      });

      if (savedResult) {
        try {
          const parsedResult = JSON.parse(savedResult);
          setResult(parsedResult);
          console.log('✅ Analysis state restored after payment');
        } catch (e) {
          console.error('Failed to parse saved result:', e);
        }
      } else {
        console.warn('⚠️ No saved result found in sessionStorage!');
      }

      if (savedJobDesc) {
        setJobDesc(savedJobDesc);
        console.log('✅ Job description restored:', savedJobDesc.substring(0, 50) + '...');
      }

      // Unlock the feature user just paid for
      console.log('💳 Purchased feature:', purchasedFeature);

      switch (purchasedFeature) {
        case 'cv_download':
          setIsPaid(true); // Mark as paid for CV download
          alert('🎉 Thank you! Your optimized CV download is ready!');
          break;
        case 'cover_letter':
          setHasCoverLetterAccess(true);
          setIsCoverLetterOpen(true); // Open modal automatically
          alert('🎉 Congratulations! You now have access to Cover Letter generation!');
          break;
        case 'interview_prep':
          setHasInterviewPrepAccess(true);
          setIsInterviewPrepOpen(true); // Open modal automatically
          alert('🎉 Congratulations! You now have access to Interview Prep!');
          break;
        case 'premium':
          setHasPremiumAccess(true);
          setIsPaid(true); // Premium includes CV download
          setHasCoverLetterAccess(true);
          setHasInterviewPrepAccess(true);
          alert('🎉 Welcome to Premium! You now have unlimited access to all features!');
          break;
        default:
          console.warn('⚠️ Unknown feature:', purchasedFeature);
      }

      // Clean URL
      window.history.replaceState({}, document.title, "/");
    }
  }, [setResult, setJobDesc]);

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
          result={result}
          jobDesc={jobDesc}
        />
      )}

      {/* GLOBAL COVER LETTER MODAL */}
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        result={result}
        jobDesc={jobDesc}
        cvText={cvText}
        onOpenPaywall={() => openPaywall('cover_letter')}
        hasAccess={hasCoverLetterAccess || hasPremiumAccess}
      />

      {/* GLOBAL INTERVIEW PREP MODAL */}
      <InterviewPrepModal
        isOpen={isInterviewPrepOpen}
        onClose={() => setIsInterviewPrepOpen(false)}
        result={result}
        jobDesc={jobDesc}
        onOpenPaywall={() => openPaywall('interview_prep')}
        isPaid={hasInterviewPrepAccess || hasPremiumAccess}
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