export const isInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    // Yaygın In-App Browser imzaları
    const rules = [
        'LinkedInApp', // LinkedIn
        'FBAN',        // Facebook
        'FBAV',        // Facebook
        'Instagram',   // Instagram
        'Twitter',     // Twitter
        '__wv',        // Generic Webview
    ];

    return rules.some(rule => ua.includes(rule));
};
