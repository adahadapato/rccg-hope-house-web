import {
    useCallback,
    useEffect,
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

import '../styles/admin.css';
import '../styles/church-settings.css';

const ContactMethodType = {
    Phone: 1,
    Email: 2,
    Website: 3,
    WhatsAppGroup: 4,
    Facebook: 5,
    Instagram: 6,
    YouTube: 7,
} as const;

type ContactMethodType = (typeof ContactMethodType)[keyof typeof ContactMethodType];

interface ChurchContactMethod {
    id: string;
    type: ContactMethodType;
    value: string;
    label: string | null;
    displayOrder: number;
}

interface ChurchInfo {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postCode: string | null;
    country: string;
    parishName: string;
    establishedYear: number;
    yearsOfMinistry: number;
    tagline: string;
    aboutLead: string;
    aboutText: string;
    multiCulturalStat: string;
    activeMemberCount: number;
    contactMethods: ChurchContactMethod[];
}

interface ChurchProfileForm {
    parishName: string;
    establishedYear: string;
    tagline: string;
    aboutLead: string;
    aboutText: string;
    multiCulturalStat: string;
}

interface AddressForm {
    addressLine1: string;
    addressLine2: string;
    city: string;
    postCode: string;
    country: string;
}

interface ContactMethodForm {
    type: ContactMethodType;
    value: string;
    label: string;
    displayOrder: string;
}

type SettingsTab = 'profile' | 'contacts';

const emptyContactMethodForm: ContactMethodForm = {
    type: ContactMethodType.Phone,
    value: '',
    label: '',
    displayOrder: '0',
};

const contactMethodOptions: Array<{
    value: ContactMethodType;
    label: string;
}> = [
        {
            value: ContactMethodType.Phone,
            label: 'Phone',
        },
        {
            value: ContactMethodType.Email,
            label: 'Email',
        },
        {
            value: ContactMethodType.Website,
            label: 'Website',
        },
        {
            value: ContactMethodType.WhatsAppGroup,
            label: 'WhatsApp Group',
        },
        {
            value: ContactMethodType.Facebook,
            label: 'Facebook',
        },
        {
            value: ContactMethodType.Instagram,
            label: 'Instagram',
        },
        {
            value: ContactMethodType.YouTube,
            label: 'YouTube',
        },
    ];

function getContactMethodLabel(
    type: ContactMethodType
): string {
    return (
        contactMethodOptions.find(
            option => option.value === type
        )?.label ?? 'Contact'
    );
}

function getContactMethodHint(
    type: ContactMethodType
): string {
    switch (type) {
        case ContactMethodType.Phone:
            return '+44...';

        case ContactMethodType.Email:
            return 'info@example.org';

        case ContactMethodType.Website:
            return 'https://example.org';

        case ContactMethodType.WhatsAppGroup:
            return 'https://chat.whatsapp.com/...';

        case ContactMethodType.Facebook:
            return 'https://facebook.com/...';

        case ContactMethodType.Instagram:
            return 'https://instagram.com/...';

        case ContactMethodType.YouTube:
            return 'https://youtube.com/...';

        default:
            return '';
    }
}

function isLinkType(
    type: ContactMethodType
): boolean {
    const linkTypes: readonly ContactMethodType[] = [
        ContactMethodType.Website,
        ContactMethodType.WhatsAppGroup,
        ContactMethodType.Facebook,
        ContactMethodType.Instagram,
        ContactMethodType.YouTube,
    ];

    return linkTypes.includes(type);
}

function ChurchSettings() {
    const [
        churchInfo,
        setChurchInfo,
    ] = useState<ChurchInfo | null>(null);

    const [
        activeTab,
        setActiveTab,
    ] = useState<SettingsTab>('profile');

    const [
        profileForm,
        setProfileForm,
    ] = useState<ChurchProfileForm>({
        parishName: '',
        establishedYear: '',
        tagline: '',
        aboutLead: '',
        aboutText: '',
        multiCulturalStat: '',
    });

    const [
        addressForm,
        setAddressForm,
    ] = useState<AddressForm>({
        addressLine1: '',
        addressLine2: '',
        city: '',
        postCode: '',
        country: '',
    });

    const [
        contactForm,
        setContactForm,
    ] = useState<ContactMethodForm>(
        emptyContactMethodForm
    );

    const [
        editingContactId,
        setEditingContactId,
    ] = useState<string | null>(null);

    const [
        deleteContact,
        setDeleteContact,
    ] = useState<ChurchContactMethod | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        retrying,
        setRetrying,
    ] = useState(false);

    const [
        savingProfile,
        setSavingProfile,
    ] = useState(false);

    const [
        savingAddress,
        setSavingAddress,
    ] = useState(false);

    const [
        savingContact,
        setSavingContact,
    ] = useState(false);

    const [
        deletingContact,
        setDeletingContact,
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

    const populateForms = useCallback(
        (info: ChurchInfo) => {
            setProfileForm({
                parishName:
                    info.parishName ?? '',
                establishedYear:
                    info.establishedYear
                        ? String(
                            info.establishedYear
                        )
                        : '',
                tagline:
                    info.tagline ?? '',
                aboutLead:
                    info.aboutLead ?? '',
                aboutText:
                    info.aboutText ?? '',
                multiCulturalStat:
                    info.multiCulturalStat ?? '',
            });

            setAddressForm({
                addressLine1:
                    info.addressLine1 ?? '',
                addressLine2:
                    info.addressLine2 ?? '',
                city:
                    info.city ?? '',
                postCode:
                    info.postCode ?? '',
                country:
                    info.country ?? '',
            });
        },
        []
    );

    const fetchChurchInfo = useCallback(
        async (
            signal?: AbortSignal
        ): Promise<ChurchInfo> => {
            const response = await apiFetch(
                '/api/church-info',
                {
                    signal,
                }
            );

            if (!response.ok) {
                throw await getApiErrorDetails(
                    response,
                    'Unable to load church settings.'
                );
            }

            return (
                await response.json()
            ) as ChurchInfo;
        },
        []
    );

    const loadChurchInfo = useCallback(
        async (
            signal?: AbortSignal
        ) => {
            const info =
                await fetchChurchInfo(
                    signal
                );

            setChurchInfo(info);
            populateForms(info);
            setLoadError(null);
        },
        [
            fetchChurchInfo,
            populateForms,
        ]
    );

    useEffect(() => {
        const controller =
            new AbortController();

        const initialise = async () => {
            try {
                setLoading(true);

                await loadChurchInfo(
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
                        getNetworkErrorDetails(
                            error
                        )
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
    }, [loadChurchInfo]);

    function showSuccess(
        message: string
    ) {
        setSuccessMessage(message);

        window.setTimeout(
            () => {
                setSuccessMessage(
                    current =>
                        current === message
                            ? null
                            : current
                );
            },
            3500
        );
    }

    function showActionError(
        error: unknown,
        fallback: string
    ) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'message' in error
        ) {
            setActionError(
                String(
                    (
                        error as {
                            message: unknown;
                        }
                    ).message
                )
            );

            return;
        }

        setActionError(fallback);
    }

    async function ensureSuccess(
        response: Response,
        fallback: string
    ) {
        if (response.ok) {
            return;
        }

        const details =
            await getApiErrorDetails(
                response,
                fallback
            );

        throw new Error(
            details.message
        );
    }

    function applyChurchInfo(
        info: ChurchInfo
    ) {
        setChurchInfo(info);
        populateForms(info);
    }

    async function retryLoad() {
        setRetrying(true);
        setActionError(null);

        try {
            await loadChurchInfo();
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
                    getNetworkErrorDetails(
                        error
                    )
                );
            }

            return false;
        } finally {
            setRetrying(false);
        }
    }

    async function submitProfile(
        event: FormEvent
    ) {
        event.preventDefault();

        setSavingProfile(true);
        setActionError(null);

        try {
            const establishedYear =
                Number(
                    profileForm
                        .establishedYear
                );

            if (
                !Number.isInteger(
                    establishedYear
                )
            ) {
                throw new Error(
                    'Enter a valid established year.'
                );
            }

            const response =
                await apiFetch(
                    '/api/church-info/admin/about',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                parishName:
                                    profileForm
                                        .parishName
                                        .trim(),
                                establishedYear,
                                tagline:
                                    profileForm
                                        .tagline
                                        .trim(),
                                aboutLead:
                                    profileForm
                                        .aboutLead
                                        .trim(),
                                aboutText:
                                    profileForm
                                        .aboutText
                                        .trim(),
                                multiCulturalStat:
                                    profileForm
                                        .multiCulturalStat
                                        .trim(),
                            }),
                    }
                );

            await ensureSuccess(
                response,
                'Unable to update the church profile.'
            );

            const updated =
                (await response.json()) as ChurchInfo;

            applyChurchInfo(updated);

            showSuccess(
                'Church profile updated successfully.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to update the church profile.'
            );
        } finally {
            setSavingProfile(false);
        }
    }

    async function submitAddress(
        event: FormEvent
    ) {
        event.preventDefault();

        setSavingAddress(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    '/api/church-info/admin/address',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                addressLine1:
                                    addressForm
                                        .addressLine1
                                        .trim(),
                                addressLine2:
                                    addressForm
                                        .addressLine2
                                        .trim() ||
                                    null,
                                city:
                                    addressForm
                                        .city
                                        .trim(),
                                postCode:
                                    addressForm
                                        .postCode
                                        .trim() ||
                                    null,
                                country:
                                    addressForm
                                        .country
                                        .trim(),
                            }),
                    }
                );

            await ensureSuccess(
                response,
                'Unable to update the church address.'
            );

            const updated =
                (await response.json()) as ChurchInfo;

            applyChurchInfo(updated);

            showSuccess(
                'Church address updated successfully.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to update the church address.'
            );
        } finally {
            setSavingAddress(false);
        }
    }

    function resetContactForm() {
        setEditingContactId(null);

        setContactForm(
            emptyContactMethodForm
        );
    }

    function startAddContact() {
        resetContactForm();
        setActionError(null);
    }

    function startEditContact(
        method: ChurchContactMethod
    ) {
        setEditingContactId(
            method.id
        );

        setContactForm({
            type: method.type,
            value: method.value,
            label: method.label ?? '',
            displayOrder:
                String(
                    method.displayOrder
                ),
        });

        setActionError(null);

        window.setTimeout(
            () => {
                document
                    .getElementById(
                        'church-contact-form'
                    )
                    ?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
            },
            0
        );
    }

    async function submitContactMethod(
        event: FormEvent
    ) {
        event.preventDefault();

        setSavingContact(true);
        setActionError(null);

        try {
            const displayOrder =
                Number(
                    contactForm
                        .displayOrder
                );

            if (
                !Number.isInteger(
                    displayOrder
                )
            ) {
                throw new Error(
                    'Display order must be a whole number.'
                );
            }

            const payload = {
                type:
                    contactForm.type,
                value:
                    contactForm
                        .value
                        .trim(),
                label:
                    contactForm
                        .label
                        .trim() ||
                    null,
                displayOrder,
            };

            const editing =
                Boolean(
                    editingContactId
                );

            const url =
                editingContactId
                    ? `/api/church-info/admin/contact-methods/${editingContactId}`
                    : '/api/church-info/admin/contact-methods';

            const response =
                await apiFetch(
                    url,
                    {
                        method:
                            editing
                                ? 'PUT'
                                : 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify(
                                editingContactId
                                    ? {
                                        id:
                                            editingContactId,
                                        ...payload,
                                    }
                                    : payload
                            ),
                    }
                );

            await ensureSuccess(
                response,
                editing
                    ? 'Unable to update the contact method.'
                    : 'Unable to add the contact method.'
            );

            const updated =
                (await response.json()) as ChurchInfo;

            applyChurchInfo(updated);
            resetContactForm();

            showSuccess(
                editing
                    ? 'Contact method updated successfully.'
                    : 'Contact method added successfully.'
            );
        } catch (error) {
            showActionError(
                error,
                editingContactId
                    ? 'Unable to update the contact method.'
                    : 'Unable to add the contact method.'
            );
        } finally {
            setSavingContact(false);
        }
    }

    async function confirmDeleteContact() {
        if (!deleteContact) {
            return;
        }

        setDeletingContact(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    `/api/church-info/admin/contact-methods/${deleteContact.id}`,
                    {
                        method: 'DELETE',
                    }
                );

            await ensureSuccess(
                response,
                'Unable to delete the contact method.'
            );

            const updated =
                (await response.json()) as ChurchInfo;

            applyChurchInfo(updated);

            if (
                editingContactId ===
                deleteContact.id
            ) {
                resetContactForm();
            }

            setDeleteContact(null);

            showSuccess(
                'Contact method deleted successfully.'
            );
        } catch (error) {
            setDeleteContact(null);

            showActionError(
                error,
                'Unable to delete the contact method.'
            );
        } finally {
            setDeletingContact(false);
        }
    }

    const sortedContactMethods =
        [...(
            churchInfo
                ?.contactMethods ??
            []
        )].sort(
            (left, right) =>
                left.displayOrder -
                right.displayOrder
        );

    return (
        <AdminLayout>
            <div className="church-settings">
                <div className="church-settings-header">
                    <div>
                        <span className="church-settings-eyebrow">
                            Administration
                        </span>

                        <h1>
                            Church Settings
                        </h1>

                        <p>
                            Manage the church profile,
                            address and public contact
                            methods used across the
                            website.
                        </p>
                    </div>
                </div>

                {actionError && (
                    <div className="church-settings-alert church-settings-alert-error">
                        <span
                            className="church-settings-alert-icon"
                            aria-hidden="true"
                        >
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
                    <div className="church-settings-alert church-settings-alert-success">
                        <span
                            className="church-settings-alert-icon"
                            aria-hidden="true"
                        >
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
                    <div className="church-settings-card church-settings-loading">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading church
                            settings...
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
                ) : churchInfo ? (
                    <>
                        <div
                            className="church-settings-tabs"
                            role="tablist"
                            aria-label="Church settings sections"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={
                                    activeTab ===
                                    'profile'
                                }
                                className={
                                    activeTab ===
                                        'profile'
                                        ? 'active'
                                        : ''
                                }
                                onClick={() =>
                                    setActiveTab(
                                        'profile'
                                    )
                                }
                            >
                                Church Profile
                            </button>

                            <button
                                type="button"
                                role="tab"
                                aria-selected={
                                    activeTab ===
                                    'contacts'
                                }
                                className={
                                    activeTab ===
                                        'contacts'
                                        ? 'active'
                                        : ''
                                }
                                onClick={() =>
                                    setActiveTab(
                                        'contacts'
                                    )
                                }
                            >
                                Contact Methods

                                <span className="church-settings-tab-count">
                                    {
                                        sortedContactMethods
                                            .length
                                    }
                                </span>
                            </button>
                        </div>

                        {activeTab ===
                            'profile' && (
                                <div className="church-settings-grid">
                                    <section className="church-settings-card">
                                        <div className="church-settings-card-heading">
                                            <div>
                                                <span className="church-settings-section-label">
                                                    Profile
                                                </span>

                                                <h2>
                                                    Church
                                                    Profile
                                                </h2>

                                                <p>
                                                    Manage
                                                    information
                                                    used in the
                                                    public About
                                                    section.
                                                </p>
                                            </div>
                                        </div>

                                        <form
                                            className="church-settings-form"
                                            onSubmit={
                                                submitProfile
                                            }
                                        >
                                            <label className="church-settings-field">
                                                <span>
                                                    Parish
                                                    Name *
                                                </span>

                                                <input
                                                    required
                                                    value={
                                                        profileForm
                                                            .parishName
                                                    }
                                                    onChange={
                                                        event =>
                                                            setProfileForm(
                                                                current => ({
                                                                    ...current,
                                                                    parishName:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                />
                                            </label>

                                            <div className="church-settings-form-grid">
                                                <label className="church-settings-field">
                                                    <span>
                                                        Established
                                                        Year *
                                                    </span>

                                                    <input
                                                        required
                                                        type="number"
                                                        min="1900"
                                                        max="2100"
                                                        value={
                                                            profileForm
                                                                .establishedYear
                                                        }
                                                        onChange={
                                                            event =>
                                                                setProfileForm(
                                                                    current => ({
                                                                        ...current,
                                                                        establishedYear:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                        }
                                                    />
                                                </label>

                                                <label className="church-settings-field">
                                                    <span>
                                                        Multicultural
                                                        Stat *
                                                    </span>

                                                    <input
                                                        required
                                                        value={
                                                            profileForm
                                                                .multiCulturalStat
                                                        }
                                                        onChange={
                                                            event =>
                                                                setProfileForm(
                                                                    current => ({
                                                                        ...current,
                                                                        multiCulturalStat:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                        }
                                                        placeholder="e.g. 20+"
                                                    />
                                                </label>
                                            </div>

                                            <label className="church-settings-field">
                                                <span>
                                                    Tagline *
                                                </span>

                                                <input
                                                    required
                                                    maxLength={
                                                        300
                                                    }
                                                    value={
                                                        profileForm
                                                            .tagline
                                                    }
                                                    onChange={
                                                        event =>
                                                            setProfileForm(
                                                                current => ({
                                                                    ...current,
                                                                    tagline:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                />
                                            </label>

                                            <label className="church-settings-field">
                                                <span>
                                                    About Lead
                                                    *
                                                </span>

                                                <textarea
                                                    required
                                                    rows={3}
                                                    maxLength={
                                                        500
                                                    }
                                                    value={
                                                        profileForm
                                                            .aboutLead
                                                    }
                                                    onChange={
                                                        event =>
                                                            setProfileForm(
                                                                current => ({
                                                                    ...current,
                                                                    aboutLead:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                />
                                            </label>

                                            <label className="church-settings-field">
                                                <span>
                                                    About Text
                                                    *
                                                </span>

                                                <textarea
                                                    required
                                                    rows={7}
                                                    maxLength={
                                                        2000
                                                    }
                                                    value={
                                                        profileForm
                                                            .aboutText
                                                    }
                                                    onChange={
                                                        event =>
                                                            setProfileForm(
                                                                current => ({
                                                                    ...current,
                                                                    aboutText:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                />
                                            </label>

                                            <div className="church-settings-form-actions">
                                                <button
                                                    type="submit"
                                                    className="admin-primary-button"
                                                    disabled={
                                                        savingProfile
                                                    }
                                                >
                                                    {savingProfile
                                                        ? 'Saving...'
                                                        : 'Save Church Profile'}
                                                </button>
                                            </div>
                                        </form>
                                    </section>

                                    <section className="church-settings-card">
                                        <div className="church-settings-card-heading">
                                            <div>
                                                <span className="church-settings-section-label">
                                                    Location
                                                </span>

                                                <h2>
                                                    Church
                                                    Address
                                                </h2>

                                                <p>
                                                    Manage the
                                                    address
                                                    displayed to
                                                    website
                                                    visitors.
                                                </p>
                                            </div>
                                        </div>

                                        <form
                                            className="church-settings-form"
                                            onSubmit={
                                                submitAddress
                                            }
                                        >
                                            <label className="church-settings-field">
                                                <span>
                                                    Address
                                                    Line 1 *
                                                </span>

                                                <input
                                                    required
                                                    value={
                                                        addressForm
                                                            .addressLine1
                                                    }
                                                    onChange={
                                                        event =>
                                                            setAddressForm(
                                                                current => ({
                                                                    ...current,
                                                                    addressLine1:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                />
                                            </label>

                                            <label className="church-settings-field">
                                                <span>
                                                    Address
                                                    Line 2
                                                </span>

                                                <input
                                                    value={
                                                        addressForm
                                                            .addressLine2
                                                    }
                                                    onChange={
                                                        event =>
                                                            setAddressForm(
                                                                current => ({
                                                                    ...current,
                                                                    addressLine2:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                />
                                            </label>

                                            <div className="church-settings-form-grid">
                                                <label className="church-settings-field">
                                                    <span>
                                                        City *
                                                    </span>

                                                    <input
                                                        required
                                                        value={
                                                            addressForm
                                                                .city
                                                        }
                                                        onChange={
                                                            event =>
                                                                setAddressForm(
                                                                    current => ({
                                                                        ...current,
                                                                        city:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                        }
                                                    />
                                                </label>

                                                <label className="church-settings-field">
                                                    <span>
                                                        Postcode
                                                    </span>

                                                    <input
                                                        value={
                                                            addressForm
                                                                .postCode
                                                        }
                                                        onChange={
                                                            event =>
                                                                setAddressForm(
                                                                    current => ({
                                                                        ...current,
                                                                        postCode:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                        }
                                                    />
                                                </label>
                                            </div>

                                            <label className="church-settings-field">
                                                <span>
                                                    Country *
                                                </span>

                                                <input
                                                    required
                                                    value={
                                                        addressForm
                                                            .country
                                                    }
                                                    onChange={
                                                        event =>
                                                            setAddressForm(
                                                                current => ({
                                                                    ...current,
                                                                    country:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                />
                                            </label>

                                            <div className="church-settings-form-actions">
                                                <button
                                                    type="submit"
                                                    className="admin-primary-button"
                                                    disabled={
                                                        savingAddress
                                                    }
                                                >
                                                    {savingAddress
                                                        ? 'Saving...'
                                                        : 'Save Address'}
                                                </button>
                                            </div>
                                        </form>
                                    </section>

                                    <section className="church-settings-card church-settings-summary-card">
                                        <div className="church-settings-card-heading">
                                            <div>
                                                <span className="church-settings-section-label">
                                                    Overview
                                                </span>

                                                <h2>
                                                    Church
                                                    Summary
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="church-settings-summary">
                                            <div>
                                                <span>
                                                    Years of
                                                    Ministry
                                                </span>

                                                <strong>
                                                    {
                                                        churchInfo
                                                            .yearsOfMinistry
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Active
                                                    Members
                                                </span>

                                                <strong>
                                                    {
                                                        churchInfo
                                                            .activeMemberCount
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Contact
                                                    Methods
                                                </span>

                                                <strong>
                                                    {
                                                        sortedContactMethods
                                                            .length
                                                    }
                                                </strong>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                        {activeTab ===
                            'contacts' && (
                                <div className="church-settings-contact-layout">
                                    <section className="church-settings-card church-settings-contact-list-card">
                                        <div className="church-settings-card-heading church-settings-card-heading-row">
                                            <div>
                                                <span className="church-settings-section-label">
                                                    Public
                                                    Contact
                                                    Details
                                                </span>

                                                <h2>
                                                    Contact
                                                    Methods
                                                </h2>

                                                <p>
                                                    These
                                                    details can
                                                    be used by
                                                    the public
                                                    website,
                                                    including
                                                    the Home
                                                    and Contact
                                                    pages.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="admin-primary-button"
                                                onClick={
                                                    startAddContact
                                                }
                                            >
                                                + Add Contact
                                            </button>
                                        </div>

                                        {sortedContactMethods
                                            .length ===
                                            0 ? (
                                            <div className="church-settings-empty">
                                                <strong>
                                                    No contact
                                                    methods
                                                    have been
                                                    added.
                                                </strong>

                                                <p>
                                                    Add the
                                                    church
                                                    phone,
                                                    email,
                                                    website,
                                                    WhatsApp
                                                    group or
                                                    social
                                                    media
                                                    links.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="church-contact-list">
                                                {sortedContactMethods.map(
                                                    method => (
                                                        <article
                                                            key={
                                                                method.id
                                                            }
                                                            className="church-contact-item"
                                                        >
                                                            <div className="church-contact-type-icon">
                                                                {method.type ===
                                                                    ContactMethodType.WhatsAppGroup
                                                                    ? 'W'
                                                                    : getContactMethodLabel(
                                                                        method.type
                                                                    )
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}
                                                            </div>

                                                            <div className="church-contact-details">
                                                                <div className="church-contact-heading">
                                                                    <strong>
                                                                        {getContactMethodLabel(
                                                                            method.type
                                                                        )}
                                                                    </strong>

                                                                    <span>
                                                                        Order{' '}
                                                                        {
                                                                            method.displayOrder
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {method.label && (
                                                                    <span className="church-contact-label">
                                                                        {
                                                                            method.label
                                                                        }
                                                                    </span>
                                                                )}

                                                                {isLinkType(
                                                                    method.type
                                                                ) ? (
                                                                    <a
                                                                        href={
                                                                            method.value
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="church-contact-value"
                                                                    >
                                                                        {
                                                                            method.value
                                                                        }
                                                                    </a>
                                                                ) : (
                                                                    <span className="church-contact-value">
                                                                        {
                                                                            method.value
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="church-contact-actions">
                                                                <button
                                                                    type="button"
                                                                    className="church-settings-secondary-button"
                                                                    onClick={() =>
                                                                        startEditContact(
                                                                            method
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="church-settings-delete-button"
                                                                    onClick={() =>
                                                                        setDeleteContact(
                                                                            method
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </article>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </section>

                                    <section
                                        id="church-contact-form"
                                        className="church-settings-card church-settings-contact-form-card"
                                    >
                                        <div className="church-settings-card-heading">
                                            <div>
                                                <span className="church-settings-section-label">
                                                    {editingContactId
                                                        ? 'Edit'
                                                        : 'Add'}
                                                </span>

                                                <h2>
                                                    {editingContactId
                                                        ? 'Edit Contact Method'
                                                        : 'Add Contact Method'}
                                                </h2>

                                                <p>
                                                    Add a
                                                    public
                                                    contact
                                                    method or
                                                    social
                                                    link for
                                                    the
                                                    church.
                                                </p>
                                            </div>
                                        </div>

                                        <form
                                            className="church-settings-form"
                                            onSubmit={
                                                submitContactMethod
                                            }
                                        >
                                            <label className="church-settings-field">
                                                <span>
                                                    Type *
                                                </span>

                                                <select
                                                    required
                                                    value={
                                                        contactForm
                                                            .type
                                                    }
                                                    onChange={
                                                        event =>
                                                            setContactForm(
                                                                current => ({
                                                                    ...current,
                                                                    type:
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value
                                                                        ) as ContactMethodType,
                                                                })
                                                            )
                                                    }
                                                >
                                                    {contactMethodOptions.map(
                                                        option => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {
                                                                    option.label
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>

                                            <label className="church-settings-field">
                                                <span>
                                                    Value *
                                                </span>

                                                <input
                                                    required
                                                    value={
                                                        contactForm
                                                            .value
                                                    }
                                                    onChange={
                                                        event =>
                                                            setContactForm(
                                                                current => ({
                                                                    ...current,
                                                                    value:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                    placeholder={getContactMethodHint(
                                                        contactForm.type
                                                    )}
                                                />

                                                <small>
                                                    {contactForm
                                                        .type ===
                                                        ContactMethodType.WhatsAppGroup
                                                        ? 'Paste the full WhatsApp group invitation link.'
                                                        : 'Enter the public contact value exactly as it should be used.'}
                                                </small>
                                            </label>

                                            <label className="church-settings-field">
                                                <span>
                                                    Display
                                                    Label
                                                </span>

                                                <input
                                                    maxLength={
                                                        100
                                                    }
                                                    value={
                                                        contactForm
                                                            .label
                                                    }
                                                    onChange={
                                                        event =>
                                                            setContactForm(
                                                                current => ({
                                                                    ...current,
                                                                    label:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                    }
                                                    placeholder={
                                                        contactForm
                                                            .type ===
                                                            ContactMethodType.WhatsAppGroup
                                                            ? 'Join Our WhatsApp Group'
                                                            : 'e.g. Main Office'
                                                    }
                                                />
                                            </label>

                                            <label className="church-settings-field">
                                                <span>
                                                    Display
                                                    Order *
                                                </span>

                                                <input
                                                    required
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={
                                                        contactForm
                                                            .displayOrder
                                                    }
                                                    onChange={
                                                        event =>
                                                            setContactForm(
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

                                                <small>
                                                    Lower
                                                    numbers
                                                    appear
                                                    first.
                                                </small>
                                            </label>

                                            <div className="church-settings-form-actions">
                                                <button
                                                    type="submit"
                                                    className="admin-primary-button"
                                                    disabled={
                                                        savingContact
                                                    }
                                                >
                                                    {savingContact
                                                        ? 'Saving...'
                                                        : editingContactId
                                                            ? 'Save Changes'
                                                            : 'Add Contact Method'}
                                                </button>

                                                {editingContactId && (
                                                    <button
                                                        type="button"
                                                        className="church-settings-secondary-button"
                                                        onClick={
                                                            resetContactForm
                                                        }
                                                        disabled={
                                                            savingContact
                                                        }
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </section>
                                </div>
                            )}
                    </>
                ) : null}

                <ConfirmDialog
                    open={
                        Boolean(
                            deleteContact
                        )
                    }
                    title="Delete contact method?"
                    message={
                        deleteContact
                            ? `Delete ${getContactMethodLabel(
                                deleteContact.type
                            )}${deleteContact.label
                                ? ` - ${deleteContact.label}`
                                : ''
                            }? This removes it from the church's contact information.`
                            : ''
                    }
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    loading={
                        deletingContact
                    }
                    loadingText="Deleting..."
                    onConfirm={() =>
                        void confirmDeleteContact()
                    }
                    onCancel={() =>
                        !deletingContact &&
                        setDeleteContact(
                            null
                        )
                    }
                />
            </div>
        </AdminLayout>
    );
}

export default ChurchSettings;