import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';

import { apiFetch } from '@/api/api';
import ConfirmDialog from '@/components/sections/ConfirmDialog';
import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/services.css';

type AdminTab = 'schedule' | 'broadcasts';

type RecurrencePattern =
    | 'Weekly'
    | 'LastOfMonth'
    | 'FirstOfMonth'
    | 'Fortnightly'
    | 'Monthly'
    | 'OneTime';

interface ChurchService {
    id: string;
    name: string;
    category: string;
    dayOfWeek: string;
    startTime: string | null;
    endTime: string | null;
    description: string | null;
    location: string | null;
    zoomId: string | null;
    zoomPasscode: string | null;
    recurrence: RecurrencePattern;
    dayOfMonth: number | null;
    isLocal: boolean;
    isActive: boolean;
    displayOrder: number;
    icon: string | null;
    showInMonthlyServices: boolean;
}

interface ServiceBroadcast {
    id: string;
    churchServiceId: string;
    category: string;
    title: string;
    videoId: string;
    videoUrl: string;
    thumbnailUrl: string;
    description: string | null;
    theme: string | null;
    serviceMonth: string;
    isLive: boolean;
}

interface ServiceFormState {
    name: string;
    category: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    description: string;
    location: string;
    zoomId: string;
    zoomPasscode: string;
    recurrence: RecurrencePattern;
    dayOfMonth: string;
    isLocal: boolean;
    displayOrder: string;
    icon: string;
    showInMonthlyServices: boolean;
}

interface BroadcastFormState {
    churchServiceId: string;
    title: string;
    youtubeUrl: string;
    serviceMonth: string;
    description: string;
    theme: string;
    isLive: boolean;
}

interface ConfirmationState {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'primary' | 'success' | 'warning' | 'danger';
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

const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

const recurrencePatterns: RecurrencePattern[] = [
    'Weekly',
    'FirstOfMonth',
    'LastOfMonth',
    'Fortnightly',
    'Monthly',
    'OneTime',
];

const emptyServiceForm: ServiceFormState = {
    name: '',
    category: 'WorshipService',
    dayOfWeek: 'Sunday',
    startTime: '',
    endTime: '',
    description: '',
    location: '',
    zoomId: '',
    zoomPasscode: '',
    recurrence: 'Weekly',
    dayOfMonth: '',
    isLocal: true,
    displayOrder: '0',
    icon: '',
    showInMonthlyServices: false,
};

const emptyBroadcastForm: BroadcastFormState = {
    churchServiceId: '',
    title: '',
    youtubeUrl: '',
    serviceMonth: new Date()
        .toISOString()
        .slice(0, 7),
    description: '',
    theme: '',
    isLive: false,
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
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
}

function formatTime(value: string | null) {
    if (!value) {
        return '—';
    }

    const [hours, minutes] =
        value.split(':').map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString(
        'en-GB',
        {
            hour: '2-digit',
            minute: '2-digit',
        }
    );
}

function formatMonth(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        'en-GB',
        {
            month: 'long',
            year: 'numeric',
        }
    );
}

async function readProblem(
    response: Response,
    fallback: string
) {
    try {
        const body = await response.json();

        if (typeof body?.detail === 'string') {
            return body.detail;
        }

        if (typeof body?.title === 'string') {
            return body.title;
        }

        if (body?.errors) {
            const messages =
                Object.values(body.errors)
                    .flat()
                    .filter(
                        (
                            item
                        ): item is string =>
                            typeof item ===
                            'string'
                    );

            if (messages.length > 0) {
                return messages.join(' ');
            }
        }
    } catch {
        // Use fallback.
    }

    return fallback;
}

