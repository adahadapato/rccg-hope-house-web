import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';

import {
    apiFetch,
    apiUrl,
    getApiErrorDetails,
    getNetworkErrorDetails,
    type ApiErrorDetails,
} from '@/api/api';
import ApiErrorState from '@/components/sections/ApiErrorState';
import ConfirmDialog from '@/components/sections/ConfirmDialog';
import AdminLayout from '../components/AdminLayout';
import AdminActionButtons from '../components/AdminActionButtons';

import '../styles/admin.css';
import '../styles/admin-events.css';
import '../styles/admin-news.css';

type AnnouncementType = 'News' | 'Event' | 'Notice' | 'Urgent';

interface Announcement {
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
    isPublished: boolean;
    showInBanner: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string | null;
}

interface NewsFormState {
    title: string;
    type: AnnouncementType;
    summary: string;
    body: string;
    linkUrl: string;
    linkText: string;
    eventStartsAt: string;
    eventEndsAt: string;
    venueName: string;
    venueAddress: string;
    startsAt: string;
    endsAt: string;
    displayOrder: string;
    isPublished: boolean;
    showInBanner: boolean;
}

interface ConfirmationState {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'primary' | 'success' | 'warning' | 'danger';
    action: (() => Promise<void>) | null;
}

type LiveStatus = 'live' | 'scheduled' | 'expired' | 'draft';

const announcementTypes: { value: AnnouncementType; label: string; hint: string }[] = [
    { value: 'News', label: 'News', hint: 'General church news' },
    { value: 'Event', label: 'Event', hint: 'Promote a programme' },
    { value: 'Notice', label: 'Notice', hint: 'Practical information' },
    { value: 'Urgent', label: 'Urgent', hint: 'Cancellations, changes' },
];

const SUMMARY_MAX = 300;
const BODY_MAX = 4000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const emptyConfirmation: ConfirmationState = {
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: null,
};

function toDateTimeLocal(value: string | null | Date) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16);
}

function toApiDateTime(value: string) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDate(value: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function resolveImage(path: string | null) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return apiUrl(path);
}

function liveStatusOf(item: Announcement, now: number): LiveStatus {
    if (!item.isPublished) return 'draft';
    if (new Date(item.startsAt).getTime() > now) return 'scheduled';
    if (item.endsAt && new Date(item.endsAt).getTime() < now) return 'expired';
    return 'live';
}

const statusLabels: Record<LiveStatus, string> = {
    live: 'Live',
    scheduled: 'Scheduled',
    expired: 'Expired',
    draft: 'Draft',
};

function newEmptyForm(displayOrder = 0): NewsFormState {
    return {
        title: '',
        type: 'News',
        summary: '',
        body: '',
        linkUrl: '',
        linkText: '',
        eventStartsAt: '',
        eventEndsAt: '',
        venueName: '',
        venueAddress: '',
        startsAt: toDateTimeLocal(new Date()),
        endsAt: '',
        displayOrder: displayOrder.toString(),
        isPublished: true,
        showInBanner: true,
    };
}

