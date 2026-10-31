import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { apiUrl } from '@/api/api';

import '../../styles/news-banner.css';

export type AnnouncementType =
    | 'News'
    | 'Event'
    | 'Notice'
    | 'Urgent';

export interface AnnouncementFeedItem {
    id: string;
    title: string;
    summary: string | null;
    body: string | null;
    type: AnnouncementType;
    imagePath: string | null;
    thumbnailPath: string | null;
    linkUrl: string | null;
    linkText: string | null;
    eventStartsAt: string | null;
    eventEndsAt: string | null;
    venueName: string | null;
    venueAddress: string | null;
    startsAt: string;
    endsAt: string | null;
    showInBanner: boolean;
    version: string;
}

const DISMISS_STORAGE_KEY = 'hopeHouseNewsDismissed';
const OPEN_DELAY_MS = 1200;
const ROTATE_MS = 8000;

const typeLabels: Record<AnnouncementType, string> = {
    News: 'News',
    Event: 'Event',
    Notice: 'Notice',
    Urgent: 'Urgent',
};

const typeIcons: Record<AnnouncementType, string> = {
    News: '📰',
    Event: '🎉',
    Notice: '📌',
    Urgent: '⚠️',
};

function resolveAnnouncementImage(
    path: string | null | undefined
): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return apiUrl(path);
}

function isExternalLink(url: string) {
    return /^https?:\/\//i.test(url);
}

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;

function parseDate(value: string | null) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatTime(date: Date) {
    return date
        .toLocaleTimeString('en-GB', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
        .replace(' ', '\u00a0');
}

interface EventWhen {
    date: string;
    time: string | null;
}

/**
 * Describes when the event happens, e.g.
 * short: "Sat 5 Dec" / long: "Saturday 5 December 2026",
 * time: "4:00 pm – 6:00 pm".
 */
function describeEventWhen(
    item: AnnouncementFeedItem,
    style: 'short' | 'long'
): EventWhen | null {
    const start = parseDate(item.eventStartsAt);
    if (!start) return null;

    const end = parseDate(item.eventEndsAt);

    const dayOptions: Intl.DateTimeFormatOptions =
        style === 'short'
            ? { weekday: 'short', day: 'numeric', month: 'short' }
            : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

    const startDay = start.toLocaleDateString('en-GB', dayOptions);

    if (end && !isSameDay(start, end)) {
        return {
            date: `${startDay} – ${end.toLocaleDateString('en-GB', dayOptions)}`,
            time: `${formatTime(start)} – ${formatTime(end)}`,
        };
    }

    return {
        date: startDay,
        time: end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start),
    };
}

/** Short venue label for the banner, e.g. "RCCG Hope House, HA8 0AP". */
function shortVenue(item: AnnouncementFeedItem) {
    const postcode = item.venueAddress?.match(UK_POSTCODE)?.[1]?.toUpperCase();

    if (item.venueName) {
        return postcode
            ? `${item.venueName}, ${keepPostcodeTogether(postcode)}`
            : item.venueName;
    }

    if (item.venueAddress) {
        const firstLine = item.venueAddress.split(/[,\n]/)[0].trim();
        return postcode && !firstLine.toUpperCase().includes(postcode)
            ? `${firstLine}, ${postcode}`
            : firstLine;
    }

    return null;
}

/** Keeps a UK postcode on one line, e.g. "HA8 0AP" never wraps. */
function keepPostcodeTogether(text: string) {
    return text.replace(UK_POSTCODE, match => match.replace(/\s+/, '\u00a0'));
}

function mapQuery(item: AnnouncementFeedItem) {
    return [item.venueName, item.venueAddress]
        .filter(Boolean)
        .join(', ')
        .replace(/\s*\n\s*/g, ', ');
}

function directionsUrl(item: AnnouncementFeedItem) {
    const query = mapQuery(item);
    return query
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
        : null;
}

