
import { useEffect, useRef, useState } from 'react';

import {
    apiUrl,
    getApiErrorDetails
} from '@/api/api';

import '@/styles/celebration-invitation.css';

/**
 * Public invitation details returned by the API.
 *
 * These properties correspond to
 * CelebrationInvitationDetailsDto.
 */
interface CelebrationInvitationDetails {
    occasion: string;
    celebrationDate: string;
    expiresAt: string;
}

type InvitationPageState =
    | 'loading'
    | 'ready'
    | 'submitting'
    | 'approved'
    | 'declined'
    | 'unavailable'
    | 'error';

const INVALID_INVITATION_MESSAGE =
    'This invitation is invalid, expired, or no longer available.';

const NETWORK_ERROR_MESSAGE =
    'We could not connect to the service. Please check your connection and try again.';

/**
 * Formats a DateOnly value without timezone-related
 * changes to the celebration date.
 */
function formatCelebrationDate(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

    if (!match) {
        return value;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
}

/**
 * Converts supported celebration occasion values
 * into readable titles.
 */
function formatOccasion(occasion: string): string {
    switch (occasion.toLowerCase()) {
        case 'birthday':
            return 'Birthday';

        case 'weddinganniversary':
            return 'Wedding Anniversary';

        default:
            return 'Special Celebration';
    }
}

/**
 * Public celebration invitation response page.
 *
 * Members use a secure invitation token to view
 * celebration details and approve or decline
 * publication without authentication.
 */
export default function CelebrationInvitationResponse() {
    // Read the token from the URL once, on first render.
    // The effect below then removes it from the address bar,
    // so it must not be re-read on later renders.
    const [token] = useState(
        () =>
            new URLSearchParams(window.location.search)
                .get('token') ?? ''
    );

    const [invitation, setInvitation] =
        useState<CelebrationInvitationDetails | null>(null);

    const [pageState, setPageState] =
        useState<InvitationPageState>('loading');

    const [errorMessage, setErrorMessage] =
        useState<string>('');

    const [selectedDecision, setSelectedDecision] =
        useState<boolean | null>(null);

    const submissionInProgress = useRef(false);

    /**
     * Retrieves invitation details when the page opens.
     */
    useEffect(() => {
        const controller = new AbortController();

        // Remove the token from the address bar after
        // reading it. Keep the token in component memory.
        //
        // This reduces accidental exposure through copied
        // URLs and browser history.
        if (token) {
            window.history.replaceState(
                window.history.state,
                '',
                window.location.pathname
            );
        }

        async function loadInvitation(): Promise<void> {
            if (!/^[a-fA-F0-9]{64}$/.test(token)) {
                setErrorMessage(INVALID_INVITATION_MESSAGE);
                setPageState('unavailable');
                return;
            }

            try {
                const response = await fetch(
                    apiUrl(
                        `/api/celebrations/invitations/${encodeURIComponent(token)}`
                    ),
                    {
                        method: 'GET',
                        signal: controller.signal,
                        cache: 'no-store',
                        referrerPolicy: 'no-referrer'
                    }
                );

                if (controller.signal.aborted) {
                    return;
                }

                if (!response.ok) {
                    if (
                        response.status === 400 ||
                        response.status === 404 ||
                        response.status === 409
                    ) {
                        setErrorMessage(
                            INVALID_INVITATION_MESSAGE
                        );

                        setPageState('unavailable');
                        return;
                    }

                    const error = await getApiErrorDetails(
                        response,
                        'We could not load your invitation.'
                    );

                    setErrorMessage(error.message);
                    setPageState('error');
                    return;
                }

                const details =
                    (await response.json()) as
                    CelebrationInvitationDetails;

                if (controller.signal.aborted) {
                    return;
                }

                setInvitation(details);
                setPageState('ready');
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setErrorMessage(
                    error instanceof Error
                        ? NETWORK_ERROR_MESSAGE
                        : 'Unable to load your invitation.'
                );

                setPageState('error');
            }
        }

        void loadInvitation();

        return () => {
            controller.abort();
        };
    }, [token]);

    /**
     * Submits the member's publication decision.
     *
     * The backend validates and consumes the token.
     * Publication remains subject to administrator
     * review after member approval.
     */
    async function submitDecision(
        approved: boolean
    ): Promise<void> {
        if (
            pageState !== 'ready' ||
            submissionInProgress.current ||
            !invitation
        ) {
            return;
        }

        submissionInProgress.current = true;

        setSelectedDecision(approved);
        setErrorMessage('');
        setPageState('submitting');

        try {
            const response = await fetch(
                apiUrl(
                    '/api/celebrations/invitations/respond'
                ),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token,
                        approved
                    }),
                    cache: 'no-store',
                    referrerPolicy: 'no-referrer'
                }
            );

            if (!response.ok) {
                if (
                    response.status === 400 ||
                    response.status === 404 ||
                    response.status === 409
                ) {
                    setErrorMessage(
                        INVALID_INVITATION_MESSAGE
                    );

                    setPageState('unavailable');
                    return;
                }

                const error = await getApiErrorDetails(
                    response,
                    'We could not record your response.'
                );

                setErrorMessage(error.message);
                setPageState('ready');
                return;
            }

            setPageState(
                approved ? 'approved' : 'declined'
            );
        } catch {
            setErrorMessage(NETWORK_ERROR_MESSAGE);
            setPageState('ready');
        } finally {
            submissionInProgress.current = false;
        }
    }

    const isBusy =
        pageState === 'loading' ||
        pageState === 'submitting';

    const showInvitation =
        (pageState === 'ready' ||
            pageState === 'submitting') &&
        invitation !== null;

    const showSuccess =
        pageState === 'approved' ||
        pageState === 'declined';

    return (
        <main className="celebration-invitation-page">
            <div className="celebration-invitation-background">
                <div className="celebration-invitation-shell">

                    <header className="celebration-invitation-brand">
                        <div
                            className="celebration-invitation-brand-icon"
                            aria-hidden="true"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 3v18" />
                                <path d="M5 8h14" />
                                <path d="M7 8l-2 5" />
                                <path d="M17 8l2 5" />
                            </svg>
                        </div>

                        <div className="celebration-invitation-brand-text">
                            <span>RCCG</span>
                            <strong>HOPE HOUSE</strong>
                        </div>
                    </header>

                    <section
                        className="celebration-invitation-card"
                        aria-labelledby="celebration-invitation-title"
                        aria-busy={isBusy}
                    >
                        <div className="celebration-invitation-card-accent" />

                        <div className="celebration-invitation-content">
                            <span className="celebration-invitation-eyebrow">
                                A SPECIAL MOMENT
                            </span>

                            <div
                                className="celebration-invitation-emblem"
                                aria-hidden="true"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        x="3"
                                        y="8"
                                        width="18"
                                        height="13"
                                        rx="2"
                                    />
                                    <path d="M12 8v13M3 12h18" />
                                    <path d="M12 8H8.5a2.5 2.5 0 1 1 2.5-2.5L12 8Z" />
                                    <path d="M12 8h3.5A2.5 2.5 0 1 0 13 5.5L12 8Z" />
                                </svg>
                            </div>

                            <h1 id="celebration-invitation-title">
                                {pageState === 'approved'
                                    ? 'Thank You!'
                                    : pageState === 'declined'
                                        ? 'Your Decision Is Recorded'
                                        : 'Celebrating With You'}
                            </h1>

                            {pageState === 'loading' && (
                                <div
                                    className="celebration-invitation-status"
                                    role="status"
                                >
                                    <span
                                        className="celebration-invitation-spinner"
                                        aria-hidden="true"
                                    />

                                    <p>
                                        We are retrieving your
                                        invitation. Please wait.
                                    </p>
                                </div>
                            )}

                            {showInvitation && (
                                <>
                                    <p className="celebration-invitation-intro">
                                        At RCCG Hope House, every
                                        milestone is an opportunity
                                        to give thanks and celebrate
                                        God's goodness together.
                                    </p>

                                    <div className="celebration-invitation-details">
                                        <span className="celebration-invitation-detail-label">
                                            YOUR SPECIAL OCCASION
                                        </span>

                                        <h2>
                                            {formatOccasion(
                                                invitation.occasion
                                            )}
                                        </h2>

                                        <div className="celebration-invitation-date">
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <rect
                                                    x="3"
                                                    y="5"
                                                    width="18"
                                                    height="16"
                                                    rx="2"
                                                />
                                                <path d="M7 3v4M17 3v4M3 10h18" />
                                            </svg>

                                            <span>
                                                {formatCelebrationDate(
                                                    invitation.celebrationDate
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="celebration-invitation-consent">
                                        <h3>
                                            May we celebrate you publicly?
                                        </h3>

                                        <p>
                                            We would love to share
                                            your special occasion
                                            with our church family
                                            through the RCCG Hope House
                                            website.
                                        </p>

                                        <p>
                                            Please let us know whether
                                            you consent to publication
                                            of your celebration details.
                                            Approval does not mean
                                            immediate publication;
                                            an administrator will
                                            review the celebration first.
                                        </p>

                                        <p className="celebration-invitation-privacy-note">
                                            You are free to decline.
                                            Your response will be
                                            recorded securely, and
                                            this invitation link can
                                            only be used once.
                                        </p>
                                    </div>

                                    {errorMessage && (
                                        <div
                                            className="celebration-invitation-alert"
                                            role="alert"
                                        >
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="celebration-invitation-actions">
                                        <button
                                            type="button"
                                            className="celebration-invitation-button celebration-invitation-button-approve"
                                            disabled={isBusy}
                                            onClick={() =>
                                                void submitDecision(true)
                                            }
                                        >
                                            {pageState === 'submitting' &&
                                                selectedDecision === true
                                                ? 'Submitting...'
                                                : 'Yes, I Approve'}
                                        </button>

                                        <button
                                            type="button"
                                            className="celebration-invitation-button celebration-invitation-button-decline"
                                            disabled={isBusy}
                                            onClick={() =>
                                                void submitDecision(false)
                                            }
                                        >
                                            {pageState === 'submitting' &&
                                                selectedDecision === false
                                                ? 'Submitting...'
                                                : 'No, Thank You'}
                                        </button>
                                    </div>

                                    {pageState === 'submitting' && (
                                        <p
                                            className="celebration-invitation-submitting"
                                            role="status"
                                        >
                                            Recording your decision...
                                        </p>
                                    )}
                                </>
                            )}

                            {showSuccess && (
                                <div
                                    className="celebration-invitation-success"
                                    role="status"
                                >
                                    <div
                                        className="celebration-invitation-success-icon"
                                        aria-hidden="true"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m5 12 4 4L19 6" />
                                        </svg>
                                    </div>

                                    <h2>
                                        {pageState === 'approved'
                                            ? 'Your Consent Has Been Recorded'
                                            : 'Your Preference Has Been Recorded'}
                                    </h2>

                                    <p>
                                        {pageState === 'approved'
                                            ? 'Thank you for allowing RCCG Hope House to celebrate your special occasion. Your celebration will be reviewed before it is published.'
                                            : 'Thank you for responding. We respect your decision, and your celebration will not be published.'}
                                    </p>
                                </div>
                            )}

                            {(pageState === 'unavailable' ||
                                pageState === 'error') && (
                                    <div
                                        className="celebration-invitation-error-state"
                                        role="alert"
                                    >
                                        <div
                                            className="celebration-invitation-error-icon"
                                            aria-hidden="true"
                                        >
                                            !
                                        </div>

                                        <h2>
                                            {pageState === 'unavailable'
                                                ? 'Invitation Unavailable'
                                                : 'Unable to Load Invitation'}
                                        </h2>

                                        <p>{errorMessage}</p>

                                        {pageState === 'unavailable' && (
                                            <p>
                                                If you believe this is
                                                a mistake, please contact
                                                the church administrator.
                                            </p>
                                        )}
                                    </div>
                                )}

                            <a
                                className="celebration-invitation-home-link"
                                href="/"
                            >
                                Return to Hope House
                            </a>
                        </div>
                    </section>

                    <footer className="celebration-invitation-footer">
                        <p>
                            RCCG Hope House
                        </p>

                        <p>
                            Faith · Family · Fellowship
                        </p>
                    </footer>
                </div>
            </div>
        </main>
    );
}
