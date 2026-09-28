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
import '../styles/admin-events.css';

interface ChurchEvent {
    id: string;
    title: string;
    category: string;
    startDateTime: string;
    endDateTime: string | null;
    description: string | null;
    location: string | null;
    icon: string | null;
    color: string | null;
    registrationUrl: string | null;
    registrationButtonText: string;
    imageUrl: string | null;
    isActive: boolean;
    displayOrder: number;
}

interface EventFormState {
    title: string;
    category: string;
    startDateTime: string;
    endDateTime: string;
    description: string;
    location: string;
    icon: string;
    color: string;
    registrationUrl: string;
    registrationButtonText: string;
    imageUrl: string;
    displayOrder: string;
    isActive: boolean;
}

interface ConfirmationState {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant:
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger';
    action: (() => Promise<void>) | null;
}

const serviceCategories = [
    'WednesdayPrayer',
    'SundaySchool',
    'WorshipService',
    'ThanksgivingService',
    'LastFridayVigil',
    'Evangelism',
    'HouseFellowship',
    'SpecialEvent',
    'HolyCommunion',
    'HolyGhostService',
];

const eventColors = [
    'gold',
    'blue',
    'rose',
];

const emptyEventForm: EventFormState = {
    title: '',
    category: 'SpecialEvent',
    startDateTime: '',
    endDateTime: '',
    description: '',
    location: '',
    icon: '',
    color: 'blue',
    registrationUrl: '',
    registrationButtonText: 'Register Now',
    imageUrl: '',
    displayOrder: '0',
    isActive: true,
};

const emptyConfirmation: ConfirmationState = {
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: null,
};

function humanise(value: string) {
    return value
        .replace(
            /([a-z])([A-Z])/g,
            '$1 $2'
        )
        .replace(
            /([A-Z])([A-Z][a-z])/g,
            '$1 $2'
        );
}

function toDateTimeLocal(
    value: string | null
) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    const offset =
        date.getTimezoneOffset();

    return new Date(
        date.getTime() -
        offset * 60_000
    )
        .toISOString()
        .slice(0, 16);
}

function toApiDateTime(
    value: string
) {
    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date.toISOString();
}

