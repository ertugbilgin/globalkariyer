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
import SuccessModal from './components/SuccessModal';
import PaymentReturnModal from './components/PaymentReturnModal';

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

  // Initialize jobDesc from sessionStorage if available
  useEffect(() => {
    const savedJD = sessionStorage.getItem('temp_job_desc');
    if (savedJD && !jobDesc) {
      setJobDesc(savedJD);
      console.log('✅ Restored jobDesc from sessionStorage');
    }
  }, []);

  // Persist jobDesc to sessionStorage whenever it changes
  useEffect(() => {
    if (jobDesc) {
      sessionStorage.setItem('temp_job_desc', jobDesc);
    }
  }, [jobDesc]);

  // Initialize feature access states from localStorage
  const getInitialFeatureAccess = () => {
    try {
      const saved = localStorage.getItem('feature_access');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🔄 Initializing states from localStorage:', parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse localStorage on init:', e);
    }
    return {
      isPaid: false,
      hasCoverLetterAccess: false,
      hasInterviewPrepAccess: false,
      hasPremiumAccess: false
    };
  };

  const initialAccess = getInitialFeatureAccess();

  const [isPaid, setIsPaid] = useState(initialAccess.isPaid);
  const [paywallFeature, setPaywallFeature] = useState(null);
  const [successModalFeature, setSuccessModalFeature] = useState(null);

  // Feature unlock states
  const [hasCoverLetterAccess, setHasCoverLetterAccess] = useState(initialAccess.hasCoverLetterAccess);
  const [hasInterviewPrepAccess, setHasInterviewPrepAccess] = useState(initialAccess.hasInterviewPrepAccess);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(initialAccess.hasPremiumAccess);

  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);
  const [isJobMatchModalOpen, setIsJobMatchModalOpen] = useState(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const [paymentReturnModal, setPaymentReturnModal] = useState({ isOpen: false, type: null });

  const printRef = useRef(null);
  const justCompletedPayment = useRef(false); // Flag to prevent restoration after payment

  // Persist feature access to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('feature_access', JSON.stringify({
      hasCoverLetterAccess,
      hasInterviewPrepAccess,
      hasPremiumAccess,
      isPaid
    }));
    console.log('💾 Persisted feature access to localStorage:', { hasCoverLetterAccess, hasInterviewPrepAccess, hasPremiumAccess, isPaid });
  }, [hasCoverLetterAccess, hasInterviewPrepAccess, hasPremiumAccess, isPaid]);

  // Restore feature access ONLY on initial mount
  useEffect(() => {
    // Skip restoration ONLY if we just completed a payment (ref is reset on page refresh)
    if (justCompletedPayment.current) {
      console.log('⏭️ Skipping localStorage restoration - just completed payment');
      justCompletedPayment.current = false; // Reset flag
      return;
    }

    const saved = localStorage.getItem('feature_access');
    if (saved) {
      try {
        const { hasCoverLetterAccess: cl, hasInterviewPrepAccess: ip, hasPremiumAccess: pm, isPaid: pd } = JSON.parse(saved);
        setHasCoverLetterAccess(cl || false);
        setHasInterviewPrepAccess(ip || false);
        setHasPremiumAccess(pm || false);
        setIsPaid(pd || false);
        console.log('✅ Restored feature access from localStorage:', { cl, ip, pm, pd });
      } catch (e) {
        console.error('Failed to restore feature access:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CRITICAL: Empty dependency array - only run on mount!

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

      // Show friendly modal
      setPaymentReturnModal({ isOpen: true, type: 'cancelled' });

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

      // Set flag to prevent localStorage restoration from overwriting
      justCompletedPayment.current = true;

      switch (purchasedFeature) {
        case 'cv_download':
          setIsPaid(true);
          console.log('Setting isPaid = true for cv_download');
          // Show unlock toast
          setShowUnlockToast(true);
          setTimeout(() => setShowUnlockToast(false), 4000);
          break;
        case 'cover_letter':
          setHasCoverLetterAccess(true);
          console.log('Setting hasCoverLetterAccess = true');
          break;
        case 'interview_prep':
          setHasInterviewPrepAccess(true);
          console.log('Setting hasInterviewPrepAccess = true');
          break;
        case 'premium':
          setHasPremiumAccess(true);
          setIsPaid(true);
          setHasCoverLetterAccess(true);
          setHasInterviewPrepAccess(true);
          console.log('Setting all premium access flags = true');
          break;
        default:
          console.warn('⚠️ Unknown feature:', purchasedFeature);
      }

      // Set success modal - this will trigger on next render with updated state
      setSuccessModalFeature(purchasedFeature);

      // Clean URL
      window.history.replaceState({}, document.title, "/");
    }
  }, [setResult, setJobDesc]);

  const openPaywall = (feature) => {
    // CRITICAL: Save current state BEFORE opening paywall
    // This ensures state is preserved even if PaywallModal doesn't open or user navigates directly to Stripe
    if (result) {
      sessionStorage.setItem('temp_analysis', JSON.stringify(result));
      console.log('💾 Saved result to sessionStorage before paywall');
    }
    if (jobDesc) {
      sessionStorage.setItem('temp_job_desc', jobDesc);
      console.log('💾 Saved jobDesc to sessionStorage before paywall');
    }

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

      {/* SUCCESS MODAL */}
      <SuccessModal
        isOpen={!!successModalFeature}
        onClose={() => setSuccessModalFeature(null)}
        feature={successModalFeature}
        onOpenFeature={() => {
          console.log('🎯 SuccessModal onOpenFeature called for:', successModalFeature);
          console.log('Current state:', { hasInterviewPrepAccess, hasPremiumAccess });
          // Open the corresponding feature modal after success modal
          if (successModalFeature === 'cover_letter') {
            setIsCoverLetterOpen(true);
          } else if (successModalFeature === 'interview_prep') {
            console.log('Opening Interview Prep Modal with isPaid = ', hasInterviewPrepAccess || hasPremiumAccess);
            setIsInterviewPrepOpen(true);
          }
        }}
      />

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
      {isInterviewPrepOpen && console.log('🔍 Rendering InterviewPrepModal with isPaid =', hasInterviewPrepAccess || hasPremiumAccess, { hasInterviewPrepAccess, hasPremiumAccess })}
      <InterviewPrepModal
        isOpen={isInterviewPrepOpen}
        onClose={() => setIsInterviewPrepOpen(false)}
        cvText={cvText}
        jobDescription={jobDesc}
        onJobDescUpdate={(newJD) => setJobDesc(newJD)}
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

      {/* CV Unlock Success Toast */}
      {showUnlockToast && (
        <div className="fixed bottom-6 right-6 z-[70] animate-fade-in">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="p-2 bg-white/20 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">CV Unlocked!</p>
              <p className="text-sm text-emerald-100">You can now download your optimized CV</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Return Modal */}
      <PaymentReturnModal
        type={paymentReturnModal.type}
        isOpen={paymentReturnModal.isOpen}
        onClose={() => setPaymentReturnModal({ isOpen: false, type: null })}
        onRetry={() => {
          setPaymentReturnModal({ isOpen: false, type: null });
          setPaywallFeature('cv_download');
        }}
      />
    </div>
  )
}

export default App