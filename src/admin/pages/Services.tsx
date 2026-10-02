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
    isBroadcastEnabled: boolean;
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

const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const recurrencePatterns: RecurrencePattern[] = [
    'Weekly', 'FirstOfMonth', 'LastOfMonth', 'Fortnightly', 'Monthly', 'OneTime',
];

const emptyServiceForm: ServiceFormState = {
    name: '',
    category: '',
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
    serviceMonth: new Date().toISOString().slice(0, 7),
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
    if (!value) return '—';
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatMonth(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function Services() {
    const [activeTab, setActiveTab] = useState<AdminTab>('schedule');
    const [services, setServices] = useState<ChurchService[]>([]);
    const [broadcasts, setBroadcasts] = useState<ServiceBroadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [loadError, setLoadError] = useState<ApiErrorDetails | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [serviceFormOpen, setServiceFormOpen] = useState(false);
    const [broadcastFormOpen, setBroadcastFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<ChurchService | null>(null);
    const [editingBroadcast, setEditingBroadcast] = useState<ServiceBroadcast | null>(null);
    const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);
    const [broadcastForm, setBroadcastForm] = useState<BroadcastFormState>(emptyBroadcastForm);
    const [confirmation, setConfirmation] = useState<ConfirmationState>(emptyConfirmation);

    const sortedServices = useMemo(
        () => [...services].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
        [services]
    );

    const serviceCategories = useMemo(
        () => Array.from(new Set(sortedServices.map(service => service.category))).sort(),
        [sortedServices]
    );

    const broadcastEnabledServices = useMemo(
        () => sortedServices.filter(service => service.isActive && service.isBroadcastEnabled),
        [sortedServices]
    );

    const monthlyServices = useMemo(
        () => sortedServices.filter(service => service.isActive && service.showInMonthlyServices),
        [sortedServices]
    );

    const activeServices = services.filter(service => service.isActive).length;
    const localServices = services.filter(service => service.isLocal).length;
    const liveBroadcasts = broadcasts.filter(broadcast => broadcast.isLive).length;

    const serviceName = useCallback(
        (id: string) => services.find(service => service.id === id)?.name ?? 'Unknown service',
        [services]
    );

    const churchService = useCallback(
        (id: string) => services.find(service => service.id === id),
        [services]
    );

    const fetchServices = useCallback(async (signal?: AbortSignal) => {
        const response = await apiFetch('/api/services?includeInactive=true', { signal });
        if (!response.ok) {
            throw await getApiErrorDetails(response, 'Unable to load services.');
        }
        return (await response.json()) as ChurchService[];
    }, []);

    const fetchBroadcasts = useCallback(async (signal?: AbortSignal) => {
        const response = await apiFetch('/api/service-broadcasts/admin?skip=0&take=500', { signal });
        if (!response.ok) {
            throw await getApiErrorDetails(response, 'Unable to load service broadcasts.');
        }
        return (await response.json()) as ServiceBroadcast[];
    }, []);

    const loadAll = useCallback(async (signal?: AbortSignal) => {
        const [serviceData, broadcastData] = await Promise.all([
            fetchServices(signal),
            fetchBroadcasts(signal),
        ]);
        setServices(serviceData);
        setBroadcasts(broadcastData);
        setLoadError(null);
    }, [fetchServices, fetchBroadcasts]);

    useEffect(() => {
        const controller = new AbortController();
        const initialise = async () => {
            try {
                setLoading(true);
                await loadAll(controller.signal);
            } catch (error) {
                if (controller.signal.aborted) return;
                if (typeof error === 'object' && error !== null && 'message' in error) {
                    setLoadError(error as ApiErrorDetails);
                } else {
                    setLoadError(getNetworkErrorDetails());
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        void initialise();
        return () => controller.abort();
    }, [loadAll]);

    async function retryLoad(): Promise<boolean> {
        setRetrying(true);
        setActionError(null);

        try {
            await loadAll();
            return true;
        } catch (error) {
            if (
                typeof error === 'object' &&
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

    function showSuccess(message: string) {
        setSuccessMessage(message);
        window.setTimeout(() => {
            setSuccessMessage(current => current === message ? null : current);
        }, 3500);
    }

    async function actionFailure(response: Response, fallback: string) {
        const details = await getApiErrorDetails(response, fallback);
        throw new Error(details.message);
    }

    function openNewService() {
        setEditingService(null);
        setServiceForm({
            ...emptyServiceForm,
            category: serviceCategories[0] ?? '',
            displayOrder: services.length.toString(),
        });
        setServiceFormOpen(true);
        setActionError(null);
    }

    function openEditService(service: ChurchService) {
        setEditingService(service);
        setServiceForm({
            name: service.name,
            category: service.category,
            dayOfWeek: service.dayOfWeek,
            startTime: service.startTime?.slice(0, 5) ?? '',
            endTime: service.endTime?.slice(0, 5) ?? '',
            description: service.description ?? '',
            location: service.location ?? '',
            zoomId: service.zoomId ?? '',
            zoomPasscode: service.zoomPasscode ?? '',
            recurrence: service.recurrence,
            dayOfMonth: service.dayOfMonth?.toString() ?? '',
            isLocal: service.isLocal,
            displayOrder: service.displayOrder.toString(),
            icon: service.icon ?? '',
            showInMonthlyServices: service.showInMonthlyServices,
        });
        setServiceFormOpen(true);
        setActionError(null);
    }

    function closeServiceForm() {
        if (saving) return;
        setServiceFormOpen(false);
        setEditingService(null);
        setServiceForm(emptyServiceForm);
    }

    async function submitService(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setActionError(null);
        try {
            const payload = {
                name: serviceForm.name.trim(),
                category: serviceForm.category,
                dayOfWeek: serviceForm.dayOfWeek,
                startTime: serviceForm.startTime ? `${serviceForm.startTime}:00` : null,
                endTime: serviceForm.endTime ? `${serviceForm.endTime}:00` : null,
                description: serviceForm.description.trim() || null,
                location: serviceForm.location.trim() || null,
                zoomId: serviceForm.zoomId.trim() || null,
                zoomPasscode: serviceForm.zoomPasscode.trim() || null,
                recurrence: serviceForm.recurrence,
                dayOfMonth: serviceForm.recurrence === 'Monthly' && serviceForm.dayOfMonth
                    ? Number(serviceForm.dayOfMonth)
                    : null,
                isLocal: serviceForm.isLocal,
                displayOrder: Number(serviceForm.displayOrder) || 0,
                icon: serviceForm.icon.trim() || null,
                showInMonthlyServices: serviceForm.showInMonthlyServices,
                isBroadcastEnabled: editingService?.isBroadcastEnabled ?? false,
            };

            const response = await apiFetch(
                editingService ? `/api/services/admin/${editingService.id}` : '/api/services/admin/',
                {
                    method: editingService ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );
            if (!response.ok) await actionFailure(response, 'Unable to save service.');
            setServices(await fetchServices());
            closeServiceForm();
            showSuccess(editingService ? 'Service updated successfully.' : 'Service created successfully.');
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to save service.');
        } finally {
            setSaving(false);
        }
    }

    function requestToggle(service: ChurchService) {
        const activating = !service.isActive;
        setConfirmation({
            open: true,
            title: activating ? 'Activate service?' : 'Deactivate service?',
            message: activating
                ? `Activate "${service.name}"? It will become available to public service listings again.`
                : `Deactivate "${service.name}"? It will be hidden from active public service listings without deleting its history.`,
            confirmText: activating ? 'Activate' : 'Deactivate',
            variant: activating ? 'success' : 'warning',
            action: async () => {
                const response = await apiFetch(`/api/services/admin/${service.id}/toggle-active`, { method: 'POST' });
                if (!response.ok) await actionFailure(response, 'Unable to change service status.');
                setServices(await fetchServices());
                showSuccess(activating ? 'Service activated.' : 'Service deactivated.');
            },
        });
    }

    function requestBroadcastToggle(service: ChurchService) {
        const enabling = !service.isBroadcastEnabled;

        setConfirmation({
            open: true,
            title: enabling ? 'Broadcast service?' : 'Unbroadcast service?',
            message: enabling
                ? `Broadcast "${service.name}"? Its latest broadcast will be eligible to appear in the public broadcast feed.`
                : `Unbroadcast "${service.name}"? Its broadcast history will be retained, but it will no longer appear in the public broadcast feed.`,
            confirmText: enabling ? 'Broadcast' : 'Unbroadcast',
            variant: enabling ? 'success' : 'warning',
            action: async () => {
                const response = await apiFetch(
                    `/api/services/admin/${service.id}/toggle-broadcast`,
                    { method: 'POST' }
                );

                if (!response.ok) {
                    await actionFailure(response, 'Unable to change broadcast status.');
                }

                setServices(await fetchServices());
                showSuccess(enabling ? 'Service is now broadcast-enabled.' : 'Service has been unbroadcast.');
            },
        });
    }

    function requestDeleteService(service: ChurchService) {
        setConfirmation({
            open: true,
            title: 'Permanently delete service?',
            message: `"${service.name}" will be permanently deleted. If broadcasts are linked to it, the server may prevent deletion to protect history. Deactivation is normally safer.`,
            confirmText: 'Delete Service',
            variant: 'danger',
            action: async () => {
                const response = await apiFetch(`/api/services/admin/${service.id}`, { method: 'DELETE' });
                if (!response.ok) await actionFailure(response, 'Unable to delete service. It may have broadcast history; deactivate it instead.');
                setServices(await fetchServices());
                showSuccess('Service deleted.');
            },
        });
    }

    function openNewBroadcast() {
        const preferredService = broadcastEnabledServices[0];
        setEditingBroadcast(null);
        setBroadcastForm({ ...emptyBroadcastForm, churchServiceId: preferredService?.id ?? '' });
        setBroadcastFormOpen(true);
        setActionError(null);
    }

    function openEditBroadcast(broadcast: ServiceBroadcast) {
        setEditingBroadcast(broadcast);
        setBroadcastForm({
            churchServiceId: broadcast.churchServiceId,
            title: broadcast.title,
            youtubeUrl: broadcast.videoUrl || broadcast.videoId,
            serviceMonth: broadcast.serviceMonth.slice(0, 7),
            description: broadcast.description ?? '',
            theme: broadcast.theme ?? '',
            isLive: broadcast.isLive,
        });
        setBroadcastFormOpen(true);
        setActionError(null);
    }

    function closeBroadcastForm() {
        if (saving) return;
        setBroadcastFormOpen(false);
        setEditingBroadcast(null);
        setBroadcastForm(emptyBroadcastForm);
    }

    async function submitBroadcast(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setActionError(null);
        try {
            const payload = editingBroadcast
                ? {
                    id: editingBroadcast.id,
                    title: broadcastForm.title.trim(),
                    youtubeUrl: broadcastForm.youtubeUrl.trim(),
                    description: broadcastForm.description.trim() || null,
                    theme: broadcastForm.theme.trim() || null,
                    isLive: broadcastForm.isLive,
                }
                : {
                    churchServiceId: broadcastForm.churchServiceId,
                    title: broadcastForm.title.trim(),
                    youtubeUrl: broadcastForm.youtubeUrl.trim(),
                    serviceMonth: `${broadcastForm.serviceMonth}-01T00:00:00`,
                    description: broadcastForm.description.trim() || null,
                    theme: broadcastForm.theme.trim() || null,
                    isLive: broadcastForm.isLive,
                };

            const response = await apiFetch(
                editingBroadcast
                    ? `/api/service-broadcasts/admin/${editingBroadcast.id}`
                    : '/api/service-broadcasts/admin/',
                {
                    method: editingBroadcast ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );
            if (!response.ok) await actionFailure(response, 'Unable to save broadcast.');
            setBroadcasts(await fetchBroadcasts());
            closeBroadcastForm();
            showSuccess(editingBroadcast ? 'Broadcast updated successfully.' : 'Broadcast added successfully.');
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to save broadcast.');
        } finally {
            setSaving(false);
        }
    }

    function requestDeleteBroadcast(broadcast: ServiceBroadcast) {
        setConfirmation({
            open: true,
            title: 'Delete broadcast?',
            message: `Delete "${broadcast.title}" for ${formatMonth(broadcast.serviceMonth)}? This cannot be undone.`,
            confirmText: 'Delete Broadcast',
            variant: 'danger',
            action: async () => {
                const response = await apiFetch(`/api/service-broadcasts/admin/${broadcast.id}`, { method: 'DELETE' });
                if (!response.ok) await actionFailure(response, 'Unable to delete broadcast.');
                setBroadcasts(await fetchBroadcasts());
                showSuccess('Broadcast deleted.');
            },
        });
    }

    async function runConfirmation() {
        if (!confirmation.action) return;
        setConfirming(true);
        setActionError(null);
        try {
            await confirmation.action();
            setConfirmation(emptyConfirmation);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to complete action.');
            setConfirmation(emptyConfirmation);
        } finally {
            setConfirming(false);
        }
    }

    return (
        <AdminLayout>
            <div className="services-admin">
                <div className="services-admin-header">
                    <div>
                        <span className="services-admin-eyebrow">Ministries</span>
                        <h1>Services</h1>
                        <p>Manage church service schedules and monthly service broadcasts.</p>
                    </div>

                    {!loadError && !loading && (
                        <button
                            type="button"
                            className="admin-primary-button"
                            onClick={activeTab === 'schedule' ? openNewService : openNewBroadcast}
                        >
                            <span>＋</span>
                            {activeTab === 'schedule' ? 'Add Service' : 'Add Broadcast'}
                        </button>
                    )}
                </div>

                {actionError && (
                    <div className="services-admin-alert services-admin-alert-error">
                        <span>!</span>
                        <div>
                            <strong>Something went wrong</strong>
                            <p>{actionError}</p>
                        </div>
                        <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error">×</button>
                    </div>
                )}

                {successMessage && (
                    <div className="services-admin-alert services-admin-alert-success">
                        <span>✓</span>
                        <div><strong>Success</strong><p>{successMessage}</p></div>
                    </div>
                )}

                {loading ? (
                    <div className="services-admin-panel services-admin-empty">
                        <div className="admin-loading-spinner" />
                        <strong>Loading services...</strong>
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
                        <div className="services-admin-stats">
                            <div className="services-stat-card"><span className="services-stat-icon">◷</span><div><strong>{services.length}</strong><span>Total Services</span></div></div>
                            <div className="services-stat-card"><span className="services-stat-icon">✓</span><div><strong>{activeServices}</strong><span>Active</span></div></div>
                            <div className="services-stat-card"><span className="services-stat-icon">⌂</span><div><strong>{localServices}</strong><span>Local Services</span></div></div>
                            <div className="services-stat-card"><span className="services-stat-icon">▶</span><div><strong>{broadcasts.length}</strong><span>Broadcast Records</span></div></div>
                        </div>

                        <div className="services-admin-tabs">
                            <button type="button" className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}>Service Schedule</button>
                            <button type="button" className={activeTab === 'broadcasts' ? 'active' : ''} onClick={() => setActiveTab('broadcasts')}>
                                Monthly Broadcasts
                                {liveBroadcasts > 0 && <span className="services-live-count">{liveBroadcasts} live</span>}
                            </button>
                        </div>

                        {activeTab === 'schedule' ? (
                            <section className="services-admin-panel">
                                <div className="services-panel-heading">
                                    <div><h2>Service Schedule</h2><p>{services.length} service{services.length === 1 ? '' : 's'} configured</p></div>
                                    <span className="services-monthly-summary">{monthlyServices.length} shown in Special Monthly Services</span>
                                </div>

                                {sortedServices.length === 0 ? (
                                    <div className="services-admin-empty">
                                        <strong>No services configured</strong>
                                        <p>Add the first church service schedule.</p>
                                        <button type="button" className="admin-primary-button" onClick={openNewService}>Add Service</button>
                                    </div>
                                ) : (
                                    <div className="services-table-wrapper">
                                        <table className="services-table">
                                            <thead><tr><th>Service</th><th>Schedule</th><th>Recurrence</th><th>Type</th><th>Monthly</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
                                            <tbody>
                                                {sortedServices.map(service => (
                                                    <tr key={service.id} className={!service.isActive ? 'services-row-inactive' : ''}>
                                                        <td><div className="services-name-cell"><span className="services-service-icon">{service.icon || '◉'}</span><div><strong>{service.name}</strong><span>{humanise(service.category)}</span></div></div></td>
                                                        <td><strong>{service.dayOfWeek}</strong><span className="services-table-secondary">{formatTime(service.startTime)} – {formatTime(service.endTime)}</span></td>
                                                        <td>{humanise(service.recurrence)}{service.dayOfMonth && <span className="services-table-secondary">Day {service.dayOfMonth}</span>}</td>
                                                        <td><span className="services-badge services-badge-neutral">{service.isLocal ? 'Local' : 'HQ'}</span></td>
                                                        <td><span className={`services-badge ${service.showInMonthlyServices ? 'services-badge-monthly' : 'services-badge-neutral'}`}>{service.showInMonthlyServices ? 'Shown' : 'No'}</span></td>
                                                        <td>{service.displayOrder}</td>
                                                        <td><span className={`services-badge ${service.isActive ? 'services-badge-active' : 'services-badge-inactive'}`}>{service.isActive ? 'Active' : 'Inactive'}</span></td>
                                                        <td>
                                                            <AdminActionButtons
                                                                itemName={service.name}
                                                                isActive={service.isActive}
                                                                onEdit={() => openEditService(service)}
                                                                onToggle={() => requestToggle(service)}
                                                                onDelete={() => requestDeleteService(service)}
                                                                editTitle="Edit service"
                                                                activateTitle="Activate service"
                                                                deactivateTitle="Deactivate service"
                                                                deleteTitle="Delete service"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        ) : (
                            <section className="services-admin-panel">
                                <div className="services-panel-heading"><div><h2>Monthly Broadcasts</h2><p>Complete service broadcast history</p></div><span className="services-monthly-summary">{broadcasts.length} record{broadcasts.length === 1 ? '' : 's'}</span></div>
                                {broadcasts.length === 0 ? (
                                    <div className="services-admin-empty"><strong>No broadcasts recorded</strong><p>Add a monthly service broadcast and its YouTube video.</p><button type="button" className="admin-primary-button" onClick={openNewBroadcast}>Add Broadcast</button></div>
                                ) : (
                                    <div className="services-table-wrapper">
                                        <table className="services-table">
                                            <thead><tr><th>Service</th><th>Month</th><th>Broadcast</th><th>Theme</th><th>Status</th><th>Video</th><th>Actions</th></tr></thead>
                                            <tbody>
                                                {broadcasts.map(broadcast => {
                                                    const linkedService = churchService(broadcast.churchServiceId);

                                                    return (
                                                        <tr key={broadcast.id}>
                                                            <td><strong>{serviceName(broadcast.churchServiceId)}</strong><span className="services-table-secondary">{humanise(broadcast.category)}</span></td>
                                                            <td>{formatMonth(broadcast.serviceMonth)}</td>
                                                            <td><strong>{broadcast.title}</strong>{broadcast.description && <span className="services-table-secondary services-description-preview">{broadcast.description}</span>}</td>
                                                            <td>{broadcast.theme || '—'}</td>
                                                            <td><span className={`services-badge ${broadcast.isLive ? 'services-badge-live' : 'services-badge-neutral'}`}>{broadcast.isLive ? 'Live' : 'Recorded'}</span></td>
                                                            <td><a className="services-video-link" href={broadcast.videoUrl} target="_blank" rel="noreferrer">▶ Watch</a></td>
                                                            <td>
                                                                <AdminActionButtons
                                                                    itemName={broadcast.title}
                                                                    isPublic={linkedService?.isBroadcastEnabled ?? false}
                                                                    onEdit={() => openEditBroadcast(broadcast)}
                                                                    onVisibilityToggle={
                                                                        linkedService
                                                                            ? () => requestBroadcastToggle(linkedService)
                                                                            : undefined
                                                                    }
                                                                    onDelete={() => requestDeleteBroadcast(broadcast)}
                                                                    editTitle="Edit broadcast"
                                                                    makePublicTitle="Broadcast service"
                                                                    makePrivateTitle="Unbroadcast service"
                                                                    deleteTitle="Delete broadcast"
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
                        )}
                    </>
                )}

                {serviceFormOpen && (
                    <div className="services-modal-backdrop" onMouseDown={closeServiceForm}>
                        <div className="services-modal services-modal-large" role="dialog" aria-modal="true" aria-labelledby="service-form-title" onMouseDown={event => event.stopPropagation()}>
                            <div className="services-modal-header"><div><span>Service Schedule</span><h2 id="service-form-title">{editingService ? 'Edit Service' : 'Add Service'}</h2></div><button type="button" onClick={closeServiceForm} disabled={saving} aria-label="Close">×</button></div>
                            <form onSubmit={submitService}>
                                <div className="services-form-grid">
                                    <label className="services-field services-field-wide"><span>Service Name *</span><input required value={serviceForm.name} onChange={e => setServiceForm(c => ({ ...c, name: e.target.value }))} /></label>
                                    <label className="services-field"><span>Category *</span><select required value={serviceForm.category} onChange={e => setServiceForm(c => ({ ...c, category: e.target.value }))}><option value="">Select a category</option>{serviceCategories.map(v => <option key={v} value={v}>{humanise(v)}</option>)}</select></label>
                                    <label className="services-field"><span>Day *</span><select value={serviceForm.dayOfWeek} onChange={e => setServiceForm(c => ({ ...c, dayOfWeek: e.target.value }))}>{daysOfWeek.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
                                    <label className="services-field"><span>Start Time</span><input type="time" value={serviceForm.startTime} onChange={e => setServiceForm(c => ({ ...c, startTime: e.target.value }))} /></label>
                                    <label className="services-field"><span>End Time</span><input type="time" value={serviceForm.endTime} onChange={e => setServiceForm(c => ({ ...c, endTime: e.target.value }))} /></label>
                                    <label className="services-field"><span>Recurrence</span><select value={serviceForm.recurrence} onChange={e => setServiceForm(c => ({ ...c, recurrence: e.target.value as RecurrencePattern }))}>{recurrencePatterns.map(v => <option key={v} value={v}>{humanise(v)}</option>)}</select></label>
                                    <label className="services-field"><span>Day of Month</span><input type="number" min="1" max="31" disabled={serviceForm.recurrence !== 'Monthly'} value={serviceForm.dayOfMonth} onChange={e => setServiceForm(c => ({ ...c, dayOfMonth: e.target.value }))} placeholder={serviceForm.recurrence === 'Monthly' ? '1–31' : 'Not required'} /></label>
                                    <label className="services-field"><span>Display Order</span><input type="number" min="0" value={serviceForm.displayOrder} onChange={e => setServiceForm(c => ({ ...c, displayOrder: e.target.value }))} /></label>
                                    <label className="services-field"><span>Icon</span><input maxLength={50} value={serviceForm.icon} onChange={e => setServiceForm(c => ({ ...c, icon: e.target.value }))} placeholder="e.g. 🕊️" /></label>
                                    <label className="services-field services-field-wide"><span>Description</span><textarea rows={3} value={serviceForm.description} onChange={e => setServiceForm(c => ({ ...c, description: e.target.value }))} /></label>
                                    <label className="services-field services-field-wide"><span>Location</span><input value={serviceForm.location} onChange={e => setServiceForm(c => ({ ...c, location: e.target.value }))} /></label>
                                    <label className="services-field"><span>Zoom ID</span><input value={serviceForm.zoomId} onChange={e => setServiceForm(c => ({ ...c, zoomId: e.target.value }))} /></label>
                                    <label className="services-field"><span>Zoom Passcode</span><input value={serviceForm.zoomPasscode} onChange={e => setServiceForm(c => ({ ...c, zoomPasscode: e.target.value }))} /></label>
                                </div>
                                <div className="services-form-options">
                                    <label><input type="checkbox" checked={serviceForm.isLocal} onChange={e => setServiceForm(c => ({ ...c, isLocal: e.target.checked }))} /><span><strong>Local service</strong><small>This service belongs to Hope House locally.</small></span></label>
                                    <label><input type="checkbox" checked={serviceForm.showInMonthlyServices} onChange={e => setServiceForm(c => ({ ...c, showInMonthlyServices: e.target.checked }))} /><span><strong>Show in Special Monthly Services</strong><small>Include this service on the public monthly services section.</small></span></label>
                                </div>
                                <div className="services-modal-actions"><button type="button" className="services-secondary-button" onClick={closeServiceForm} disabled={saving}>Cancel</button><button type="submit" className="admin-primary-button" disabled={saving}>{saving ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service'}</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {broadcastFormOpen && (
                    <div className="services-modal-backdrop" onMouseDown={closeBroadcastForm}>
                        <div className="services-modal" role="dialog" aria-modal="true" aria-labelledby="broadcast-form-title" onMouseDown={event => event.stopPropagation()}>
                            <div className="services-modal-header"><div><span>Monthly Services</span><h2 id="broadcast-form-title">{editingBroadcast ? 'Edit Broadcast' : 'Add Broadcast'}</h2></div><button type="button" onClick={closeBroadcastForm} disabled={saving} aria-label="Close">×</button></div>
                            <form onSubmit={submitBroadcast}>
                                <div className="services-form-grid">
                                    <label className="services-field services-field-wide"><span>Service *</span><select required disabled={Boolean(editingBroadcast)} value={broadcastForm.churchServiceId} onChange={e => setBroadcastForm(c => ({ ...c, churchServiceId: e.target.value }))}><option value="">Select a service</option>{(editingBroadcast ? sortedServices.filter(service => service.id === broadcastForm.churchServiceId) : broadcastEnabledServices).map(service => <option key={service.id} value={service.id}>{service.name}{!service.isActive ? ' (Inactive)' : ''}</option>)}</select>{editingBroadcast && <small>Service cannot be reassigned when editing an existing broadcast.</small>}</label>
                                    <label className="services-field services-field-wide"><span>Title *</span><input required value={broadcastForm.title} onChange={e => setBroadcastForm(c => ({ ...c, title: e.target.value }))} /></label>
                                    <label className="services-field services-field-wide"><span>YouTube URL or Video ID *</span><input required value={broadcastForm.youtubeUrl} onChange={e => setBroadcastForm(c => ({ ...c, youtubeUrl: e.target.value }))} /></label>
                                    <label className="services-field"><span>Service Month *</span><input type="month" required disabled={Boolean(editingBroadcast)} value={broadcastForm.serviceMonth} onChange={e => setBroadcastForm(c => ({ ...c, serviceMonth: e.target.value }))} /></label>
                                    <label className="services-field"><span>Theme</span><input value={broadcastForm.theme} onChange={e => setBroadcastForm(c => ({ ...c, theme: e.target.value }))} /></label>
                                    <label className="services-field services-field-wide"><span>Description</span><textarea rows={3} value={broadcastForm.description} onChange={e => setBroadcastForm(c => ({ ...c, description: e.target.value }))} /></label>
                                </div>
                                <div className="services-form-options"><label><input type="checkbox" checked={broadcastForm.isLive} onChange={e => setBroadcastForm(c => ({ ...c, isLive: e.target.checked }))} /><span><strong>Live broadcast</strong><small>Mark this broadcast as currently live.</small></span></label></div>
                                <div className="services-modal-actions"><button type="button" className="services-secondary-button" onClick={closeBroadcastForm} disabled={saving}>Cancel</button><button type="submit" className="admin-primary-button" disabled={saving}>{saving ? 'Saving...' : editingBroadcast ? 'Save Changes' : 'Add Broadcast'}</button></div>
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

export default Services;
