import { useState } from 'react';

interface PrayerFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrayerForm({ isOpen, onClose }: PrayerFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        isAnonymous: false
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const payload = {
                content: formData.message,
                isAnonymous: formData.isAnonymous,
                requesterName: formData.isAnonymous ? null : formData.name,
                requesterEmail: formData.isAnonymous ? null : (formData.email || null),
                requesterPhone: formData.isAnonymous ? null : (formData.phone || null)
            };

            const response = await fetch('/api/prayer-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '', message: '', isAnonymous: false });
                setTimeout(onClose, 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
            console.error('Failed to submit prayer request:', error);
        }
    };

    return (
        <div className="prayer-modal-overlay" onClick={onClose}>
            <div className="prayer-modal-content" onClick={(e) => e.stopPropagation()}>

                {status === 'success' ? (
                    <div className="prayer-success">
                        <div className="success-icon">🙏</div>
                        <h3>Prayer Request Received!</h3>
                        <p>We have received your request. Our prayer team will be lifting this up for you shortly.</p>
                        <button className="btn-primary btn-small" onClick={onClose}>Close</button>
                    </div>
                ) : (
                    <>
                        <div className="prayer-modal-header">
                            <h3>Submit a Prayer Request</h3>
                            <button className="close-btn" onClick={onClose}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="prayer-form-fields">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={formData.isAnonymous}
                                    required={!formData.isAnonymous}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email (Optional)</label>
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={formData.isAnonymous}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone (Optional)</label>
                                <input
                                    type="tel"
                                    placeholder="+44 9999999999"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={formData.isAnonymous}
                                />
                            </div>

                            <div className="form-group">
                                <label>Prayer Request *</label>
                                <textarea
                                    placeholder="How can we pray for you?"
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="anonymous"
                                    checked={formData.isAnonymous}
                                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                                />
                                <label htmlFor="anonymous">Submit Anonymously</label>
                            </div>

                            {status === 'error' && (
                                <p className="error-msg">Something went wrong. Please try again.</p>
                            )}

                            <button
                                type="submit"
                                className="btn-primary btn-full"
                                disabled={status === 'submitting'}
                            >
                                {status === 'submitting' ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}