import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';

import {
    apiFetch,
    getApiErrorDetails,
    getNetworkErrorDetails,
    type ApiErrorDetails,
} from '@/api/api';

import ApiErrorState from '@/components/sections/ApiErrorState';
import ConfirmDialog from '@/components/sections/ConfirmDialog';

import AdminLayout from '../components/AdminLayout';
import AdminActionButtons from '../components/AdminActionButtons';

import '../styles/admin.css';
import '../styles/prayer-request.css';


/* ============================================================
   TYPES
   ============================================================ */

type PrayerStatus =
    | 'pending'
    | 'in-progress'
    | 'resolved';

type PrayerFilter =
    | 'all'
    | PrayerStatus;

type PrayerRequestStatusValue =
    | number
    | string;

interface PrayerRequestItem {
    id: string;
    requesterName: string;
    isAnonymous: boolean;
    requesterEmail: string | null;
    phoneNumber: string | null;
    content: string;
    status: PrayerRequestStatusValue;
    createdAt: string;
    pastoralNote: string | null;
    respondedAt: string | null;
}

interface PrayerRequestStats {
    pendingCount: number;
    inProgressCount: number;
    resolvedCount: number;
    totalCount: number;
}

interface ManagePrayerFormState {
    status: PrayerStatus;
    pastoralNote: string;
}


/* ============================================================
   CONSTANTS
   ============================================================ */

const emptyManageForm: ManagePrayerFormState = {
    status: 'pending',
    pastoralNote: '',
};


/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Converts the PrayerRequestStatus value returned by the API
 * into the frontend status used by the administration page.
 *
 * The helper supports both the default numeric ASP.NET enum
 * serialization and string enum serialization.
 */
function normalisePrayerStatus(
    status: PrayerRequestStatusValue
): PrayerStatus {
    if (
        status === 1 ||
        status === '1' ||
        status === 'InProgress' ||
        status === 'inProgress' ||
        status === 'in-progress'
    ) {
        return 'in-progress';
    }

    if (
        status === 2 ||
        status === '2' ||
        status === 'Resolved' ||
        status === 'resolved'
    ) {
        return 'resolved';
    }

    return 'pending';
}


/**
 * Returns a user-friendly label for a prayer request status.
 */
function prayerStatusLabel(
    status: PrayerRequestStatusValue
) {
    const normalised =
        normalisePrayerStatus(status);

    if (normalised === 'in-progress') {
        return 'In Progress';
    }

    if (normalised === 'resolved') {
        return 'Resolved';
    }

    return 'Pending';
}


/**
 * Converts the frontend status into the numeric value expected
 * by the PrayerRequestStatus enum in the API.
 */
function prayerStatusApiValue(
    status: PrayerStatus
) {
    if (status === 'in-progress') {
        return 1;
    }

    if (status === 'resolved') {
        return 2;
    }

    return 0;
}


/**
 * Formats an API date for display in the admin interface.
 */
function formatDateTime(
    value: string
) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
    ).format(date);
}


/**
 * Produces a compact prayer request preview for the table while
 * preserving the complete request for the detail modal.
 */
function prayerPreview(
    content: string,
    maximumLength = 100
) {
    const normalised =
        content
            .replace(/\s+/g, ' ')
            .trim();

    if (
        normalised.length <=
        maximumLength
    ) {
        return normalised;
    }

    return `${normalised.slice(
        0,
        maximumLength
    ).trim()}…`;
}


/**
 * Returns initials for the requester avatar.
 */