function formatEventDate(
    startDateTime: string,
    endDateTime: string | null
) {
    const start =
        new Date(startDateTime);

    if (
        Number.isNaN(
            start.getTime()
        )
    ) {
        return startDateTime;
    }

    if (!endDateTime) {
        return start.toLocaleDateString(
            'en-GB',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }
        );
    }

    const end =
        new Date(endDateTime);

    if (
        Number.isNaN(
            end.getTime()
        )
    ) {
        return start.toLocaleDateString(
            'en-GB',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }
        );
    }

    const sameDay =
        start.getFullYear() ===
        end.getFullYear() &&
        start.getMonth() ===
        end.getMonth() &&
        start.getDate() ===
        end.getDate();

    if (sameDay) {
        return start.toLocaleDateString(
            'en-GB',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }
        );
    }

    const sameMonth =
        start.getFullYear() ===
        end.getFullYear() &&
        start.getMonth() ===
        end.getMonth();

    if (sameMonth) {
        return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(
            'en-GB',
            {
                month: 'short',
                year: 'numeric',
            }
        )}`;
    }

    return `${start.toLocaleDateString(
        'en-GB',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    )} – ${end.toLocaleDateString(
        'en-GB',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    )}`;
}

function formatEventTime(
    startDateTime: string,
    endDateTime: string | null
) {
    const start =
        new Date(startDateTime);

    if (
        Number.isNaN(
            start.getTime()
        )
    ) {
        return '—';
    }

    const startTime =
        start.toLocaleTimeString(
            'en-GB',
            {
                hour: '2-digit',
                minute: '2-digit',
            }
        );

    if (!endDateTime) {
        return startTime;
    }

    const end =
        new Date(endDateTime);

    if (
        Number.isNaN(
            end.getTime()
        )
    ) {
        return startTime;
    }

    const endTime =
        end.toLocaleTimeString(
            'en-GB',
            {
                hour: '2-digit',
                minute: '2-digit',
            }
        );

    const sameDay =
        start.getFullYear() ===
        end.getFullYear() &&
        start.getMonth() ===
        end.getMonth() &&
        start.getDate() ===
        end.getDate();

    if (
        !sameDay &&
        startTime === endTime
    ) {
        return `${startTime} daily`;
    }

    return `${startTime} – ${endTime}`;
}

function isPastEvent(
    churchEvent: ChurchEvent
) {
    const comparisonDate =
        churchEvent.endDateTime ??
        churchEvent.startDateTime;

    const date =
        new Date(comparisonDate);

    return (
        !Number.isNaN(
            date.getTime()
        ) &&
        date.getTime() <
        Date.now()
    );
}

function AdminEvents() {
    const [
        events,
        setEvents,
    ] =
        useState<ChurchEvent[]>(
            []
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        retrying,
        setRetrying,
    ] =
        useState(false);

    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const [
        confirming,
        setConfirming,
    ] =
        useState(false);

    const [
        loadError,
        setLoadError,
    ] =
        useState<ApiErrorDetails | null>(
            null
        );

    const [
        actionError,
        setActionError,
    ] =
        useState<string | null>(
            null
        );

    const [
        successMessage,
        setSuccessMessage,
    ] =
        useState<string | null>(
            null
        );

    const [
        eventFormOpen,
        setEventFormOpen,
    ] =
        useState(false);

    const [
        editingEvent,
        setEditingEvent,
    ] =
        useState<ChurchEvent | null>(
            null
        );

    const [
        eventForm,
        setEventForm,
    ] =
        useState<EventFormState>(
            emptyEventForm
        );

    const [
        confirmation,
        setConfirmation,
    ] =
        useState<ConfirmationState>(
            emptyConfirmation
        );

    const sortedEvents =
        useMemo(
            () =>
                [...events].sort(
                    (a, b) => {
                        const aTime =
                            new Date(
                                a.startDateTime
                            ).getTime();

                        const bTime =
                            new Date(
                                b.startDateTime
                            ).getTime();

                        if (
                            aTime !==
                            bTime
                        ) {
                            return (
                                aTime -
                                bTime
                            );
                        }

                        if (
                            a.displayOrder !==
                            b.displayOrder
                        ) {
                            return (
                                a.displayOrder -
                                b.displayOrder
                            );
                        }

                        return a.title.localeCompare(
                            b.title
                        );
                    }
                ),
            [events]
        );

    const activeEvents =
        events.filter(
            churchEvent =>
                churchEvent.isActive
        ).length;

    const upcomingEvents =
        events.filter(
            churchEvent =>
                churchEvent.isActive &&
                !isPastEvent(
                    churchEvent
                )
        ).length;

    const pastEvents =
        events.filter(
            isPastEvent
        ).length;

    const fetchEvents =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/events/admin?skip=0&take=500',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load events.'
                    );
                }

                return (
                    await response.json()
                ) as ChurchEvent[];
            },
            []
        );

    const loadAll =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const eventData =
                    await fetchEvents(
                        signal
                    );

                setEvents(
                    eventData
                );

                setLoadError(
                    null
                );
            },
            [fetchEvents]
        );

    useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(
                        true
                    );

                    await loadAll(
                        controller.signal
                    );
                } catch (error) {
                    if (
                        controller
                            .signal
                            .aborted
                    ) {
                        return;
                    }

                    if (
                        typeof error ===
                        'object' &&
                        error !==
                        null &&
                        'message' in
                        error
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
                        !controller
                            .signal
                            .aborted
                    ) {
                        setLoading(
                            false
                        );
                    }
                }
            };

        void initialise();

        return () =>
            controller.abort();
    }, [loadAll]);

    async function retryLoad():
        Promise<boolean> {
        setRetrying(true);
        setActionError(null);

        try {
            await loadAll();

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

    function openNewEvent() {
        setEditingEvent(
            null
        );

        setEventForm({
            ...emptyEventForm,
            displayOrder:
                events.length.toString(),
        });

        setEventFormOpen(
            true
        );

        setActionError(
            null
        );
    }

    function openEditEvent(
        churchEvent: ChurchEvent
    ) {
        setEditingEvent(
            churchEvent
        );

        setEventForm({
            title:
                churchEvent.title,
            category:
                churchEvent.category,
            startDateTime:
                toDateTimeLocal(
                    churchEvent.startDateTime
                ),
            endDateTime:
                toDateTimeLocal(
                    churchEvent.endDateTime
                ),
            description:
                churchEvent.description ??
                '',
            location:
                churchEvent.location ??
                '',
            icon:
                churchEvent.icon ??
                '',
            color:
                churchEvent.color ??
                'blue',
            registrationUrl:
                churchEvent.registrationUrl ??
                '',
            registrationButtonText:
                churchEvent.registrationButtonText ||
                'Register Now',
            imageUrl:
                churchEvent.imageUrl ??
                '',
            displayOrder:
                churchEvent.displayOrder.toString(),
            isActive:
                churchEvent.isActive,
        });

        setEventFormOpen(
            true
        );

        setActionError(
            null
        );
    }

    function closeEventForm() {
        if (saving) {
            return;
        }

        setEventFormOpen(
            false
        );

        setEditingEvent(
            null
        );

        setEventForm(
            emptyEventForm
        );
    }

    async function submitEvent(
        event: FormEvent
    ) {
        event.preventDefault();

        setSaving(true);
        setActionError(null);

        try {
            const startDateTime =
                toApiDateTime(
                    eventForm.startDateTime
                );

            const endDateTime =
                eventForm.endDateTime
                    ? toApiDateTime(
                        eventForm.endDateTime
                    )
                    : null;

            if (!startDateTime) {
                throw new Error(
                    'Please enter a valid start date and time.'
                );
            }

            if (
                endDateTime &&
                new Date(
                    endDateTime
                ).getTime() <
                new Date(
                    startDateTime
                ).getTime()
            ) {
                throw new Error(
                    'The end date and time cannot be earlier than the start date and time.'
                );
            }

            const payload = {
                title:
                    eventForm
                        .title
                        .trim(),

                category:
                    eventForm.category,

                startDateTime,

                endDateTime,

                description:
                    eventForm
                        .description
                        .trim() ||
                    null,

                location:
                    eventForm
                        .location
                        .trim() ||
                    null,

                icon:
                    eventForm
                        .icon
                        .trim() ||
                    null,

                color:
                    eventForm
                        .color
                        .trim() ||
                    null,

                registrationUrl:
                    eventForm
                        .registrationUrl
                        .trim() ||
                    null,

                registrationButtonText:
                    eventForm
                        .registrationButtonText
                        .trim() ||
                    'Register Now',

                imageUrl:
                    eventForm
                        .imageUrl
                        .trim() ||
                    null,

                displayOrder:
                    Number(
                        eventForm.displayOrder
                    ) || 0,

                isActive:
                    eventForm.isActive,
            };

            const response =
                await apiFetch(
                    editingEvent
                        ? `/api/events/admin/${editingEvent.id}`
                        : '/api/events/admin',
                    {
                        method:
                            editingEvent
                                ? 'PUT'
                                : 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to save event.'
                );
            }

            setEvents(
                await fetchEvents()
            );

            closeEventForm();

            showSuccess(
                editingEvent
                    ? 'Event updated successfully.'
                    : 'Event created successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof
                    Error
                    ? error.message
                    : 'Unable to save event.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestToggle(
        churchEvent: ChurchEvent
    ) {
        const activating =
            !churchEvent.isActive;

        setConfirmation({
            open: true,

            title: activating
                ? 'Activate event?'
                : 'Deactivate event?',

            message: activating
                ? `Activate "${churchEvent.title}"? If it is upcoming, it will become available on the public Upcoming Events section.`
                : `Deactivate "${churchEvent.title}"? It will be hidden from the public Upcoming Events section without deleting it.`,

            confirmText:
                activating
                    ? 'Activate'
                    : 'Deactivate',

            variant:
                activating
                    ? 'success'
                    : 'warning',

            action: async () => {
                const response =
                    await apiFetch(
                        `/api/events/admin/${churchEvent.id}/toggle-active`,
                        {
                            method:
                                'POST',
                        }
                    );

                if (
                    !response.ok
                ) {
                    await actionFailure(
                        response,
                        'Unable to change event status.'
                    );
                }

                setEvents(
                    await fetchEvents()
                );

                showSuccess(
                    activating
                        ? 'Event activated.'
                        : 'Event deactivated.'
                );
            },
        });
    }

    function requestDeleteEvent(
        churchEvent: ChurchEvent
    ) {
        setConfirmation({
            open: true,

            title:
                'Permanently delete event?',

            message:
                `"${churchEvent.title}" will be permanently deleted. ` +
                'This action cannot be undone.',

            confirmText:
                'Delete Event',

            variant:
                'danger',

            action: async () => {
                const response =
                    await apiFetch(
                        `/api/events/admin/${churchEvent.id}`,
                        {
                            method:
                                'DELETE',
                        }
                    );

                if (
                    !response.ok
                ) {
                    await actionFailure(
                        response,
                        'Unable to delete event.'
                    );
                }

                setEvents(
                    await fetchEvents()
                );

                showSuccess(
                    'Event deleted.'
                );
            },
        });
    }

    async function runConfirmation() {
        if (
            !confirmation.action
        ) {
            return;
        }

        setConfirming(true);
        setActionError(null);

        try {
            await confirmation.action();

            setConfirmation(
                emptyConfirmation
            );
        } catch (error) {
            setActionError(
                error instanceof
                    Error
                    ? error.message
                    : 'Unable to complete action.'
            );

            setConfirmation(
                emptyConfirmation
            );
        } finally {
            setConfirming(false);
        }
    }

    return (
        <AdminLayout>
            <div className="events-admin">
                <div className="events-admin-header">
                    <div>
                        <span className="events-admin-eyebrow">
                            Website Content
                        </span>

                        <h1>
                            Events
                        </h1>

                        <p>
                            Manage events
                            displayed in the
                            public Upcoming
                            Events section.
                        </p>
                    </div>

                    {!loadError &&
                        !loading && (
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openNewEvent
                                }
                            >
                                <span>
                                    ＋
                                </span>

                                Add Event
                            </button>
                        )}
                </div>

                {actionError && (
                    <div className="events-admin-alert events-admin-alert-error">
                        <span>
                            !
                        </span>

                        <div>
                            <strong>
                                Something went
                                wrong
                            </strong>

                            <p>
                                {
                                    actionError
                                }
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
                    <div className="events-admin-alert events-admin-alert-success">
                        <span>
                            ✓
                        </span>

                        <div>
                            <strong>
                                Success
                            </strong>

                            <p>
                                {
                                    successMessage
                                }
                            </p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="events-admin-panel events-admin-empty">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading events...
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
                        <div className="events-admin-stats">
                            <div className="events-stat-card">
                                <span className="events-stat-icon">
                                    ◷
                                </span>

                                <div>
                                    <strong>
                                        {
                                            events.length
                                        }
                                    </strong>

                                    <span>
                                        Total Events
                                    </span>
                                </div>
                            </div>

                            <div className="events-stat-card">
                                <span className="events-stat-icon">
                                    ✓
                                </span>

                                <div>
                                    <strong>
                                        {
                                            activeEvents
                                        }
                                    </strong>

                                    <span>
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="events-stat-card">
                                <span className="events-stat-icon">
                                    📅
                                </span>

                                <div>
                                    <strong>
                                        {
                                            upcomingEvents
                                        }
                                    </strong>

                                    <span>
                                        Upcoming
                                    </span>
                                </div>
                            </div>

                            <div className="events-stat-card">
                                <span className="events-stat-icon">
                                    ↶
                                </span>

                                <div>
                                    <strong>
                                        {
                                            pastEvents
                                        }
                                    </strong>

                                    <span>
                                        Past
                                    </span>
                                </div>
                            </div>
                        </div>

                        <section className="events-admin-panel">
                            <div className="events-panel-heading">
                                <div>
                                    <h2>
                                        Church
                                        Events
                                    </h2>

                                    <p>
                                        {
                                            events.length
                                        }{' '}
                                        event
                                        {events.length ===
                                            1
                                            ? ''
                                            : 's'}{' '}
                                        configured
                                    </p>
                                </div>

                                <span className="events-upcoming-summary">
                                    {
                                        upcomingEvents
                                    }{' '}
                                    currently
                                    shown as
                                    upcoming
                                </span>
                            </div>

                            {sortedEvents.length ===
                                0 ? (
                                <div className="events-admin-empty">
                                    <strong>
                                        No events
                                        configured
                                    </strong>

                                    <p>
                                        Add the
                                        first church
                                        event.
                                    </p>

                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={
                                            openNewEvent
                                        }
                                    >
                                        Add Event
                                    </button>
                                </div>
                            ) : (
                                <div className="events-table-wrapper">
                                    <table className="events-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Event
                                                </th>

                                                <th>
                                                    Date
                                                </th>

                                                <th>
                                                    Time
                                                </th>

                                                <th>
                                                    Category
                                                </th>

                                                <th>
                                                    Registration
                                                </th>

                                                <th>
                                                    Order
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
                                            {sortedEvents.map(
                                                churchEvent => {
                                                    const past =
                                                        isPastEvent(
                                                            churchEvent
                                                        );

                                                    return (
                                                        <tr
                                                            key={
                                                                churchEvent.id
                                                            }
                                                            className={
                                                                !churchEvent.isActive
                                                                    ? 'events-row-inactive'
                                                                    : past
                                                                        ? 'events-row-past'
                                                                        : ''
                                                            }
                                                        >
                                                            <td>
                                                                <div className="events-name-cell">
                                                                    <span
                                                                        className={`events-event-icon events-event-icon-${churchEvent.color ??
                                                                            'blue'
                                                                            }`}
                                                                    >
                                                                        {churchEvent.icon ||
                                                                            '📅'}
                                                                    </span>

                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                churchEvent.title
                                                                            }
                                                                        </strong>

                                                                        <span>
                                                                            {churchEvent.location ||
                                                                                'No location specified'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {formatEventDate(
                                                                        churchEvent.startDateTime,
                                                                        churchEvent.endDateTime
                                                                    )}
                                                                </strong>
                                                            </td>

                                                            <td>
                                                                {formatEventTime(
                                                                    churchEvent.startDateTime,
                                                                    churchEvent.endDateTime
                                                                )}
                                                            </td>

                                                            <td>
                                                                <span className="events-badge events-badge-neutral">
                                                                    {humanise(
                                                                        churchEvent.category
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {churchEvent.registrationUrl ? (
                                                                    <a
                                                                        className="events-registration-link"
                                                                        href={
                                                                            churchEvent.registrationUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        Open
                                                                    </a>
                                                                ) : (
                                                                    <span className="events-table-secondary">
                                                                        Not
                                                                        set
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td>
                                                                {
                                                                    churchEvent.displayOrder
                                                                }
                                                            </td>

                                                            <td>
                                                                <div className="events-status-stack">
                                                                    <span
                                                                        className={`events-badge ${churchEvent.isActive
                                                                            ? 'events-badge-active'
                                                                            : 'events-badge-inactive'
                                                                            }`}
                                                                    >
                                                                        {churchEvent.isActive
                                                                            ? 'Active'
                                                                            : 'Inactive'}
                                                                    </span>

                                                                    {past && (
                                                                        <span className="events-badge events-badge-past">
                                                                            Past
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <AdminActionButtons
                                                                    itemName={churchEvent.title}
                                                                    isActive={churchEvent.isActive}
                                                                    onEdit={() =>
                                                                        openEditEvent(
                                                                            churchEvent
                                                                        )
                                                                    }
                                                                    onToggle={() =>
                                                                        requestToggle(
                                                                            churchEvent
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        requestDeleteEvent(
                                                                            churchEvent
                                                                        )
                                                                    }
                                                                    editTitle="Edit event"
                                                                    activateTitle="Activate event"
                                                                    deactivateTitle="Deactivate event"
                                                                    deleteTitle="Delete event"
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
                        </section>
                    </>
                )}

                {eventFormOpen && (
                    <div
                        className="events-modal-backdrop"
                        onMouseDown={
                            closeEventForm
                        }
                    >
                        <div
                            className="events-modal events-modal-large"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="event-form-title"
                            onMouseDown={
                                event =>
                                    event.stopPropagation()
                            }
                        >
                            <div className="events-modal-header">
                                <div>
                                    <span>
                                        Upcoming
                                        Events
                                    </span>

                                    <h2 id="event-form-title">
                                        {editingEvent
                                            ? 'Edit Event'
                                            : 'Add Event'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeEventForm
                                    }
                                    disabled={
                                        saving
                                    }
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>

                            <form
                                onSubmit={
                                    submitEvent
                                }
                            >
                                <div className="events-form-grid">
                                    <label className="events-field events-field-wide">
                                        <span>
                                            Event
                                            Title *
                                        </span>

                                        <input
                                            required
                                            maxLength={
                                                150
                                            }
                                            value={
                                                eventForm.title
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            title:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            Category *
                                        </span>

                                        <select
                                            value={
                                                eventForm.category
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            category:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        >
                                            {serviceCategories.map(
                                                value => (
                                                    <option
                                                        key={
                                                            value
                                                        }
                                                        value={
                                                            value
                                                        }
                                                    >
                                                        {humanise(
                                                            value
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            Display
                                            Order
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                eventForm.displayOrder
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            displayOrder:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            Start Date
                                            & Time *
                                        </span>

                                        <input
                                            type="datetime-local"
                                            required
                                            value={
                                                eventForm.startDateTime
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            startDateTime:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            End Date
                                            & Time
                                        </span>

                                        <input
                                            type="datetime-local"
                                            value={
                                                eventForm.endDateTime
                                            }
                                            min={
                                                eventForm.startDateTime ||
                                                undefined
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            endDateTime:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            Icon
                                        </span>

                                        <input
                                            maxLength={
                                                50
                                            }
                                            value={
                                                eventForm.icon
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            icon:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            placeholder="e.g. 🎉"
                                        />
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            Colour
                                        </span>

                                        <select
                                            value={
                                                eventForm.color
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            color:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        >
                                            {eventColors.map(
                                                color => (
                                                    <option
                                                        key={
                                                            color
                                                        }
                                                        value={
                                                            color
                                                        }
                                                    >
                                                        {color
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase() +
                                                            color.slice(
                                                                1
                                                            )}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="events-field events-field-wide">
                                        <span>
                                            Description
                                        </span>

                                        <textarea
                                            rows={3}
                                            maxLength={
                                                1000
                                            }
                                            value={
                                                eventForm.description
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            description:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>

                                    <label className="events-field events-field-wide">
                                        <span>
                                            Location
                                        </span>

                                        <input
                                            maxLength={
                                                200
                                            }
                                            value={
                                                eventForm.location
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            location:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            placeholder="e.g. RCCG Hope House"
                                        />
                                    </label>

                                    <label className="events-field events-field-wide">
                                        <span>
                                            Registration
                                            URL
                                        </span>

                                        <input
                                            type="url"
                                            maxLength={
                                                1000
                                            }
                                            value={
                                                eventForm.registrationUrl
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            registrationUrl:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            placeholder="https://..."
                                        />
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            Registration
                                            Button Text
                                        </span>

                                        <input
                                            maxLength={
                                                100
                                            }
                                            value={
                                                eventForm.registrationButtonText
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            registrationButtonText:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            placeholder="Register Now"
                                        />
                                    </label>

                                    <label className="events-field">
                                        <span>
                                            Image URL
                                        </span>

                                        <input
                                            maxLength={
                                                1000
                                            }
                                            value={
                                                eventForm.imageUrl
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            imageUrl:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            placeholder="/images/event.jpg"
                                        />
                                    </label>
                                </div>

                                <div className="events-form-options">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                eventForm.isActive
                                            }
                                            onChange={
                                                event =>
                                                    setEventForm(
                                                        current => ({
                                                            ...current,
                                                            isActive:
                                                                event
                                                                    .target
                                                                    .checked,
                                                        })
                                                    )
                                            }
                                        />

                                        <span>
                                            <strong>
                                                Active
                                                event
                                            </strong>

                                            <small>
                                                Active
                                                upcoming
                                                events are
                                                eligible to
                                                appear on
                                                the public
                                                Upcoming
                                                Events
                                                section.
                                            </small>
                                        </span>
                                    </label>
                                </div>

                                <div className="events-modal-actions">
                                    <button
                                        type="button"
                                        className="events-secondary-button"
                                        onClick={
                                            closeEventForm
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                        disabled={
                                            saving
                                        }
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : editingEvent
                                                ? 'Save Changes'
                                                : 'Create Event'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmDialog
                    open={
                        confirmation.open
                    }
                    title={
                        confirmation.title
                    }
                    message={
                        confirmation.message
                    }
                    confirmText={
                        confirmation.confirmText
                    }
                    cancelText="Cancel"
                    variant={
                        confirmation.variant
                    }
                    loading={
                        confirming
                    }
                    loadingText="Please wait..."
                    onConfirm={() =>
                        void runConfirmation()
                    }
                    onCancel={() =>
                        !confirming &&
                        setConfirmation(
                            emptyConfirmation
                        )
                    }
                />
            </div>
        </AdminLayout>
    );
}

export default AdminEvents;