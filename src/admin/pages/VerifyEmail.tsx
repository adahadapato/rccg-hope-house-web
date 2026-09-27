import {
    useEffect,
    useState,
} from 'react';

import {
    apiUrl,
    getApiErrorDetails,
} from '@/api/api';

import '../styles/VerifyEmail.css';

type VerificationState =
    | 'verifying'
    | 'success'
    | 'error';

function VerifyEmail() {
    const [
        verificationState,
        setVerificationState,
    ] = useState<VerificationState>(
        'verifying'
    );

    const [
        errorMessage,
        setErrorMessage,
    ] = useState('');

    useEffect(() => {
        let cancelled = false;

        const verifyEmail =
            async () => {
                const searchParams =
                    new URLSearchParams(
                        window.location.search
                    );

                const userId =
                    searchParams.get(
                        'userId'
                    );

                const token =
                    searchParams.get(
                        'token'
                    );

                if (
                    !userId ||
                    !token
                ) {
                    if (!cancelled) {
                        setErrorMessage(
                            'This verification link is incomplete or invalid.'
                        );

                        setVerificationState(
                            'error'
                        );
                    }

                    return;
                }

                try {
                    const response =
                        await fetch(
                            apiUrl(
                                '/api/auth/confirm-email'
                            ),
                            {
                                method:
                                    'POST',
                                headers: {
                                    'Content-Type':
                                        'application/json',
                                },
                                body:
                                    JSON.stringify(
                                        {
                                            userId,
                                            token,
                                        }
                                    ),
                            }
                        );

                    if (cancelled) {
                        return;
                    }

                    if (response.ok) {
                        setVerificationState(
                            'success'
                        );

                        return;
                    }

                    const error =
                        await getApiErrorDetails(
                            response,
                            'We could not verify your email address.'
                        );

                    if (cancelled) {
                        return;
                    }

                    setErrorMessage(
                        error.message
                    );

                    setVerificationState(
                        'error'
                    );
                } catch {
                    if (cancelled) {
                        return;
                    }

                    setErrorMessage(
                        'We could not connect to the service. Please check your connection and try again.'
                    );

                    setVerificationState(
                        'error'
                    );
                }
            };

        void verifyEmail();

        return () => {
            cancelled = true;
        };
    }, []);

    if (
        verificationState ===
        'verifying'
    ) {
        return (
            <main className="verify-email-page">
                <section className="verify-email-card">
                    <div className="verify-email-spinner" />

                    <h1 className="verify-email-heading">
                        Verifying your email
                    </h1>

                    <p className="verify-email-text">
                        Please wait while we verify
                        your email address.
                    </p>
                </section>
            </main>
        );
    }

    if (
        verificationState ===
        'success'
    ) {
        return (
            <main className="verify-email-page">
                <section className="verify-email-card">
                    <div className="verify-email-status-icon verify-email-status-icon--success">
                        ✓
                    </div>

                    <h1 className="verify-email-heading">
                        Email verified
                    </h1>

                    <p className="verify-email-text">
                        Your email address has been
                        verified successfully.
                    </p>

                    <p className="verify-email-text">
                        You can now sign in to your
                        RCCG Hope House account.
                    </p>

                    <a
                        href="/"
                        className="verify-email-button"
                    >
                        Continue
                    </a>
                </section>
            </main>
        );
    }

    return (
        <main className="verify-email-page">
            <section className="verify-email-card">
                <div className="verify-email-status-icon verify-email-status-icon--error">
                    !
                </div>

                <h1 className="verify-email-heading">
                    Verification failed
                </h1>

                <p className="verify-email-text">
                    {errorMessage}
                </p>

                <p className="verify-email-secondary-text">
                    The verification link may be
                    invalid or expired. Please
                    contact an administrator if
                    you need a new verification
                    email.
                </p>

                <a
                    href="/"
                    className="verify-email-button"
                >
                    Return to website
                </a>
            </section>
        </main>
    );
}

export default VerifyEmail;