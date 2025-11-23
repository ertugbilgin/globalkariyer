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
                                "Yapay zeka CV'nizi detaylıca inceliyor...",
                                "ATS uyumluluk skoru hesaplanıyor...",
                                "İngilizce dil bilgisi kontrol ediliyor...",
                                "Sektörel anahtar kelimeler taranıyor...",
                                "Neredeyse bitti, lütfen sayfayı kapatmayın! 🚀",
                                "Sonuçlar hazırlanıyor..."
                            ];
                            const currentIndex = messages.indexOf(prevText);
                            const nextIndex = (currentIndex + 1) % messages.length;
                            return messages[nextIndex];
                        });
                    } else if (currentProgress < 30) {
                        setLoadingText("CV Taranıyor ve Ayrıştırılıyor...");
                    } else if (currentProgress < 60) {
                        setLoadingText("ATS Uyumluluk Analizi Yapılıyor...");
                    } else {
                        setLoadingText("Anahtar Kelimeler ve Eksikler Belirleniyor...");
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
            setLoadingText("Analiz Başlatılıyor...");
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
