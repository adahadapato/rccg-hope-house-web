import {
    useEffect,
    useState,
} from 'react';

interface ApiErrorStateProps {
    status?: number | null;
    message?: string | null;
    title?: string | null;
    onRetry?: () =>
        boolean | Promise<boolean>;
    retrying?: boolean;
    compact?: boolean;
    retryDelaySeconds?: number;
}

interface RetryCooldownState {
    retryAvailableAt: number;
}

const RETRY_STATE_KEY =
    'apiErrorRetryCooldown';

function getDefaultTitle(
    status?: number | null
): string {
    switch (status) {
        case 401:
            return 'Session expired';

        case 403:
            return 'Access denied';

        case 404:
            return 'Content not found';

        case 429:
            return 'Too many requests';

        case 500:
        case 502:
        case 503:
        case 504:
            return 'Service temporarily unavailable';

        default:
            return 'Unable to load content';
    }
}

function getDefaultMessage(
    status?: number | null
): string {
    switch (status) {
        case 401:
            return 'Your session may have expired. Please sign in again.';

        case 403:
            return 'You do not have permission to access this content.';

        case 404:
            return 'The requested content could not be found.';

        case 429:
            return 'Too many requests have been made in a short period. Please wait a moment and try again.';

        case 500:
            return 'The server encountered an unexpected problem. Please try again.';

        case 502:
        case 503:
        case 504:
            return 'The service is temporarily unavailable. Please try again shortly.';

        default:
            return 'We could not connect to the service. Please check your connection and try again.';
    }
}

function readRetryState():
    RetryCooldownState | null {
    try {
        const storedValue =
            sessionStorage.getItem(
                RETRY_STATE_KEY
            );

        if (!storedValue) {
            return null;
        }

        const parsed =
            JSON.parse(
                storedValue
            ) as Partial<RetryCooldownState>;

        if (
            typeof parsed.retryAvailableAt !==
            'number' ||
            !Number.isFinite(
                parsed.retryAvailableAt
            )
        ) {
            sessionStorage.removeItem(
                RETRY_STATE_KEY
            );

            return null;
        }

        return {
            retryAvailableAt:
                parsed.retryAvailableAt,
        };
    } catch {
        return null;
    }
}

function writeRetryState(
    retryAvailableAt: number
): void {
    try {
        sessionStorage.setItem(
            RETRY_STATE_KEY,
            JSON.stringify({
                retryAvailableAt,
            })
        );
    } catch {
        // Ignore storage failures.
    }
}

function clearRetryState(): void {
    try {
        sessionStorage.removeItem(
            RETRY_STATE_KEY
        );
    } catch {
        // Ignore storage failures.
    }
}

function calculateRemainingSeconds(
    retryAvailableAt: number
): number {
    return Math.max(
        0,
        Math.ceil(
            (
                retryAvailableAt -
                Date.now()
            ) / 1000
        )
    );
}

function getOrCreateRetryTime(
    retryDelaySeconds: number
): number {
    const existingState =
        readRetryState();

    /*
     * Reuse the existing timestamp even when it has
     * already expired. This is intentional.
     *
     * It means that after the first countdown reaches
     * zero, navigating to another Admin page still shows
     * "Try Again" instead of starting another countdown.
     */
    if (existingState) {
        return existingState.retryAvailableAt;
    }

    const retryAvailableAt =
        Date.now() +
        Math.max(
            0,
            retryDelaySeconds
        ) *
        1000;

    writeRetryState(
        retryAvailableAt
    );

    return retryAvailableAt;
}

