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
import useGallery from '@/hooks/useGallery';

import AdminActionButtons from '../components/AdminActionButtons';
import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/members.css';

type MaritalStatus =
    | 'Single'
    | 'Married'
    | 'Divorced'
    | 'Widowed'
    | 'Separated';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    country: string | null;
    birthMonth: number | null;
    birthDay: number | null;
    birthYear: number | null;
    maritalStatus: MaritalStatus | null;
    weddingAnniversary: string | null;
    consentToContact: boolean;
    consentToBirthdayPublication: boolean;
    photoId: string | null;
    photoImagePath: string | null;
    photoThumbnailPath: string | null;
    isActive: boolean;
    joinedDate: string;
}

interface MemberFormState {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    joinedDate: string;
    birthMonth: string;
    birthDay: string;
    birthYear: string;
    maritalStatus: string;
    weddingAnniversary: string;
    consentToContact: boolean;
    consentToBirthdayPublication: boolean;
    photoId: string;
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

const emptyMemberForm: MemberFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    joinedDate: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    maritalStatus: '',
    weddingAnniversary: '',
    consentToContact: false,
    consentToBirthdayPublication: false,
    photoId: '',
};

const emptyConfirmation: ConfirmationState = {
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: null,
};

const maritalStatuses: MaritalStatus[] = [
    'Single',
    'Married',
    'Divorced',
    'Widowed',
    'Separated',
];

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function formatDate(value: string | null) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    );
}

function formatBirthday(member: Member) {
    if (
        member.birthMonth === null ||
        member.birthDay === null
    ) {
        return '—';
    }

    const month =
        months[
        member.birthMonth - 1
        ];

    if (!month) {
        return '—';
    }

    return member.birthYear
        ? `${member.birthDay} ${month} ${member.birthYear}`
        : `${member.birthDay} ${month}`;
}

function resolveMemberImageUrl(
    path: string | null
) {
    if (!path) {
        return null;
    }

    if (
        path.startsWith('http://') ||
        path.startsWith('https://')
    ) {
        return path;
    }

    const apiBaseUrl =
        (
            import.meta.env
                .VITE_API_BASE_URL ??
            ''
        ).replace(/\/$/, '');

    const normalisedPath =
        path.startsWith('/')
            ? path
            : `/${path}`;

    return `${apiBaseUrl}${normalisedPath}`;
}

