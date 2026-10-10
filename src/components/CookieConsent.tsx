
import { useEffect, useState } from 'react';

import {
    getAnalyticsConsent,
    saveAnalyticsConsent,
    initialiseAnalytics
} from '../utils/analytics';

import './cookie-consent.css';

type ConsentChoice = 'accepted' | 'rejected';

export default function CookieConsent() {
    const [choice, setChoice] = useState<ConsentChoice | null>(
        getAnalyticsConsent
    );

    const [showBanner, setShowBanner] = useState(
        choice === null
    );

    const [showPreferences, setShowPreferences] =
        useState(false);

    useEffect(() => {
        if (choice === 'accepted') {
            initialiseAnalytics();
        }
    }, [choice]);

    function handleConsent(value: ConsentChoice) {
        saveAnalyticsConsent(value);
        setChoice(value);
        setShowBanner(false);
        setShowPreferences(false);

        // Reload when withdrawing consent to unload
        // previously initialised Google Analytics.
        if (value === 'rejected') {
            window.location.reload();
        }
    }

    return (
        <>
            {showBanner && (
                <div
                    className="cookie-consent"
                    role="dialog"
                    aria-label="Cookie preferences"
                    aria-modal="false"
                >
                    <div className="cookie-consent-header">
                        <span
                            className="cookie-consent-icon"
                            aria-hidden="true"
                        >
                            🍪
                        </span>

                        <h3 className="cookie-consent-title">
                            Your Privacy Matters
                        </h3>
                    </div>

                    <p className="cookie-consent-description">
                        RCCG Hope House uses essential storage
                        for website functionality. With your
                        permission, we also use Google Analytics
                        to understand website visits and improve
                        our services.
                    </p>

                    {showPreferences && (
                        <div className="cookie-consent-preferences">
                            <strong>Analytics Cookies</strong>
                            <p>
                                These optional cookies help us
                                understand how visitors use our
                                website. You can accept or reject
                                them without affecting access
                                to our services.
                            </p>
                        </div>
                    )}

                    <div className="cookie-consent-actions">
                        <button
                            type="button"
                            className="cookie-consent-button cookie-consent-accept"
                            onClick={() => handleConsent('accepted')}
                        >
                            Accept Analytics
                        </button>

                        <button
                            type="button"
                            className="cookie-consent-button cookie-consent-reject"
                            onClick={() => handleConsent('rejected')}
                        >
                            Reject
                        </button>

                        <button
                            type="button"
                            className="cookie-consent-button cookie-consent-settings"
                            onClick={() =>
                                setShowPreferences(!showPreferences)
                            }
                        >
                            Preferences
                        </button>
                    </div>
                </div>
            )}

            {!showBanner && (
                <button
                    type="button"
                    className="cookie-settings-trigger"
                    onClick={() => {
                        setShowPreferences(true);
                        setShowBanner(true);
                    }}
                >
                    🍪 Cookie Settings
                </button>
            )}
        </>
    );
}
