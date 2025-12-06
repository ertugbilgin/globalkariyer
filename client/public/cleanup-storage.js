// Cleanup script for localStorage - GDPR compliance
// Removes CV data and analysis results from browser storage
(function () {
    console.log('🧹 Cleaning up sensitive data from localStorage...');

    const keysToRemove = [
        'analysis_result',
        'analysis_job_desc',
        'cover_letter',
        'interview_prep',
        'cv_text'
    ];

    let removedCount = 0;
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            removedCount++;
        }
    });

    if (removedCount > 0) {
        console.log(`✅ Removed ${removedCount} sensitive items from localStorage`);
    } else {
        console.log('✅ No sensitive data found in localStorage');
    }
})();