function Services() {
    const [activeTab, setActiveTab] =
        useState<AdminTab>('schedule');

    const [services, setServices] =
        useState<ChurchService[]>([]);

    const [broadcasts, setBroadcasts] =
        useState<ServiceBroadcast[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [confirming, setConfirming] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const [serviceFormOpen, setServiceFormOpen] =
        useState(false);

    const [
        broadcastFormOpen,
        setBroadcastFormOpen,
    ] = useState(false);

    const [
        editingService,
        setEditingService,
    ] = useState<ChurchService | null>(
        null
    );

    const [
        editingBroadcast,
        setEditingBroadcast,
    ] = useState<ServiceBroadcast | null>(
        null
    );

    const [serviceForm, setServiceForm] =
        useState<ServiceFormState>(
            emptyServiceForm
        );

    const [
        broadcastForm,
        setBroadcastForm,
    ] = useState<BroadcastFormState>(
        emptyBroadcastForm
    );

    const [confirmation, setConfirmation] =
        useState<ConfirmationState>(
            emptyConfirmation
        );

    const sortedServices = useMemo(
        () =>
            [...services].sort(
                (a, b) =>
                    a.displayOrder -
                    b.displayOrder ||
                    a.name.localeCompare(
                        b.name
                    )
            ),
        [services]
    );

    const monthlyServices = useMemo(
        () =>
            sortedServices.filter(
                service =>
                    service.isActive &&
                    service.showInMonthlyServices
            ),
        [sortedServices]
    );

    const activeServices =
        services.filter(
            service => service.isActive
        ).length;

    const localServices =
        services.filter(
            service => service.isLocal
        ).length;

    const liveBroadcasts =
        broadcasts.filter(
            broadcast => broadcast.isLive
        ).length;

    const serviceName = useCallback(
        (id: string) =>
            services.find(
                service =>
                    service.id === id
            )?.name ?? 'Unknown service',
        [services]
    );

    const loadServices = useCallback(
        async (signal?: AbortSignal) => {
            const response = await apiFetch(
                '/api/services?includeInactive=true',
                { signal }
            );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        `Unable to load services (${response.status}).`
                    )
                );
            }

            const data: ChurchService[] =
                await response.json();

            setServices(data);
        },
        []
    );

    const loadBroadcasts = useCallback(
        async (signal?: AbortSignal) => {
            const response = await apiFetch(
                '/api/service-broadcasts/admin?skip=0&take=500',
                { signal }
            );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        `Unable to load broadcasts (${response.status}).`
                    )
                );
            }

            const data: ServiceBroadcast[] =
                await response.json();

            setBroadcasts(data);
        },
        []
    );

    //const refreshData = useCallback(
    //    async () => {
    //        setError(null);

    //        await Promise.all([
    //            loadServices(),
    //            loadBroadcasts(),
    //        ]);
    //    },
    //    [loadServices, loadBroadcasts]
    //);

    useEffect(() => {
        const controller =
            new AbortController();

        const initialise = async () => {
            try {
                setLoading(true);

                await Promise.all([
                    loadServices(
                        controller.signal
                    ),
                    loadBroadcasts(
                        controller.signal
                    ),
                ]);
            } catch (err) {
                if (
                    err instanceof DOMException &&
                    err.name === 'AbortError'
                ) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load services.'
                );
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        };

        void initialise();

        return () =>
            controller.abort();
    }, [loadServices, loadBroadcasts]);

    function showSuccess(message: string) {
        setSuccessMessage(message);

        window.setTimeout(
            () =>
                setSuccessMessage(
                    current =>
                        current === message
                            ? null
                            : current
                ),
            3500
        );
    }

    function openNewService() {
        setEditingService(null);

        setServiceForm({
            ...emptyServiceForm,
            displayOrder:
                services.length.toString(),
        });

        setServiceFormOpen(true);
        setError(null);
    }

    function openEditService(
        service: ChurchService
    ) {
        setEditingService(service);

        setServiceForm({
            name: service.name,
            category: service.category,
            dayOfWeek:
                service.dayOfWeek,
            startTime:
                service.startTime?.slice(
                    0,
                    5
                ) ?? '',
            endTime:
                service.endTime?.slice(
                    0,
                    5
                ) ?? '',
            description:
                service.description ?? '',
            location:
                service.location ?? '',
            zoomId:
                service.zoomId ?? '',
            zoomPasscode:
                service.zoomPasscode ?? '',
            recurrence:
                service.recurrence,
            dayOfMonth:
                service.dayOfMonth?.toString() ??
                '',
            isLocal:
                service.isLocal,
            displayOrder:
                service.displayOrder.toString(),
            icon:
                service.icon ?? '',
            showInMonthlyServices:
                service.showInMonthlyServices,
        });

        setServiceFormOpen(true);
        setError(null);
    }

    function closeServiceForm() {
        if (saving) {
            return;
        }

        setServiceFormOpen(false);
        setEditingService(null);
        setServiceForm(
            emptyServiceForm
        );
    }

    async function submitService(
        event: FormEvent
    ) {
        event.preventDefault();

        setSaving(true);
        setError(null);

        try {
            const payload = {
                name:
                    serviceForm.name.trim(),
                category:
                    serviceForm.category,
                dayOfWeek:
                    serviceForm.dayOfWeek,
                startTime:
                    serviceForm.startTime
                        ? `${serviceForm.startTime}:00`
                        : null,
                endTime:
                    serviceForm.endTime
                        ? `${serviceForm.endTime}:00`
                        : null,
                description:
                    serviceForm.description.trim() ||
                    null,
                location:
                    serviceForm.location.trim() ||
                    null,
                zoomId:
                    serviceForm.zoomId.trim() ||
                    null,
                zoomPasscode:
                    serviceForm.zoomPasscode.trim() ||
                    null,
                recurrence:
                    serviceForm.recurrence,
                dayOfMonth:
                    serviceForm.dayOfMonth
                        ? Number(
                            serviceForm.dayOfMonth
                        )
                        : null,
                isLocal:
                    serviceForm.isLocal,
                displayOrder:
                    Number(
                        serviceForm.displayOrder
                    ) || 0,
                icon:
                    serviceForm.icon.trim() ||
                    null,
                showInMonthlyServices:
                    serviceForm.showInMonthlyServices,
            };

            const response = await apiFetch(
                editingService
                    ? `/api/services/admin/${editingService.id}`
                    : '/api/services/admin/',
                {
                    method: editingService
                        ? 'PUT'
                        : 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        editingService
                            ? 'Unable to update service.'
                            : 'Unable to create service.'
                    )
                );
            }

            await loadServices();

            closeServiceForm();

            showSuccess(
                editingService
                    ? 'Service updated successfully.'
                    : 'Service created successfully.'
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save service.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestToggle(
        service: ChurchService
    ) {
        const activating =
            !service.isActive;

        setConfirmation({
            open: true,
            title: activating
                ? 'Activate service?'
                : 'Deactivate service?',
            message: activating
                ? `Activate "${service.name}"? It will become available to public service listings again.`
                : `Deactivate "${service.name}"? It will be hidden from active public service listings without deleting its history.`,
            confirmText: activating
                ? 'Activate'
                : 'Deactivate',
            variant: activating
                ? 'success'
                : 'warning',
            action: async () => {
                const response =
                    await apiFetch(
                        `/api/services/admin/${service.id}/toggle-active`,
                        {
                            method: 'POST',
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        await readProblem(
                            response,
                            'Unable to change service status.'
                        )
                    );
                }

                await loadServices();

                showSuccess(
                    activating
                        ? 'Service activated.'
                        : 'Service deactivated.'
                );
            },
        });
    }

    function requestDeleteService(
        service: ChurchService
    ) {
        setConfirmation({
            open: true,
            title:
                'Permanently delete service?',
            message:
                `"${service.name}" will be permanently deleted. ` +
                'If broadcasts are linked to this service, the server may prevent deletion to protect the broadcast history. Deactivation is normally safer.',
            confirmText: 'Delete Service',
            variant: 'danger',
            action: async () => {
                const response =
                    await apiFetch(
                        `/api/services/admin/${service.id}`,
                        {
                            method: 'DELETE',
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        await readProblem(
                            response,
                            'Unable to delete service. It may have broadcast history; deactivate it instead.'
                        )
                    );
                }

                await loadServices();

                showSuccess(
                    'Service deleted.'
                );
            },
        });
    }

    function openNewBroadcast() {
        const preferredService =
            monthlyServices[0] ??
            sortedServices.find(
                service =>
                    service.isActive
            );

        setEditingBroadcast(null);

        setBroadcastForm({
            ...emptyBroadcastForm,
            churchServiceId:
                preferredService?.id ?? '',
        });

        setBroadcastFormOpen(true);
        setError(null);
    }

    function openEditBroadcast(
        broadcast: ServiceBroadcast
    ) {
        setEditingBroadcast(broadcast);

        setBroadcastForm({
            churchServiceId:
                broadcast.churchServiceId,
            title: broadcast.title,
            youtubeUrl:
                broadcast.videoUrl ||
                broadcast.videoId,
            serviceMonth:
                broadcast.serviceMonth.slice(
                    0,
                    7
                ),
            description:
                broadcast.description ?? '',
            theme:
                broadcast.theme ?? '',
            isLive:
                broadcast.isLive,
        });

        setBroadcastFormOpen(true);
        setError(null);
    }

    function closeBroadcastForm() {
        if (saving) {
            return;
        }

        setBroadcastFormOpen(false);
        setEditingBroadcast(null);
        setBroadcastForm(
            emptyBroadcastForm
        );
    }

    async function submitBroadcast(
        event: FormEvent
    ) {
        event.preventDefault();

        setSaving(true);
        setError(null);

        try {
            const payload =
                editingBroadcast
                    ? {
                        id:
                            editingBroadcast.id,
                        title:
                            broadcastForm.title.trim(),
                        youtubeUrl:
                            broadcastForm.youtubeUrl.trim(),
                        description:
                            broadcastForm.description.trim() ||
                            null,
                        theme:
                            broadcastForm.theme.trim() ||
                            null,
                        isLive:
                            broadcastForm.isLive,
                    }
                    : {
                        churchServiceId:
                            broadcastForm.churchServiceId,
                        title:
                            broadcastForm.title.trim(),
                        youtubeUrl:
                            broadcastForm.youtubeUrl.trim(),
                        serviceMonth:
                            `${broadcastForm.serviceMonth}-01T00:00:00`,
                        description:
                            broadcastForm.description.trim() ||
                            null,
                        theme:
                            broadcastForm.theme.trim() ||
                            null,
                        isLive:
                            broadcastForm.isLive,
                    };

            const response = await apiFetch(
                editingBroadcast
                    ? `/api/service-broadcasts/admin/${editingBroadcast.id}`
                    : '/api/service-broadcasts/admin/',
                {
                    method: editingBroadcast
                        ? 'PUT'
                        : 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        editingBroadcast
                            ? 'Unable to update broadcast.'
                            : 'Unable to create broadcast.'
                    )
                );
            }

            await loadBroadcasts();

            closeBroadcastForm();

            showSuccess(
                editingBroadcast
                    ? 'Broadcast updated successfully.'
                    : 'Broadcast added successfully.'
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save broadcast.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestDeleteBroadcast(
        broadcast: ServiceBroadcast
    ) {
        setConfirmation({
            open: true,
            title:
                'Delete broadcast?',
            message:
                `Delete "${broadcast.title}" for ${formatMonth(
                    broadcast.serviceMonth
                )}? This cannot be undone.`,
            confirmText:
                'Delete Broadcast',
            variant: 'danger',
            action: async () => {
                const response =
                    await apiFetch(
                        `/api/service-broadcasts/admin/${broadcast.id}`,
                        {
                            method: 'DELETE',
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        await readProblem(
                            response,
                            'Unable to delete broadcast.'
                        )
                    );
                }

                await loadBroadcasts();

                showSuccess(
                    'Broadcast deleted.'
                );
            },
        });
    }

    async function runConfirmation() {
        if (!confirmation.action) {
            return;
        }

        setConfirming(true);
        setError(null);

        try {
            await confirmation.action();

            setConfirmation(
                emptyConfirmation
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
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
            <div className="services-admin">
                <div className="services-admin-header">
                    <div>
                        <span className="services-admin-eyebrow">
                            Ministries
                        </span>

                        <h1>
                            Services
                        </h1>

                        <p>
                            Manage church service
                            schedules and monthly
                            service broadcasts.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={
                            activeTab ===
                                'schedule'
                                ? openNewService
                                : openNewBroadcast
                        }
                    >
                        <span>＋</span>

                        {activeTab ===
                            'schedule'
                            ? 'Add Service'
                            : 'Add Broadcast'}
                    </button>
                </div>

                {error && (
                    <div className="services-admin-alert services-admin-alert-error">
                        <span>!</span>

                        <div>
                            <strong>
                                Something went
                                wrong
                            </strong>

                            <p>{error}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError(null)
                            }
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="services-admin-alert services-admin-alert-success">
                        <span>✓</span>

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

                <div className="services-admin-stats">
                    <div className="services-stat-card">
                        <span className="services-stat-icon">
                            ◷
                        </span>

                        <div>
                            <strong>
                                {
                                    services.length
                                }
                            </strong>

                            <span>
                                Total Services
                            </span>
                        </div>
                    </div>

                    <div className="services-stat-card">
                        <span className="services-stat-icon">
                            ✓
                        </span>

                        <div>
                            <strong>
                                {
                                    activeServices
                                }
                            </strong>

                            <span>
                                Active
                            </span>
                        </div>
                    </div>

                    <div className="services-stat-card">
                        <span className="services-stat-icon">
                            ⌂
                        </span>

                        <div>
                            <strong>
                                {
                                    localServices
                                }
                            </strong>

                            <span>
                                Local Services
                            </span>
                        </div>
                    </div>

                    <div className="services-stat-card">
                        <span className="services-stat-icon">
                            ▶
                        </span>

                        <div>
                            <strong>
                                {
                                    broadcasts.length
                                }
                            </strong>

                            <span>
                                Broadcast Records
                            </span>
                        </div>
                    </div>
                </div>

                <div className="services-admin-tabs">
                    <button
                        type="button"
                        className={
                            activeTab ===
                                'schedule'
                                ? 'active'
                                : ''
                        }
                        onClick={() =>
                            setActiveTab(
                                'schedule'
                            )
                        }
                    >
                        Service Schedule
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab ===
                                'broadcasts'
                                ? 'active'
                                : ''
                        }
                        onClick={() =>
                            setActiveTab(
                                'broadcasts'
                            )
                        }
                    >
                        Monthly Broadcasts

                        {liveBroadcasts >
                            0 && (
                                <span className="services-live-count">
                                    {
                                        liveBroadcasts
                                    }{' '}
                                    live
                                </span>
                            )}
                    </button>
                </div>

                {loading ? (
                    <div className="services-admin-empty">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading services...
                        </strong>
                    </div>
                ) : activeTab ===
                    'schedule' ? (
                    <section className="services-admin-panel">
                        <div className="services-panel-heading">
                            <div>
                                <h2>
                                    Service
                                    Schedule
                                </h2>

                                <p>
                                    {
                                        services.length
                                    }{' '}
                                    service
                                    {services.length ===
                                        1
                                        ? ''
                                        : 's'}{' '}
                                    configured
                                </p>
                            </div>

                            <span className="services-monthly-summary">
                                {
                                    monthlyServices.length
                                }{' '}
                                shown in Special
                                Monthly Services
                            </span>
                        </div>

                        {sortedServices.length ===
                            0 ? (
                            <div className="services-admin-empty">
                                <strong>
                                    No services
                                    configured
                                </strong>

                                <p>
                                    Add the first
                                    church service
                                    schedule.
                                </p>

                                <button
                                    type="button"
                                    className="admin-primary-button"
                                    onClick={
                                        openNewService
                                    }
                                >
                                    Add Service
                                </button>
                            </div>
                        ) : (
                            <div className="services-table-wrapper">
                                <table className="services-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                Service
                                            </th>
                                            <th>
                                                Schedule
                                            </th>
                                            <th>
                                                Recurrence
                                            </th>
                                            <th>
                                                Type
                                            </th>
                                            <th>
                                                Monthly
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
                                        {sortedServices.map(
                                            service => (
                                                <tr
                                                    key={
                                                        service.id
                                                    }
                                                    className={
                                                        !service.isActive
                                                            ? 'services-row-inactive'
                                                            : ''
                                                    }
                                                >
                                                    <td>
                                                        <div className="services-name-cell">
                                                            <span className="services-service-icon">
                                                                {service.icon ||
                                                                    '◉'}
                                                            </span>

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        service.name
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {humanise(
                                                                        service.category
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {
                                                                service.dayOfWeek
                                                            }
                                                        </strong>

                                                        <span className="services-table-secondary">
                                                            {formatTime(
                                                                service.startTime
                                                            )}{' '}
                                                            –{' '}
                                                            {formatTime(
                                                                service.endTime
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {humanise(
                                                            service.recurrence
                                                        )}

                                                        {service.dayOfMonth && (
                                                            <span className="services-table-secondary">
                                                                Day{' '}
                                                                {
                                                                    service.dayOfMonth
                                                                }
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className="services-badge services-badge-neutral">
                                                            {service.isLocal
                                                                ? 'Local'
                                                                : 'HQ'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`services-badge ${service.showInMonthlyServices
                                                                    ? 'services-badge-monthly'
                                                                    : 'services-badge-neutral'
                                                                }`}
                                                        >
                                                            {service.showInMonthlyServices
                                                                ? 'Shown'
                                                                : 'No'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            service.displayOrder
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`services-badge ${service.isActive
                                                                    ? 'services-badge-active'
                                                                    : 'services-badge-inactive'
                                                                }`}
                                                        >
                                                            {service.isActive
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="services-actions">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditService(
                                                                        service
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={
                                                                    service.isActive
                                                                        ? 'warning'
                                                                        : 'success'
                                                                }
                                                                onClick={() =>
                                                                    requestToggle(
                                                                        service
                                                                    )
                                                                }
                                                            >
                                                                {service.isActive
                                                                    ? 'Deactivate'
                                                                    : 'Activate'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="danger"
                                                                onClick={() =>
                                                                    requestDeleteService(
                                                                        service
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="services-admin-panel">
                        <div className="services-panel-heading">
                            <div>
                                <h2>
                                    Monthly
                                    Broadcasts
                                </h2>

                                <p>
                                    Complete service
                                    broadcast history
                                </p>
                            </div>

                            <span className="services-monthly-summary">
                                {
                                    broadcasts.length
                                }{' '}
                                record
                                {broadcasts.length ===
                                    1
                                    ? ''
                                    : 's'}
                            </span>
                        </div>

                        {broadcasts.length ===
                            0 ? (
                            <div className="services-admin-empty">
                                <strong>
                                    No broadcasts
                                    recorded
                                </strong>

                                <p>
                                    Add a monthly
                                    service broadcast
                                    and its YouTube
                                    video.
                                </p>

                                <button
                                    type="button"
                                    className="admin-primary-button"
                                    onClick={
                                        openNewBroadcast
                                    }
                                >
                                    Add Broadcast
                                </button>
                            </div>
                        ) : (
                            <div className="services-table-wrapper">
                                <table className="services-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                Service
                                            </th>
                                            <th>
                                                Month
                                            </th>
                                            <th>
                                                Broadcast
                                            </th>
                                            <th>
                                                Theme
                                            </th>
                                            <th>
                                                Status
                                            </th>
                                            <th>
                                                Video
                                            </th>
                                            <th>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {broadcasts.map(
                                            broadcast => (
                                                <tr
                                                    key={
                                                        broadcast.id
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {serviceName(
                                                                broadcast.churchServiceId
                                                            )}
                                                        </strong>

                                                        <span className="services-table-secondary">
                                                            {humanise(
                                                                broadcast.category
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {formatMonth(
                                                            broadcast.serviceMonth
                                                        )}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {
                                                                broadcast.title
                                                            }
                                                        </strong>

                                                        {broadcast.description && (
                                                            <span className="services-table-secondary services-description-preview">
                                                                {
                                                                    broadcast.description
                                                                }
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {broadcast.theme ||
                                                            '—'}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`services-badge ${broadcast.isLive
                                                                    ? 'services-badge-live'
                                                                    : 'services-badge-neutral'
                                                                }`}
                                                        >
                                                            {broadcast.isLive
                                                                ? 'Live'
                                                                : 'Recorded'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <a
                                                            className="services-video-link"
                                                            href={
                                                                broadcast.videoUrl
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            ▶ Watch
                                                        </a>
                                                    </td>

                                                    <td>
                                                        <div className="services-actions">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditBroadcast(
                                                                        broadcast
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="danger"
                                                                onClick={() =>
                                                                    requestDeleteBroadcast(
                                                                        broadcast
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {serviceFormOpen && (
                    <div
                        className="services-modal-backdrop"
                        onMouseDown={
                            closeServiceForm
                        }
                    >
                        <div
                            className="services-modal services-modal-large"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="service-form-title"
                            onMouseDown={event =>
                                event.stopPropagation()
                            }
                        >
                            <div className="services-modal-header">
                                <div>
                                    <span>
                                        Service
                                        Schedule
                                    </span>

                                    <h2 id="service-form-title">
                                        {editingService
                                            ? 'Edit Service'
                                            : 'Add Service'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeServiceForm
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
                                    submitService
                                }
                            >
                                <div className="services-form-grid">
                                    <label className="services-field services-field-wide">
                                        <span>
                                            Service
                                            Name *
                                        </span>

                                        <input
                                            required
                                            value={
                                                serviceForm.name
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        name: event
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            placeholder="e.g. Sunday Worship Service"
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Category *
                                        </span>

                                        <select
                                            value={
                                                serviceForm.category
                                            }
                                            onChange={event =>
                                                setServiceForm(
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
                                                category => (
                                                    <option
                                                        key={
                                                            category
                                                        }
                                                        value={
                                                            category
                                                        }
                                                    >
                                                        {humanise(
                                                            category
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Day *
                                        </span>

                                        <select
                                            value={
                                                serviceForm.dayOfWeek
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        dayOfWeek:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        >
                                            {daysOfWeek.map(
                                                day => (
                                                    <option
                                                        key={
                                                            day
                                                        }
                                                        value={
                                                            day
                                                        }
                                                    >
                                                        {
                                                            day
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Start Time
                                        </span>

                                        <input
                                            type="time"
                                            value={
                                                serviceForm.startTime
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        startTime:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            End Time
                                        </span>

                                        <input
                                            type="time"
                                            value={
                                                serviceForm.endTime
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        endTime:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Recurrence
                                        </span>

                                        <select
                                            value={
                                                serviceForm.recurrence
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        recurrence:
                                                            event
                                                                .target
                                                                .value as RecurrencePattern,
                                                    })
                                                )
                                            }
                                        >
                                            {recurrencePatterns.map(
                                                recurrence => (
                                                    <option
                                                        key={
                                                            recurrence
                                                        }
                                                        value={
                                                            recurrence
                                                        }
                                                    >
                                                        {humanise(
                                                            recurrence
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Day of
                                            Month
                                        </span>

                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            disabled={
                                                serviceForm.recurrence !==
                                                'Monthly'
                                            }
                                            value={
                                                serviceForm.dayOfMonth
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        dayOfMonth:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder={
                                                serviceForm.recurrence ===
                                                    'Monthly'
                                                    ? '1–31'
                                                    : 'Not required'
                                            }
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Display
                                            Order
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                serviceForm.displayOrder
                                            }
                                            onChange={event =>
                                                setServiceForm(
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

                                    <label className="services-field">
                                        <span>
                                            Icon
                                        </span>

                                        <input
                                            value={
                                                serviceForm.icon
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        icon: event
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            maxLength={
                                                50
                                            }
                                            placeholder="e.g. 🕊️"
                                        />
                                    </label>

                                    <label className="services-field services-field-wide">
                                        <span>
                                            Description
                                        </span>

                                        <textarea
                                            rows={3}
                                            value={
                                                serviceForm.description
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        description:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="Brief description of the service"
                                        />
                                    </label>

                                    <label className="services-field services-field-wide">
                                        <span>
                                            Location
                                        </span>

                                        <input
                                            value={
                                                serviceForm.location
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        location:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="Church address, Online, RCCG HQ, etc."
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Zoom ID
                                        </span>

                                        <input
                                            value={
                                                serviceForm.zoomId
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        zoomId: event
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Zoom
                                            Passcode
                                        </span>

                                        <input
                                            value={
                                                serviceForm.zoomPasscode
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        zoomPasscode:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <div className="services-form-options">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                serviceForm.isLocal
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        isLocal:
                                                            event
                                                                .target
                                                                .checked,
                                                    })
                                                )
                                            }
                                        />

                                        <span>
                                            <strong>
                                                Local
                                                service
                                            </strong>

                                            <small>
                                                This
                                                service
                                                belongs
                                                to Hope
                                                House
                                                locally.
                                            </small>
                                        </span>
                                    </label>

                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                serviceForm.showInMonthlyServices
                                            }
                                            onChange={event =>
                                                setServiceForm(
                                                    current => ({
                                                        ...current,
                                                        showInMonthlyServices:
                                                            event
                                                                .target
                                                                .checked,
                                                    })
                                                )
                                            }
                                        />

                                        <span>
                                            <strong>
                                                Show in
                                                Special
                                                Monthly
                                                Services
                                            </strong>

                                            <small>
                                                Include
                                                this
                                                service
                                                on the
                                                public
                                                monthly
                                                services
                                                section.
                                            </small>
                                        </span>
                                    </label>
                                </div>

                                <div className="services-modal-actions">
                                    <button
                                        type="button"
                                        className="services-secondary-button"
                                        onClick={
                                            closeServiceForm
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
                                            : editingService
                                                ? 'Save Changes'
                                                : 'Create Service'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {broadcastFormOpen && (
                    <div
                        className="services-modal-backdrop"
                        onMouseDown={
                            closeBroadcastForm
                        }
                    >
                        <div
                            className="services-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="broadcast-form-title"
                            onMouseDown={event =>
                                event.stopPropagation()
                            }
                        >
                            <div className="services-modal-header">
                                <div>
                                    <span>
                                        Monthly
                                        Services
                                    </span>

                                    <h2 id="broadcast-form-title">
                                        {editingBroadcast
                                            ? 'Edit Broadcast'
                                            : 'Add Broadcast'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeBroadcastForm
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
                                    submitBroadcast
                                }
                            >
                                <div className="services-form-grid">
                                    <label className="services-field services-field-wide">
                                        <span>
                                            Service *
                                        </span>

                                        <select
                                            required
                                            disabled={
                                                Boolean(
                                                    editingBroadcast
                                                )
                                            }
                                            value={
                                                broadcastForm.churchServiceId
                                            }
                                            onChange={event =>
                                                setBroadcastForm(
                                                    current => ({
                                                        ...current,
                                                        churchServiceId:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select a
                                                service
                                            </option>

                                            {sortedServices.map(
                                                service => (
                                                    <option
                                                        key={
                                                            service.id
                                                        }
                                                        value={
                                                            service.id
                                                        }
                                                    >
                                                        {
                                                            service.name
                                                        }
                                                        {!service.isActive
                                                            ? ' (Inactive)'
                                                            : ''}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {editingBroadcast && (
                                            <small>
                                                Service
                                                cannot be
                                                reassigned
                                                when
                                                editing an
                                                existing
                                                broadcast.
                                            </small>
                                        )}
                                    </label>

                                    <label className="services-field services-field-wide">
                                        <span>
                                            Title *
                                        </span>

                                        <input
                                            required
                                            value={
                                                broadcastForm.title
                                            }
                                            onChange={event =>
                                                setBroadcastForm(
                                                    current => ({
                                                        ...current,
                                                        title: event
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            placeholder="Broadcast title"
                                        />
                                    </label>

                                    <label className="services-field services-field-wide">
                                        <span>
                                            YouTube URL
                                            or Video ID
                                            *
                                        </span>

                                        <input
                                            required
                                            value={
                                                broadcastForm.youtubeUrl
                                            }
                                            onChange={event =>
                                                setBroadcastForm(
                                                    current => ({
                                                        ...current,
                                                        youtubeUrl:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            placeholder="https://www.youtube.com/watch?v=..."
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Service
                                            Month *
                                        </span>

                                        <input
                                            type="month"
                                            required
                                            disabled={
                                                Boolean(
                                                    editingBroadcast
                                                )
                                            }
                                            value={
                                                broadcastForm.serviceMonth
                                            }
                                            onChange={event =>
                                                setBroadcastForm(
                                                    current => ({
                                                        ...current,
                                                        serviceMonth:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                        />
                                    </label>

                                    <label className="services-field">
                                        <span>
                                            Theme
                                        </span>

                                        <input
                                            value={
                                                broadcastForm.theme
                                            }
                                            onChange={event =>
                                                setBroadcastForm(
                                                    current => ({
                                                        ...current,
                                                        theme: event
                                                            .target
                                                            .value,
                                                    })
                                                )
                                            }
                                            placeholder="Optional theme"
                                        />
                                    </label>

                                    <label className="services-field services-field-wide">
                                        <span>
                                            Description
                                        </span>

                                        <textarea
                                            rows={3}
                                            value={
                                                broadcastForm.description
                                            }
                                            onChange={event =>
                                                setBroadcastForm(
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
                                </div>

                                <div className="services-form-options">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                broadcastForm.isLive
                                            }
                                            onChange={event =>
                                                setBroadcastForm(
                                                    current => ({
                                                        ...current,
                                                        isLive:
                                                            event
                                                                .target
                                                                .checked,
                                                    })
                                                )
                                            }
                                        />

                                        <span>
                                            <strong>
                                                Live
                                                broadcast
                                            </strong>

                                            <small>
                                                Mark this
                                                broadcast
                                                as
                                                currently
                                                live.
                                            </small>
                                        </span>
                                    </label>
                                </div>

                                <div className="services-modal-actions">
                                    <button
                                        type="button"
                                        className="services-secondary-button"
                                        onClick={
                                            closeBroadcastForm
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
                                            : editingBroadcast
                                                ? 'Save Changes'
                                                : 'Add Broadcast'}
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

export default Services;