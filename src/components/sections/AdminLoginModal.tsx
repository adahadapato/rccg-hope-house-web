import { apiFetch } from '@/api/api';
import {
    useEffect,
    useState,
} from 'react';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AdminLoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    role: string;
    userName: string;
    name: string;
    email: string;
}

export default function AdminLoginModal({
    isOpen,
    onClose,
}: AdminLoginModalProps) {
    const [email, setEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [status, setStatus] = useState<
        | 'idle'
        | 'submitting'
        | 'success'
        | 'error'
    >('idle');

    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (event.key === 'Escape') {
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
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setStatus('submitting');
        setErrorMessage(null);

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
                        body: JSON.stringify({
                            email,
                            password,
                        }),
                    }
                );

            if (!response.ok) {
                setStatus('error');

                setErrorMessage(
                    response.status === 401
                        ? 'Invalid email or password.'
                        : 'Something went wrong. Please try again.'
                );

                return;
            }

            const data =
                (await response.json()) as AdminLoginResponse;

            localStorage.setItem(
                'adminAccessToken',
                data.accessToken
            );

            localStorage.setItem(
                'adminRefreshToken',
                data.refreshToken
            );

            localStorage.setItem(
                'adminRole',
                data.role
            );

            localStorage.setItem(
                'adminName',
                data.name
            );

            localStorage.setItem(
                'adminEmail',
                data.email
            );

            setStatus('success');

            window.location.assign(
                '/admin'
            );
        } catch {
            setStatus('error');

            setErrorMessage(
                'Could not reach the server. Please check your connection.'
            );
        }
    };

    return (
        <div
            className="admin-modal-overlay"
            onMouseDown={event => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
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
                    onClick={onClose}
                    aria-label="Close admin login"
                    title="Close"
                >
                    ×
                </button>

                <div className="admin-modal-header">
                    <h2 id="admin-login-title">
                        Admin Login
                    </h2>

                    <p>
                        Sign in to manage Hope House
                        content
                    </p>
                </div>

                <form
                    className="admin-login-form"
                    onSubmit={handleSubmit}
                >
                    <div className="admin-form-group">
                        <label htmlFor="admin-email">
                            Email
                        </label>

                        <input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={event =>
                                setEmail(
                                    event.target
                                        .value
                                )
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
                            value={password}
                            onChange={event =>
                                setPassword(
                                    event.target
                                        .value
                                )
                            }
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {status === 'error' &&
                        errorMessage && (
                            <p className="app-message app-message-error">
                                ✕{' '}
                                {
                                    errorMessage
                                }
                            </p>
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
                        onClick={onClose}
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
            </div>
        </div>
    );
}