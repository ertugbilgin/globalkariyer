import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useAnalyze } from './hooks/useAnalyze'
import { generateWordDoc } from './lib/docxGenerator'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import UploadSection from './components/UploadSection'
import AnalysisDashboard from './components/AnalysisDashboard'
import CVPreview from './components/CVPreview'

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

  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: result?.contactInfo?.name ? `${result.contactInfo.name.replace(/\s+/g, '_')}_Optimized_CV` : 'Optimized_CV',
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      <Header result={result} onDownload={() => generateWordDoc(result)} />

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
              <AnalysisDashboard result={result} onReset={() => setResult(null)} />
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

export default App