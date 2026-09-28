import {
    apiFetch,
    getApiErrorDetails,
    getNetworkErrorDetails,
    storeAdminSession,
    type ApiErrorDetails,
    type AuthTokensResponse,
} from '@/api/api';

import ApiErrorState from '@/components/sections/ApiErrorState';

import {
    useEffect,
    useState,
} from 'react';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type LoginStep =
    | 'credentials'
    | 'two-factor';

export default function AdminLoginModal({
    isOpen,
    onClose,
}: AdminLoginModalProps) {
    const [
        email,
        setEmail,
    ] = useState('');

    const [
        password,
        setPassword,
    ] = useState('');

    const [
        loginStep,
        setLoginStep,
    ] = useState<LoginStep>(
        'credentials'
    );

    const [
        twoFactorChallengeToken,
        setTwoFactorChallengeToken,
    ] = useState<string | null>(
        null
    );

    const [
        verificationCode,
        setVerificationCode,
    ] = useState('');

    const [
        useRecoveryCode,
        setUseRecoveryCode,
    ] = useState(false);

    const [
        status,
        setStatus,
    ] = useState<
        | 'idle'
        | 'submitting'
        | 'success'
        | 'error'
    >('idle');

    const [
        loginError,
        setLoginError,
    ] =
        useState<ApiErrorDetails | null>(
            null
        );

    function resetLoginForm() {
        setEmail('');
        setPassword('');
        setLoginStep(
            'credentials'
        );
        setTwoFactorChallengeToken(
            null
        );
        setVerificationCode('');
        setUseRecoveryCode(false);
        setStatus('idle');
        setLoginError(null);
    }

    function handleClose() {
        if (
            status === 'submitting' ||
            status === 'success'
        ) {
            return;
        }

        resetLoginForm();
        onClose();
    }

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === 'Escape'
            ) {
                /*
                 * Do not close the modal while
                 * authentication is being submitted
                 * or after a successful login while
                 * navigation is taking place.
                 */
                if (
                    status ===
                    'submitting' ||
                    status ===
                    'success'
                ) {
                    return;
                }

                onClose();
            }
        };

        window.addEventListener(
            'keydown',
            handleEscape
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleEscape
            );
        };
    }, [
        isOpen,
        onClose,
        status,
    ]);

    if (!isOpen) {
        return null;
    }

    function clearError() {
        if (loginError) {
            setLoginError(null);
        }

        if (status === 'error') {
            setStatus('idle');
        }
    }

    function completeLogin(
        data: AuthTokensResponse
    ) {
        storeAdminSession(data);

        setStatus('success');

        window.location.assign(
            '/admin'
        );
    }

    const handleCredentialSubmit =
        async (
            event:
                React.FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setStatus('submitting');
            setLoginError(null);

            try {
                const response =
                    await apiFetch(
                        '/api/auth/login',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify({
                                    email:
                                        email.trim(),
                                    password,
                                }),
                        }
                    );

                if (!response.ok) {
                    const error =
                        await getApiErrorDetails(
                            response,
                            response.status ===
                                401
                                ? 'Unable to sign in with the supplied credentials.'
                                : 'Unable to sign in.'
                        );

                    setLoginError(
                        error
                    );

                    setStatus(
                        'error'
                    );

                    return;
                }

                const data =
                    (await response.json()) as AuthTokensResponse;

                if (
                    data.requiresTwoFactor
                ) {
                    if (
                        !data
                            .twoFactorChallengeToken
                    ) {
                        setLoginError({
                            status: null,
                            title:
                                'Unable to continue',
                            message:
                                'Two-factor authentication is required, but the server did not provide a login challenge.',
                        });

                        setStatus(
                            'error'
                        );

                        return;
                    }

                    setTwoFactorChallengeToken(
                        data
                            .twoFactorChallengeToken
                    );

                    setVerificationCode('');
                    setUseRecoveryCode(false);
                    setLoginStep(
                        'two-factor'
                    );
                    setStatus('idle');

                    return;
                }

                completeLogin(
                    data
                );
            } catch (error) {
                setLoginError(
                    getNetworkErrorDetails(
                        error
                    )
                );

                setStatus(
                    'error'
                );
            }
        };

    const handleTwoFactorSubmit =
        async (
            event:
                React.FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                !twoFactorChallengeToken
            ) {
                setLoginError({
                    status: null,
                    title:
                        'Login challenge expired',
                    message:
                        'Please return to the sign-in form and enter your email and password again.',
                });

                setStatus(
                    'error'
                );

                return;
            }

            setStatus('submitting');
            setLoginError(null);

            try {
                const response =
                    await apiFetch(
                        '/api/auth/two-factor',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify({
                                    challengeToken:
                                        twoFactorChallengeToken,
                                    verificationCode:
                                        verificationCode
                                            .trim(),
                                    useRecoveryCode,
                                }),
                        }
                    );

                if (!response.ok) {
                    const error =
                        await getApiErrorDetails(
                            response,
                            response.status ===
                                401
                                ? useRecoveryCode
                                    ? 'The recovery code is invalid or the login challenge has expired.'
                                    : 'The authentication code is invalid or the login challenge has expired.'
                                : 'Unable to complete two-factor authentication.'
                        );

                    setLoginError(
                        error
                    );

                    setStatus(
                        'error'
                    );

                    return;
                }

                const data =
                    (await response.json()) as AuthTokensResponse;

                completeLogin(
                    data
                );
            } catch (error) {
                setLoginError(
                    getNetworkErrorDetails(
                        error
                    )
                );

                setStatus(
                    'error'
                );
            }
        };

    function backToCredentials() {
        if (
            status === 'submitting'
        ) {
            return;
        }

        setLoginStep(
            'credentials'
        );

        setTwoFactorChallengeToken(
            null
        );

        setVerificationCode('');
        setUseRecoveryCode(false);
        setPassword('');
        setLoginError(null);
        setStatus('idle');
    }

    return (
        <div
            className="admin-modal-overlay"
            onMouseDown={
                event => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        handleClose();
                    }
                }
            }
        >
            <div
                className="admin-login-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-login-title"
            >
                <button
                    type="button"
                    className="admin-modal-close"
                    onClick={
                        handleClose
                    }
                    aria-label="Close admin login"
                    title="Close"
                    disabled={
                        status ===
                        'submitting' ||
                        status ===
                        'success'
                    }
                >
                    ×
                </button>

                <div className="admin-modal-header">
                    <h2 id="admin-login-title">
                        {loginStep ===
                            'credentials'
                            ? 'Admin Login'
                            : 'Two-Factor Authentication'}
                    </h2>

                    <p>
                        {loginStep ===
                            'credentials'
                            ? 'Sign in to manage Hope House content'
                            : useRecoveryCode
                                ? 'Enter one of your recovery codes to continue'
                                : 'Enter the code from your authenticator app'}
                    </p>
                </div>

                {loginStep ===
                    'credentials' ? (
                    <form
                        className="admin-login-form"
                        onSubmit={
                            handleCredentialSubmit
                        }
                    >
                        <div className="admin-form-group">
                            <label htmlFor="admin-email">
                                Email
                            </label>

                            <input
                                id="admin-email"
                                type="email"
                                value={
                                    email
                                }
                                onChange={
                                    event => {
                                        setEmail(
                                            event
                                                .target
                                                .value
                                        );

                                        clearError();
                                    }
                                }
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="admin-password">
                                Password
                            </label>

                            <input
                                id="admin-password"
                                type="password"
                                value={
                                    password
                                }
                                onChange={
                                    event => {
                                        setPassword(
                                            event
                                                .target
                                                .value
                                        );

                                        clearError();
                                    }
                                }
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {status ===
                            'error' &&
                            loginError && (
                                <ApiErrorState
                                    status={
                                        loginError.status
                                    }
                                    title={
                                        loginError.title
                                    }
                                    message={
                                        loginError.message
                                    }
                                    compact
                                />
                            )}

                        {status ===
                            'success' && (
                                <p className="app-message app-message-success">
                                    ✓ Logged in
                                    successfully.
                                </p>
                            )}

                        <button
                            type="submit"
                            className="admin-sign-in-btn"
                            disabled={
                                status ===
                                'submitting' ||
                                status ===
                                'success'
                            }
                        >
                            {status ===
                                'submitting'
                                ? 'Signing in...'
                                : status ===
                                    'success'
                                    ? 'Logged In'
                                    : 'Sign In'}
                        </button>

                        <button
                            type="button"
                            className="admin-cancel-btn"
                            onClick={
                                handleClose
                            }
                            disabled={
                                status ===
                                'submitting' ||
                                status ===
                                'success'
                            }
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <form
                        className="admin-login-form"
                        onSubmit={
                            handleTwoFactorSubmit
                        }
                    >
                        <div className="admin-form-group">
                            <label htmlFor="admin-two-factor-code">
                                {useRecoveryCode
                                    ? 'Recovery Code'
                                    : 'Authentication Code'}
                            </label>

                            <input
                                id="admin-two-factor-code"
                                type="text"
                                value={
                                    verificationCode
                                }
                                onChange={
                                    event => {
                                        setVerificationCode(
                                            event
                                                .target
                                                .value
                                        );

                                        clearError();
                                    }
                                }
                                autoComplete="one-time-code"
                                inputMode={
                                    useRecoveryCode
                                        ? 'text'
                                        : 'numeric'
                                }
                                placeholder={
                                    useRecoveryCode
                                        ? 'Enter recovery code'
                                        : '000000'
                                }
                                required
                                autoFocus
                            />
                        </div>

                        {status ===
                            'error' &&
                            loginError && (
                                <ApiErrorState
                                    status={
                                        loginError.status
                                    }
                                    title={
                                        loginError.title
                                    }
                                    message={
                                        loginError.message
                                    }
                                    compact
                                />
                            )}

                        {status ===
                            'success' && (
                                <p className="app-message app-message-success">
                                    ✓ Logged in
                                    successfully.
                                </p>
                            )}

                        <button
                            type="submit"
                            className="admin-sign-in-btn"
                            disabled={
                                status ===
                                'submitting' ||
                                status ===
                                'success' ||
                                !verificationCode
                                    .trim()
                            }
                        >
                            {status ===
                                'submitting'
                                ? 'Verifying...'
                                : status ===
                                    'success'
                                    ? 'Verified'
                                    : 'Verify & Sign In'}
                        </button>

                        <button
                            type="button"
                            className="admin-cancel-btn"
                            onClick={() => {
                                setUseRecoveryCode(
                                    current =>
                                        !current
                                );

                                setVerificationCode(
                                    ''
                                );

                                setLoginError(
                                    null
                                );

                                setStatus(
                                    'idle'
                                );
                            }}
                            disabled={
                                status ===
                                'submitting' ||
                                status ===
                                'success'
                            }
                        >
                            {useRecoveryCode
                                ? 'Use Authenticator Code'
                                : 'Use Recovery Code'}
                        </button>

                        <button
                            type="button"
                            className="admin-cancel-btn"
                            onClick={
                                backToCredentials
                            }
                            disabled={
                                status ===
                                'submitting' ||
                                status ===
                                'success'
                            }
                        >
                            Back to Sign In
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}