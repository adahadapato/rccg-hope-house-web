import {
    useCallback,
    useEffect,
    useState,
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

import {
    BIRTHDAY_WISHES_CHANGED_EVENT,
    type AdminBirthdayWish,
    type BirthdayWishStats,
    type BirthdayWishStatus,
} from '@/hooks/useBirthdayWishes';

import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/birthday-wishes.css';

type WishTab = BirthdayWishStatus | 'All';

const TABS: { value: WishTab; label: string }[] = [
    { value: 'Pending', label: 'Needs review' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'All', label: 'All' },
];

const EMPTY_STATS: BirthdayWishStats = {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
};

const SOURCE_LABELS: Record<string, string> = {
    Ai: 'AI check',
    Admin: 'Admin',
    System: 'Automatic rule',
};

const STATUS_LABELS: Record<BirthdayWishStatus, string> = {
    Pending: 'Needs review',
    Approved: 'Showing',
    Rejected: 'Rejected',
};

function formatDateTime(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function getImageUrl(path: string | null): string | null {
    if (!path) {
        return null;
    }

    return path.startsWith('http://') || path.startsWith('https://')
        ? path
        : apiUrl(path);
}

function tabCount(tab: WishTab, stats: BirthdayWishStats): number {
    switch (tab) {
        case 'Pending': return stats.pendingCount;
        case 'Approved': return stats.approvedCount;
        case 'Rejected': return stats.rejectedCount;
        default: return stats.pendingCount + stats.approvedCount + stats.rejectedCount;
    }
}

function BirthdayWishes() {
    const [tab, setTab] = useState<WishTab>('Pending');
    const [wishes, setWishes] = useState<AdminBirthdayWish[]>([]);
    const [stats, setStats] = useState<BirthdayWishStats>(EMPTY_STATS);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<ApiErrorDetails | null>(null);
    const [retrying, setRetrying] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const [busyId, setBusyId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [deleteWish, setDeleteWish] = useState<AdminBirthdayWish | null>(null);

    /* ========== LOAD LIST + COUNTS ========== */

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                const statusQuery = tab === 'All' ? '' : `?status=${tab}`;

                const [listResponse, statsResponse] = await Promise.all([
                    apiFetch(`/api/birthday-wishes/admin${statusQuery}`, {
                        signal: controller.signal,
                    }),
                    apiFetch('/api/birthday-wishes/admin/stats', {
                        signal: controller.signal,
                    }),
                ]);

                if (!listResponse.ok) {
                    throw await getApiErrorDetails(
                        listResponse,
                        'Birthday wishes could not be loaded.'
                    );
                }

                const list = (await listResponse.json()) as AdminBirthdayWish[];

                const nextStats = statsResponse.ok
                    ? ((await statsResponse.json()) as BirthdayWishStats)
                    : null;

                if (controller.signal.aborted) {
                    return;
                }

                setWishes(Array.isArray(list) ? list : []);

                if (nextStats) {
                    setStats(nextStats);
                }

                setLoadError(null);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setLoadError(
                    error && typeof error === 'object' && 'message' in error
                        ? (error as ApiErrorDetails)
                        : getNetworkErrorDetails(error)
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setRetrying(false);
                }
            }
        };

        void load();

        return () => controller.abort();
    }, [tab, reloadKey]);

    const reload = useCallback(() => {
        setReloadKey(key => key + 1);
        window.dispatchEvent(new Event(BIRTHDAY_WISHES_CHANGED_EVENT));
    }, []);

    const changeTab = (next: WishTab) => {
        if (next === tab) {
            return;
        }

        setLoading(true);
        setTab(next);
    };

    const retry = async () => {
        setRetrying(true);
        setReloadKey(key => key + 1);
        return true;
    };

    /* ========== ACTIONS ========== */

    const runAction = async (
        wish: AdminBirthdayWish,
        path: string,
        method: 'POST' | 'DELETE',
        success: string
    ) => {
        setBusyId(wish.id);
        setActionError(null);
        setSuccessMessage(null);

        try {
            const response = await apiFetch(path, { method });

            if (!response.ok) {
                throw await getApiErrorDetails(
                    response,
                    'The change could not be saved.'
                );
            }

            setSuccessMessage(success);
            reload();
        } catch (error) {
            setActionError(
                error && typeof error === 'object' && 'message' in error
                    ? String((error as ApiErrorDetails).message)
                    : 'The change could not be saved.'
            );
        } finally {
            setBusyId(null);
        }
    };

    const approve = (wish: AdminBirthdayWish) =>
        void runAction(
            wish,
            `/api/birthday-wishes/admin/${wish.id}/approve`,
            'POST',
            `${wish.authorName}'s wish is now showing on the website.`
        );

    const reject = (wish: AdminBirthdayWish) =>
        void runAction(
            wish,
            `/api/birthday-wishes/admin/${wish.id}/reject`,
            'POST',
            `${wish.authorName}'s wish has been rejected and is hidden.`
        );

    const confirmDelete = async () => {
        if (!deleteWish) {
            return;
        }

        await runAction(
            deleteWish,
            `/api/birthday-wishes/admin/${deleteWish.id}`,
            'DELETE',
            `${deleteWish.authorName}'s wish has been deleted.`
        );

        setDeleteWish(null);
    };

    /* ========== RENDER ========== */

    return (
        <AdminLayout>
            <section className="wishes-admin-page">
                <div className="wishes-admin-header">
                    <div>
                        <span className="admin-eyebrow">Gallery</span>

                        <h1>Birthday Wishes</h1>

                        <p>
                            Wishes visitors leave on Celebrants of the Month photos.
                            The AI check shows kind wishes straight away, rejects
                            unacceptable ones and sends anything it is unsure about
                            here for you to decide. Wishes are only shown on the
                            website; nothing is sent to members.
                        </p>
                    </div>

                    {stats.pendingCount > 0 && (
                        <div className="wishes-header-pending">
                            <span>{stats.pendingCount}</span>

                            <div>
                                <strong>Needs review</strong>
                                <small>
                                    wish{stats.pendingCount === 1 ? '' : 'es'} waiting
                                </small>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className="wishes-tabs"
                    role="tablist"
                    aria-label="Filter wishes"
                >
                    {TABS.map(item => (
                        <button
                            key={item.value}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.value}
                            className={`wishes-tab ${tab === item.value ? 'active' : ''}`}
                            onClick={() => changeTab(item.value)}
                        >
                            {item.label}
                            <span>{tabCount(item.value, stats)}</span>
                        </button>
                    ))}
                </div>

                {actionError && (
                    <div
                        className="admin-message admin-message-error"
                        role="alert"
                    >
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
                    <div
                        className="admin-message admin-message-success"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}

                {loading ? (
                    <div className="admin-empty-state">
                        <div className="admin-loading-spinner" />
                        <p>Loading birthday wishes...</p>
                    </div>
                ) : loadError ? (
                    <ApiErrorState
                        status={loadError.status}
                        title={loadError.title}
                        message={loadError.message}
                        onRetry={retry}
                        retrying={retrying}
                    />
                ) : wishes.length === 0 ? (
                    <div className="admin-panel admin-empty-state">
                        <span className="admin-empty-icon">🎂</span>
                        <p>
                            {tab === 'Pending'
                                ? 'Nothing needs review. All caught up!'
                                : 'No wishes here yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="wishes-list">
                        {wishes.map(wish => {
                            const thumbnail = getImageUrl(wish.imageThumbnailPath);
                            const busy = busyId === wish.id;

                            return (
                                <article
                                    key={wish.id}
                                    className={`admin-panel wish-card wish-card-${wish.status.toLowerCase()}`}
                                >
                                    <div className="wish-card-photo">
                                        {thumbnail ? (
                                            <img
                                                src={thumbnail}
                                                alt=""
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span aria-hidden="true">🎂</span>
                                        )}
                                    </div>

                                    <div className="wish-card-body">
                                        <div className="wish-card-top">
                                            <span className="wish-card-photo-title">
                                                For {wish.imageTitle ?? 'a celebrant'}
                                            </span>

                                            <span className={`wish-status wish-status-${wish.status.toLowerCase()}`}>
                                                {STATUS_LABELS[wish.status] ?? wish.status}
                                            </span>
                                        </div>

                                        <p className="wish-card-message">{wish.message}</p>

                                        <p className="wish-card-author">
                                            From <strong>{wish.authorName}</strong>
                                            {' · '}
                                            {formatDateTime(wish.createdAt)}
                                        </p>

                                        {wish.decisionReason && (
                                            <p className="wish-card-reason">
                                                <strong>
                                                    {SOURCE_LABELS[wish.decisionSource] ?? wish.decisionSource}:
                                                </strong>{' '}
                                                {wish.decisionReason}
                                                {wish.decisionSource === 'Admin' && wish.moderatedBy && (
                                                    <> ({wish.moderatedBy}, {formatDateTime(wish.moderatedAt)})</>
                                                )}
                                            </p>
                                        )}

                                        <div className="wish-card-actions">
                                            {wish.status !== 'Approved' && (
                                                <button
                                                    type="button"
                                                    className="admin-primary-button wish-approve"
                                                    onClick={() => approve(wish)}
                                                    disabled={busy}
                                                >
                                                    ✓ Approve
                                                </button>
                                            )}

                                            {wish.status !== 'Rejected' && (
                                                <button
                                                    type="button"
                                                    className="admin-secondary-button"
                                                    onClick={() => reject(wish)}
                                                    disabled={busy}
                                                >
                                                    {wish.status === 'Approved' ? 'Hide (reject)' : 'Reject'}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="admin-secondary-button wish-delete"
                                                onClick={() => setDeleteWish(wish)}
                                                disabled={busy}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <ConfirmDialog
                    open={deleteWish !== null}
                    title="Delete Birthday Wish"
                    message={
                        deleteWish
                            ? `Permanently delete the wish from ${deleteWish.authorName}? This cannot be undone.`
                            : ''
                    }
                    confirmText="Delete Wish"
                    loadingText="Deleting..."
                    variant="danger"
                    loading={deleteWish !== null && busyId === deleteWish.id}
                    onConfirm={() => void confirmDelete()}
                    onCancel={() => setDeleteWish(null)}
                />
            </section>
        </AdminLayout>
    );
}

export default BirthdayWishes;