function requesterInitials(
    request: PrayerRequestItem
) {
    if (request.isAnonymous) {
        return 'A';
    }

    const parts =
        request.requesterName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 0) {
        return '?';
    }

    if (parts.length === 1) {
        return parts[0]
            .charAt(0)
            .toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[
        parts.length - 1
    ].charAt(0)}`.toUpperCase();
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function PrayerRequest() {
    const [
        prayerRequests,
        setPrayerRequests,
    ] = useState<PrayerRequestItem[]>([]);

    const [
        stats,
        setStats,
    ] = useState<PrayerRequestStats>({
        pendingCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        totalCount: 0,
    });

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        retrying,
        setRetrying,
    ] = useState(false);

    const [
        loadError,
        setLoadError,
    ] = useState<ApiErrorDetails | null>(
        null
    );

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(
        null
    );

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(
        null
    );

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        filter,
        setFilter,
    ] = useState<PrayerFilter>(
        'all'
    );

    const [
        selectedPrayer,
        setSelectedPrayer,
    ] = useState<PrayerRequestItem | null>(
        null
    );

    const [
        viewOpen,
        setViewOpen,
    ] = useState(false);

    const [
        managePrayer,
        setManagePrayer,
    ] = useState<PrayerRequestItem | null>(
        null
    );

    const [
        manageOpen,
        setManageOpen,
    ] = useState(false);

    const [
        manageForm,
        setManageForm,
    ] = useState<ManagePrayerFormState>(
        emptyManageForm
    );

    const [
        savingStatus,
        setSavingStatus,
    ] = useState(false);

    const [
        deletePrayer,
        setDeletePrayer,
    ] = useState<PrayerRequestItem | null>(
        null
    );

    const [
        deletingId,
        setDeletingId,
    ] = useState<string | null>(
        null
    );


    /* ========================================================
       FILTERING
       ======================================================== */

    const filteredPrayerRequests =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return prayerRequests.filter(
                prayer => {
                    const status =
                        normalisePrayerStatus(
                            prayer.status
                        );

                    if (
                        filter !== 'all' &&
                        status !== filter
                    ) {
                        return false;
                    }

                    if (!query) {
                        return true;
                    }

                    const searchable =
                        [
                            prayer.requesterName,
                            prayer.requesterEmail ??
                            '',
                            prayer.phoneNumber ??
                            '',
                            prayer.content,
                            prayer.pastoralNote ??
                            '',
                            prayerStatusLabel(
                                prayer.status
                            ),
                            prayer.isAnonymous
                                ? 'anonymous'
                                : '',
                        ]
                            .join(' ')
                            .toLowerCase();

                    return searchable.includes(
                        query
                    );
                }
            );
        }, [
            prayerRequests,
            filter,
            search,
        ]);


    /* ========================================================
       DATA LOADING
       ======================================================== */

    const fetchPrayerRequests =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/prayer-requests/admin/?skip=0&take=100',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load prayer requests.'
                    );
                }

                return (
                    await response.json()
                ) as PrayerRequestItem[];
            },
            []
        );


    const fetchPrayerStats =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/prayer-requests/admin/stats',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load prayer request statistics.'
                    );
                }

                return (
                    await response.json()
                ) as PrayerRequestStats;
            },
            []
        );


    const loadPrayerRequests =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                /*
                 * Load the request list first, followed by statistics.
                 * The calls are intentionally sequential so the page
                 * does not depend on concurrent server-side EF queries.
                 */
                const requestData =
                    await fetchPrayerRequests(
                        signal
                    );

                const statsData =
                    await fetchPrayerStats(
                        signal
                    );

                setPrayerRequests(
                    [...requestData].sort(
                        (a, b) =>
                            new Date(
                                b.createdAt
                            ).getTime() -
                            new Date(
                                a.createdAt
                            ).getTime()
                    )
                );

                setStats(statsData);
                setLoadError(null);
            },
            [
                fetchPrayerRequests,
                fetchPrayerStats,
            ]
        );


    useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(true);

                    await loadPrayerRequests(
                        controller.signal
                    );
                } catch (error) {
                    if (
                        controller.signal
                            .aborted
                    ) {
                        return;
                    }

                    if (
                        typeof error ===
                        'object' &&
                        error !== null &&
                        'message' in error
                    ) {
                        setLoadError(
                            error as ApiErrorDetails
                        );
                    } else {
                        setLoadError(
                            getNetworkErrorDetails()
                        );
                    }
                } finally {
                    if (
                        !controller.signal
                            .aborted
                    ) {
                        setLoading(false);
                    }
                }
            };

        void initialise();

        return () => {
            controller.abort();
        };
    }, [loadPrayerRequests]);


    async function retryLoad():
        Promise<boolean> {
        setRetrying(true);
        setActionError(null);
        setSuccessMessage(null);

        try {
            await loadPrayerRequests();

            return true;
        } catch (error) {
            if (
                typeof error ===
                'object' &&
                error !== null &&
                'message' in error
            ) {
                setLoadError(
                    error as ApiErrorDetails
                );
            } else {
                setLoadError(
                    getNetworkErrorDetails()
                );
            }

            return false;
        } finally {
            setRetrying(false);
        }
    }


    /* ========================================================
       COMMON ACTION HELPERS
       ======================================================== */

    function showSuccess(
        message: string
    ) {
        setSuccessMessage(
            message
        );

        window.setTimeout(
            () => {
                setSuccessMessage(
                    current =>
                        current ===
                            message
                            ? null
                            : current
                );
            },
            3500
        );
    }


    async function actionFailure(
        response: Response,
        fallback: string
    ) {
        const details =
            await getApiErrorDetails(
                response,
                fallback
            );

        throw new Error(
            details.message
        );
    }


    function updatePrayerLocally(
        id: string,
        update: (
            prayer: PrayerRequestItem
        ) => PrayerRequestItem
    ) {
        setPrayerRequests(
            current =>
                current.map(
                    prayer =>
                        prayer.id === id
                            ? update(
                                prayer
                            )
                            : prayer
                )
        );
    }


    /* ========================================================
       VIEW
       ======================================================== */

    async function openView(
        prayer: PrayerRequestItem
    ) {
        setActionError(null);
        setSuccessMessage(null);

        try {
            /*
             * Retrieve the detail record so the modal always has
             * the current pastoral note and status.
             */
            const response =
                await apiFetch(
                    `/api/prayer-requests/admin/${prayer.id}`
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to load the prayer request.'
                );
            }

            const detail =
                (
                    await response.json()
                ) as PrayerRequestItem;

            setSelectedPrayer(
                detail
            );

            setViewOpen(true);
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load the prayer request.'
            );
        }
    }


    function closeView() {
        setViewOpen(false);
        setSelectedPrayer(null);
    }


    /* ========================================================
       MANAGE STATUS
       ======================================================== */

    async function openManage(
        prayer: PrayerRequestItem
    ) {
        setActionError(null);
        setSuccessMessage(null);

        try {
            /*
             * Load the detail record before editing to ensure the
             * pastoral note is current.
             */
            const response =
                await apiFetch(
                    `/api/prayer-requests/admin/${prayer.id}`
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to load the prayer request.'
                );
            }

            const detail =
                (
                    await response.json()
                ) as PrayerRequestItem;

            setManagePrayer(
                detail
            );

            setManageForm({
                status:
                    normalisePrayerStatus(
                        detail.status
                    ),
                pastoralNote:
                    detail.pastoralNote ??
                    '',
            });

            setManageOpen(true);
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load the prayer request.'
            );
        }
    }


    function closeManage() {
        if (savingStatus) {
            return;
        }

        setManageOpen(false);
        setManagePrayer(null);
        setManageForm(
            emptyManageForm
        );
    }


    async function submitManage(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!managePrayer) {
            return;
        }

        setSavingStatus(true);
        setActionError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/prayer-requests/admin/${managePrayer.id}/status`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                newStatus:
                                    prayerStatusApiValue(
                                        manageForm.status
                                    ),
                                pastoralNote:
                                    manageForm
                                        .pastoralNote
                                        .trim() ||
                                    null,
                            }),
                    }
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to update the prayer request.'
                );
            }

            /*
             * Reload the saved detail from the server. This keeps
             * RespondedAt and other domain-generated values in sync.
             */
            const detailResponse =
                await apiFetch(
                    `/api/prayer-requests/admin/${managePrayer.id}`
                );

            if (!detailResponse.ok) {
                await actionFailure(
                    detailResponse,
                    'The prayer request was updated, but the refreshed details could not be loaded.'
                );
            }

            const updated =
                (
                    await detailResponse.json()
                ) as PrayerRequestItem;

            updatePrayerLocally(
                updated.id,
                () => updated
            );

            setSelectedPrayer(
                current =>
                    current?.id ===
                        updated.id
                        ? updated
                        : current
            );

            /*
             * Refresh server-side statistics because the status
             * change may have moved the request between categories.
             */
            const updatedStats =
                await fetchPrayerStats();

            setStats(updatedStats);

            setManageOpen(false);
            setManagePrayer(null);
            setManageForm(
                emptyManageForm
            );

            showSuccess(
                'Prayer request updated successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : 'Unable to update the prayer request.'
            );
        } finally {
            setSavingStatus(false);
        }
    }


    /* ========================================================
       DELETE
       ======================================================== */

    function requestDelete(
        prayer: PrayerRequestItem
    ) {
        setActionError(null);
        setSuccessMessage(null);

        setDeletePrayer(
            prayer
        );
    }


    function closeDeleteConfirmation() {
        if (deletingId) {
            return;
        }

        setDeletePrayer(null);
    }


    async function confirmDelete() {
        if (!deletePrayer) {
            return;
        }

        const prayer =
            deletePrayer;

        setDeletingId(
            prayer.id
        );

        setActionError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/prayer-requests/admin/${prayer.id}`,
                    {
                        method: 'DELETE',
                    }
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to delete the prayer request.'
                );
            }

            setPrayerRequests(
                current =>
                    current.filter(
                        item =>
                            item.id !==
                            prayer.id
                    )
            );

            if (
                selectedPrayer?.id ===
                prayer.id
            ) {
                setViewOpen(false);
                setSelectedPrayer(null);
            }

            if (
                managePrayer?.id ===
                prayer.id
            ) {
                setManageOpen(false);
                setManagePrayer(null);
                setManageForm(
                    emptyManageForm
                );
            }

            /*
             * Refresh statistics after deletion so the dashboard
             * continues to reflect the persisted data.
             */
            try {
                const updatedStats =
                    await fetchPrayerStats();

                setStats(updatedStats);
            } catch {
                /*
                 * The deletion itself has succeeded. If refreshing
                 * statistics fails, derive the visible counts from
                 * the previous server values until the next reload.
                 */
                const deletedStatus =
                    normalisePrayerStatus(
                        prayer.status
                    );

                setStats(
                    current => ({
                        pendingCount:
                            deletedStatus ===
                                'pending'
                                ? Math.max(
                                    0,
                                    current.pendingCount -
                                    1
                                )
                                : current.pendingCount,

                        inProgressCount:
                            deletedStatus ===
                                'in-progress'
                                ? Math.max(
                                    0,
                                    current.inProgressCount -
                                    1
                                )
                                : current.inProgressCount,

                        resolvedCount:
                            deletedStatus ===
                                'resolved'
                                ? Math.max(
                                    0,
                                    current.resolvedCount -
                                    1
                                )
                                : current.resolvedCount,

                        totalCount:
                            Math.max(
                                0,
                                current.totalCount -
                                1
                            ),
                    })
                );
            }

            setDeletePrayer(null);

            showSuccess(
                'Prayer request deleted successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : 'Unable to delete the prayer request.'
            );

            setDeletePrayer(null);
        } finally {
            setDeletingId(null);
        }
    }


    /* ========================================================
       RENDER
       ======================================================== */

    return (
        <AdminLayout>
            <section className="prayer-admin-page">

                {/* =================================================
                    HEADER
                   ================================================= */}

                <div className="prayer-admin-header">
                    <div>
                        <span className="admin-eyebrow">
                            Connect
                        </span>

                        <h1>
                            Prayer Requests
                        </h1>

                        <p>
                            Review prayer requests submitted through
                            RCCG Hope House, track pastoral progress
                            and record internal pastoral notes.
                        </p>
                    </div>

                    {!loading &&
                        !loadError && (
                            <div className="prayer-header-pending">
                                <span>
                                    {stats.pendingCount}
                                </span>

                                <div>
                                    <strong>
                                        Pending
                                    </strong>

                                    <small>
                                        request
                                        {stats.pendingCount === 1
                                            ? ''
                                            : 's'}
                                    </small>
                                </div>
                            </div>
                        )}
                </div>


                {/* =================================================
                    ACTION MESSAGES
                   ================================================= */}

                {actionError && (
                    <div
                        className="admin-message admin-message-error"
                        role="alert"
                    >
                        <div>
                            <strong>
                                Something went wrong
                            </strong>

                            <p>
                                {actionError}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setActionError(
                                    null
                                )
                            }
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


                {/* =================================================
                    LOADING / ERROR / CONTENT
                   ================================================= */}

                {loading ? (
                    <div className="admin-empty-state">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading prayer requests...
                        </strong>
                    </div>
                ) : loadError ? (
                    <ApiErrorState
                        status={
                            loadError.status
                        }
                        title={
                            loadError.title
                        }
                        message={
                            loadError.message
                        }
                        onRetry={
                            retryLoad
                        }
                        retrying={
                            retrying
                        }
                    />
                ) : (
                    <>

                        {/* =========================================
                            SUMMARY
                           ========================================= */}

                        <div className="prayer-summary-grid">
                            <div className="prayer-summary-card">
                                <span className="prayer-summary-icon">
                                    ♡
                                </span>

                                <div>
                                    <strong>
                                        {stats.totalCount}
                                    </strong>

                                    <small>
                                        Total Requests
                                    </small>
                                </div>
                            </div>


                            <div className="prayer-summary-card pending">
                                <span className="prayer-summary-icon">
                                    ●
                                </span>

                                <div>
                                    <strong>
                                        {stats.pendingCount}
                                    </strong>

                                    <small>
                                        Pending
                                    </small>
                                </div>
                            </div>


                            <div className="prayer-summary-card in-progress">
                                <span className="prayer-summary-icon">
                                    ◷
                                </span>

                                <div>
                                    <strong>
                                        {stats.inProgressCount}
                                    </strong>

                                    <small>
                                        In Progress
                                    </small>
                                </div>
                            </div>


                            <div className="prayer-summary-card resolved">
                                <span className="prayer-summary-icon">
                                    ✓
                                </span>

                                <div>
                                    <strong>
                                        {stats.resolvedCount}
                                    </strong>

                                    <small>
                                        Resolved
                                    </small>
                                </div>
                            </div>
                        </div>


                        {/* =========================================
                            PRAYER REQUEST MANAGEMENT
                           ========================================= */}

                        <article className="admin-panel prayer-management-panel">

                            <div className="prayer-toolbar">
                                <div>
                                    <h2>
                                        Prayer Request Inbox
                                    </h2>

                                    <p>
                                        View, manage and track prayer
                                        requests submitted through the
                                        website.
                                    </p>
                                </div>

                                <div className="prayer-toolbar-controls">
                                    <input
                                        type="search"
                                        value={
                                            search
                                        }
                                        onChange={
                                            event =>
                                                setSearch(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        placeholder="Search prayer requests..."
                                        aria-label="Search prayer requests"
                                        className="prayer-search"
                                    />

                                    <select
                                        value={
                                            filter
                                        }
                                        onChange={
                                            event =>
                                                setFilter(
                                                    event
                                                        .target
                                                        .value as PrayerFilter
                                                )
                                        }
                                        aria-label="Filter prayer requests"
                                        className="prayer-filter"
                                    >
                                        <option value="all">
                                            All requests
                                        </option>

                                        <option value="pending">
                                            Pending
                                        </option>

                                        <option value="in-progress">
                                            In Progress
                                        </option>

                                        <option value="resolved">
                                            Resolved
                                        </option>
                                    </select>
                                </div>
                            </div>


                            {prayerRequests.length === 0 ? (
                                <div className="admin-empty-state">
                                    <span className="admin-empty-icon">
                                        ♡
                                    </span>

                                    <strong>
                                        No prayer requests
                                    </strong>

                                    <p>
                                        Prayer requests will appear
                                        here when visitors submit them.
                                    </p>
                                </div>
                            ) : filteredPrayerRequests.length === 0 ? (
                                <div className="admin-empty-state">
                                    <strong>
                                        No matching prayer requests
                                    </strong>

                                    <p>
                                        Try changing your search or
                                        status filter.
                                    </p>
                                </div>
                            ) : (
                                <div className="admin-table-wrapper">
                                    <table className="admin-data-table prayer-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Requester
                                                </th>

                                                <th>
                                                    Prayer Request
                                                </th>

                                                <th>
                                                    Submitted
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredPrayerRequests.map(
                                                prayer => {
                                                    const status =
                                                        normalisePrayerStatus(
                                                            prayer.status
                                                        );

                                                    return (
                                                        <tr
                                                            key={
                                                                prayer.id
                                                            }
                                                            className={
                                                                status ===
                                                                    'pending'
                                                                    ? 'prayer-row-pending'
                                                                    : undefined
                                                            }
                                                        >
                                                            <td>
                                                                <div className="prayer-requester-cell">
                                                                    <div className="prayer-avatar">
                                                                        {requesterInitials(
                                                                            prayer
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                prayer.requesterName
                                                                            }
                                                                        </strong>

                                                                        {prayer.isAnonymous ? (
                                                                            <small>
                                                                                Anonymous submission
                                                                            </small>
                                                                        ) : (
                                                                            <>
                                                                                <small>
                                                                                    {prayer.requesterEmail ??
                                                                                        'No email provided'}
                                                                                </small>

                                                                                {prayer.phoneNumber && (
                                                                                    <small>
                                                                                        {
                                                                                            prayer.phoneNumber
                                                                                        }
                                                                                    </small>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <p className="prayer-content-preview">
                                                                    {prayerPreview(
                                                                        prayer.content
                                                                    )}
                                                                </p>
                                                            </td>

                                                            <td>
                                                                <span className="prayer-date">
                                                                    {formatDateTime(
                                                                        prayer.createdAt
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`prayer-status prayer-status-${status}`}
                                                                >
                                                                    {prayerStatusLabel(
                                                                        prayer.status
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <AdminActionButtons
                                                                    itemName={
                                                                        prayer.requesterName
                                                                    }
                                                                    onView={() =>
                                                                        void openView(
                                                                            prayer
                                                                        )
                                                                    }
                                                                    onEdit={() =>
                                                                        void openManage(
                                                                            prayer
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        requestDelete(
                                                                            prayer
                                                                        )
                                                                    }
                                                                    viewTitle="View prayer request"
                                                                    editTitle="Manage status and pastoral note"
                                                                    deleteTitle="Delete prayer request"
                                                                    disabled={
                                                                        deletingId ===
                                                                        prayer.id
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </article>
                    </>
                )}


                {/* =================================================
                    VIEW PRAYER REQUEST MODAL
                   ================================================= */}

                {viewOpen &&
                    selectedPrayer && (
                        <div
                            className="admin-modal-backdrop"
                            role="presentation"
                        >
                            <div
                                className="admin-modal prayer-view-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="prayer-view-title"
                            >
                                <div className="prayer-modal-header">
                                    <div>
                                        <span className="admin-eyebrow">
                                            Prayer Request
                                        </span>

                                        <h2 id="prayer-view-title">
                                            {selectedPrayer.requesterName}
                                        </h2>

                                        <p>
                                            Submitted{' '}
                                            {formatDateTime(
                                                selectedPrayer.createdAt
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="prayer-modal-close"
                                        onClick={
                                            closeView
                                        }
                                        aria-label="Close prayer request"
                                    >
                                        ×
                                    </button>
                                </div>


                                <div className="prayer-view-body">
                                    <div className="prayer-detail-grid">
                                        <div className="prayer-detail-card">
                                            <span>
                                                Requester
                                            </span>

                                            <strong>
                                                {
                                                    selectedPrayer.requesterName
                                                }
                                            </strong>
                                        </div>

                                        <div className="prayer-detail-card">
                                            <span>
                                                Submission
                                            </span>

                                            <strong>
                                                {selectedPrayer.isAnonymous
                                                    ? 'Anonymous'
                                                    : 'Named'}
                                            </strong>
                                        </div>

                                        <div className="prayer-detail-card">
                                            <span>
                                                Email
                                            </span>

                                            <strong>
                                                {selectedPrayer.requesterEmail ??
                                                    'Not provided'}
                                            </strong>
                                        </div>

                                        <div className="prayer-detail-card">
                                            <span>
                                                Phone
                                            </span>

                                            <strong>
                                                {selectedPrayer.phoneNumber ??
                                                    'Not provided'}
                                            </strong>
                                        </div>

                                        <div className="prayer-detail-card">
                                            <span>
                                                Status
                                            </span>

                                            <strong>
                                                {prayerStatusLabel(
                                                    selectedPrayer.status
                                                )}
                                            </strong>
                                        </div>

                                        <div className="prayer-detail-card">
                                            <span>
                                                Resolved
                                            </span>

                                            <strong>
                                                {selectedPrayer.respondedAt
                                                    ? formatDateTime(
                                                        selectedPrayer.respondedAt
                                                    )
                                                    : 'Not yet'}
                                            </strong>
                                        </div>
                                    </div>


                                    <div className="prayer-full-request">
                                        <span>
                                            Prayer Request
                                        </span>

                                        <p>
                                            {
                                                selectedPrayer.content
                                            }
                                        </p>
                                    </div>


                                    <div className="prayer-pastoral-note">
                                        <span>
                                            Pastoral Note
                                        </span>

                                        <p>
                                            {selectedPrayer.pastoralNote ??
                                                'No pastoral note has been added.'}
                                        </p>
                                    </div>
                                </div>


                                <div className="admin-modal-actions prayer-modal-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            closeView
                                        }
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={() => {
                                            const prayer =
                                                selectedPrayer;

                                            setViewOpen(
                                                false
                                            );

                                            setSelectedPrayer(
                                                null
                                            );

                                            void openManage(
                                                prayer
                                            );
                                        }}
                                    >
                                        Manage Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                {/* =================================================
                    MANAGE PRAYER REQUEST MODAL
                   ================================================= */}

                {manageOpen &&
                    managePrayer && (
                        <div
                            className="admin-modal-backdrop"
                            role="presentation"
                        >
                            <div
                                className="admin-modal prayer-manage-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="prayer-manage-title"
                            >
                                <div className="prayer-modal-header">
                                    <div>
                                        <span className="admin-eyebrow">
                                            Pastoral Management
                                        </span>

                                        <h2 id="prayer-manage-title">
                                            Manage{' '}
                                            {managePrayer.requesterName}
                                        </h2>

                                        <p>
                                            Update the prayer workflow
                                            status and record an internal
                                            pastoral note.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="prayer-modal-close"
                                        onClick={
                                            closeManage
                                        }
                                        disabled={
                                            savingStatus
                                        }
                                        aria-label="Close prayer request management"
                                    >
                                        ×
                                    </button>
                                </div>


                                <form
                                    onSubmit={
                                        submitManage
                                    }
                                >
                                    <div className="prayer-manage-body">

                                        <div className="prayer-manage-request">
                                            <span>
                                                Prayer Request
                                            </span>

                                            <p>
                                                {
                                                    managePrayer.content
                                                }
                                            </p>
                                        </div>


                                        <div className="admin-form-group">
                                            <label htmlFor="prayer-status">
                                                Status
                                                <span>
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                id="prayer-status"
                                                value={
                                                    manageForm.status
                                                }
                                                onChange={
                                                    event =>
                                                        setManageForm(
                                                            current => ({
                                                                ...current,
                                                                status:
                                                                    event
                                                                        .target
                                                                        .value as PrayerStatus,
                                                            })
                                                        )
                                                }
                                                required
                                                disabled={
                                                    savingStatus
                                                }
                                            >
                                                <option value="pending">
                                                    Pending
                                                </option>

                                                <option value="in-progress">
                                                    In Progress
                                                </option>

                                                <option value="resolved">
                                                    Resolved
                                                </option>
                                            </select>
                                        </div>


                                        <div className="admin-form-group">
                                            <label htmlFor="prayer-pastoral-note">
                                                Pastoral Note
                                            </label>

                                            <textarea
                                                id="prayer-pastoral-note"
                                                rows={
                                                    8
                                                }
                                                value={
                                                    manageForm.pastoralNote
                                                }
                                                onChange={
                                                    event =>
                                                        setManageForm(
                                                            current => ({
                                                                ...current,
                                                                pastoralNote:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                                placeholder="Add an internal pastoral note..."
                                                disabled={
                                                    savingStatus
                                                }
                                            />
                                        </div>

                                        <p className="prayer-note-help">
                                            Pastoral notes are for internal
                                            prayer team use and are not shown
                                            to the requester.
                                        </p>
                                    </div>


                                    <div className="admin-modal-actions prayer-modal-actions">
                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            onClick={
                                                closeManage
                                            }
                                            disabled={
                                                savingStatus
                                            }
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="admin-primary-button"
                                            disabled={
                                                savingStatus
                                            }
                                        >
                                            {savingStatus
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}


                {/* =================================================
                    DELETE CONFIRMATION
                   ================================================= */}

                <ConfirmDialog
                    open={
                        deletePrayer !== null
                    }
                    title="Delete Prayer Request"
                    message={
                        deletePrayer
                            ? `Are you sure you want to permanently delete the prayer request from ${deletePrayer.requesterName}? This action cannot be undone.`
                            : ''
                    }
                    confirmText="Delete Request"
                    loadingText="Deleting..."
                    variant="danger"
                    loading={
                        deletingId !== null
                    }
                    onConfirm={() =>
                        void confirmDelete()
                    }
                    onCancel={
                        closeDeleteConfirmation
                    }
                />

            </section>
        </AdminLayout>
    );
}