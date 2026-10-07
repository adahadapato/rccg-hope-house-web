import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';

import {
    apiFetch,
    clearAdminSession,
    getApiErrorDetails,
    getNetworkErrorDetails,
    type ApiErrorDetails,
} from '@/api/api';

import ApiErrorState from '@/components/sections/ApiErrorState';
import ConfirmDialog from '@/components/sections/ConfirmDialog';
import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/account-settings.css';

interface AccountProfile {
    id: string;
    email: string;
    emailConfirmed: boolean;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    phoneNumberConfirmed: boolean;
    profileImagePath: string | null;
    twoFactorEnabled: boolean;
    lastLoginAt: string | null;
}

interface TwoFactorStatus {
    isEnabled: boolean;
    hasAuthenticator: boolean;
    recoveryCodesLeft: number;
}

interface TwoFactorSetup {
    sharedKey: string;
    authenticatorUri: string;
}

interface RecoveryCodesResponse {
    recoveryCodes: string[];
}

interface ProfileForm {
    firstName: string;
    lastName: string;
}

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const emptyPasswordForm: PasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
};

function formatLastLogin(
    value: string | null
): string {
    if (!value) {
        return 'Never';
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Never';
    }

    return date.toLocaleString(
        'en-GB',
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        }
    );
}

function getInitials(
    profile: AccountProfile
): string {
    const initials = [
        profile.firstName,
        profile.lastName,
    ]
        .filter(Boolean)
        .map(value =>
            value
                .trim()
                .charAt(0)
                .toUpperCase()
        )
        .join('')
        .slice(0, 2);

    return (
        initials ||
        profile.email
            .charAt(0)
            .toUpperCase() ||
        'A'
    );
}

function getDisplayName(
    profile: AccountProfile
): string {
    const name = [
        profile.firstName,
        profile.lastName,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    return name || profile.email;
}

function resolveImageUrl(
    imagePath: string | null
): string | null {
    if (!imagePath) {
        return null;
    }

    if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://') ||
        imagePath.startsWith('data:')
    ) {
        return imagePath;
    }

    const baseUrl = (
        import.meta.env.VITE_API_BASE_URL ??
        ''
    ).replace(/\/$/, '');

    const normalizedPath =
        imagePath.startsWith('/')
            ? imagePath
            : `/${imagePath}`;

    return `${baseUrl}${normalizedPath}`;
}