export default function AdminNews() {
    const [items, setItems] = useState<Announcement[]>([]);
    // Captured whenever the list loads, so Live/Scheduled/Expired is stable during render.
    const [now, setNow] = useState(0);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [loadError, setLoadError] = useState<ApiErrorDetails | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Announcement | null>(null);
    const [form, setForm] = useState<NewsFormState>(newEmptyForm());
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [posterPreview, setPosterPreview] = useState<string>('');
    const [removePoster, setRemovePoster] = useState(false);
    const [fillingAddress, setFillingAddress] = useState(false);

    const [confirmation, setConfirmation] = useState<ConfirmationState>(emptyConfirmation);

    const previewWhen = useMemo(() => {
        if (!form.eventStartsAt) return '';
        const start = new Date(form.eventStartsAt);
        if (Number.isNaN(start.getTime())) return '';
        const time = (d: Date) =>
            d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
        const day = start.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
        const end = form.eventEndsAt ? new Date(form.eventEndsAt) : null;
        return end && !Number.isNaN(end.getTime())
            ? `${day} · ${time(start)} – ${time(end)}`
            : `${day} · ${time(start)}`;
    }, [form.eventStartsAt, form.eventEndsAt]);

    const counts = useMemo(() => {
        const result = { live: 0, scheduled: 0, expired: 0, draft: 0, banner: 0 };
        for (const item of items) {
            const status = liveStatusOf(item, now);
            result[status] += 1;
            if (status === 'live' && item.showInBanner) result.banner += 1;
        }
        return result;
    }, [items, now]);

    const fetchItems = useCallback(async (signal?: AbortSignal) => {
        const response = await apiFetch('/api/announcements/admin?skip=0&take=500', { signal });
        if (!response.ok) {
            throw await getApiErrorDetails(response, 'Unable to load news & updates.');
        }
        return (await response.json()) as Announcement[];
    }, []);

    const loadAll = useCallback(
        async (signal?: AbortSignal) => {
            const data = await fetchItems(signal);
            setNow(Date.now());
            setItems(data);
            setLoadError(null);
        },
        [fetchItems]
    );

    useEffect(() => {
        const controller = new AbortController();

        const initialise = async () => {
            try {
                setLoading(true);
                await loadAll(controller.signal);
            } catch (error) {
                if (controller.signal.aborted) return;
                setLoadError(
                    typeof error === 'object' && error !== null && 'message' in error
                        ? (error as ApiErrorDetails)
                        : getNetworkErrorDetails()
                );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        void initialise();
        return () => controller.abort();
    }, [loadAll]);

    // Revoke object URLs created for poster previews.
    useEffect(() => {
        return () => {
            if (posterPreview.startsWith('blob:')) URL.revokeObjectURL(posterPreview);
        };
    }, [posterPreview]);

    async function retryLoad(): Promise<boolean> {
        setRetrying(true);
        setActionError(null);
        try {
            await loadAll();
            return true;
        } catch (error) {
            setLoadError(
                typeof error === 'object' && error !== null && 'message' in error
                    ? (error as ApiErrorDetails)
                    : getNetworkErrorDetails()
            );
            return false;
        } finally {
            setRetrying(false);
        }
    }

    function showSuccess(message: string) {
        setSuccessMessage(message);
        window.setTimeout(
            () => setSuccessMessage(current => (current === message ? null : current)),
            3500
        );
    }

    async function failFrom(response: Response, fallback: string): Promise<never> {
        const details = await getApiErrorDetails(response, fallback);
        throw new Error(details.message);
    }

    function openNew() {
        setEditing(null);
        setForm(newEmptyForm(items.length));
        setPosterFile(null);
        setPosterPreview('');
        setRemovePoster(false);
        setFormError(null);
        setActionError(null);
        setFormOpen(true);
    }

    function openEdit(item: Announcement) {
        setEditing(item);
        setForm({
            title: item.title,
            type: item.type,
            summary: item.summary ?? '',
            body: item.body ?? '',
            linkUrl: item.linkUrl ?? '',
            linkText: item.linkText ?? '',
            eventStartsAt: toDateTimeLocal(item.eventStartsAt),
            eventEndsAt: toDateTimeLocal(item.eventEndsAt),
            venueName: item.venueName ?? '',
            venueAddress: item.venueAddress ?? '',
            startsAt: toDateTimeLocal(item.startsAt),
            endsAt: toDateTimeLocal(item.endsAt),
            displayOrder: item.displayOrder.toString(),
            isPublished: item.isPublished,
            showInBanner: item.showInBanner,
        });
        setPosterFile(null);
        setPosterPreview(resolveImage(item.thumbnailPath ?? item.imagePath));
        setRemovePoster(false);
        setFormError(null);
        setActionError(null);
        setFormOpen(true);
    }

    function closeForm() {
        if (saving) return;
        setFormOpen(false);
        setEditing(null);
        setPosterFile(null);
        setPosterPreview('');
    }

    function update<K extends keyof NewsFormState>(key: K, value: NewsFormState[K]) {
        setForm(current => ({ ...current, [key]: value }));
    }

    function handlePosterChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setFormError('Poster must be a JPEG, PNG or WebP image.');
            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setFormError('Poster cannot be larger than 10MB.');
            return;
        }

        setFormError(null);
        setPosterFile(file);
        setRemovePoster(false);
        setPosterPreview(URL.createObjectURL(file));
    }

    async function fillChurchAddress() {
        setFillingAddress(true);
        setFormError(null);
        try {
            const response = await apiFetch('/api/church-info');
            if (!response.ok) {
                await failFrom(response, 'Unable to load the church address.');
            }
            const info = (await response.json()) as {
                parishName?: string | null;
                addressLine1?: string | null;
                addressLine2?: string | null;
                city?: string | null;
                postCode?: string | null;
            };
            const address = [info.addressLine1, info.addressLine2, info.city, info.postCode]
                .map(part => part?.trim())
                .filter(Boolean)
                .join(', ');

            if (!address) {
                setFormError('No church address is saved yet. Add it under Administration › Church Settings.');
                return;
            }

            setForm(current => ({
                ...current,
                venueName: current.venueName || (info.parishName?.trim() ?? ''),
                venueAddress: address,
            }));
        } catch (error) {
            setFormError(
                error instanceof Error ? error.message : getNetworkErrorDetails(error).message
            );
        } finally {
            setFillingAddress(false);
        }
    }

    function clearPoster() {
        setPosterFile(null);
        setPosterPreview('');
        setRemovePoster(Boolean(editing?.imagePath));
    }

    async function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const startsAt = toApiDateTime(form.startsAt);
        const endsAt = toApiDateTime(form.endsAt);

        if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
            setFormError('"Show until" cannot be earlier than "Show from".');
            return;
        }

        const eventStartsAt = toApiDateTime(form.eventStartsAt);
        const eventEndsAt = toApiDateTime(form.eventEndsAt);

        if (eventEndsAt && !eventStartsAt) {
            setFormError('Add the event start time as well as the end time.');
            return;
        }

        if (eventStartsAt && eventEndsAt && new Date(eventEndsAt) < new Date(eventStartsAt)) {
            setFormError('The event cannot end before it starts.');
            return;
        }

        const payload = {
            title: form.title.trim(),
            type: form.type,
            summary: form.summary.trim() || null,
            body: form.body.trim() || null,
            linkUrl: form.linkUrl.trim() || null,
            linkText: form.linkText.trim() || null,
            eventStartsAt,
            eventEndsAt,
            venueName: form.venueName.trim() || null,
            venueAddress: form.venueAddress.trim() || null,
            startsAt,
            endsAt,
            displayOrder: Math.max(0, Number.parseInt(form.displayOrder, 10) || 0),
            isPublished: form.isPublished,
            showInBanner: form.showInBanner,
        };

        setSaving(true);

        try {
            const response = await apiFetch(
                editing ? `/api/announcements/admin/${editing.id}` : '/api/announcements/admin',
                {
                    method: editing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                await failFrom(response, 'Unable to save the announcement.');
            }

            const saved = (await response.json()) as Announcement;

            if (posterFile) {
                const formData = new FormData();
                formData.append('file', posterFile);

                const imageResponse = await apiFetch(
                    `/api/announcements/admin/${saved.id}/image`,
                    { method: 'POST', body: formData }
                );

                if (!imageResponse.ok) {
                    await loadAll();
                    await failFrom(
                        imageResponse,
                        'The announcement was saved, but the poster could not be uploaded.'
                    );
                }
            } else if (removePoster && editing) {
                const removeResponse = await apiFetch(
                    `/api/announcements/admin/${saved.id}/image`,
                    { method: 'DELETE' }
                );

                if (!removeResponse.ok) {
                    await loadAll();
                    await failFrom(
                        removeResponse,
                        'The announcement was saved, but the poster could not be removed.'
                    );
                }
            }

            await loadAll();
            setFormOpen(false);
            setEditing(null);
            setPosterFile(null);
            setPosterPreview('');
            showSuccess(editing ? 'Announcement updated.' : 'Announcement published.');
        } catch (error) {
            setFormError(
                error instanceof Error ? error.message : getNetworkErrorDetails(error).message
            );
        } finally {
            setSaving(false);
        }
    }

    function requestToggle(item: Announcement) {
        const publishing = !item.isPublished;

        setConfirmation({
            open: true,
            title: publishing ? 'Publish announcement?' : 'Unpublish announcement?',
            message: publishing
                ? `"${item.title}" will be shown on the website during its display window.`
                : `"${item.title}" will be hidden from the website and the floating banner.`,
            confirmText: publishing ? 'Publish' : 'Unpublish',
            variant: publishing ? 'success' : 'warning',
            action: async () => {
                const response = await apiFetch(
                    `/api/announcements/admin/${item.id}/toggle-published`,
                    { method: 'POST' }
                );
                if (!response.ok) await failFrom(response, 'Unable to update the announcement.');
                await loadAll();
                showSuccess(publishing ? 'Announcement published.' : 'Announcement unpublished.');
            },
        });
    }

    function requestDelete(item: Announcement) {
        setConfirmation({
            open: true,
            title: 'Permanently delete announcement?',
            message: `"${item.title}" and its poster will be permanently deleted. This cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
            action: async () => {
                const response = await apiFetch(`/api/announcements/admin/${item.id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) await failFrom(response, 'Unable to delete the announcement.');
                await loadAll();
                showSuccess('Announcement deleted.');
            },
        });
    }

    async function runConfirmation() {
        if (!confirmation.action) return;
        setConfirming(true);
        setActionError(null);
        try {
            await confirmation.action();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to complete action.');
        } finally {
            setConfirmation(emptyConfirmation);
            setConfirming(false);
        }
    }

    return (
        <AdminLayout>
            <div className="events-admin news-admin">
                <div className="events-admin-header">
                    <div>
                        <span className="events-admin-eyebrow">Website Content</span>
                        <h1>News &amp; Updates</h1>
                        <p>
                            Publish announcements and posters. Live items appear in the floating
                            News banner on the public website.
                        </p>
                    </div>

                    {!loadError && !loading && (
                        <button type="button" className="admin-primary-button" onClick={openNew}>
                            <span>＋</span>
                            New Announcement
                        </button>
                    )}
                </div>

                {actionError && (
                    <div className="events-admin-alert events-admin-alert-error">
                        <span>!</span>
                        <div>
                            <strong>Something went wrong</strong>
                            <p>{actionError}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActionError(null)}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="events-admin-alert events-admin-alert-success">
                        <span>✓</span>
                        <div>
                            <strong>Success</strong>
                            <p>{successMessage}</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="events-admin-panel events-admin-empty">
                        <div className="admin-loading-spinner" />
                        <strong>Loading news &amp; updates...</strong>
                    </div>
                ) : loadError ? (
                    <ApiErrorState
                        status={loadError.status}
                        title={loadError.title}
                        message={loadError.message}
                        onRetry={retryLoad}
                        retrying={retrying}
                    />
                ) : (
                    <>
                        <div className="events-admin-stats">
                            <div className="events-stat-card">
                                <span className="events-stat-icon">📣</span>
                                <div>
                                    <strong>{counts.banner}</strong>
                                    <span>In floating banner</span>
                                </div>
                            </div>
                            <div className="events-stat-card">
                                <span className="events-stat-icon">●</span>
                                <div>
                                    <strong>{counts.live}</strong>
                                    <span>Live now</span>
                                </div>
                            </div>
                            <div className="events-stat-card">
                                <span className="events-stat-icon">◷</span>
                                <div>
                                    <strong>{counts.scheduled}</strong>
                                    <span>Scheduled</span>
                                </div>
                            </div>
                            <div className="events-stat-card">
                                <span className="events-stat-icon">✎</span>
                                <div>
                                    <strong>{counts.draft + counts.expired}</strong>
                                    <span>Drafts &amp; expired</span>
                                </div>
                            </div>
                        </div>

                        <section className="events-admin-panel">
                            <div className="events-panel-heading">
                                <div>
                                    <h2>All announcements</h2>
                                    <p>Lower display order shows first in the banner.</p>
                                </div>
                            </div>

                            {items.length === 0 ? (
                                <div className="events-admin-empty">
                                    <strong>No announcements yet</strong>
                                    <p>
                                        Create your first announcement — for example, upload a
                                        programme poster.
                                    </p>
                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={openNew}
                                    >
                                        New Announcement
                                    </button>
                                </div>
                            ) : (
                                <div className="events-table-wrapper">
                                    <table className="events-table">
                                        <thead>
                                            <tr>
                                                <th>Announcement</th>
                                                <th>Type</th>
                                                <th>Showing</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(item => {
                                                const status = liveStatusOf(item, now);
                                                const thumb = resolveImage(
                                                    item.thumbnailPath ?? item.imagePath
                                                );

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className={
                                                            status === 'live'
                                                                ? ''
                                                                : 'events-row-inactive'
                                                        }
                                                    >
                                                        <td>
                                                            <div className="news-name-cell">
                                                                {thumb ? (
                                                                    <img src={thumb} alt="" />
                                                                ) : (
                                                                    <span className="news-thumb-empty">
                                                                        ▤
                                                                    </span>
                                                                )}
                                                                <div>
                                                                    <strong>{item.title}</strong>
                                                                    {item.summary && (
                                                                        <span className="events-table-secondary">
                                                                            {item.summary}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`news-type-badge news-type-badge-${item.type.toLowerCase()}`}
                                                            >
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="news-window">
                                                                From {formatDate(item.startsAt)}
                                                                <span className="events-table-secondary">
                                                                    {item.endsAt
                                                                        ? `Until ${formatDate(item.endsAt)}`
                                                                        : 'No end date'}
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="events-status-stack">
                                                                <span
                                                                    className={`news-status news-status-${status}`}
                                                                >
                                                                    {statusLabels[status]}
                                                                </span>
                                                                {item.showInBanner &&
                                                                    status === 'live' && (
                                                                        <span className="events-badge events-badge-neutral">
                                                                            In banner
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <AdminActionButtons
                                                                itemName={item.title}
                                                                isPublic={item.isPublished}
                                                                onVisibilityToggle={() =>
                                                                    requestToggle(item)
                                                                }
                                                                makePublicTitle="Publish"
                                                                makePrivateTitle="Unpublish"
                                                                onEdit={() => openEdit(item)}
                                                                onDelete={() => requestDelete(item)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {formOpen && (
                    <div className="events-modal-backdrop" onMouseDown={closeForm}>
                        <div
                            className="events-modal events-modal-large news-modal-form"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="news-form-title"
                            onMouseDown={event => event.stopPropagation()}
                        >
                            <div className="events-modal-header">
                                <div>
                                    <span>News &amp; Updates</span>
                                    <h2 id="news-form-title">
                                        {editing ? 'Edit Announcement' : 'New Announcement'}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={submitForm}>
                                {formError && (
                                    <div className="events-admin-alert events-admin-alert-error news-form-alert">
                                        <span>!</span>
                                        <div>
                                            <strong>Please check the form</strong>
                                            <p>{formError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="news-form-layout">
                                    <div className="events-form-grid">
                                        <label className="events-field events-field-wide">
                                            <span>Title *</span>
                                            <input
                                                required
                                                maxLength={150}
                                                value={form.title}
                                                placeholder="An Evening of Victory Praise"
                                                onChange={e => update('title', e.target.value)}
                                            />
                                        </label>

                                        <div className="events-field events-field-wide">
                                            <span>Type</span>
                                            <div className="news-type-picker" role="radiogroup">
                                                {announcementTypes.map(option => (
                                                    <label
                                                        key={option.value}
                                                        className={`news-type-option news-type-option-${option.value.toLowerCase()}${form.type === option.value ? ' selected' : ''}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="announcement-type"
                                                            value={option.value}
                                                            checked={form.type === option.value}
                                                            onChange={() => update('type', option.value)}
                                                        />
                                                        <strong>{option.label}</strong>
                                                        <small>{option.hint}</small>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <label className="events-field events-field-wide">
                                            <span>
                                                Banner summary
                                                <em className="news-char-count">
                                                    {form.summary.length}/{SUMMARY_MAX}
                                                </em>
                                            </span>
                                            <textarea
                                                rows={2}
                                                maxLength={SUMMARY_MAX}
                                                value={form.summary}
                                                placeholder="Sat 5 Dec, 4–6 PM at Hope House. Come ready to lift your voice!"
                                                onChange={e => update('summary', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field events-field-wide">
                                            <span>
                                                Full details
                                                <em className="news-char-count">
                                                    {form.body.length}/{BODY_MAX}
                                                </em>
                                            </span>
                                            <textarea
                                                rows={5}
                                                maxLength={BODY_MAX}
                                                value={form.body}
                                                placeholder="Shown when visitors click 'Read more'. Line breaks are kept."
                                                onChange={e => update('body', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field">
                                            <span>Button link</span>
                                            <input
                                                value={form.linkUrl}
                                                placeholder="https://… or #events"
                                                maxLength={1000}
                                                onChange={e => update('linkUrl', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field">
                                            <span>Button text</span>
                                            <input
                                                value={form.linkText}
                                                placeholder="Learn more"
                                                maxLength={60}
                                                disabled={!form.linkUrl.trim()}
                                                onChange={e => update('linkText', e.target.value)}
                                            />
                                        </label>

                                        <div className="news-form-section events-field-wide">
                                            <strong>Event details</strong>
                                            <small>
                                                Optional. Shown in the banner instead of
                                                dates, with a map and directions.
                                            </small>
                                        </div>

                                        <label className="events-field">
                                            <span>Event starts</span>
                                            <input
                                                type="datetime-local"
                                                value={form.eventStartsAt}
                                                onChange={e => update('eventStartsAt', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field">
                                            <span>Event ends</span>
                                            <input
                                                type="datetime-local"
                                                value={form.eventEndsAt}
                                                min={form.eventStartsAt || undefined}
                                                onChange={e => update('eventEndsAt', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field events-field-wide">
                                            <span>Venue name</span>
                                            <input
                                                value={form.venueName}
                                                maxLength={150}
                                                placeholder="RCCG Hope House"
                                                onChange={e => update('venueName', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field events-field-wide">
                                            <span className="news-field-label-row">
                                                Address &amp; postcode
                                                <button
                                                    type="button"
                                                    className="news-link-button"
                                                    onClick={() => void fillChurchAddress()}
                                                    disabled={fillingAddress}
                                                >
                                                    {fillingAddress ? 'Loading…' : 'Use church address'}
                                                </button>
                                            </span>
                                            <textarea
                                                rows={2}
                                                maxLength={300}
                                                value={form.venueAddress}
                                                placeholder="230 Burnt Oak Broadway, Edgware, HA8 0AP"
                                                onChange={e => update('venueAddress', e.target.value)}
                                            />
                                            {form.venueAddress.trim() && (
                                                <a
                                                    className="news-map-check"
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                        [form.venueName, form.venueAddress]
                                                            .map(v => v.trim())
                                                            .filter(Boolean)
                                                            .join(', ')
                                                    )}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Check this address on Google Maps ↗
                                                </a>
                                            )}
                                        </label>

                                        <div className="news-form-section events-field-wide">
                                            <strong>When to show it</strong>
                                            <small>
                                                When the banner appears on the website — usually
                                                from today until the event ends.
                                            </small>
                                        </div>

                                        <label className="events-field">
                                            <span>Show from</span>
                                            <input
                                                type="datetime-local"
                                                value={form.startsAt}
                                                onChange={e => update('startsAt', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field">
                                            <span>Show until (optional)</span>
                                            <input
                                                type="datetime-local"
                                                value={form.endsAt}
                                                min={form.startsAt || undefined}
                                                onChange={e => update('endsAt', e.target.value)}
                                            />
                                        </label>

                                        <label className="events-field">
                                            <span>Display order</span>
                                            <input
                                                type="number"
                                                min={0}
                                                value={form.displayOrder}
                                                onChange={e => update('displayOrder', e.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <aside className="news-form-side">
                                        <div className="news-poster-field">
                                            <span className="news-side-label">Poster / flyer</span>

                                            {posterPreview ? (
                                                <div className="news-poster-preview">
                                                    <img src={posterPreview} alt="Poster preview" />
                                                    <div className="news-poster-actions">
                                                        <label className="events-secondary-button">
                                                            Replace
                                                            <input
                                                                type="file"
                                                                accept="image/jpeg,image/png,image/webp"
                                                                onChange={handlePosterChange}
                                                                hidden
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="events-secondary-button"
                                                            onClick={clearPoster}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="news-poster-drop">
                                                    <span aria-hidden="true">🖼️</span>
                                                    <strong>Upload a poster</strong>
                                                    <small>JPEG, PNG or WebP, up to 10MB</small>
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        onChange={handlePosterChange}
                                                        hidden
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        <div className="news-preview">
                                            <span className="news-side-label">Banner preview</span>
                                            <div className={`news-preview-card news-preview-${form.type.toLowerCase()}`}>
                                                <div className="news-preview-head">News &amp; Updates</div>
                                                <div className="news-preview-body">
                                                    <div className="news-preview-thumb">
                                                        {posterPreview ? (
                                                            <img src={posterPreview} alt="" />
                                                        ) : (
                                                            <span>▤</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <em>{form.type}</em>
                                                        <strong>
                                                            {form.title.trim() || 'Your headline'}
                                                        </strong>
                                                        <p>
                                                            {form.summary.trim() ||
                                                                'Your short summary appears here.'}
                                                        </p>
                                                        {previewWhen && (
                                                            <span className="news-preview-meta">
                                                                📅 {previewWhen}
                                                            </span>
                                                        )}
                                                        {(form.venueName.trim() || form.venueAddress.trim()) && (
                                                            <span className="news-preview-meta">
                                                                📍 {form.venueName.trim() ||
                                                                    form.venueAddress.split(',')[0].trim()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </aside>
                                </div>

                                <div className="events-form-options">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.isPublished}
                                            onChange={e => update('isPublished', e.target.checked)}
                                        />
                                        <span>
                                            <strong>Published</strong>
                                            <small>
                                                Visible on the website between the “Show from” and
                                                “Show until” dates.
                                            </small>
                                        </span>
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.showInBanner}
                                            onChange={e => update('showInBanner', e.target.checked)}
                                        />
                                        <span>
                                            <strong>Show in floating banner</strong>
                                            <small>
                                                Pops up on the home page. Visitors who close it
                                                will see it again when you post or edit something.
                                            </small>
                                        </span>
                                    </label>
                                </div>

                                <div className="events-modal-actions">
                                    <button
                                        type="button"
                                        className="events-secondary-button"
                                        onClick={closeForm}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : editing
                                                ? 'Save Changes'
                                                : form.isPublished
                                                    ? 'Publish'
                                                    : 'Save Draft'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmDialog
                    open={confirmation.open}
                    title={confirmation.title}
                    message={confirmation.message}
                    confirmText={confirmation.confirmText}
                    cancelText="Cancel"
                    variant={confirmation.variant}
                    loading={confirming}
                    loadingText="Please wait..."
                    onConfirm={() => void runConfirmation()}
                    onCancel={() => !confirming && setConfirmation(emptyConfirmation)}
                />
            </div>
        </AdminLayout>
    );
}
