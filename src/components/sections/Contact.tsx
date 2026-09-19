import { useState } from 'react';
import { useChurchInfo } from '../../hooks/useChurchInfo';
import { useChurchServices, formatTimeRange } from '../../hooks/useChurchServices';

const CONTACT_REASONS = [
    { value: 'Membership', label: 'I want to become a member of your church' },
    { value: 'PrayerRequest', label: 'I want to make a special prayer request' },
    { value: 'Other', label: 'Other' }
];

export default function Contact() {
    const { churchInfo } = useChurchInfo();

    // ✅ 1. Fetch services from the DB to get dynamic service times
    const { services } = useChurchServices(true);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phoneNumber: '', reason: '', message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ✅ 2. Find the main Sunday and Wednesday services dynamically by name
    const sundayService = services?.find(s => s.name === 'Worship Service');
    const wednesdayService = services?.find(s => s.name === 'Fasting and Prayer Day');

    const handleChange = (field: keyof typeof formData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            setFormData({ ...formData, [field]: e.target.value });
        };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage(null);
        try {
            const response = await fetch('/api/contact', {
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
                setErrorMessage(await parseErrorMessage(response));
            }
        } catch {
            setStatus('error');
            setErrorMessage('Could not reach the server. Please check your connection and try again.');
        }
    };

    const parseErrorMessage = async (response: Response): Promise<string> => {
        try {
            const data = await response.json();
            if (data?.errors && typeof data.errors === 'object') {
                const messages = Object.values(data.errors).flat().filter((m): m is string => typeof m === 'string');
                if (messages.length > 0) return messages.join(' ');
            }
            if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
            if (typeof data?.title === 'string' && data.title.trim()) return data.title;
            return `Something went wrong (${response.status}). Please try again.`;
        } catch {
            return `Something went wrong (${response.status}). Please try again.`;
        }
    };

    const phones = churchInfo?.contactMethods.filter(m => m.type === 'Phone') ?? [];
    const emails = churchInfo?.contactMethods.filter(m => m.type === 'Email') ?? [];

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
                                <div>
                                    <h3>Address</h3>
                                    <p>
                                        {churchInfo?.addressLine1}
                                        {churchInfo?.addressLine2 && <>, {churchInfo.addressLine2}</>}
                                        <br />
                                        {churchInfo?.city}
                                        {churchInfo?.postCode && ` ${churchInfo.postCode}`}
                                    </p>
                                </div>
                            </div>
                            <div className="contact-item-modern">
                                <div className="contact-icon-modern">📞</div>
                                <div>
                                    <h3>Contact</h3>
                                    <p>
                                        {phones.map((p, i) => (
                                            <span key={p.id}>
                                                {p.label ? `${p.label}: ` : 'Phone: '}{p.value}{i < phones.length - 1 && <br />}
                                            </span>
                                        ))}
                                        {phones.length > 0 && emails.length > 0 && <br />}
                                        {emails.map((e, i) => (
                                            <span key={e.id}>
                                                {e.label ? `${e.label}: ` : 'Email: '}{e.value}{i < emails.length - 1 && <br />}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            </div>

                            {/* ✅ 3. Dynamic Service Times with Safe Fallbacks */}
                            <div className="contact-item-modern">
                                <div className="contact-icon-modern">🕐</div>
                                <div>
                                    <h3>Service Times</h3>
                                    <p>
                                        {sundayService ? (
                                            <>Sunday: {formatTimeRange(sundayService.startTime, sundayService.endTime)}</>
                                        ) : (
                                            <>Sunday: 9:00 AM - 12:00 PM</> // Fallback if DB is empty
                                        )}
                                        <br />
                                        {wednesdayService ? (
                                            <>Wednesday: {formatTimeRange(wednesdayService.startTime, wednesdayService.endTime)}</>
                                        ) : (
                                            <>Wednesday: 7:00 PM - 7:30 PM</> // Fallback if DB is empty
                                        )}
                                    </p>
                                </div>
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
                                    <input type="text" placeholder="First Name" className="form-input-modern" value={formData.firstName} onChange={handleChange('firstName')} required />
                                    <input type="text" placeholder="Last Name" className="form-input-modern" value={formData.lastName} onChange={handleChange('lastName')} required />
                                </div>
                                <div className="form-row">
                                    <input type="email" placeholder="Your Email" className="form-input-modern" value={formData.email} onChange={handleChange('email')} required />
                                    <input type="tel" placeholder="Phone Number (Optional)" className="form-input-modern" value={formData.phoneNumber} onChange={handleChange('phoneNumber')} />
                                </div>
                                <select className="form-input-modern" value={formData.reason} onChange={handleChange('reason')} required>
                                    <option value="" disabled>Reason for contacting us</option>
                                    {CONTACT_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                <textarea placeholder="Your Message" className="form-textarea-modern" rows={5} value={formData.message} onChange={handleChange('message')} required></textarea>
                                {status === 'error' && <p className="error-msg">{errorMessage}</p>}
                                <button type="submit" className="btn-primary btn-full" disabled={status === 'submitting'}>
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