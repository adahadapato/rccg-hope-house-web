
const MEASUREMENT_ID = 'G-N7JQTLJ6CV';

const CONSENT_KEY = 'rccg-analytics-consent';

type ConsentChoice = 'accepted' | 'rejected';

declare global {
    interface Window {
        dataLayer: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

let analyticsLoaded = false;

export function getAnalyticsConsent():
    ConsentChoice | null {
    try {
        const choice = localStorage.getItem(CONSENT_KEY);

        return choice === 'accepted' ||
            choice === 'rejected'
            ? choice
            : null;
    } catch {
        return null;
    }
}

export function saveAnalyticsConsent(
    choice: ConsentChoice
): void {
    try {
        localStorage.setItem(CONSENT_KEY, choice);
    } catch {
        // Continue without persistent storage.
    }
}

function isPublicPage(): boolean {
    const path = window.location.pathname.toLowerCase();

    return !(
        path === '/admin' ||
        path.startsWith('/admin/') ||
        path === '/verify-email'
    );
}

export function trackPageView(): void {
    if (!analyticsLoaded ||
        !window.gtag ||
        !isPublicPage()) {
        return;
    }

    window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path:
            window.location.pathname +
            window.location.search
    });
}

export function initialiseAnalytics(): void {
    if (analyticsLoaded ||
        getAnalyticsConsent() !== 'accepted' ||
        !isPublicPage()) {
        return;
    }

    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];

    window.gtag = (...args: unknown[]) => {
        window.dataLayer.push(args);
    };

    window.gtag('js', new Date());

    window.gtag('config', MEASUREMENT_ID, {
        send_page_view: false
    });

    const script = document.createElement('script');

    script.async = true;
    script.src =
        'https://www.googletagmanager.com/gtag/js?id=' +
        MEASUREMENT_ID;

    document.head.appendChild(script);

    trackPageView();
}
