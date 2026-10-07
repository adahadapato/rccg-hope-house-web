import {
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';

import { apiFetch } from '@/api/api';

import {
    useChurchInfo,
    type ChurchContactMethodType,
} from '../../hooks/useChurchInfo';

const CONTACT_REASONS = [
    {
        value: 'Membership',
        label:
            'I want to become a member of your church',
    },
    {
        value: 'PrayerRequest',
        label:
            'I want to make a special prayer request',
    },
    {
        value: 'Other',
        label: 'Other',
    },
];

export default function Contact() {
    const { churchInfo } =
        useChurchInfo();

    const [
        formData,
        setFormData,
    ] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        reason: '',
        message: '',
    });

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
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(
        null
    );

    /**
     * Gets all configured contact methods
     * of a particular type.
     */
    const getContactMethods = (
        type: ChurchContactMethodType
    ) =>
        churchInfo?.contactMethods
            .filter(
                method =>
                    method.type === type
            )
            .sort(
                (left, right) =>
                    left.displayOrder -
                    right.displayOrder
            ) ?? [];

    const phones =
        getContactMethods('Phone');

    const emails =
        getContactMethods('Email');

    const websites =
        getContactMethods('Website');

    const whatsappGroups =
        getContactMethods(
            'WhatsAppGroup'
        );

    const facebookLinks =
        getContactMethods('Facebook');

    const instagramLinks =
        getContactMethods('Instagram');

    const youtubeLinks =
        getContactMethods('YouTube');

    const socialLinks = [
        ...facebookLinks,
        ...instagramLinks,
        ...youtubeLinks,
    ].sort(
        (left, right) =>
            left.displayOrder -
            right.displayOrder
    );

    const handleChange =
        (
            field:
                keyof typeof formData
        ) =>
            (
                event: ChangeEvent<
                    | HTMLInputElement
                    | HTMLTextAreaElement
                    | HTMLSelectElement
                >
            ) => {
                setFormData(
                    current => ({
                        ...current,
                        [field]:
                            event.target
                                .value,
                    })
                );
            };

    const handleSubmit = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        setStatus('submitting');
        setErrorMessage(null);

        try {
            const response =
                await apiFetch(
                    '/api/contact',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify(
                                formData
                            ),
                    }
                );

            if (response.ok) {
                setStatus('success');

                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phoneNumber: '',
                    reason: '',
                    message: '',
                });

                window.setTimeout(
                    () =>
                        setStatus(
                            'idle'
                        ),
                    4000
                );

                return;
            }

            setStatus('error');

            setErrorMessage(
                await parseErrorMessage(
                    response
                )
            );
        } catch {
            setStatus('error');

            setErrorMessage(
                'Could not reach the server. Please check your connection and try again.'
            );
        }
    };

    const parseErrorMessage =
        async (
            response: Response
        ): Promise<string> => {
            try {
                const data =
                    await response.json();

                if (
                    data?.errors &&
                    typeof data.errors ===
                    'object'
                ) {
                    const messages =
                        Object.values(
                            data.errors
                        )
                            .flat()
                            .filter(
                                (
                                    message
                                ): message is string =>
                                    typeof message ===
                                    'string'
                            );

                    if (
                        messages.length >
                        0
                    ) {
                        return messages.join(
                            ' '
                        );
                    }
                }

                if (
                    typeof data?.detail ===
                    'string' &&
                    data.detail.trim()
                ) {
                    return data.detail;
                }

                if (
                    typeof data?.title ===
                    'string' &&
                    data.title.trim()
                ) {
                    return data.title;
                }

                return `Something went wrong (${response.status}). Please try again.`;
            } catch {
                return `Something went wrong (${response.status}). Please try again.`;
            }
        };

    return (
        <section
            id="contact"
            className="section bg-gray-50"
        >
            <div className="container">
                <div className="contact-grid-modern">

                    <div className="contact-info-modern">
                        <div className="section-header-left">
                            <span className="section-tag">
                                GET IN TOUCH
                            </span>

                            <h2 className="section-title">
                                Visit Us
                            </h2>

                            <div className="title-divider-left" />
                        </div>

                        <p className="contact-description">
                            We'd love to hear from you.
                            Get in touch with our church
                            family using any of the
                            contact options below.
                        </p>

                        <div className="contact-items-modern">

                            <div className="contact-item-modern">
                                <div className="contact-icon-modern">
                                    📍
                                </div>

                                <div>
                                    <h3>
                                        Address
                                    </h3>

                                    <p>
                                        {
                                            churchInfo
                                                ?.addressLine1
                                        }

                                        {churchInfo
                                            ?.addressLine2 && (
                                                <>
                                                    <br />
                                                    {
                                                        churchInfo
                                                            .addressLine2
                                                    }
                                                </>
                                            )}

                                        <br />

                                        {
                                            churchInfo
                                                ?.city
                                        }

                                        {churchInfo
                                            ?.postCode &&
                                            ` ${churchInfo.postCode}`}

                                        {churchInfo
                                            ?.country && (
                                                <>
                                                    <br />
                                                    {
                                                        churchInfo
                                                            .country
                                                    }
                                                </>
                                            )}
                                    </p>
                                </div>
                            </div>

                            {(phones.length >
                                0 ||
                                emails.length >
                                0) && (
                                    <div className="contact-item-modern">
                                        <div className="contact-icon-modern">
                                            📞
                                        </div>

                                        <div>
                                            <h3>
                                                Contact
                                            </h3>

                                            <div className="public-contact-links">
                                                {phones.map(
                                                    phone => (
                                                        <a
                                                            key={
                                                                phone.id
                                                            }
                                                            href={`tel:${phone.value.replace(
                                                                /\s+/g,
                                                                ''
                                                            )}`}
                                                        >
                                                            <span>
                                                                {phone.label ??
                                                                    'Phone'}
                                                            </span>

                                                            <strong>
                                                                {
                                                                    phone.value
                                                                }
                                                            </strong>
                                                        </a>
                                                    )
                                                )}

                                                {emails.map(
                                                    email => (
                                                        <a
                                                            key={
                                                                email.id
                                                            }
                                                            href={`mailto:${email.value}`}
                                                        >
                                                            <span>
                                                                {email.label ??
                                                                    'Email'}
                                                            </span>

                                                            <strong>
                                                                {
                                                                    email.value
                                                                }
                                                            </strong>
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {websites.length >
                                0 && (
                                    <div className="contact-item-modern">
                                        <div className="contact-icon-modern">
                                            🌐
                                        </div>

                                        <div>
                                            <h3>
                                                Website
                                            </h3>

                                            <div className="public-contact-links">
                                                {websites.map(
                                                    website => (
                                                        <a
                                                            key={
                                                                website.id
                                                            }
                                                            href={
                                                                website.value
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <span>
                                                                {website.label ??
                                                                    'Official Website'}
                                                            </span>

                                                            <strong>
                                                                {
                                                                    website.value
                                                                }
                                                            </strong>
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {whatsappGroups.length >
                                0 && (
                                    <div className="contact-item-modern contact-whatsapp-item">
                                        <div className="contact-icon-modern contact-whatsapp-icon">
                                            W
                                        </div>

                                        <div className="contact-whatsapp-content">
                                            <h3>
                                                WhatsApp
                                                Community
                                            </h3>

                                            <p>
                                                Stay connected
                                                with our church
                                                family and
                                                receive community
                                                updates.
                                            </p>

                                            <div className="contact-whatsapp-buttons">
                                                {whatsappGroups.map(
                                                    whatsapp => (
                                                        <a
                                                            key={
                                                                whatsapp.id
                                                            }
                                                            href={
                                                                whatsapp.value
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="contact-whatsapp-button"
                                                        >
                                                            <span className="contact-whatsapp-logo">
                                                                W
                                                            </span>

                                                            <span>
                                                                {whatsapp.label ??
                                                                    'Join Our WhatsApp Group'}
                                                            </span>
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {socialLinks.length >
                                0 && (
                                    <div className="contact-item-modern">
                                        <div className="contact-icon-modern">
                                            ↗
                                        </div>

                                        <div>
                                            <h3>
                                                Follow Us
                                            </h3>

                                            <div className="contact-social-links">
                                                {socialLinks.map(
                                                    social => (
                                                        <a
                                                            key={
                                                                social.id
                                                            }
                                                            href={
                                                                social.value
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {social.label ??
                                                                social.type}
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                        </div>
                    </div>

                    <div className="contact-form-modern">
                        <h3>
                            Send Us a Message
                        </h3>

                        {status ===
                            'success' ? (
                            <div className="app-message app-message-success">
                                ✓ Thank you! Your
                                message has been
                                sent. We'll be in
                                touch soon.
                            </div>
                        ) : (
                            <form
                                className="contact-form-fields"
                                onSubmit={
                                    handleSubmit
                                }
                            >
                                <div className="form-row">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        className="form-input-modern"
                                        value={
                                            formData.firstName
                                        }
                                        onChange={handleChange(
                                            'firstName'
                                        )}
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        className="form-input-modern"
                                        value={
                                            formData.lastName
                                        }
                                        onChange={handleChange(
                                            'lastName'
                                        )}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <input
                                        type="email"
                                        placeholder="Your Email"
                                        className="form-input-modern"
                                        value={
                                            formData.email
                                        }
                                        onChange={handleChange(
                                            'email'
                                        )}
                                        required
                                    />

                                    <input
                                        type="tel"
                                        placeholder="Phone Number (Optional)"
                                        className="form-input-modern"
                                        value={
                                            formData.phoneNumber
                                        }
                                        onChange={handleChange(
                                            'phoneNumber'
                                        )}
                                    />
                                </div>

                                <select
                                    className="form-input-modern"
                                    value={
                                        formData.reason
                                    }
                                    onChange={handleChange(
                                        'reason'
                                    )}
                                    required
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Reason for
                                        contacting us
                                    </option>

                                    {CONTACT_REASONS.map(
                                        reason => (
                                            <option
                                                key={
                                                    reason.value
                                                }
                                                value={
                                                    reason.value
                                                }
                                            >
                                                {
                                                    reason.label
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <textarea
                                    placeholder="Your Message"
                                    className="form-textarea-modern"
                                    rows={5}
                                    value={
                                        formData.message
                                    }
                                    onChange={handleChange(
                                        'message'
                                    )}
                                    required
                                />

                                {status ===
                                    'error' &&
                                    errorMessage && (
                                        <p className="app-message app-message-error">
                                            ✕{' '}
                                            {
                                                errorMessage
                                            }
                                        </p>
                                    )}

                                <button
                                    type="submit"
                                    className="btn-primary btn-full"
                                    disabled={
                                        status ===
                                        'submitting'
                                    }
                                >
                                    {status ===
                                        'submitting'
                                        ? 'Sending...'
                                        : 'Send Message'}

                                    {status !==
                                        'submitting' && (
                                            <span>
                                                →
                                            </span>
                                        )}
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}