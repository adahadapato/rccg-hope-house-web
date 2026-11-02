import {
    useEffect,
    useState,
    type FormEvent,
} from 'react';

import {
    getBirthdayWishes,
    submitBirthdayWish,
    WISH_MESSAGE_MAX_LENGTH,
    WISH_NAME_MAX_LENGTH,
    type BirthdayWish,
} from '@/hooks/useBirthdayWishes';

import '../../styles/birthday-wishes.css';

interface BirthdayWishesProps {
    imageId: string;
    /** Photo title, usually the celebrant's name. */
    celebrantName: string;
    /** Called when a new wish is published, so card counts update. */
    onWishPublished?: () => void;
}

/**
 * The panel is re-created for each photo (it is keyed by the
 * photo id), so remember the visitor's name between photos.
 */
let rememberedAuthorName = '';

type Notice =
    | { kind: 'success' | 'info' | 'error'; text: string }
    | null;

function formatWishDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}

function getErrorMessage(error: unknown): string {
    if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    ) {
        return (error as { message: string }).message;
    }

    return 'Your wish could not be sent. Please try again.';
}

/**
 * Wishes list and "Send a wish" form shown in the enlarged
 * view of a Celebrants of the Month photo.
 *
 * Render it with key={imageId} so it starts fresh for each photo.
 */
export default function BirthdayWishes({
    imageId,
    celebrantName,
    onWishPublished,
}: BirthdayWishesProps) {
    const [wishes, setWishes] = useState<BirthdayWish[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    const [authorName, setAuthorName] = useState(rememberedAuthorName);
    const [message, setMessage] = useState('');
    const [website, setWebsite] = useState('');
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);

    /* Load the approved wishes for this photo. */
    useEffect(() => {
        const controller = new AbortController();

        getBirthdayWishes(imageId, controller.signal)
            .then(items => {
                if (!controller.signal.aborted) {
                    setWishes(items);
                }
            })
            .catch(error => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setLoadFailed(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [imageId]);

    const trimmedName = authorName.trim();
    const trimmedMessage = message.trim();

    const canSend =
        !sending &&
        trimmedName.length >= 2 &&
        trimmedMessage.length >= 2 &&
        message.length <= WISH_MESSAGE_MAX_LENGTH;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!canSend) {
            return;
        }

        setSending(true);
        setNotice(null);

        try {
            const result = await submitBirthdayWish({
                galleryImageId: imageId,
                authorName: trimmedName,
                message: trimmedMessage,
                website,
            });

            if (result.status === 'Approved' && result.wish) {
                const published = result.wish;

                setWishes(current => [...current, published]);
                setMessage('');
                setNotice({ kind: 'success', text: result.message });
                onWishPublished?.();
            } else if (result.status === 'Pending') {
                setMessage('');
                setNotice({ kind: 'info', text: result.message });
            } else {
                // Rejected: keep the text so the visitor can change it.
                setNotice({ kind: 'error', text: result.message });
            }
        } catch (error) {
            setNotice({ kind: 'error', text: getErrorMessage(error) });
        } finally {
            setSending(false);
        }
    };

    const remaining = WISH_MESSAGE_MAX_LENGTH - message.length;

    return (
        <section
            className="birthday-wishes"
            aria-label={`Birthday wishes for ${celebrantName}`}
        >
            <div className="birthday-wishes-heading">
                <span aria-hidden="true">🎂</span>

                <h4>
                    Birthday wishes
                    {wishes.length > 0 && (
                        <span className="birthday-wishes-count">
                            {wishes.length}
                        </span>
                    )}
                </h4>
            </div>

            {loading ? (
                <p className="birthday-wishes-muted">
                    Loading wishes...
                </p>
            ) : loadFailed ? (
                <p className="birthday-wishes-muted">
                    Wishes could not be loaded right now.
                </p>
            ) : wishes.length === 0 ? (
                <p className="birthday-wishes-muted">
                    Be the first to wish {celebrantName} a happy birthday!
                </p>
            ) : (
                <ul className="birthday-wishes-list">
                    {wishes.map(wish => (
                        <li
                            key={wish.id}
                            className="birthday-wish"
                        >
                            <div className="birthday-wish-meta">
                                <strong>{wish.authorName}</strong>
                                <span>{formatWishDate(wish.createdAt)}</span>
                            </div>

                            <p>{wish.message}</p>
                        </li>
                    ))}
                </ul>
            )}

            <form
                className="birthday-wish-form"
                onSubmit={event => void handleSubmit(event)}
                noValidate
            >
                {/* Honeypot: hidden from people, only bots fill it in. */}
                <div
                    className="birthday-wish-honeypot"
                    aria-hidden="true"
                >
                    <label>
                        Website
                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={website}
                            onChange={event => setWebsite(event.target.value)}
                        />
                    </label>
                </div>

                <label className="birthday-wish-field">
                    <span>Your name</span>
                    <input
                        type="text"
                        value={authorName}
                        maxLength={WISH_NAME_MAX_LENGTH}
                        autoComplete="name"
                        placeholder="e.g. Sister Grace"
                        onChange={event => {
                            setAuthorName(event.target.value);
                            rememberedAuthorName = event.target.value;
                        }}
                        disabled={sending}
                        required
                    />
                </label>

                <label className="birthday-wish-field">
                    <span>Your wish</span>
                    <textarea
                        value={message}
                        maxLength={WISH_MESSAGE_MAX_LENGTH}
                        rows={3}
                        placeholder={`Happy birthday, ${celebrantName}! God bless you...`}
                        onChange={event => setMessage(event.target.value)}
                        disabled={sending}
                        required
                    />
                </label>

                <div className="birthday-wish-actions">
                    <small
                        className={remaining < 50 ? 'birthday-wish-limit' : undefined}
                    >
                        {remaining} characters left
                    </small>

                    <button
                        type="submit"
                        className="birthday-wish-send"
                        disabled={!canSend}
                    >
                        {sending ? 'Sending...' : 'Send wish'}
                    </button>
                </div>

                {notice && (
                    <p
                        className={`birthday-wish-notice ${notice.kind}`}
                        role={notice.kind === 'error' ? 'alert' : 'status'}
                    >
                        {notice.text}
                    </p>
                )}

                <p className="birthday-wish-privacy">
                    Wishes are checked before they appear and are only shown on this page.
                </p>
            </form>
        </section>
    );
}
