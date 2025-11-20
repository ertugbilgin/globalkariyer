export const trackEvent = (eventName, params = {}) => {
    if (window.gtag) {
        window.gtag('event', eventName, params);
        console.log(`📊 GA Event: ${eventName}`, params);
    } else {
        console.warn("Google Analytics not initialized");
    }
};

export const ANALYTICS_EVENTS = {
    CV_UPLOAD: 'cv_upload',
    ANALYSIS_SUCCESS: 'analysis_success',
    ANALYSIS_FAIL: 'analysis_fail',
    DOWNLOAD_WORD: 'download_word',
    SYSTEM_BUSY: 'system_busy'
};
