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
    const [loadingText, setLoadingText] = useState("Analiz Başlatılıyor...");

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        setLoadingText("Son dokunuşlar yapılıyor... (Bu işlem biraz zaman alabilir)");
                        return 90;
                    }
                    if (prev < 30) setLoadingText("CV Taranıyor ve Ayrıştırılıyor...");
                    else if (prev < 60) setLoadingText("ATS Uyumluluk Analizi Yapılıyor...");
                    else if (prev < 80) setLoadingText("Anahtar Kelimeler ve Eksikler Belirleniyor...");
                    else setLoadingText("Profesyonel İngilizce Format Oluşturuluyor...");
                    return prev + 1.5;
                });
            }, 150);
            return () => clearInterval(interval);
        } else {
            setProgress(0);
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
            setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
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
        handleAnalyze
    };
};
