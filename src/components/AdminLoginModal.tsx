import { apiFetch } from '@/api/api';
import { useState } from 'react';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage(null);

        try {
            const res = await apiFetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                setStatus('error');
                setErrorMessage(res.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.');
                return;
            }

            const data = await res.json();
            // Stored for future admin pages to read — no admin dashboard
            // exists yet, so this just persists the session for later.
            localStorage.setItem('adminAccessToken', data.accessToken);
            localStorage.setItem('adminRefreshToken', data.refreshToken);
            localStorage.setItem('adminRole', data.role);

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setEmail('');
                setPassword('');
                onClose();
            }, 1500);
        } catch {
            setStatus('error');
            setErrorMessage('Could not reach the server. Please check your connection.');
        }
    };

    return (
        <div className="prayer-modal-overlay" onClick={onClose}>
            <div className="prayer-modal-content" onClick={(e) => e.stopPropagation()}>
                {status === 'success' ? (
                    <div className="prayer-success">
                        <div className="success-icon">✅</div>
                        <h3>Logged In</h3>
                        <p>Welcome back.</p>
                    </div>
                ) : (
                    <>
                        <div className="prayer-modal-header">
                            <h3>Admin Login</h3>
                            <button className="close-btn" onClick={onClose}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="prayer-form-fields">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="admin@rccghopehouse.org.uk"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {status === 'error' && (
                                <p className="error-msg">{errorMessage}</p>
                            )}

                            <button
                                type="submit"
                                className="btn-primary btn-full"
                                disabled={status === 'submitting'}
                            >
                                {status === 'submitting' ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