function Members() {
    const {
        images: galleryImages,
        loading: galleryLoading,
        error: galleryError,
    } = useGallery();

    const [
        members,
        setMembers,
    ] = useState<Member[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        retrying,
        setRetrying,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        confirming,
        setConfirming,
    ] = useState(false);

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
        memberFormOpen,
        setMemberFormOpen,
    ] = useState(false);

    const [
        editingMember,
        setEditingMember,
    ] =
        useState<Member | null>(
            null
        );

    const [
        memberForm,
        setMemberForm,
    ] =
        useState<MemberFormState>(
            emptyMemberForm
        );

    const [
        searchTerm,
        setSearchTerm,
    ] = useState('');

    const [
        showInactive,
        setShowInactive,
    ] = useState(false);

    const [
        confirmation,
        setConfirmation,
    ] =
        useState<ConfirmationState>(
            emptyConfirmation
        );

    const fetchMembers =
        useCallback(
            async (
                includeInactive: boolean,
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        `/api/members?includeInactive=${includeInactive}&skip=0&take=500`,
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load members.'
                    );
                }

                return (
                    await response.json()
                ) as Member[];
            },
            []
        );

    const loadMembers =
        useCallback(
            async (
                includeInactive: boolean,
                signal?: AbortSignal
            ) => {
                const data =
                    await fetchMembers(
                        includeInactive,
                        signal
                    );

                setMembers(data);
                setLoadError(null);
            },
            [fetchMembers]
        );

    useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(true);

                    await loadMembers(
                        showInactive,
                        controller.signal
                    );
                } catch (error) {
                    if (
                        controller.signal.aborted
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
                        !controller.signal.aborted
                    ) {
                        setLoading(false);
                    }
                }
            };

        void initialise();

        return () =>
            controller.abort();
    }, [
        loadMembers,
        showInactive,
    ]);

    const filteredMembers =
        useMemo(() => {
            const search =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!search) {
                return members;
            }

            return members.filter(
                member => {
                    const fullName =
                        `${member.firstName} ${member.lastName}`
                            .toLowerCase();

                    return (
                        fullName.includes(
                            search
                        ) ||
                        member.email
                            ?.toLowerCase()
                            .includes(
                                search
                            ) ||
                        member.phoneNumber
                            ?.toLowerCase()
                            .includes(
                                search
                            ) ||
                        member.addressLine1
                            ?.toLowerCase()
                            .includes(search) ||
                        member.city
                            ?.toLowerCase()
                            .includes(search) ||
                        member.postcode
                            ?.toLowerCase()
                            .includes(search)
                    );
                }
            );
        }, [
            members,
            searchTerm,
        ]);

    const activeMembers =
        members.filter(
            member =>
                member.isActive
        ).length;

    const currentMonth =
        new Date().getMonth() + 1;

    const birthdaysThisMonth =
        members.filter(
            member =>
                member.isActive &&
                member.birthMonth ===
                currentMonth
        ).length;

    const anniversariesThisMonth =
        members.filter(
            member => {
                if (
                    !member.isActive ||
                    !member.weddingAnniversary
                ) {
                    return false;
                }

                const [
                    ,
                    month,
                ] =
                    member
                        .weddingAnniversary
                        .split('-')
                        .map(Number);

                return (
                    month ===
                    currentMonth
                );
            }
        ).length;

    async function retryLoad():
        Promise<boolean> {
        setRetrying(true);
        setActionError(null);

        try {
            await loadMembers(
                showInactive
            );

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

    function openNewMember() {
        setEditingMember(null);

        setMemberForm({
            ...emptyMemberForm,
        });

        setMemberFormOpen(true);
        setActionError(null);
    }

    function openEditMember(
        member: Member
    ) {
        setEditingMember(
            member
        );

        setMemberForm({
            firstName:
                member.firstName,
            lastName:
                member.lastName,
            email:
                member.email ?? '',
            phoneNumber:
                member.phoneNumber ?? '',
            addressLine1:
                member.addressLine1 ?? '',
            addressLine2:
                member.addressLine2 ?? '',
            city:
                member.city ?? '',
            county:
                member.county ?? '',
            postcode:
                member.postcode ?? '',
            country:
                member.country ?? '',
            joinedDate:
                member.joinedDate
                    ?.slice(0, 10) ?? '',
            birthMonth:
                member.birthMonth
                    ?.toString() ?? '',
            birthDay:
                member.birthDay
                    ?.toString() ?? '',
            birthYear:
                member.birthYear
                    ?.toString() ?? '',
            maritalStatus:
                member.maritalStatus ??
                '',
            weddingAnniversary:
                member
                    .weddingAnniversary
                    ?.slice(
                        0,
                        10
                    ) ?? '',
            consentToContact:
                member
                    .consentToContact,
            consentToBirthdayPublication:
                member.consentToBirthdayPublication,
            photoId:
                member.photoId ?? '',
        });

        setMemberFormOpen(true);
        setActionError(null);
    }

    function closeMemberForm() {
        if (saving) {
            return;
        }

        setMemberFormOpen(false);
        setEditingMember(null);

        setMemberForm(
            emptyMemberForm
        );
    }

    function updateMaritalStatus(
        value: string
    ) {
        setMemberForm(
            current => ({
                ...current,
                maritalStatus:
                    value,
                weddingAnniversary:
                    value ===
                        'Married'
                        ? current
                            .weddingAnniversary
                        : '',
            })
        );
    }

    async function submitMember(
        event: FormEvent
    ) {
        event.preventDefault();

        setSaving(true);
        setActionError(null);

        try {
            const hasAddress =
                memberForm.addressLine1.trim() !== '' ||
                memberForm.addressLine2.trim() !== '' ||
                memberForm.city.trim() !== '' ||
                memberForm.county.trim() !== '' ||
                memberForm.postcode.trim() !== '';

            const payload = {
                id:
                    editingMember?.id,
                firstName:
                    memberForm
                        .firstName
                        .trim(),
                lastName:
                    memberForm
                        .lastName
                        .trim(),
                email:
                    memberForm.email
                        .trim() ||
                    null,
                phoneNumber:
                    memberForm
                        .phoneNumber
                        .trim() ||
                    null,
                addressLine1:
                    hasAddress
                        ? memberForm.addressLine1.trim() || null
                        : null,
                addressLine2:
                    hasAddress
                        ? memberForm.addressLine2.trim() || null
                        : null,
                city:
                    hasAddress
                        ? memberForm.city.trim() || null
                        : null,
                county:
                    hasAddress
                        ? memberForm.county.trim() || null
                        : null,
                postcode:
                    hasAddress
                        ? memberForm.postcode.trim() || null
                        : null,
                country:
                    hasAddress
                        ? memberForm.country.trim() || null
                        : null,
                joinedDate:
                    memberForm.joinedDate
                        ? `${memberForm.joinedDate}T00:00:00`
                        : null,
                birthMonth:
                    memberForm.birthMonth
                        ? Number(
                            memberForm.birthMonth
                        )
                        : null,
                birthDay:
                    memberForm.birthDay
                        ? Number(
                            memberForm.birthDay
                        )
                        : null,
                birthYear:
                    memberForm.birthYear
                        ? Number(
                            memberForm.birthYear
                        )
                        : null,
                maritalStatus:
                    memberForm
                        .maritalStatus ||
                    null,
                weddingAnniversary:
                    memberForm
                        .maritalStatus ===
                        'Married' &&
                        memberForm
                            .weddingAnniversary
                        ? memberForm
                            .weddingAnniversary
                        : null,
                consentToContact:
                    memberForm
                        .consentToContact,
                consentToBirthdayPublication:
                    memberForm.consentToBirthdayPublication,
                photoId:
                    memberForm.photoId || null,
            };

            const response =
                await apiFetch(
                    editingMember
                        ? `/api/members/${editingMember.id}`
                        : '/api/members/',
                    {
                        method:
                            editingMember
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
                    'Unable to save member.'
                );
            }

            setMembers(
                await fetchMembers(
                    showInactive
                )
            );

            closeMemberForm();

            showSuccess(
                editingMember
                    ? 'Member updated successfully.'
                    : 'Member added successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof
                    Error
                    ? error.message
                    : 'Unable to save member.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestStatusChange(
        member: Member
    ) {
        const activating =
            !member.isActive;

        const memberName =
            `${member.firstName} ${member.lastName}`;

        setConfirmation({
            open: true,
            title: activating
                ? 'Reactivate member?'
                : 'Deactivate member?',
            message: activating
                ? `Reactivate "${memberName}"? The member will return to the active membership list.`
                : `Deactivate "${memberName}"? Their record will be retained but they will no longer appear in the active membership list.`,
            confirmText:
                activating
                    ? 'Reactivate'
                    : 'Deactivate',
            variant:
                activating
                    ? 'success'
                    : 'warning',
            action: async () => {
                const action =
                    activating
                        ? 'reactivate'
                        : 'deactivate';

                const response =
                    await apiFetch(
                        `/api/members/${member.id}/${action}`,
                        {
                            method:
                                'POST',
                        }
                    );

                if (!response.ok) {
                    await actionFailure(
                        response,
                        activating
                            ? 'Unable to reactivate member.'
                            : 'Unable to deactivate member.'
                    );
                }

                setMembers(
                    await fetchMembers(
                        showInactive
                    )
                );

                showSuccess(
                    activating
                        ? 'Member reactivated.'
                        : 'Member deactivated.'
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
            <div className="members-admin">
                <div className="members-admin-header">
                    <div>
                        <span className="members-admin-eyebrow">
                            Administration
                        </span>

                        <h1>
                            Members
                        </h1>

                        <p>
                            Manage church members, contact preferences,
                            birthdays and anniversaries.
                        </p>
                    </div>

                    {!loadError &&
                        !loading && (
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openNewMember
                                }
                            >
                                <span>
                                    ＋
                                </span>

                                Add Member
                            </button>
                        )}
                </div>

                {actionError && (
                    <div className="members-admin-alert members-admin-alert-error">
                        <span>
                            !
                        </span>

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
                    <div className="members-admin-alert members-admin-alert-success">
                        <span>
                            ✓
                        </span>

                        <div>
                            <strong>
                                Success
                            </strong>

                            <p>
                                {successMessage}
                            </p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="members-admin-panel members-admin-empty">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading members...
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
                        <div className="members-admin-stats">
                            <div className="members-stat-card">
                                <span className="members-stat-icon">
                                    ◉
                                </span>

                                <div>
                                    <strong>
                                        {members.length}
                                    </strong>

                                    <span>
                                        Total Members
                                    </span>
                                </div>
                            </div>

                            <div className="members-stat-card">
                                <span className="members-stat-icon">
                                    ✓
                                </span>

                                <div>
                                    <strong>
                                        {activeMembers}
                                    </strong>

                                    <span>
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="members-stat-card">
                                <span className="members-stat-icon">
                                    ☆
                                </span>

                                <div>
                                    <strong>
                                        {birthdaysThisMonth}
                                    </strong>

                                    <span>
                                        Birthdays This Month
                                    </span>
                                </div>
                            </div>

                            <div className="members-stat-card">
                                <span className="members-stat-icon">
                                    ♡
                                </span>

                                <div>
                                    <strong>
                                        {anniversariesThisMonth}
                                    </strong>

                                    <span>
                                        Anniversaries This Month
                                    </span>
                                </div>
                            </div>
                        </div>

                        <section className="members-admin-panel">
                            <div className="members-panel-heading">
                                <div>
                                    <h2>
                                        Membership Directory
                                    </h2>

                                    <p>
                                        {filteredMembers.length}{' '}
                                        member
                                        {filteredMembers.length ===
                                            1
                                            ? ''
                                            : 's'}{' '}
                                        shown
                                    </p>
                                </div>

                                <div className="members-toolbar">
                                    <input
                                        type="search"
                                        value={
                                            searchTerm
                                        }
                                        onChange={
                                            event =>
                                                setSearchTerm(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        placeholder="Search members..."
                                        aria-label="Search members"
                                    />

                                    <label className="members-show-inactive">
                                        <input
                                            type="checkbox"
                                            checked={
                                                showInactive
                                            }
                                            onChange={
                                                event =>
                                                    setShowInactive(
                                                        event
                                                            .target
                                                            .checked
                                                    )
                                            }
                                        />

                                        <span>
                                            Show inactive
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {filteredMembers.length ===
                                0 ? (
                                <div className="members-admin-empty">
                                    <strong>
                                        {searchTerm
                                            ? 'No matching members'
                                            : 'No members recorded'}
                                    </strong>

                                    <p>
                                        {searchTerm
                                            ? 'Try a different name, email address or phone number.'
                                            : 'Add the first church member to the membership directory.'}
                                    </p>

                                    {!searchTerm && (
                                        <button
                                            type="button"
                                            className="admin-primary-button"
                                            onClick={
                                                openNewMember
                                            }
                                        >
                                            Add Member
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="members-table-wrapper">
                                    <table className="members-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Member
                                                </th>

                                                <th>
                                                    Contact
                                                </th>

                                                <th>
                                                    Birthday
                                                </th>

                                                <th>
                                                    Marital Status
                                                </th>

                                                <th>
                                                    Joined
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
                                            {filteredMembers.map(
                                                member => {
                                                    const memberName =
                                                        `${member.firstName} ${member.lastName}`;

                                                    return (
                                                        <tr
                                                            key={
                                                                member.id
                                                            }
                                                            className={
                                                                !member.isActive
                                                                    ? 'members-row-inactive'
                                                                    : ''
                                                            }
                                                        >
                                                            <td>
                                                                <div className="members-name-cell">
                                                                    <span className="members-avatar">
                                                                        {member.photoThumbnailPath ||
                                                                            member.photoImagePath ? (
                                                                            <img
                                                                                src={
                                                                                    resolveMemberImageUrl(
                                                                                        member.photoThumbnailPath ??
                                                                                        member.photoImagePath
                                                                                    ) ??
                                                                                    undefined
                                                                                }
                                                                                alt=""
                                                                                onError={
                                                                                    event => {
                                                                                        event.currentTarget.style.display =
                                                                                            'none';

                                                                                        const fallback =
                                                                                            event.currentTarget
                                                                                                .nextElementSibling as
                                                                                            | HTMLElement
                                                                                            | null;

                                                                                        if (fallback) {
                                                                                            fallback.style.display =
                                                                                                'grid';
                                                                                        }
                                                                                    }
                                                                                }
                                                                            />
                                                                        ) : null}

                                                                        <span
                                                                            className="members-avatar-fallback"
                                                                            style={{
                                                                                display:
                                                                                    member.photoThumbnailPath ||
                                                                                        member.photoImagePath
                                                                                        ? 'none'
                                                                                        : 'grid',
                                                                            }}
                                                                            aria-hidden="true"
                                                                        >
                                                                            {member.firstName
                                                                                .charAt(0)
                                                                                .toUpperCase()}
                                                                            {member.lastName
                                                                                .charAt(0)
                                                                                .toUpperCase()}
                                                                        </span>
                                                                    </span>

                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                memberName
                                                                            }
                                                                        </strong>

                                                                        <span>
                                                                            {member.consentToContact
                                                                                ? 'Contact consent given'
                                                                                : 'No contact consent'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <span className="members-contact-value">
                                                                    {member.email ||
                                                                        '—'}
                                                                </span>

                                                                <span className="members-table-secondary">
                                                                    {member.phoneNumber ||
                                                                        '—'}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {formatBirthday(
                                                                    member
                                                                )}
                                                            </td>

                                                            <td>
                                                                {member.maritalStatus ||
                                                                    '—'}

                                                                {member.weddingAnniversary && (
                                                                    <span className="members-table-secondary">
                                                                        Anniversary:{' '}
                                                                        {formatDate(
                                                                            member.weddingAnniversary
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    member.joinedDate
                                                                )}
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`members-badge ${member.isActive
                                                                        ? 'members-badge-active'
                                                                        : 'members-badge-inactive'
                                                                        }`}
                                                                >
                                                                    {member.isActive
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <AdminActionButtons
                                                                    itemName={
                                                                        memberName
                                                                    }
                                                                    isActive={
                                                                        member.isActive
                                                                    }
                                                                    onEdit={() =>
                                                                        openEditMember(
                                                                            member
                                                                        )
                                                                    }
                                                                    onToggle={() =>
                                                                        requestStatusChange(
                                                                            member
                                                                        )
                                                                    }
                                                                    editTitle="Edit member"
                                                                    activateTitle="Reactivate member"
                                                                    deactivateTitle="Deactivate member"
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

                {memberFormOpen && (
                    <div
                        className="members-modal-backdrop"
                        onMouseDown={
                            closeMemberForm
                        }
                    >
                        <div
                            className="members-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="member-form-title"
                            onMouseDown={
                                event =>
                                    event.stopPropagation()
                            }
                        >
                            <div className="members-modal-header">
                                <div>
                                    <span>
                                        Membership
                                    </span>

                                    <h2 id="member-form-title">
                                        {editingMember
                                            ? 'Edit Member'
                                            : 'Add Member'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeMemberForm
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
                                    submitMember
                                }
                            >
                                <div className="members-form-section">
                                    <h3>
                                        Personal Details
                                    </h3>

                                    <div className="members-form-grid">
                                        <label className="members-field">
                                            <span>
                                                First Name *
                                            </span>

                                            <input
                                                required
                                                maxLength={
                                                    100
                                                }
                                                value={
                                                    memberForm.firstName
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                firstName:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Last Name *
                                            </span>

                                            <input
                                                required
                                                maxLength={
                                                    100
                                                }
                                                value={
                                                    memberForm.lastName
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                lastName:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Email
                                            </span>

                                            <input
                                                type="email"
                                                maxLength={
                                                    255
                                                }
                                                value={
                                                    memberForm.email
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                email:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Phone Number
                                            </span>

                                            <input
                                                type="tel"
                                                maxLength={
                                                    20
                                                }
                                                value={
                                                    memberForm.phoneNumber
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                phoneNumber:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="members-form-section">
                                    <h3>
                                        Address
                                    </h3>

                                    <p>
                                        Address is optional. If entered, Address Line 1, City, Postcode and Country are required.
                                    </p>

                                    <div className="members-form-grid">
                                        <label className="members-field">
                                            <span>
                                                Address Line 1
                                            </span>

                                            <input
                                                maxLength={200}
                                                value={memberForm.addressLine1}
                                                onChange={event =>
                                                    setMemberForm(current => ({
                                                        ...current,
                                                        addressLine1: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Address Line 2
                                            </span>

                                            <input
                                                maxLength={200}
                                                value={memberForm.addressLine2}
                                                onChange={event =>
                                                    setMemberForm(current => ({
                                                        ...current,
                                                        addressLine2: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                City
                                            </span>

                                            <input
                                                maxLength={100}
                                                value={memberForm.city}
                                                onChange={event =>
                                                    setMemberForm(current => ({
                                                        ...current,
                                                        city: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                County
                                            </span>

                                            <input
                                                maxLength={100}
                                                value={memberForm.county}
                                                onChange={event =>
                                                    setMemberForm(current => ({
                                                        ...current,
                                                        county: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Postcode
                                            </span>

                                            <input
                                                maxLength={20}
                                                value={memberForm.postcode}
                                                onChange={event =>
                                                    setMemberForm(current => ({
                                                        ...current,
                                                        postcode: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Country
                                            </span>

                                            <input
                                                maxLength={100}
                                                value={memberForm.country}
                                                onChange={event =>
                                                    setMemberForm(current => ({
                                                        ...current,
                                                        country: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="members-form-section">
                                    <h3>
                                        Membership
                                    </h3>

                                    <p>
                                        Leave Joined Date blank when adding a member to use the date of entry automatically.
                                    </p>

                                    <div className="members-form-grid">
                                        <label className="members-field">
                                            <span>
                                                Joined Date
                                            </span>

                                            <input
                                                type="date"
                                                value={memberForm.joinedDate}
                                                onChange={event =>
                                                    setMemberForm(current => ({
                                                        ...current,
                                                        joinedDate: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="members-form-section">
                                    <h3>
                                        Member Photo
                                    </h3>

                                    <p>
                                        Select an existing image from the church gallery.
                                        The thumbnail is shown so images with the same
                                        title can be distinguished.
                                    </p>

                                    {galleryLoading ? (
                                        <p>
                                            Loading gallery images...
                                        </p>
                                    ) : galleryError ? (
                                        <p>
                                            {galleryError}
                                        </p>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className={`members-photo-option members-photo-option-none ${memberForm.photoId === ''
                                                        ? 'members-photo-option-selected'
                                                        : ''
                                                    }`}
                                                onClick={() =>
                                                    setMemberForm(
                                                        current => ({
                                                            ...current,
                                                            photoId: '',
                                                        })
                                                    )
                                                }
                                            >
                                                <span className="members-photo-option-empty">
                                                    No photo
                                                </span>
                                            </button>

                                            <div className="members-photo-picker">
                                                {galleryImages.map(
                                                    image => {
                                                        const selected =
                                                            memberForm.photoId ===
                                                            image.id;

                                                        return (
                                                            <button
                                                                key={
                                                                    image.id
                                                                }
                                                                type="button"
                                                                className={`members-photo-option ${selected
                                                                        ? 'members-photo-option-selected'
                                                                        : ''
                                                                    }`}
                                                                onClick={() =>
                                                                    setMemberForm(
                                                                        current => ({
                                                                            ...current,
                                                                            photoId:
                                                                                image.id,
                                                                        })
                                                                    )
                                                                }
                                                                aria-pressed={
                                                                    selected
                                                                }
                                                                title={
                                                                    image.title
                                                                }
                                                            >
                                                                <img
                                                                    src={
                                                                        resolveMemberImageUrl(
                                                                            image.thumbnailPath
                                                                        ) ??
                                                                        undefined
                                                                    }
                                                                    alt={
                                                                        image.altText ||
                                                                        image.title
                                                                    }
                                                                />

                                                                <span>
                                                                    {
                                                                        image.title
                                                                    }
                                                                </span>
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>

                                            {memberForm.photoId && (
                                                <button
                                                    type="button"
                                                    className="members-secondary-button"
                                                    onClick={() =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                photoId: '',
                                                            })
                                                        )
                                                    }
                                                >
                                                    Remove Photo
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="members-form-section">
                                    <h3>
                                        Birthday
                                    </h3>

                                    <p>
                                        Month and day are entered together.
                                        The year is optional.
                                    </p>

                                    <div className="members-birthday-grid">
                                        <label className="members-field">
                                            <span>
                                                Month
                                            </span>

                                            <select
                                                value={
                                                    memberForm.birthMonth
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                birthMonth:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                            >
                                                <option value="">
                                                    Select month
                                                </option>

                                                {months.map(
                                                    (
                                                        month,
                                                        index
                                                    ) => (
                                                        <option
                                                            key={
                                                                month
                                                            }
                                                            value={
                                                                index +
                                                                1
                                                            }
                                                        >
                                                            {
                                                                month
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Day
                                            </span>

                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={
                                                    memberForm.birthDay
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                birthDay:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                                placeholder="Day"
                                            />
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Year
                                            </span>

                                            <input
                                                type="number"
                                                min="1900"
                                                max={
                                                    new Date()
                                                        .getFullYear()
                                                }
                                                value={
                                                    memberForm.birthYear
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                birthYear:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                                placeholder="Optional"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="members-form-section">
                                    <h3>
                                        Family Information
                                    </h3>

                                    <div className="members-form-grid">
                                        <label className="members-field">
                                            <span>
                                                Marital Status
                                            </span>

                                            <select
                                                value={
                                                    memberForm.maritalStatus
                                                }
                                                onChange={
                                                    event =>
                                                        updateMaritalStatus(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                }
                                            >
                                                <option value="">
                                                    Not specified
                                                </option>

                                                {maritalStatuses.map(
                                                    status => (
                                                        <option
                                                            key={
                                                                status
                                                            }
                                                            value={
                                                                status
                                                            }
                                                        >
                                                            {
                                                                status
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </label>

                                        <label className="members-field">
                                            <span>
                                                Wedding Anniversary
                                            </span>

                                            <input
                                                type="date"
                                                disabled={
                                                    memberForm.maritalStatus !==
                                                    'Married'
                                                }
                                                value={
                                                    memberForm.weddingAnniversary
                                                }
                                                onChange={
                                                    event =>
                                                        setMemberForm(
                                                            current => ({
                                                                ...current,
                                                                weddingAnniversary:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                            />

                                            {memberForm.maritalStatus !==
                                                'Married' && (
                                                    <small>
                                                        Available when marital status is Married.
                                                    </small>
                                                )}
                                        </label>
                                    </div>
                                </div>

                                <div className="members-form-options">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                memberForm.consentToContact
                                            }
                                            onChange={
                                                event =>
                                                    setMemberForm(
                                                        current => ({
                                                            ...current,
                                                            consentToContact:
                                                                event
                                                                    .target
                                                                    .checked,
                                                        })
                                                    )
                                            }
                                        />

                                        <span>
                                            <strong>
                                                Consent to Contact
                                            </strong>

                                            <small>
                                                The member has agreed to receive
                                                church communications, including
                                                appropriate birthday and anniversary
                                                greetings.
                                            </small>
                                        </span>
                                    </label>

                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                memberForm.consentToBirthdayPublication
                                            }
                                            onChange={
                                                event =>
                                                    setMemberForm(
                                                        current => ({
                                                            ...current,
                                                            consentToBirthdayPublication:
                                                                event
                                                                    .target
                                                                    .checked,
                                                        })
                                                    )
                                            }
                                        />

                                        <span>
                                            <strong>
                                                Consent to Birthday Publication
                                            </strong>

                                            <small>
                                                The member has agreed for their name,
                                                birthday day and month, and approved
                                                photo to appear in public birthday
                                                celebrations. Birth year and contact
                                                details are not published.
                                            </small>
                                        </span>
                                    </label>
                                </div>

                                <div className="members-modal-actions">
                                    <button
                                        type="button"
                                        className="members-secondary-button"
                                        onClick={
                                            closeMemberForm
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
                                            : editingMember
                                                ? 'Save Changes'
                                                : 'Add Member'}
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

export default Members;