function mapEmbedUrl(item: AnnouncementFeedItem) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery(item))}&z=15&output=embed`;
}

function signatureOf(items: AnnouncementFeedItem[]) {
    return items
        .map(item => `${item.id}:${item.version}`)
        .sort()
        .join('|');
}

function readDismissedSignature(): string | null {
    try {
        return localStorage.getItem(DISMISS_STORAGE_KEY);
    } catch {
        return null;
    }
}

function writeDismissedSignature(signature: string) {
    try {
        localStorage.setItem(DISMISS_STORAGE_KEY, signature);
    } catch {
        /* Storage blocked - the banner simply reopens next visit. */
    }
}

function prefersReducedMotion() {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
}

/* ==========================================================
   Icons
   Drawn as SVG so they look the same on every phone
   (emoji calendars show a fixed date such as "JUL 17").
   ========================================================== */

function CalendarIcon() {
    return (
        <svg className="news-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function PinIcon() {
    return (
        <svg className="news-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.3" fill="currentColor" />
        </svg>
    );
}

/* ==========================================================
   Detail modal
   ========================================================== */

interface AnnouncementModalProps {
    item: AnnouncementFeedItem;
    onClose: () => void;
}

function AnnouncementModal({ item, onClose }: AnnouncementModalProps) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const image = resolveAnnouncementImage(item.imagePath ?? item.thumbnailPath);
    const when = describeEventWhen(item, 'long');
    const venueLabel = shortVenue(item);
    const directions = directionsUrl(item);

    // The Google map is only loaded when the visitor asks for it,
    // so no Google content or cookies load until then.
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    return (
        <div
            className="news-modal-backdrop"
            onMouseDown={event => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                className={`news-modal${image ? '' : ' news-modal-no-image'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="news-modal-title"
            >
                <button
                    ref={closeButtonRef}
                    type="button"
                    className="news-modal-close"
                    onClick={onClose}
                    aria-label="Close announcement"
                >
                    ×
                </button>

                {image && (
                    <a
                        className="news-modal-poster"
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open full-size poster"
                    >
                        <img src={image} alt={`Poster: ${item.title}`} />
                    </a>
                )}

                <div className="news-modal-content">
                    <span className={`news-type-chip news-type-${item.type.toLowerCase()}`}>
                        {typeIcons[item.type]} {typeLabels[item.type]}
                    </span>

                    <h2 id="news-modal-title">{item.title}</h2>

                    {(when || venueLabel) && (
                        <div className="news-event-card">
                            {when && (
                                <div className="news-event-row">
                                    <CalendarIcon />
                                    <div>
                                        <strong>{when.date}</strong>
                                        {when.time && <span>{when.time}</span>}
                                    </div>
                                </div>
                            )}

                            {venueLabel && (
                                <div className="news-event-row">
                                    <PinIcon />
                                    <div>
                                        <strong>{item.venueName ?? venueLabel}</strong>
                                        {item.venueAddress && (
                                            <span className="news-event-address">
                                                {keepPostcodeTogether(item.venueAddress)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {directions && (
                                <div className="news-event-actions">
                                    <a
                                        className="news-map-button news-map-button-primary"
                                        href={directions}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Get directions
                                        <span aria-hidden="true">↗</span>
                                    </a>
                                    {!showMap && (
                                        <button
                                            type="button"
                                            className="news-map-button"
                                            onClick={() => setShowMap(true)}
                                        >
                                            Show map
                                        </button>
                                    )}
                                </div>
                            )}

                            {directions && showMap && (
                                <div className="news-map-frame">
                                    <iframe
                                        title={`Map of ${venueLabel}`}
                                        src={mapEmbedUrl(item)}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {item.summary && (
                        <p className="news-modal-summary">{item.summary}</p>
                    )}

                    {item.body && (
                        <div className="news-modal-body">{item.body}</div>
                    )}

                    {item.linkUrl && (
                        <a
                            className="news-cta"
                            href={item.linkUrl}
                            {...(isExternalLink(item.linkUrl)
                                ? { target: '_blank', rel: 'noopener noreferrer' }
                                : {})}
                            onClick={() => {
                                if (!isExternalLink(item.linkUrl!)) onClose();
                            }}
                        >
                            {item.linkText || 'Learn more'}
                            <span aria-hidden="true">→</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ==========================================================
   Floating banner
   ========================================================== */

export default function NewsBanner() {
    const [items, setItems] = useState<AnnouncementFeedItem[]>([]);
    const [index, setIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [paused, setPaused] = useState(false);
    const [modalItem, setModalItem] = useState<AnnouncementFeedItem | null>(null);

    const signature = useMemo(() => signatureOf(items), [items]);

    useEffect(() => {
        const controller = new AbortController();
        let openTimer: number | undefined;

        const load = async () => {
            try {
                const response = await fetch(
                    apiUrl('/api/announcements/live?bannerOnly=true&take=10'),
                    { signal: controller.signal }
                );

                if (!response.ok) return;

                const data = (await response.json()) as AnnouncementFeedItem[];
                if (!Array.isArray(data) || data.length === 0) return;

                setItems(data);
                setMounted(true);

                // Re-open automatically only when something is new or changed
                // since the visitor last closed the banner.
                if (readDismissedSignature() !== signatureOf(data)) {
                    openTimer = window.setTimeout(
                        () => setExpanded(true),
                        OPEN_DELAY_MS
                    );
                }
            } catch {
                /* The banner is optional - fail silently. */
            }
        };

        void load();

        return () => {
            controller.abort();
            window.clearTimeout(openTimer);
        };
    }, []);

    const count = items.length;
    const current = items[Math.min(index, count - 1)];

    const go = useCallback(
        (direction: 1 | -1) => {
            if (count < 2) return;
            setIndex(i => (i + direction + count) % count);
        },
        [count]
    );

    // Auto-rotate while expanded, unless hovered/focused or the modal is open.
    useEffect(() => {
        if (!expanded || paused || modalItem || count < 2 || prefersReducedMotion()) {
            return;
        }

        const timer = window.setTimeout(() => go(1), ROTATE_MS);
        return () => window.clearTimeout(timer);
    }, [expanded, paused, modalItem, count, index, go]);

    const closeModal = useCallback(() => setModalItem(null), []);

    const collapse = () => {
        setExpanded(false);
        writeDismissedSignature(signature);
    };

    if (!mounted || !current) return null;

    const thumb = resolveAnnouncementImage(current.thumbnailPath ?? current.imagePath);
    const currentWhen = describeEventWhen(current, 'short');
    const currentVenue = shortVenue(current);
    const currentDirections = directionsUrl(current);
    const isUrgent = items.some(item => item.type === 'Urgent');

    return (
        <>
            {expanded ? (
                <aside
                    className={`news-banner news-banner-${current.type.toLowerCase()}`}
                    aria-label="News and updates"
                    aria-roledescription="carousel"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                >
                    <header className="news-banner-header">
                        <span className="news-banner-label">
                            <span className="news-banner-pulse" aria-hidden="true" />
                            News &amp; Updates
                        </span>

                        {count > 1 && (
                            <span className="news-banner-count" aria-live="polite">
                                {index + 1} / {count}
                            </span>
                        )}

                        <button
                            type="button"
                            className="news-icon-button"
                            onClick={collapse}
                            aria-label="Minimise news and updates"
                            title="Minimise"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path d="M6 12h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </header>

                    <div
                        key={current.id}
                        className="news-banner-body"
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${index + 1} of ${count}`}
                    >
                        <button
                            type="button"
                            className="news-banner-thumb"
                            onClick={() => setModalItem(current)}
                            aria-label={`View poster for ${current.title}`}
                        >
                            {thumb ? (
                                <img src={thumb} alt="" loading="lazy" />
                            ) : (
                                <span className="news-banner-thumb-fallback" aria-hidden="true">
                                    {typeIcons[current.type]}
                                </span>
                            )}
                        </button>

                        <div className="news-banner-text">
                            <span className={`news-type-chip news-type-${current.type.toLowerCase()}`}>
                                {typeLabels[current.type]}
                            </span>
                            <h3>{current.title}</h3>
                            {current.summary && <p>{current.summary}</p>}
                            {(currentWhen || currentVenue) && (
                                <ul className="news-banner-meta">
                                    {currentWhen && (
                                        <li>
                                            <CalendarIcon />
                                            <span>
                                                {currentWhen.date}
                                                {currentWhen.time && ` · ${currentWhen.time}`}
                                            </span>
                                        </li>
                                    )}
                                    {currentVenue && (
                                        <li>
                                            <PinIcon />
                                            {currentDirections ? (
                                                <a
                                                    href={currentDirections}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Get directions in Google Maps"
                                                >
                                                    {currentVenue}
                                                </a>
                                            ) : (
                                                <span>{currentVenue}</span>
                                            )}
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <footer className="news-banner-footer">
                        <button
                            type="button"
                            className="news-read-more"
                            onClick={() => setModalItem(current)}
                        >
                            Read more
                        </button>

                        {current.linkUrl && (
                            <a
                                className="news-cta news-cta-small"
                                href={current.linkUrl}
                                {...(isExternalLink(current.linkUrl)
                                    ? { target: '_blank', rel: 'noopener noreferrer' }
                                    : {})}
                            >
                                {current.linkText || 'Learn more'}
                            </a>
                        )}

                        {count > 1 && (
                            <div className="news-banner-nav">
                                <button
                                    type="button"
                                    className="news-icon-button"
                                    onClick={() => go(-1)}
                                    aria-label="Previous announcement"
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="news-icon-button"
                                    onClick={() => go(1)}
                                    aria-label="Next announcement"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </footer>

                    {count > 1 && !paused && !prefersReducedMotion() && (
                        <span
                            key={`progress-${index}`}
                            className="news-banner-progress"
                            style={{ animationDuration: `${ROTATE_MS}ms` }}
                            aria-hidden="true"
                        />
                    )}
                </aside>
            ) : (
                <button
                    type="button"
                    className={`news-pill${isUrgent ? ' news-pill-urgent' : ''}`}
                    onClick={() => setExpanded(true)}
                    aria-label={`Open news and updates (${count})`}
                >
                    <span className="news-pill-icon" aria-hidden="true">📣</span>
                    <span className="news-pill-text">News</span>
                    <span className="news-pill-badge">{count}</span>
                </button>
            )}

            {modalItem && (
                <AnnouncementModal
                    item={modalItem}
                    onClose={closeModal}
                />
            )}
        </>
    );
}
