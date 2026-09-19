import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/api';
import { useGivingTypes } from '../../hooks/useGivingTypes';

interface GiveOnlineModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SubmitStatus =
    | 'idle'
    | 'submitting'
    | 'success'
    | 'error';

export default function GiveOnlineModal({
    isOpen,
    onClose,
}: GiveOnlineModalProps) {
    const {
        givingTypes,
        loading: givingTypesLoading,
        error: givingTypesError,
    } = useGivingTypes();

    const [givingTypeId, setGivingTypeId] =
        useState('');

    const [amount, setAmount] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [reference, setReference] = useState('');
    const [otherGivingType, setOtherGivingType] =
        useState('');
    const [isAnonymous, setIsAnonymous] =
        useState(false);

    const [status, setStatus] =
        useState<SubmitStatus>('idle');

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const selectedGivingType =
        givingTypes.find(
            (type) => type.id === givingTypeId
        );

    const isOther =
        selectedGivingType?.name === 'Other';


    /* =========================================
       ESCAPE KEY
       ========================================= */

    useEffect(() => {
        if (!isOpen) return;

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


    /* =========================================
       QUICK AMOUNT
       ========================================= */

    const handleQuickAmount = (
        selectedAmount: number
    ) => {
        setAmount(selectedAmount.toString());
        setErrorMessage(null);
        setStatus('idle');
    };


    /* =========================================
       API ERROR PARSER
       ========================================= */

    const parseErrorMessage = async (
        response: Response
    ): Promise<string> => {
        try {
            const data = await response.json();

            if (
                data?.errors &&
                typeof data.errors === 'object'
            ) {
                const messages = Object.values(
                    data.errors
                )
                    .flat()
                    .filter(
                        (message): message is string =>
                            typeof message === 'string'
                    );

                if (messages.length > 0) {
                    return messages.join(' ');
                }
            }

            if (
                typeof data?.detail === 'string' &&
                data.detail.trim()
            ) {
                return data.detail;
            }

            if (
                typeof data?.title === 'string' &&
                data.title.trim()
            ) {
                return data.title;
            }

            return `Something went wrong (${response.status}). Please try again.`;
        } catch {
            return `Something went wrong (${response.status}). Please try again.`;
        }
    };


    /* =========================================
       FORM SUBMIT
       ========================================= */

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setErrorMessage(null);
        setStatus('idle');

        const numericAmount = Number(amount);

        if (!givingTypeId) {
            setStatus('error');
            setErrorMessage(
                'Please select a giving type.'
            );
            return;
        }

        if (
            !numericAmount ||
            numericAmount <= 0
        ) {
            setStatus('error');
            setErrorMessage(
                'Please enter a valid amount.'
            );
            return;
        }

        if (
            isOther &&
            !otherGivingType.trim()
        ) {
            setStatus('error');
            setErrorMessage(
                'Please tell us what you are giving towards.'
            );
            return;
        }

        if (
            !isAnonymous &&
            !fullName.trim()
        ) {
            setStatus('error');
            setErrorMessage(
                'Please enter your full name.'
            );
            return;
        }

        if (
            !isAnonymous &&
            !email.trim()
        ) {
            setStatus('error');
            setErrorMessage(
                'Please enter your email address.'
            );
            return;
        }

        /*
         * If "Other" is selected, include the
         * description entered by the giver in the
         * message/reference sent to the backend.
         */
        const messageParts: string[] = [];

        if (isOther && otherGivingType.trim()) {
            messageParts.push(
                `Giving purpose: ${otherGivingType.trim()}`
            );
        }

        if (reference.trim()) {
            messageParts.push(reference.trim());
        }

        const messageReference =
            messageParts.length > 0
                ? messageParts.join(' | ')
                : null;

        const requestBody = {
            givingTypeId,
            amount: numericAmount,
            isAnonymous,
            fullName: isAnonymous
                ? null
                : fullName.trim(),
            email: isAnonymous
                ? null
                : email.trim(),
            messageReference,
        };

        try {
            setStatus('submitting');

            const response = await apiFetch(
                '/api/offerings',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify(
                        requestBody
                    ),
                }
            );

            if (!response.ok) {
                setStatus('error');
                setErrorMessage(
                    await parseErrorMessage(
                        response
                    )
                );
                return;
            }

            /*
             * The offering has now been recorded
             * successfully in Pending status.
             *
             * A payment provider will later be
             * integrated here to continue to the
             * secure checkout/payment session.
             */
            await response.json();

            setStatus('success');

            setErrorMessage(
                'Your giving details have been recorded. Secure online payment will be available soon.'
            );
        } catch {
            setStatus('error');

            setErrorMessage(
                'Could not reach the server. Please check your connection and try again.'
            );
        }
    };


    return (
        <div
            className="give-modal-overlay"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    status !== 'submitting'
                ) {
                    onClose();
                }
            }}
        >
            <div
                className="give-online-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="give-online-title"
            >

                {/* CLOSE */}

                <button
                    type="button"
                    className="give-modal-close"
                    onClick={onClose}
                    aria-label="Close Give Online"
                    title="Close"
                    disabled={
                        status === 'submitting'
                    }
                >
                    ×
                </button>


                {/* HEADER */}

                <div className="give-modal-header">

                    <div className="give-icon">
                        ♥
                    </div>

                    <h2 id="give-online-title">
                        Give Online
                    </h2>

                    <p className="give-scripture">
                        “God loves a cheerful giver.”
                    </p>

                    <p className="give-scripture-reference">
                        2 Corinthians 9:7
                    </p>

                </div>


                {/* FORM */}

                <form
                    className="give-online-form"
                    onSubmit={handleSubmit}
                >

                    {/* GIVING TYPE */}

                    <div className="give-form-group">

                        <label htmlFor="giving-type">
                            Giving Type
                        </label>

                        <select
                            id="giving-type"
                            value={givingTypeId}
                            onChange={(event) => {
                                setGivingTypeId(
                                    event.target.value
                                );

                                setOtherGivingType('');
                                setErrorMessage(null);
                                setStatus('idle');
                            }}
                            disabled={
                                givingTypesLoading ||
                                status === 'submitting'
                            }
                            required
                        >
                            <option value="">
                                {givingTypesLoading
                                    ? 'Loading giving types...'
                                    : 'Select giving type'}
                            </option>

                            {givingTypes.map(
                                (type) => (
                                    <option
                                        key={type.id}
                                        value={type.id}
                                    >
                                        {type.name}
                                    </option>
                                )
                            )}

                        </select>

                    </div>


                    {/* GIVING TYPE ERROR */}

                    {givingTypesError && (
                        <p className="app-message app-message-error">
                            ✕ {givingTypesError}
                        </p>
                    )}


                    {/* OTHER */}

                    {isOther && (

                        <div className="give-form-group">

                            <label htmlFor="other-giving-type">
                                What are you giving towards?
                            </label>

                            <input
                                id="other-giving-type"
                                type="text"
                                value={otherGivingType}
                                onChange={(event) => {
                                    setOtherGivingType(
                                        event.target.value
                                    );

                                    setErrorMessage(null);
                                }}
                                placeholder="Enter giving purpose"
                                disabled={
                                    status === 'submitting'
                                }
                                required
                            />

                        </div>

                    )}


                    {/* AMOUNT */}

                    <div className="give-form-group">

                        <label htmlFor="giving-amount">
                            Amount
                        </label>

                        <div className="give-amount-input">

                            <span className="currency-symbol">
                                £
                            </span>

                            <input
                                id="giving-amount"
                                type="number"
                                min="1"
                                step="0.01"
                                inputMode="decimal"
                                value={amount}
                                onChange={(event) => {
                                    setAmount(
                                        event.target.value
                                    );

                                    setErrorMessage(null);
                                    setStatus('idle');
                                }}
                                placeholder="0.00"
                                disabled={
                                    status === 'submitting'
                                }
                                required
                            />

                        </div>

                    </div>


                    {/* QUICK AMOUNTS */}

                    <div className="quick-amounts">

                        {[10, 20, 50, 100].map(
                            (quickAmount) => (

                                <button
                                    key={quickAmount}
                                    type="button"
                                    className={
                                        Number(amount) ===
                                            quickAmount
                                            ? 'quick-amount active'
                                            : 'quick-amount'
                                    }
                                    onClick={() =>
                                        handleQuickAmount(
                                            quickAmount
                                        )
                                    }
                                    disabled={
                                        status ===
                                        'submitting'
                                    }
                                >
                                    £{quickAmount}
                                </button>

                            )
                        )}

                    </div>


                    {/* ANONYMOUS */}

                    <label className="anonymous-option">

                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(event) => {
                                setIsAnonymous(
                                    event.target.checked
                                );

                                setErrorMessage(null);
                                setStatus('idle');
                            }}
                            disabled={
                                status === 'submitting'
                            }
                        />

                        <span>
                            I would like to give anonymously
                        </span>

                    </label>


                    {/* PERSONAL DETAILS */}

                    {!isAnonymous && (
                        <div className="giver-details">

                            <div className="give-form-group">

                                <label htmlFor="giver-name">
                                    Full Name
                                </label>

                                <input
                                    id="giver-name"
                                    type="text"
                                    value={fullName}
                                    onChange={(event) => {
                                        setFullName(
                                            event.target.value
                                        );

                                        setErrorMessage(null);
                                    }}
                                    placeholder="Your full name"
                                    autoComplete="name"
                                    disabled={
                                        status ===
                                        'submitting'
                                    }
                                    required
                                />

                            </div>


                            <div className="give-form-group">

                                <label htmlFor="giver-email">
                                    Email
                                </label>

                                <input
                                    id="giver-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(
                                            event.target.value
                                        );

                                        setErrorMessage(null);
                                    }}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    disabled={
                                        status ===
                                        'submitting'
                                    }
                                    required
                                />

                            </div>

                        </div>
                    )}


                    {/* REFERENCE */}

                    <div className="give-form-group">

                        <label htmlFor="giving-reference">
                            Message / Reference
                            <span className="optional-text">
                                {' '}(optional)
                            </span>
                        </label>

                        <textarea
                            id="giving-reference"
                            value={reference}
                            onChange={(event) => {
                                setReference(
                                    event.target.value
                                );

                                setErrorMessage(null);
                            }}
                            placeholder="Add a short message or reference"
                            rows={3}
                            disabled={
                                status === 'submitting'
                            }
                        />

                    </div>


                    {/* SUCCESS / ERROR MESSAGE */}

                    {errorMessage && (
                        <p
                            className={
                                status === 'success'
                                    ? 'app-message app-message-success'
                                    : 'app-message app-message-error'
                            }
                        >
                            {status === 'success'
                                ? '✓ '
                                : '✕ '}
                            {errorMessage}
                        </p>
                    )}


                    {/* PAYMENT */}

                    <button
                        type="submit"
                        className="give-payment-btn"
                        disabled={
                            status === 'submitting' ||
                            givingTypesLoading ||
                            Boolean(givingTypesError)
                        }
                    >
                        {status === 'submitting'
                            ? 'Please wait...'
                            : status === 'success'
                                ? 'Giving Details Recorded'
                                : 'Continue to Secure Payment'}
                    </button>


                    <div className="give-security-note">

                        <span aria-hidden="true">
                            🔒
                        </span>

                        <span>
                            Secure online giving
                        </span>

                    </div>


                    {/* CANCEL */}

                    <button
                        type="button"
                        className="give-cancel-btn"
                        onClick={onClose}
                        disabled={
                            status === 'submitting'
                        }
                    >
                        {status === 'success'
                            ? 'Close'
                            : 'Cancel'}
                    </button>

                </form>

            </div>
        </div>
    );
}