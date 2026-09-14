import { useState } from 'react';

const CONTACT_REASONS = [
    { value: 'Membership', label: 'I want to become a member of your church' },
    { value: 'PrayerRequest', label: 'I want to make a special prayer request' },
    { value: 'Other', label: 'Other' }
];

export default function Contact() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        reason: '',
        message: ''
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleChange = (field: keyof typeof formData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            setFormData({ ...formData, [field]: e.target.value });
        };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const response = await fetch('/api/contact-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', reason: '', message: '' });
                setTimeout(() => setStatus('idle'), 4000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
            console.error('Failed to submit contact message:', error);
        }
    };

    return (
        <section id="contact" className="section bg-gray-50">
            <div className="container">
                <div className="contact-grid-modern">
                    <div className="contact-info-modern">
                        <div className="section-header-left">
                            <span className="section-tag">GET IN TOUCH</span>
                            <h2 className="section-title">Visit Us</h2>
                            <div className="title-divider-left"></div>
                        </div>
                        <p className="contact-description">We'd love to meet you in person. Join us this Sunday and experience the warmth of our church family.</p>
                        <div className="contact-items-modern">
                            <div className="contact-item-modern">
                                <div className="contact-icon-modern">📍</div>
                                <div><h3>Address</h3><p>123 Hope Street, Grace Avenue<br />London, UK SW1A 1AA</p></div>
                            </div>
                            <div className="contact-item-modern">
                                <div className="contact-icon-modern">📞</div>
                                <div><h3>Contact</h3><p>Phone: +44 20 1234 5678<br />Email: info@rccghopehouse.org.uk</p></div>
                            </div>
                            <div className="contact-item-modern">
                                <div className="contact-icon-modern">🕐</div>
                                <div><h3>Service Times</h3><p>Sunday: 9:00 AM - 12:00 PM<br />Wednesday: 6:00 PM</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="contact-form-modern">
                        <h3>Send Us a Message</h3>

                        {status === 'success' ? (
                            <div className="contact-success">
                                <p>✅ Thank you! Your message has been sent. We'll be in touch soon.</p>
                            </div>
                        ) : (
                            <form className="contact-form-fields" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        className="form-input-modern"
                                        value={formData.firstName}
                                        onChange={handleChange('firstName')}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        className="form-input-modern"
                                        value={formData.lastName}
                                        onChange={handleChange('lastName')}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="email"
                                        placeholder="Your Email"
                                        className="form-input-modern"
                                        value={formData.email}
                                        onChange={handleChange('email')}
                                        required
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (Optional)"
                                        className="form-input-modern"
                                        value={formData.phoneNumber}
                                        onChange={handleChange('phoneNumber')}
                                    />
                                </div>
                                <select
                                    className="form-input-modern"
                                    value={formData.reason}
                                    onChange={handleChange('reason')}
                                    required
                                >
                                    <option value="" disabled>Reason for contacting us</option>
                                    {CONTACT_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                <textarea
                                    placeholder="Your Message"
                                    className="form-textarea-modern"
                                    rows={5}
                                    value={formData.message}
                                    onChange={handleChange('message')}
                                    required
                                ></textarea>

                                {status === 'error' && (
                                    <p className="error-msg">Something went wrong. Please try again.</p>
                                )}

                                <button
                                    type="submit"
                                    className="btn-primary btn-full"
                                    disabled={status === 'submitting'}
                                >
                                    {status === 'submitting' ? 'Sending...' : 'Send Message'} <span>→</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}