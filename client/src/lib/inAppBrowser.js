export const isInAppBrowser = () => {
    // Test için: URL'de ?inApp=true varsa in-app gibi davran
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('inApp') === 'true') {
        return true;
    }

    const ua = (navigator.userAgent || navigator.vendor || window.opera).toLowerCase();

    // Yaygın In-App Browser imzaları (Lowercase)
    const rules = [
        'linkedin',    // LinkedIn (App or WebView)
        'fban',        // Facebook
        'fbav',        // Facebook
        'instagram',   // Instagram
        'twitter',     // Twitter
        '__wv',        // Generic Webview
        'wv',          // Generic Webview
        'whatsapp',    // WhatsApp
        'snapchat',    // Snapchat
        'line',        // Line
        'threads',     // Threads
        'slack',       // Slack
    ];

    return rules.some(rule => ua.includes(rule));
};