function ApiErrorState({
    status = null,
    message,
    title,
    onRetry,
    retrying = false,
    compact = false,
    retryDelaySeconds = 30,
}: ApiErrorStateProps) {
    const [
        retryAvailableAt,
        setRetryAvailableAt,
    ] = useState<number>(() =>
        getOrCreateRetryTime(
            retryDelaySeconds
        )
    );

    const [
        secondsRemaining,
        setSecondsRemaining,
    ] = useState<number>(() =>
        calculateRemainingSeconds(
            retryAvailableAt
        )
    );

    const [
        retryInProgress,
        setRetryInProgress,
    ] = useState(false);

    const displayTitle =
        title?.trim() ||
        getDefaultTitle(status);

    const displayMessage =
        message?.trim() ||
        getDefaultMessage(status);

    useEffect(() => {
        if (!onRetry) {
            return;
        }

        const updateCountdown =
            () => {
                setSecondsRemaining(
                    calculateRemainingSeconds(
                        retryAvailableAt
                    )
                );
            };

        updateCountdown();

        if (
            calculateRemainingSeconds(
                retryAvailableAt
            ) === 0
        ) {
            return;
        }

        const timer =
            window.setInterval(
                updateCountdown,
                250
            );

        return () => {
            window.clearInterval(
                timer
            );
        };
    }, [
        onRetry,
        retryAvailableAt,
    ]);

    const isRetrying =
        retrying ||
        retryInProgress;

    const waitingToRetry =
        secondsRemaining > 0;

    const retryDisabled =
        isRetrying ||
        waitingToRetry;

    async function handleRetry() {
        if (
            retryDisabled ||
            !onRetry
        ) {
            return;
        }

        /*
         * Do NOT start another countdown here.
         *
         * First perform the real retry for the current
         * page. Only a failed retry starts a fresh
         * cooldown.
         */
        setRetryInProgress(true);

        try {
            const succeeded =
                await onRetry();

            if (succeeded) {
                /*
                 * The current page successfully reloaded.
                 * End the outage cooldown so a future,
                 * unrelated error can start a fresh one.
                 */
                clearRetryState();
                return;
            }

            /*
             * The real retry failed.
             * Only now do we start another cooldown.
             */
            const nextRetryAvailableAt =
                Date.now() +
                Math.max(
                    0,
                    retryDelaySeconds
                ) *
                1000;

            writeRetryState(
                nextRetryAvailableAt
            );

            setRetryAvailableAt(
                nextRetryAvailableAt
            );

            setSecondsRemaining(
                Math.max(
                    0,
                    retryDelaySeconds
                )
            );
        } catch {
            /*
             * Treat an unexpected thrown retry as a
             * failed retry and apply the same cooldown.
             */
            const nextRetryAvailableAt =
                Date.now() +
                Math.max(
                    0,
                    retryDelaySeconds
                ) *
                1000;

            writeRetryState(
                nextRetryAvailableAt
            );

            setRetryAvailableAt(
                nextRetryAvailableAt
            );

            setSecondsRemaining(
                Math.max(
                    0,
                    retryDelaySeconds
                )
            );
        } finally {
            setRetryInProgress(false);
        }
    }

    function getRetryButtonText():
        string {
        if (isRetrying) {
            return 'Trying again...';
        }

        if (
            secondsRemaining > 0
        ) {
            return `Try Again in ${secondsRemaining} ${secondsRemaining === 1
                    ? 'sec'
                    : 'secs'
                }`;
        }

        return 'Try Again';
    }

    return (
        <div
            className={`api-error-state ${compact
                    ? 'api-error-state-compact'
                    : ''
                }`}
            role="alert"
        >
            <div className="api-error-state-icon">
                !
            </div>

            <div className="api-error-state-content">
                <strong>
                    {displayTitle}
                </strong>

                <p>
                    {displayMessage}
                </p>

                {status === 429 && (
                    <small>
                        Error 429 - Too Many Requests
                    </small>
                )}

                {status !== null &&
                    status !== undefined &&
                    status !== 429 && (
                        <small>
                            Error {status}
                        </small>
                    )}

                {onRetry && (
                    <button
                        type="button"
                        className="api-error-state-retry"
                        onClick={() =>
                            void handleRetry()
                        }
                        disabled={
                            retryDisabled
                        }
                    >
                        {getRetryButtonText()}
                    </button>
                )}
            </div>
        </div>
    );
}

export default ApiErrorState;
