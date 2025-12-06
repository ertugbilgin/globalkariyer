export const initializeGA = (measurementId) => {
    if (!measurementId) return;

    // Inject Google Analytics script dynamically
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId);

    console.log(`✅ Google Analytics Initialized: ${measurementId}`);
};

export const trackEvent = (eventName, params = {}) => {
    if (window.gtag) {
        window.gtag('event', eventName, params);
        console.log(`📊 GA Event: ${eventName}`, params);
    } else {
        // console.warn("Google Analytics not initialized"); // Suppress warning to avoid noise before consent
    }
};

export const ANALYTICS_EVENTS = {
    CV_UPLOAD: 'cv_upload',
    ANALYSIS_SUCCESS: 'analysis_success',
    ANALYSIS_FAIL: 'analysis_fail',
    DOWNLOAD_WORD: 'download_word',
    SYSTEM_BUSY: 'system_busy',
    JOB_MATCH_OPEN: 'job_match_open',
    JOB_MATCH_ANALYSIS: 'job_match_analysis',
    JOB_MATCH_SUCCESS: 'job_match_success',
    JD_UPDATE_FROM_MODAL: 'jd_update_from_modal'
};
