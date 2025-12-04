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
    SYSTEM_BUSY: 'system_busy',
    JOB_MATCH_OPEN: 'job_match_open',
    JOB_MATCH_ANALYSIS: 'job_match_analysis',
    JOB_MATCH_SUCCESS: 'job_match_success',
    JD_UPDATE_FROM_MODAL: 'jd_update_from_modal'
};
