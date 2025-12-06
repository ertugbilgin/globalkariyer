import { useState, useEffect } from 'react';
import { trackEvent, ANALYTICS_EVENTS } from '../lib/analytics';
import { useTranslation } from 'react-i18next';

export const useAnalyze = () => {
    const [file, setFile] = useState(null);
    const [jobDesc, setJobDesc] = useState('');
    const [result, setResult] = useState(() => {
        // Restore result from sessionStorage on initial load
        const savedResult = sessionStorage.getItem('analysis_result');
        if (savedResult) {
            try {
                console.log('✅ Restored analysis result from sessionStorage');
                return JSON.parse(savedResult);
            } catch (e) {
                console.error('Failed to parse saved result:', e);
                return null;
            }
        }
        return null;
    });
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

    const { i18n } = useTranslation();

    const handleAnalyze = async (jobDescOverride = null) => {
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
        // Use override if provided, otherwise use state
        formData.append('jobDescription', jobDescOverride !== null ? jobDescOverride : jobDesc);
        formData.append('language', i18n.language);

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
            setTimeout(() => {
                setResult(data);
                // Persist result to sessionStorage
                sessionStorage.setItem('analysis_result', JSON.stringify(data));
                console.log('💾 Cached analysis result to sessionStorage');
            }, 500);
        } catch (err) {
            trackEvent(ANALYTICS_EVENTS.ANALYSIS_FAIL, { error: err.message });
            setError(err.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            if (!currentBusyState) setTimeout(() => setLoading(false), 500);
        }
    };

    const calculateJobMatch = async (currentCvText, newJobDesc) => {
        if (!currentCvText || !newJobDesc) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiUrl}/job-match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cvText: currentCvText,
                    jobDescription: newJobDesc,
                    language: i18n.language
                })
            });

            const data = await res.json();
            if (data.jobFit) {
                trackEvent(ANALYTICS_EVENTS.JOB_MATCH_SUCCESS, { score: data.jobFit.score });
                setResult(prev => ({
                    ...prev,
                    jobFit: data.jobFit,
                    missingKeywords: data.missingKeywords || prev.missingKeywords
                }));
            }
        } catch (error) {
            console.error("Job Match update failed:", error);
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
        handleAnalyze,
        calculateJobMatch,
        clearError: () => {
            setError(null);
            setFile(null);
        }
    };
};
