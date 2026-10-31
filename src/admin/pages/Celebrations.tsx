import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiFetch, getApiErrorDetails, getNetworkErrorDetails, type ApiErrorDetails } from '@/api/api';
import ApiErrorState from '@/components/sections/ApiErrorState';
import ConfirmDialog from '@/components/sections/ConfirmDialog';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin.css';
import '../styles/celebrations.css';

type Occasion = 'Birthday' | 'WeddingAnniversary';
type StatusFilter = 'Upcoming' | 'Pending' | 'AwaitingMemberResponse' | 'ApprovedByMember' | 'ReadyToPublish' | 'Published';

interface Celebration {
    id: string;
    memberId: string;
    memberName: string | null;
    galleryCategoryId: string;
    galleryCategoryName: string | null;
    occasion: string;
    celebrationDate: string;
    galleryImageId: string | null;
    photoUrl: string | null;
    photoPublicationConsent: boolean;
    status: string;
    invitationSentAt: string | null;
    respondedAt: string | null;
    approvedByAdminAt: string | null;
    publishedAt: string | null;
    withdrawnAt: string | null;
}

interface MemberOption {
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    consentToContact: boolean;
    birthMonth: number | null;
    birthDay: number | null;
    weddingAnniversary: string | null;
}

interface GalleryCategoryOption {
    id: string;
    name: string;
    isActive: boolean;
    displayOrder: number;
}

interface CelebrationForm {
    memberId: string;
    galleryCategoryId: string;
    occasion: Occasion;
    celebrationDate: string;
}

type ConfirmationState = {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'primary' | 'success' | 'warning' | 'danger';
    action: (() => Promise<void>) | null;
};

const filters: { value: StatusFilter; label: string }[] = [
    { value: 'Upcoming', label: 'Upcoming' },
    { value: 'Pending', label: 'Pending' },
    { value: 'AwaitingMemberResponse', label: 'Awaiting Response' },
    { value: 'ApprovedByMember', label: 'Member Approved' },
    { value: 'ReadyToPublish', label: 'Ready to Publish' },
    { value: 'Published', label: 'Published' },
];

const emptyConfirmation: ConfirmationState = {
    open: false, title: '', message: '', confirmText: 'Confirm', variant: 'primary', action: null,
};

const todayInUk = (): string => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const value = (type: string) => parts.find(part => part.type === type)?.value ?? '';
    return `${value('year')}-${value('month')}-${value('day')}`;
};

function addDays(value: string, days: number): string {
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
        timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric',
    });
}

function formatDateTime(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-GB', {
        timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short',
    });
}

function formatOccasion(value: string): string {
    return value === 'WeddingAnniversary' ? 'Wedding Anniversary' : value;
}

function formatStatus(value: string): string {
    const labels: Record<string, string> = {
        Pending: 'Pending', AwaitingMemberResponse: 'Awaiting Response',
        ApprovedByMember: 'Member Approved', ReadyToPublish: 'Ready to Publish',
        ApprovedByAdmin: 'Admin Approved', Published: 'Published',
        Declined: 'Declined', Withdrawn: 'Withdrawn',
    };
    return labels[value] ?? value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function errorDetails(error: unknown): ApiErrorDetails {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return error as ApiErrorDetails;
    }
    return getNetworkErrorDetails();
}

async function requireSuccess(response: Response, message: string): Promise<void> {
    if (!response.ok) {
        const details = await getApiErrorDetails(response, message);
        throw new Error(details.message);
    }
}

function eligibleDate(member: MemberOption | undefined, occasion: Occasion, year: number): string | null {
    if (!member) return null;
    let month: number | undefined;
    let day: number | undefined;
    if (occasion === 'Birthday') {
        month = member.birthMonth ?? undefined;
        day = member.birthDay ?? undefined;
    } else if (member.weddingAnniversary) {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(member.weddingAnniversary);
        if (match) {
            month = Number(match[2]);
            day = Number(match[3]);
        }
    }
    if (!month || !day) return null;
    const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(`${candidate}T12:00:00Z`);
    return date.toISOString().slice(0, 10) === candidate ? candidate : null;
}