function AccountSettings() {
    const [
        profile,
        setProfile,
    ] =
        useState<AccountProfile | null>(
            null
        );

    const [
        twoFactorStatus,
        setTwoFactorStatus,
    ] =
        useState<TwoFactorStatus | null>(
            null
        );

    const [
        profileForm,
        setProfileForm,
    ] =
        useState<ProfileForm>({
            firstName: '',
            lastName: '',
        });

    const [
        phoneNumber,
        setPhoneNumber,
    ] = useState('');

    const [
        passwordForm,
        setPasswordForm,
    ] =
        useState<PasswordForm>(
            emptyPasswordForm
        );

    const [
        twoFactorSetup,
        setTwoFactorSetup,
    ] =
        useState<TwoFactorSetup | null>(
            null
        );

    const [
        twoFactorCode,
        setTwoFactorCode,
    ] = useState('');

    const [
        recoveryCodes,
        setRecoveryCodes,
    ] = useState<string[]>([]);

    const [
        deletePassword,
        setDeletePassword,
    ] = useState('');

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
        savingPhone,
        setSavingPhone,
    ] = useState(false);

    const [
        changingPassword,
        setChangingPassword,
    ] = useState(false);

    const [
        uploadingImage,
        setUploadingImage,
    ] = useState(false);

    const [
        removingImage,
        setRemovingImage,
    ] = useState(false);

    const [
        configuringTwoFactor,
        setConfiguringTwoFactor,
    ] = useState(false);

    const [
        enablingTwoFactor,
        setEnablingTwoFactor,
    ] = useState(false);

    const [
        disablingTwoFactor,
        setDisablingTwoFactor,
    ] = useState(false);

    const [
        generatingCodes,
        setGeneratingCodes,
    ] = useState(false);

    const [
        deletingAccount,
        setDeletingAccount,
    ] = useState(false);

    const [
        deleteConfirmationOpen,
        setDeleteConfirmationOpen,
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

    const imageInputRef =
        useRef<HTMLInputElement | null>(
            null
        );

    const fetchProfile =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/account/profile',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load your account settings.'
                    );
                }

                return (
                    await response.json()
                ) as AccountProfile;
            },
            []
        );

    const fetchTwoFactorStatus =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/account/two-factor',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load two-factor authentication status.'
                    );
                }

                return (
                    await response.json()
                ) as TwoFactorStatus;
            },
            []
        );

    const loadSettings =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const [
                    profileData,
                    twoFactorData,
                ] =
                    await Promise.all([
                        fetchProfile(
                            signal
                        ),
                        fetchTwoFactorStatus(
                            signal
                        ),
                    ]);

                setProfile(
                    profileData
                );

                setProfileForm({
                    firstName:
                        profileData.firstName,
                    lastName:
                        profileData.lastName,
                });

                setPhoneNumber(
                    profileData.phoneNumber ??
                    ''
                );

                setTwoFactorStatus(
                    twoFactorData
                );

                setLoadError(null);
            },
            [
                fetchProfile,
                fetchTwoFactorStatus,
            ]
        );

    useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(true);

                    await loadSettings(
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
                        !controller
                            .signal
                            .aborted
                    ) {
                        setLoading(false);
                    }
                }
            };

        void initialise();

        return () =>
            controller.abort();
    }, [loadSettings]);

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

    function showActionError(
        error: unknown,
        fallback: string
    ) {
        setActionError(
            error instanceof Error
                ? error.message
                : fallback
        );
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

    async function retryLoad() {
        setRetrying(true);
        setActionError(null);

        try {
            await loadSettings();

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
            const response =
                await apiFetch(
                    '/api/account/profile',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                firstName:
                                    profileForm
                                        .firstName
                                        .trim(),
                                lastName:
                                    profileForm
                                        .lastName
                                        .trim(),
                            }),
                    }
                );

            await ensureSuccess(
                response,
                'Unable to update your profile.'
            );

            const updated =
                (await response.json()) as AccountProfile;

            setProfile(updated);

            setProfileForm({
                firstName:
                    updated.firstName,
                lastName:
                    updated.lastName,
            });

            localStorage.setItem(
                'adminName',
                getDisplayName(
                    updated
                )
            );

            showSuccess(
                'Profile updated successfully.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to update your profile.'
            );
        } finally {
            setSavingProfile(false);
        }
    }

    async function submitPhone(
        event: FormEvent
    ) {
        event.preventDefault();

        setSavingPhone(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    '/api/account/phone',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                phoneNumber:
                                    phoneNumber
                                        .trim() ||
                                    null,
                            }),
                    }
                );

            await ensureSuccess(
                response,
                'Unable to update your phone number.'
            );

            const updated =
                (await response.json()) as AccountProfile;

            setProfile(updated);

            setPhoneNumber(
                updated.phoneNumber ??
                ''
            );

            showSuccess(
                'Contact information updated.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to update your phone number.'
            );
        } finally {
            setSavingPhone(false);
        }
    }

    async function submitPassword(
        event: FormEvent
    ) {
        event.preventDefault();

        setActionError(null);

        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            setActionError(
                'The new password and confirmation do not match.'
            );

            return;
        }

        if (
            passwordForm.newPassword
                .length < 8
        ) {
            setActionError(
                'The new password must contain at least 8 characters.'
            );

            return;
        }

        setChangingPassword(true);

        try {
            const response =
                await apiFetch(
                    '/api/account/change-password',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                currentPassword:
                                    passwordForm
                                        .currentPassword,
                                newPassword:
                                    passwordForm
                                        .newPassword,
                            }),
                    }
                );

            await ensureSuccess(
                response,
                'Unable to change your password.'
            );

            setPasswordForm(
                emptyPasswordForm
            );

            showSuccess(
                'Password changed successfully.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to change your password.'
            );
        } finally {
            setChangingPassword(false);
        }
    }

    async function handleImageSelected(
        event:
            ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        event.target.value = '';

        if (!file) {
            return;
        }

        setUploadingImage(true);
        setActionError(null);

        try {
            const formData =
                new FormData();

            formData.append(
                'file',
                file
            );

            const response =
                await apiFetch(
                    '/api/account/profile-image',
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

            await ensureSuccess(
                response,
                'Unable to upload your profile photo.'
            );

            const updated =
                (await response.json()) as AccountProfile;

            setProfile(updated);

            showSuccess(
                'Profile photo updated.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to upload your profile photo.'
            );
        } finally {
            setUploadingImage(false);
        }
    }

    async function removeProfileImage() {
        setRemovingImage(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    '/api/account/profile-image',
                    {
                        method: 'DELETE',
                    }
                );

            await ensureSuccess(
                response,
                'Unable to remove your profile photo.'
            );

            const updated =
                (await response.json()) as AccountProfile;

            setProfile(updated);

            showSuccess(
                'Profile photo removed.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to remove your profile photo.'
            );
        } finally {
            setRemovingImage(false);
        }
    }

    async function beginTwoFactorSetup() {
        setConfiguringTwoFactor(true);
        setActionError(null);
        setRecoveryCodes([]);

        try {
            const response =
                await apiFetch(
                    '/api/account/two-factor/setup'
                );

            await ensureSuccess(
                response,
                'Unable to start two-factor authentication setup.'
            );

            const setup =
                (await response.json()) as TwoFactorSetup;

            setTwoFactorSetup(
                setup
            );

            setTwoFactorCode('');
        } catch (error) {
            showActionError(
                error,
                'Unable to start two-factor authentication setup.'
            );
        } finally {
            setConfiguringTwoFactor(false);
        }
    }

    async function enableTwoFactor(
        event: FormEvent
    ) {
        event.preventDefault();

        if (
            !twoFactorCode.trim()
        ) {
            return;
        }

        setEnablingTwoFactor(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    '/api/account/two-factor/enable',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                verificationCode:
                                    twoFactorCode
                                        .trim(),
                            }),
                    }
                );

            await ensureSuccess(
                response,
                'Unable to enable two-factor authentication.'
            );

            const data =
                (await response.json()) as RecoveryCodesResponse;

            setRecoveryCodes(
                data.recoveryCodes ??
                []
            );

            setTwoFactorSetup(null);
            setTwoFactorCode('');

            setTwoFactorStatus(
                await fetchTwoFactorStatus()
            );

            setProfile(
                await fetchProfile()
            );

            showSuccess(
                'Two-factor authentication enabled.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to enable two-factor authentication.'
            );
        } finally {
            setEnablingTwoFactor(false);
        }
    }

    async function disableTwoFactor() {
        setDisablingTwoFactor(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    '/api/account/two-factor/disable',
                    {
                        method: 'POST',
                    }
                );

            await ensureSuccess(
                response,
                'Unable to disable two-factor authentication.'
            );

            setTwoFactorStatus(
                await fetchTwoFactorStatus()
            );

            setProfile(
                await fetchProfile()
            );

            setTwoFactorSetup(null);
            setTwoFactorCode('');
            setRecoveryCodes([]);

            showSuccess(
                'Two-factor authentication disabled.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to disable two-factor authentication.'
            );
        } finally {
            setDisablingTwoFactor(false);
        }
    }

    async function generateRecoveryCodes() {
        setGeneratingCodes(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    '/api/account/two-factor/recovery-codes',
                    {
                        method: 'POST',
                    }
                );

            await ensureSuccess(
                response,
                'Unable to generate recovery codes.'
            );

            const data =
                (await response.json()) as RecoveryCodesResponse;

            setRecoveryCodes(
                data.recoveryCodes ??
                []
            );

            setTwoFactorStatus(
                await fetchTwoFactorStatus()
            );

            showSuccess(
                'New recovery codes generated.'
            );
        } catch (error) {
            showActionError(
                error,
                'Unable to generate recovery codes.'
            );
        } finally {
            setGeneratingCodes(false);
        }
    }

    async function copyRecoveryCodes() {
        if (
            recoveryCodes.length === 0
        ) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                recoveryCodes.join(
                    '\n'
                )
            );

            showSuccess(
                'Recovery codes copied.'
            );
        } catch {
            setActionError(
                'Unable to copy the recovery codes automatically.'
            );
        }
    }

    async function deleteAccount() {
        if (
            !deletePassword.trim()
        ) {
            setActionError(
                'Enter your current password before deleting your account.'
            );

            setDeleteConfirmationOpen(
                false
            );

            return;
        }

        setDeletingAccount(true);
        setActionError(null);

        try {
            const response =
                await apiFetch(
                    '/api/account',
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                currentPassword:
                                    deletePassword,
                            }),
                    }
                );

            await ensureSuccess(
                response,
                'Unable to delete your account.'
            );

            clearAdminSession();

            window.location.replace(
                '/'
            );
        } catch (error) {
            setDeleteConfirmationOpen(
                false
            );

            showActionError(
                error,
                'Unable to delete your account.'
            );
        } finally {
            setDeletingAccount(false);
        }
    }

    const profileImageUrl =
        profile
            ? resolveImageUrl(
                profile.profileImagePath
            )
            : null;

    return (
        <AdminLayout>
            <div className="admin-settings">
                <div className="admin-settings-header">
                    <div>
                        <span className="admin-settings-eyebrow">
                            Administration
                        </span>

                        <h1>
                            Account Settings
                        </h1>

                        <p>
                            Manage your personal
                            profile, security and
                            administrator account.
                        </p>
                    </div>
                </div>

                {actionError && (
                    <div className="settings-alert settings-alert-error">
                        <span
                            className="settings-alert-icon"
                            aria-hidden="true"
                        >
                            !
                        </span>

                        <div>
                            <strong>
                                Something went
                                wrong
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
                    <div className="settings-alert settings-alert-success">
                        <span
                            className="settings-alert-icon"
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
                    <div className="settings-card settings-loading">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading account
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
                ) : profile ? (
                    <div className="settings-grid">
                        <section className="settings-card settings-profile-card">
                            <div className="settings-card-heading">
                                <div>
                                    <span className="settings-section-label">
                                        Profile
                                    </span>

                                    <h2>
                                        My Profile
                                    </h2>

                                    <p>
                                        Update the
                                        information
                                        displayed on
                                        your
                                        administrator
                                        account.
                                    </p>
                                </div>
                            </div>

                            <div className="settings-avatar-row">
                                <div className="settings-avatar">
                                    {profileImageUrl ? (
                                        <img
                                            src={
                                                profileImageUrl
                                            }
                                            alt={`${getDisplayName(
                                                profile
                                            )} profile`}
                                        />
                                    ) : (
                                        <span>
                                            {getInitials(
                                                profile
                                            )}
                                        </span>
                                    )}
                                </div>

                                <div className="settings-avatar-details">
                                    <strong>
                                        {getDisplayName(
                                            profile
                                        )}
                                    </strong>

                                    <span>
                                        {profile.email}
                                    </span>

                                    <div className="settings-inline-actions">
                                        <input
                                            ref={
                                                imageInputRef
                                            }
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="settings-file-input"
                                            onChange={
                                                handleImageSelected
                                            }
                                        />

                                        <button
                                            type="button"
                                            className="admin-primary-button"
                                            onClick={() =>
                                                imageInputRef
                                                    .current
                                                    ?.click()
                                            }
                                            disabled={
                                                uploadingImage ||
                                                removingImage
                                            }
                                        >
                                            {uploadingImage
                                                ? 'Uploading...'
                                                : profile
                                                    .profileImagePath
                                                    ? 'Replace Photo'
                                                    : 'Upload Photo'}
                                        </button>

                                        {profile
                                            .profileImagePath && (
                                                <button
                                                    type="button"
                                                    className="settings-secondary-button"
                                                    onClick={() =>
                                                        void removeProfileImage()
                                                    }
                                                    disabled={
                                                        uploadingImage ||
                                                        removingImage
                                                    }
                                                >
                                                    {removingImage
                                                        ? 'Removing...'
                                                        : 'Remove'}
                                                </button>
                                            )}
                                    </div>

                                    <small>
                                        JPEG, PNG or
                                        WebP. Images
                                        are validated
                                        by the server.
                                    </small>
                                </div>
                            </div>

                            <form
                                className="settings-form"
                                onSubmit={
                                    submitProfile
                                }
                            >
                                <div className="settings-form-grid">
                                    <label className="settings-field">
                                        <span>
                                            First Name
                                            *
                                        </span>

                                        <input
                                            required
                                            value={
                                                profileForm
                                                    .firstName
                                            }
                                            onChange={
                                                event =>
                                                    setProfileForm(
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

                                    <label className="settings-field">
                                        <span>
                                            Last Name
                                            *
                                        </span>

                                        <input
                                            required
                                            value={
                                                profileForm
                                                    .lastName
                                            }
                                            onChange={
                                                event =>
                                                    setProfileForm(
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
                                </div>

                                <div className="settings-form-actions">
                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                        disabled={
                                            savingProfile
                                        }
                                    >
                                        {savingProfile
                                            ? 'Saving...'
                                            : 'Save Profile'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <span className="settings-section-label">
                                        Contact
                                    </span>

                                    <h2>
                                        Contact
                                        Information
                                    </h2>

                                    <p>
                                        Review your
                                        sign-in email
                                        and update your
                                        contact number.
                                    </p>
                                </div>
                            </div>

                            <div className="settings-email-panel">
                                <div>
                                    <span>
                                        Email Address
                                    </span>

                                    <strong>
                                        {profile.email}
                                    </strong>
                                </div>

                                <span
                                    className={`settings-status-badge ${profile.emailConfirmed
                                            ? 'success'
                                            : 'warning'
                                        }`}
                                >
                                    {profile.emailConfirmed
                                        ? 'Verified'
                                        : 'Unverified'}
                                </span>
                            </div>

                            <p className="settings-help-text">
                                Email changes are not
                                currently available
                                from this page because
                                a new address must be
                                verified before it can
                                become your sign-in
                                email.
                            </p>

                            <form
                                className="settings-form"
                                onSubmit={
                                    submitPhone
                                }
                            >
                                <label className="settings-field">
                                    <span>
                                        Phone Number
                                    </span>

                                    <input
                                        type="tel"
                                        value={
                                            phoneNumber
                                        }
                                        onChange={
                                            event =>
                                                setPhoneNumber(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        placeholder="+44..."
                                    />

                                    <small>
                                        Current
                                        status:{' '}
                                        {profile.phoneNumber
                                            ? profile.phoneNumberConfirmed
                                                ? 'Verified'
                                                : 'Unverified'
                                            : 'Not set'}
                                    </small>
                                </label>

                                <div className="settings-form-actions">
                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                        disabled={
                                            savingPhone
                                        }
                                    >
                                        {savingPhone
                                            ? 'Saving...'
                                            : 'Save Contact Details'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="settings-card">
                            <div className="settings-card-heading">
                                <div>
                                    <span className="settings-section-label">
                                        Security
                                    </span>

                                    <h2>
                                        Password &
                                        Security
                                    </h2>

                                    <p>
                                        Change your
                                        password and
                                        review recent
                                        account
                                        information.
                                    </p>
                                </div>
                            </div>

                            <div className="settings-security-summary">
                                <div>
                                    <span>
                                        Last Login
                                    </span>

                                    <strong>
                                        {formatLastLogin(
                                            profile.lastLoginAt
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Two-Factor
                                        Authentication
                                    </span>

                                    <strong>
                                        {twoFactorStatus
                                            ?.isEnabled
                                            ? 'Enabled'
                                            : 'Not enabled'}
                                    </strong>
                                </div>
                            </div>

                            <form
                                className="settings-form"
                                onSubmit={
                                    submitPassword
                                }
                            >
                                <label className="settings-field">
                                    <span>
                                        Current
                                        Password *
                                    </span>

                                    <input
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        value={
                                            passwordForm
                                                .currentPassword
                                        }
                                        onChange={
                                            event =>
                                                setPasswordForm(
                                                    current => ({
                                                        ...current,
                                                        currentPassword:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                    />
                                </label>

                                <div className="settings-form-grid">
                                    <label className="settings-field">
                                        <span>
                                            New
                                            Password *
                                        </span>

                                        <input
                                            type="password"
                                            required
                                            minLength={
                                                8
                                            }
                                            autoComplete="new-password"
                                            value={
                                                passwordForm
                                                    .newPassword
                                            }
                                            onChange={
                                                event =>
                                                    setPasswordForm(
                                                        current => ({
                                                            ...current,
                                                            newPassword:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>

                                    <label className="settings-field">
                                        <span>
                                            Confirm New
                                            Password *
                                        </span>

                                        <input
                                            type="password"
                                            required
                                            minLength={
                                                8
                                            }
                                            autoComplete="new-password"
                                            value={
                                                passwordForm
                                                    .confirmPassword
                                            }
                                            onChange={
                                                event =>
                                                    setPasswordForm(
                                                        current => ({
                                                            ...current,
                                                            confirmPassword:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>
                                </div>

                                <small className="settings-help-text">
                                    The password must
                                    satisfy the server
                                    password policy.
                                </small>

                                <div className="settings-form-actions">
                                    <button
                                        type="submit"
                                        className="admin-primary-button"
                                        disabled={
                                            changingPassword
                                        }
                                    >
                                        {changingPassword
                                            ? 'Changing Password...'
                                            : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="settings-card">
                            <div className="settings-card-heading settings-card-heading-row">
                                <div>
                                    <span className="settings-section-label">
                                        Two-Factor
                                        Authentication
                                    </span>

                                    <h2>
                                        Authenticator
                                        Security
                                    </h2>

                                    <p>
                                        Add an extra
                                        verification
                                        step when
                                        signing in.
                                    </p>
                                </div>

                                <span
                                    className={`settings-status-badge ${twoFactorStatus
                                            ?.isEnabled
                                            ? 'success'
                                            : 'neutral'
                                        }`}
                                >
                                    {twoFactorStatus
                                        ?.isEnabled
                                        ? 'Enabled'
                                        : 'Off'}
                                </span>
                            </div>

                            {twoFactorStatus
                                ?.isEnabled ? (
                                <>
                                    <div className="settings-two-factor-summary">
                                        <div>
                                            <span>
                                                Authenticator
                                            </span>

                                            <strong>
                                                {twoFactorStatus
                                                    .hasAuthenticator
                                                    ? 'Configured'
                                                    : 'Not configured'}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Recovery
                                                Codes
                                            </span>

                                            <strong>
                                                {
                                                    twoFactorStatus
                                                        .recoveryCodesLeft
                                                }{' '}
                                                remaining
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="settings-inline-actions">
                                        <button
                                            type="button"
                                            className="admin-primary-button"
                                            onClick={() =>
                                                void generateRecoveryCodes()
                                            }
                                            disabled={
                                                generatingCodes ||
                                                disablingTwoFactor
                                            }
                                        >
                                            {generatingCodes
                                                ? 'Generating...'
                                                : 'Generate New Recovery Codes'}
                                        </button>

                                        <button
                                            type="button"
                                            className="settings-danger-outline-button"
                                            onClick={() =>
                                                void disableTwoFactor()
                                            }
                                            disabled={
                                                disablingTwoFactor ||
                                                generatingCodes
                                            }
                                        >
                                            {disablingTwoFactor
                                                ? 'Disabling...'
                                                : 'Disable 2FA'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {!twoFactorSetup ? (
                                        <div className="settings-two-factor-intro">
                                            <p>
                                                Use an
                                                authenticator
                                                application
                                                to generate
                                                a temporary
                                                code each
                                                time you
                                                sign in.
                                            </p>

                                            <button
                                                type="button"
                                                className="admin-primary-button"
                                                onClick={() =>
                                                    void beginTwoFactorSetup()
                                                }
                                                disabled={
                                                    configuringTwoFactor
                                                }
                                            >
                                                {configuringTwoFactor
                                                    ? 'Preparing...'
                                                    : 'Set Up Two-Factor Authentication'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="settings-two-factor-setup">
                                            <div className="settings-setup-step">
                                                <span className="settings-step-number">
                                                    1
                                                </span>

                                                <div>
                                                    <strong>
                                                        Add
                                                        the
                                                        account
                                                        to
                                                        your
                                                        authenticator
                                                        app
                                                    </strong>

                                                    <p>
                                                        Enter
                                                        the
                                                        following
                                                        setup
                                                        key
                                                        manually.
                                                    </p>

                                                    <code className="settings-secret-key">
                                                        {
                                                            twoFactorSetup.sharedKey
                                                        }
                                                    </code>
                                                </div>
                                            </div>

                                            <div className="settings-setup-step">
                                                <span className="settings-step-number">
                                                    2
                                                </span>

                                                <div>
                                                    <strong>
                                                        Verify
                                                        your
                                                        authenticator
                                                    </strong>

                                                    <p>
                                                        Enter
                                                        the
                                                        current
                                                        six-digit
                                                        code
                                                        from
                                                        the
                                                        app.
                                                    </p>

                                                    <form
                                                        className="settings-two-factor-form"
                                                        onSubmit={
                                                            enableTwoFactor
                                                        }
                                                    >
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            autoComplete="one-time-code"
                                                            value={
                                                                twoFactorCode
                                                            }
                                                            onChange={
                                                                event =>
                                                                    setTwoFactorCode(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                            }
                                                            placeholder="000000"
                                                            required
                                                        />

                                                        <button
                                                            type="submit"
                                                            className="admin-primary-button"
                                                            disabled={
                                                                enablingTwoFactor ||
                                                                !twoFactorCode
                                                                    .trim()
                                                            }
                                                        >
                                                            {enablingTwoFactor
                                                                ? 'Verifying...'
                                                                : 'Verify & Enable'}
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>

                                            <details className="settings-authenticator-uri">
                                                <summary>
                                                    Advanced:
                                                    authenticator
                                                    URI
                                                </summary>

                                                <code>
                                                    {
                                                        twoFactorSetup.authenticatorUri
                                                    }
                                                </code>
                                            </details>
                                        </div>
                                    )}
                                </>
                            )}

                            {recoveryCodes.length >
                                0 && (
                                    <div className="settings-recovery-panel">
                                        <div>
                                            <strong>
                                                Save these
                                                recovery
                                                codes
                                            </strong>

                                            <p>
                                                Keep them
                                                somewhere
                                                secure.
                                                Each code
                                                can be
                                                used to
                                                sign in
                                                if your
                                                authenticator
                                                is
                                                unavailable.
                                            </p>
                                        </div>

                                        <div className="settings-recovery-codes">
                                            {recoveryCodes.map(
                                                code => (
                                                    <code
                                                        key={
                                                            code
                                                        }
                                                    >
                                                        {
                                                            code
                                                        }
                                                    </code>
                                                )
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="settings-secondary-button"
                                            onClick={() =>
                                                void copyRecoveryCodes()
                                            }
                                        >
                                            Copy Codes
                                        </button>
                                    </div>
                                )}
                        </section>

                        <section className="settings-card settings-danger-card">
                            <div className="settings-card-heading">
                                <div>
                                    <span className="settings-section-label settings-danger-label">
                                        Danger Zone
                                    </span>

                                    <h2>
                                        Delete Account
                                    </h2>

                                    <p>
                                        Permanently
                                        delete your
                                        administrator
                                        account.
                                    </p>
                                </div>
                            </div>

                            <div className="settings-danger-content">
                                <div>
                                    <strong>
                                        This action
                                        cannot be
                                        undone.
                                    </strong>

                                    <p>
                                        Enter your
                                        current
                                        password before
                                        requesting
                                        deletion. The
                                        system will
                                        prevent deletion
                                        if this is the
                                        last active
                                        administrator.
                                    </p>
                                </div>

                                <label className="settings-field">
                                    <span>
                                        Current
                                        Password
                                    </span>

                                    <input
                                        type="password"
                                        autoComplete="current-password"
                                        value={
                                            deletePassword
                                        }
                                        onChange={
                                            event =>
                                                setDeletePassword(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        placeholder="Enter current password"
                                    />
                                </label>

                                <button
                                    type="button"
                                    className="settings-danger-button"
                                    disabled={
                                        deletingAccount ||
                                        !deletePassword
                                            .trim()
                                    }
                                    onClick={() =>
                                        setDeleteConfirmationOpen(
                                            true
                                        )
                                    }
                                >
                                    Delete My Account
                                </button>
                            </div>
                        </section>
                    </div>
                ) : null}

                <ConfirmDialog
                    open={
                        deleteConfirmationOpen
                    }
                    title="Delete your account?"
                    message="This permanently deletes your administrator account and cannot be undone. Are you sure you want to continue?"
                    confirmText="Delete Account"
                    cancelText="Cancel"
                    variant="danger"
                    loading={
                        deletingAccount
                    }
                    loadingText="Deleting..."
                    onConfirm={() =>
                        void deleteAccount()
                    }
                    onCancel={() =>
                        !deletingAccount &&
                        setDeleteConfirmationOpen(
                            false
                        )
                    }
                />
            </div>
        </AdminLayout>
    );
}

export default AccountSettings;