export default function Celebrations() {
    const [status, setStatus] = useState<StatusFilter>('Upcoming');
    const [fromDate, setFromDate] = useState(todayInUk);
    const [throughDate, setThroughDate] = useState(() => addDays(todayInUk(), 30));
    const [search, setSearch] = useState('');
    const [celebrations, setCelebrations] = useState<Celebration[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [loadError, setLoadError] = useState<ApiErrorDetails | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>(emptyConfirmation);
    const [confirming, setConfirming] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Celebration | null>(null);
    const [saving, setSaving] = useState(false);
    const [members, setMembers] = useState<MemberOption[]>([]);
    const [categories, setCategories] = useState<GalleryCategoryOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const [form, setForm] = useState<CelebrationForm>({
        memberId: '', galleryCategoryId: '', occasion: 'Birthday', celebrationDate: '',
    });

    const loadCelebrations = useCallback(async (signal?: AbortSignal) => {
        const params = new URLSearchParams({ status });
        if (fromDate) params.set('fromDate', fromDate);
        if (throughDate) params.set('throughDate', throughDate);
        const response = await apiFetch(`/api/celebrations?${params.toString()}`, { signal });
        if (!response.ok) throw await getApiErrorDetails(response, 'Unable to load celebrations.');
        const data = (await response.json()) as Celebration[];
        setCelebrations(data);
        setLoadError(null);
    }, [status, fromDate, throughDate]);

    useEffect(() => {
        const controller = new AbortController();
        async function initialise() {
            setLoading(true);
            try {
                await loadCelebrations(controller.signal);
            } catch (error) {
                if (!controller.signal.aborted) setLoadError(errorDetails(error));
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void initialise();
        return () => controller.abort();
    }, [loadCelebrations]);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return celebrations;
        return celebrations.filter(item =>
            (item.memberName ?? '').toLowerCase().includes(term) ||
            item.occasion.toLowerCase().includes(term) ||
            (item.galleryCategoryName ?? '').toLowerCase().includes(term) ||
            item.status.toLowerCase().includes(term)
        );
    }, [celebrations, search]);

    async function retryLoad(): Promise<boolean> {
        setRetrying(true);
        try {
            await loadCelebrations();
            return true;
        } catch (error) {
            setLoadError(errorDetails(error));
            return false;
        } finally {
            setRetrying(false);
        }
    }

    async function loadOptions() {
        setOptionsLoading(true);
        setOptionsError(null);
        try {
            // Uses the existing members endpoint and gallery category resource.
            const [membersResponse, categoriesResponse] = await Promise.all([
                apiFetch('/api/members?includeInactive=false&skip=0&take=500'),
                apiFetch('/api/gallery-categories/admin/'),
            ]);
            await requireSuccess(membersResponse, 'Unable to load members.');
            await requireSuccess(categoriesResponse, 'Unable to load gallery categories.');
            setMembers((await membersResponse.json()) as MemberOption[]);
            const categoryResult: unknown = await categoriesResponse.json();
            if (Array.isArray(categoryResult)) {
                setCategories((categoryResult as GalleryCategoryOption[]).filter(category => category.isActive).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)));
            } else if (
                categoryResult !== null && typeof categoryResult === 'object' &&
                'items' in categoryResult && Array.isArray(categoryResult.items)
            ) {
                setCategories((categoryResult.items as GalleryCategoryOption[]).filter(category => category.isActive).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)));
            } else {
                throw new Error('The gallery category response has an unexpected format.');
            }
        } catch (error) {
            setOptionsError(error instanceof Error ? error.message : 'Unable to load form options.');
        } finally {
            setOptionsLoading(false);
        }
    }

    function openCreate() {
        setEditing(null);
        setForm({ memberId: '', galleryCategoryId: '', occasion: 'Birthday', celebrationDate: '' });
        setActionError(null);
        setFormOpen(true);
        void loadOptions();
    }

    function openEdit(item: Celebration) {
        setEditing(item);
        setForm({
            memberId: item.memberId,
            galleryCategoryId: item.galleryCategoryId,
            occasion: item.occasion === 'WeddingAnniversary' ? 'WeddingAnniversary' : 'Birthday',
            celebrationDate: item.celebrationDate.slice(0, 10),
        });
        setActionError(null);
        setFormOpen(true);
        void loadOptions();
    }

    function updateMember(memberId: string) {
        const member = members.find(item => item.id === memberId);
        const date = eligibleDate(member, form.occasion, Number(form.celebrationDate.slice(0, 4)) || Number(todayInUk().slice(0, 4)));
        setForm(current => ({ ...current, memberId, celebrationDate: date ?? '' }));
    }

    function updateOccasion(occasion: Occasion) {
        const member = members.find(item => item.id === form.memberId);
        const date = eligibleDate(member, occasion, Number(form.celebrationDate.slice(0, 4)) || Number(todayInUk().slice(0, 4)));
        setForm(current => ({ ...current, occasion, celebrationDate: date ?? '' }));
    }

    async function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        setActionError(null);
        const member = members.find(item => item.id === form.memberId);
        if (!editing && (!member || !member.isActive || !member.consentToContact)) {
            setActionError('Select an active member who has consented to contact.');
            return;
        }
        if (!form.galleryCategoryId || !form.celebrationDate) {
            setActionError('Select a gallery category and celebration date.');
            return;
        }
        if (!editing) {
            const expected = eligibleDate(member, form.occasion, Number(form.celebrationDate.slice(0, 4)));
            if (!expected || expected !== form.celebrationDate) {
                setActionError('The celebration date must match the member’s recorded birthday or anniversary.');
                return;
            }
        }
        setSaving(true);
        try {
            const payload = editing
                ? { galleryCategoryId: form.galleryCategoryId, occasion: form.occasion, celebrationDate: form.celebrationDate }
                : { memberId: form.memberId, galleryCategoryId: form.galleryCategoryId, occasion: form.occasion, celebrationDate: form.celebrationDate };
            const response = await apiFetch(editing ? `/api/celebrations/${editing.id}` : '/api/celebrations/', {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            await requireSuccess(response, editing ? 'Unable to update celebration.' : 'Unable to create celebration.');
            setFormOpen(false);
            setSuccess(editing ? 'Celebration updated successfully.' : 'Celebration created successfully.');
            await loadCelebrations();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to save celebration.');
        } finally {
            setSaving(false);
        }
    }

    function requestAction(item: Celebration, action: 'invite' | 'approve' | 'publish' | 'delete') {
        const title = { invite: 'Send SMS invitation?', approve: 'Approve celebration?', publish: 'Publish celebration?', delete: 'Delete celebration?' }[action];
        const message = {
            invite: `Send a secure SMS invitation to ${item.memberName ?? 'this member'}? The member must respond before publication can be approved.`,
            approve: `Approve ${item.memberName ?? 'this member'}’s celebration for publication? Confirm that the member has consented.`,
            publish: `Publish ${item.memberName ?? 'this member'}’s celebration? This will make the approved celebration public.`,
            delete: `Delete ${item.memberName ?? 'this member'}’s celebration? This action removes the record from the active workflow.`,
        }[action];
        setConfirmation({
            open: true, title, message,
            confirmText: { invite: 'Send Invitation', approve: 'Approve', publish: 'Publish', delete: 'Delete' }[action],
            variant: action === 'delete' ? 'danger' : action === 'publish' ? 'success' : 'primary',
            action: async () => {
                setBusyId(item.id);
                try {
                    const response = await apiFetch(
                        action === 'delete' ? `/api/celebrations/${item.id}` : `/api/celebrations/${item.id}/${action}`,
                        { method: action === 'delete' ? 'DELETE' : 'POST' }
                    );
                    await requireSuccess(response, `Unable to ${action} celebration.`);
                    if (action === 'invite') {
                        const result: unknown = await response.json();
                        if (result && typeof result === 'object' && 'success' in result && result.success === false) {
                            throw new Error('The invitation was not issued. Please check the member’s contact details.');
                        }
                    }
                    setSuccess({ invite: 'SMS invitation request completed.', approve: 'Administrator approval recorded.', publish: 'Celebration published.', delete: 'Celebration deleted.' }[action]);
                    await loadCelebrations();
                } finally {
                    setBusyId(null);
                }
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
            setConfirming(false);
            setConfirmation(emptyConfirmation);
        }
    }

    const selectedMember = members.find(member => member.id === form.memberId);
    const eligibleMembers = members.filter(member => member.isActive && member.consentToContact);
    const canEdit = (item: Celebration) => item.status === 'Pending' && !item.invitationSentAt;
    const canInvite = (item: Celebration) => item.status === 'Pending' && !item.invitationSentAt;
    const canApprove = (item: Celebration) => item.status === 'ApprovedByMember' && !item.approvedByAdminAt;
    const canPublish = (item: Celebration) => item.status === 'ReadyToPublish' || (item.status === 'ApprovedByMember' && !!item.approvedByAdminAt);

    return (
        <AdminLayout>
            <div className="celebrations-admin">
                <header className="celebrations-header">
                    <div>
                        <span className="celebrations-eyebrow">Administration</span>
                        <h1>Celebrations</h1>
                        <p>Manage birthdays, wedding anniversaries, member invitations and publication approvals.</p>
                    </div>
                    <button type="button" className="admin-primary-button" onClick={openCreate}>＋ Add Celebration</button>
                </header>

                {actionError && <div className="celebrations-alert celebrations-alert-error" role="alert"><span>{actionError}</span><button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error">×</button></div>}
                {success && <div className="celebrations-alert celebrations-alert-success" role="status"><span>{success}</span><button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss notification">×</button></div>}

                <section className="celebrations-panel celebrations-filters" aria-label="Celebration filters">
                    <div className="celebrations-tabs" role="group" aria-label="Workflow stage">
                        {filters.map(filter => (
                            <button key={filter.value} type="button" className={status === filter.value ? 'active' : ''} aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)}>{filter.label}</button>
                        ))}
                    </div>
                    <div className="celebrations-filter-fields">
                        <label>From date<input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} /></label>
                        <label>Through date<input type="date" min={fromDate || undefined} value={throughDate} onChange={event => setThroughDate(event.target.value)} /></label>
                        <label className="celebrations-search">Search results<input type="search" placeholder="Member, occasion or status" value={search} onChange={event => setSearch(event.target.value)} /></label>
                    </div>
                    <p className="celebrations-filter-note">Date filters apply to Upcoming, Pending and Published. Ready to Publish uses the through date as its cutoff. Other stages are not date-filtered by the API.</p>
                </section>

                {loading ? (
                    <div className="celebrations-panel celebrations-empty"><div className="admin-loading-spinner" /><strong>Loading celebrations...</strong></div>
                ) : loadError ? (
                    <ApiErrorState status={loadError.status} title={loadError.title} message={loadError.message} onRetry={retryLoad} retrying={retrying} />
                ) : (
                    <section className="celebrations-panel">
                        <div className="celebrations-panel-heading"><div><h2>{filters.find(item => item.value === status)?.label}</h2><p>{visible.length} celebration{visible.length === 1 ? '' : 's'} shown</p></div><button type="button" className="celebrations-secondary-button" onClick={() => void retryLoad()} disabled={retrying}>{retrying ? 'Refreshing...' : 'Refresh'}</button></div>
                        {visible.length === 0 ? (
                            <div className="celebrations-empty"><strong>No celebrations found</strong><p>Try another workflow stage, date range or search term.</p></div>
                        ) : (
                            <div className="celebrations-table-wrap">
                                <table className="celebrations-table">
                                    <thead><tr><th>Member / Occasion</th><th>Date</th><th>Gallery Category</th><th>Workflow</th><th>Invitation / Consent</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {visible.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.memberName || 'Member unavailable'}</strong><span className="celebrations-subtext">{formatOccasion(item.occasion)}</span></td>
                                                <td>{formatDate(item.celebrationDate)}</td>
                                                <td>{item.galleryCategoryName || '—'}</td>
                                                <td><span className={`celebrations-status celebrations-status-${item.status.toLowerCase()}`}>{formatStatus(item.status)}</span><span className="celebrations-subtext">{item.publishedAt ? `Published ${formatDate(item.publishedAt)}` : item.approvedByAdminAt ? 'Admin approved' : ''}</span></td>
                                                <td><span>{item.invitationSentAt ? `Sent ${formatDateTime(item.invitationSentAt)}` : 'Not sent'}</span><span className="celebrations-subtext">{item.respondedAt ? `Responded ${formatDateTime(item.respondedAt)}` : 'No response recorded'}</span><span className="celebrations-subtext">Photo consent: {item.photoPublicationConsent ? 'Yes' : 'No'}</span></td>
                                                <td><div className="celebrations-actions">
                                                    {canEdit(item) && <button type="button" onClick={() => openEdit(item)} disabled={busyId === item.id}>Edit</button>}
                                                    {canInvite(item) && <button type="button" onClick={() => requestAction(item, 'invite')} disabled={busyId === item.id}>Send SMS</button>}
                                                    {canApprove(item) && <button type="button" onClick={() => requestAction(item, 'approve')} disabled={busyId === item.id}>Admin Approve</button>}
                                                    {canPublish(item) && <button type="button" className="celebrations-action-primary" onClick={() => requestAction(item, 'publish')} disabled={busyId === item.id}>Publish</button>}
                                                    {canEdit(item) && <button type="button" className="celebrations-action-danger" onClick={() => requestAction(item, 'delete')} disabled={busyId === item.id}>Delete</button>}
                                                    {!canEdit(item) && !canInvite(item) && !canApprove(item) && !canPublish(item) && <span className="celebrations-subtext">No actions available</span>}
                                                </div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {formOpen && (
                    <div className="celebrations-modal-backdrop" onMouseDown={() => { if (!saving) setFormOpen(false); }}>
                        <div className="celebrations-modal" role="dialog" aria-modal="true" aria-labelledby="celebrations-form-title" onMouseDown={event => event.stopPropagation()}>
                            <header className="celebrations-modal-header"><div><span>Celebration management</span><h2 id="celebrations-form-title">{editing ? 'Edit Celebration' : 'Add Celebration'}</h2></div><button type="button" aria-label="Close" disabled={saving} onClick={() => setFormOpen(false)}>×</button></header>
                            {optionsLoading ? <div className="celebrations-empty">Loading members and gallery categories...</div> : optionsError ? <div className="celebrations-alert celebrations-alert-error" role="alert">{optionsError}<button type="button" onClick={() => void loadOptions()}>Retry</button></div> : (
                                <form onSubmit={event => void submitForm(event)}>
                                    <div className="celebrations-form-grid">
                                        <label className="celebrations-field">Member *
                                            <select required disabled={!!editing} value={form.memberId} onChange={event => updateMember(event.target.value)}>
                                                <option value="">Select an eligible member</option>
                                                {editing && !eligibleMembers.some(member => member.id === editing.memberId) && <option value={editing.memberId}>{editing.memberName ?? 'Existing member'}</option>}
                                                {eligibleMembers.map(member => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
                                            </select>
                                        </label>
                                        <label className="celebrations-field">Occasion *
                                            <select value={form.occasion} onChange={event => updateOccasion(event.target.value as Occasion)}>
                                                <option value="Birthday">Birthday</option><option value="WeddingAnniversary">Wedding Anniversary</option>
                                            </select>
                                        </label>
                                        <label className="celebrations-field">Gallery Category *
                                            <select required value={form.galleryCategoryId} onChange={event => setForm(current => ({ ...current, galleryCategoryId: event.target.value }))}>
                                                <option value="">Select gallery category</option>
                                                {editing && !categories.some(category => category.id === editing.galleryCategoryId) && <option value={editing.galleryCategoryId}>{editing.galleryCategoryName ?? 'Existing category'}</option>}
                                                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                                            </select>
                                        </label>
                                        <label className="celebrations-field">Celebration Date *
                                            <input required type="date" value={form.celebrationDate} onChange={event => setForm(current => ({ ...current, celebrationDate: event.target.value }))} />
                                        </label>
                                    </div>
                                    {!editing && selectedMember && <p className="celebrations-form-note">The date must match the member's recorded {form.occasion === 'Birthday' ? 'birthday' : 'wedding anniversary'}. Change the year to schedule a different year.</p>}
                                    <p className="celebrations-form-note">Creating a celebration does not grant publication consent. Send an invitation after saving, then await the member's decision and administrator approval.</p>
                                    {actionError && <div className="celebrations-alert celebrations-alert-error" role="alert">{actionError}</div>}
                                    <div className="celebrations-modal-actions"><button type="button" className="celebrations-secondary-button" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="admin-primary-button" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Celebration'}</button></div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                <ConfirmDialog open={confirmation.open} title={confirmation.title} message={confirmation.message} confirmText={confirmation.confirmText} cancelText="Cancel" variant={confirmation.variant} loading={confirming} loadingText="Please wait..." onConfirm={() => void runConfirmation()} onCancel={() => { if (!confirming) setConfirmation(emptyConfirmation); }} />
            </div>
        </AdminLayout>
    );
}
