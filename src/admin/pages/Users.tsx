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

import '../styles/admin.css';
import '../styles/users.css';

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    phoneNumberConfirmed: boolean;
    emailConfirmed: boolean;
    twoFactorEnabled: boolean;
    isActive: boolean;
    lastLoginAt: string | null;
    roles: string[];
}

interface AdminRole {
    id: string;
    name: string;
}

interface UserFormState {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    roles: string[];
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
    action:
    | (() => Promise<void>)
    | null;
}

const emptyUserForm: UserFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    roles: [],
};

const emptyConfirmation: ConfirmationState = {
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: null,
};

function formatLastLogin(
    value: string | null
) {
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

function getDisplayName(
    user: AdminUser
) {
    const name = [
        user.firstName,
        user.lastName,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    return name || user.email;
}

function Users() {
    const [
        users,
        setUsers,
    ] = useState<AdminUser[]>([]);

    const [
        roles,
        setRoles,
    ] = useState<AdminRole[]>([]);

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
        userFormOpen,
        setUserFormOpen,
    ] = useState(false);

    const [
        editingUser,
        setEditingUser,
    ] =
        useState<AdminUser | null>(
            null
        );

    const [
        userForm,
        setUserForm,
    ] =
        useState<UserFormState>(
            emptyUserForm
        );

    const [
        confirmation,
        setConfirmation,
    ] =
        useState<ConfirmationState>(
            emptyConfirmation
        );

    const sortedUsers =
        useMemo(
            () =>
                [...users].sort(
                    (a, b) =>
                        getDisplayName(
                            a
                        ).localeCompare(
                            getDisplayName(
                                b
                            )
                        )
                ),
            [users]
        );

    const sortedRoles =
        useMemo(
            () =>
                [...roles].sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                ),
            [roles]
        );

    const activeUsers =
        users.filter(
            user => user.isActive
        ).length;

    const verifiedUsers =
        users.filter(
            user =>
                user.emailConfirmed
        ).length;

    const twoFactorUsers =
        users.filter(
            user =>
                user.twoFactorEnabled
        ).length;

    const fetchUsers =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/admin/users',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load users.'
                    );
                }

                return (
                    await response.json()
                ) as AdminUser[];
            },
            []
        );

    const fetchRoles =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/admin/roles',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load roles.'
                    );
                }

                return (
                    await response.json()
                ) as AdminRole[];
            },
            []
        );

    const loadAll =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const [
                    userData,
                    roleData,
                ] =
                    await Promise.all([
                        fetchUsers(
                            signal
                        ),
                        fetchRoles(
                            signal
                        ),
                    ]);

                setUsers(userData);
                setRoles(roleData);
                setLoadError(null);
            },
            [
                fetchRoles,
                fetchUsers,
            ]
        );

    useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(true);

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

    function openNewUser() {
        setEditingUser(null);

        setUserForm({
            ...emptyUserForm,
            roles: [],
        });

        setUserFormOpen(true);
        setActionError(null);
    }

    function openEditUser(
        user: AdminUser
    ) {
        setEditingUser(user);

        setUserForm({
            firstName:
                user.firstName,
            lastName:
                user.lastName,
            email: user.email,
            phoneNumber:
                user.phoneNumber ??
                '',
            password: '',
            roles: [
                ...user.roles,
            ],
        });

        setUserFormOpen(true);
        setActionError(null);
    }

    function closeUserForm() {
        if (saving) {
            return;
        }

        setUserFormOpen(false);
        setEditingUser(null);

        setUserForm({
            ...emptyUserForm,
            roles: [],
        });
    }

    function toggleRole(
        roleName: string
    ) {
        setUserForm(
            current => {
                const selected =
                    current.roles.includes(
                        roleName
                    );

                return {
                    ...current,
                    roles: selected
                        ? current.roles.filter(
                            role =>
                                role !==
                                roleName
                        )
                        : [
                            ...current.roles,
                            roleName,
                        ],
                };
            }
        );
    }

    async function refreshUsers() {
        setUsers(
            await fetchUsers()
        );
    }

    async function submitUser(
        event: FormEvent
    ) {
        event.preventDefault();

        setSaving(true);
        setActionError(null);

        try {
            const profilePayload = {
                email:
                    userForm.email.trim(),
                firstName:
                    userForm.firstName.trim(),
                lastName:
                    userForm.lastName.trim(),
                phoneNumber:
                    userForm
                        .phoneNumber
                        .trim() ||
                    null,
            };

            if (editingUser) {
                const profileResponse =
                    await apiFetch(
                        `/api/admin/users/${editingUser.id}`,
                        {
                            method:
                                'PUT',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify(
                                    profilePayload
                                ),
                        }
                    );

                if (
                    !profileResponse.ok
                ) {
                    await actionFailure(
                        profileResponse,
                        'Unable to update user.'
                    );
                }

                const rolesChanged =
                    JSON.stringify(
                        [
                            ...editingUser.roles,
                        ].sort()
                    ) !==
                    JSON.stringify(
                        [
                            ...userForm.roles,
                        ].sort()
                    );

                if (rolesChanged) {
                    const roleResponse =
                        await apiFetch(
                            `/api/admin/users/${editingUser.id}/roles`,
                            {
                                method:
                                    'PUT',
                                headers: {
                                    'Content-Type':
                                        'application/json',
                                },
                                body:
                                    JSON.stringify(
                                        {
                                            roles:
                                                userForm.roles,
                                        }
                                    ),
                            }
                        );

                    if (
                        !roleResponse.ok
                    ) {
                        await actionFailure(
                            roleResponse,
                            'The user details were updated, but the roles could not be updated.'
                        );
                    }
                }

                await refreshUsers();

                closeUserForm();

                showSuccess(
                    'User updated successfully.'
                );

                return;
            }

            const createResponse =
                await apiFetch(
                    '/api/admin/users',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify(
                                {
                                    ...profilePayload,
                                    password:
                                        userForm.password,
                                    roles:
                                        userForm.roles,
                                }
                            ),
                    }
                );

            if (
                !createResponse.ok
            ) {
                await actionFailure(
                    createResponse,
                    'Unable to create user.'
                );
            }

            const createResult =
                (await createResponse.json()) as {
                    id: string;
                    verificationEmailSent:
                    boolean;
                    verificationEmailError:
                    string | null;
                };

            await refreshUsers();

            closeUserForm();

            if (
                createResult
                    .verificationEmailSent
            ) {
                showSuccess(
                    'User created successfully. A verification email was sent.'
                );
            } else {
                showSuccess(
                    'User created successfully. The verification email could not be sent.'
                );
            }
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : editingUser
                        ? 'Unable to update user.'
                        : 'Unable to create user.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestStatusChange(
        user: AdminUser
    ) {
        const activating =
            !user.isActive;

        setConfirmation({
            open: true,
            title: activating
                ? 'Activate user?'
                : 'Deactivate user?',
            message: activating
                ? `Activate ${getDisplayName(user)}? They will be able to access the administration system again if their other sign-in requirements are satisfied.`
                : `Deactivate ${getDisplayName(user)}? They will no longer be able to sign in to the administration system.`,
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
                        `/api/admin/users/${user.id}/status`,
                        {
                            method:
                                'PUT',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify(
                                    {
                                        isActive:
                                            activating,
                                    }
                                ),
                        }
                    );

                if (!response.ok) {
                    await actionFailure(
                        response,
                        'Unable to change user status.'
                    );
                }

                await refreshUsers();

                showSuccess(
                    activating
                        ? 'User activated.'
                        : 'User deactivated.'
                );
            },
        });
    }

    function requestDeleteUser(
        user: AdminUser
    ) {
        setConfirmation({
            open: true,
            title: 'Delete user?',
            message:
                `Permanently delete ${getDisplayName(user)}? ` +
                'This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger',
            action: async () => {
                const response =
                    await apiFetch(
                        `/api/admin/users/${user.id}`,
                        {
                            method: 'DELETE',
                        }
                    );

                if (!response.ok) {
                    await actionFailure(
                        response,
                        'Unable to delete user.'
                    );
                }

                setUsers(
                    current =>
                        current.filter(
                            existingUser =>
                                existingUser.id !==
                                user.id
                        )
                );

                showSuccess(
                    'User deleted successfully.'
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
                error instanceof Error
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
            <div className="users-admin">
                <div className="users-admin-header">
                    <div>
                        <span className="users-admin-eyebrow">
                            Administration
                        </span>

                        <h1>
                            Users
                        </h1>

                        <p>
                            Create and manage
                            administrator accounts,
                            contact details and
                            access roles.
                        </p>
                    </div>

                    {!loadError &&
                        !loading && (
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openNewUser
                                }
                            >
                                <span>
                                    ＋
                                </span>

                                Add User
                            </button>
                        )}
                </div>

                {actionError && (
                    <div className="users-admin-alert users-admin-alert-error">
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
                    <div className="users-admin-alert users-admin-alert-success">
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
                    <div className="users-admin-panel users-admin-empty">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading users...
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
                        <div className="users-admin-stats">
                            <div className="users-stat-card">
                                <span className="users-stat-icon">
                                    ♙
                                </span>

                                <div>
                                    <strong>
                                        {
                                            users.length
                                        }
                                    </strong>

                                    <span>
                                        Total Users
                                    </span>
                                </div>
                            </div>

                            <div className="users-stat-card">
                                <span className="users-stat-icon">
                                    ✓
                                </span>

                                <div>
                                    <strong>
                                        {
                                            activeUsers
                                        }
                                    </strong>

                                    <span>
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="users-stat-card">
                                <span className="users-stat-icon">
                                    ✉
                                </span>

                                <div>
                                    <strong>
                                        {
                                            verifiedUsers
                                        }
                                    </strong>

                                    <span>
                                        Email Verified
                                    </span>
                                </div>
                            </div>

                            <div className="users-stat-card">
                                <span className="users-stat-icon">
                                    ◈
                                </span>

                                <div>
                                    <strong>
                                        {
                                            twoFactorUsers
                                        }
                                    </strong>

                                    <span>
                                        Using 2FA
                                    </span>
                                </div>
                            </div>
                        </div>

                        <section className="users-admin-panel">
                            <div className="users-panel-heading">
                                <div>
                                    <h2>
                                        User Accounts
                                    </h2>

                                    <p>
                                        {
                                            users.length
                                        }{' '}
                                        user
                                        {users.length ===
                                            1
                                            ? ''
                                            : 's'}{' '}
                                        configured
                                    </p>
                                </div>
                            </div>

                            {sortedUsers.length ===
                                0 ? (
                                <div className="users-admin-empty">
                                    <strong>
                                        No users
                                        found
                                    </strong>

                                    <p>
                                        Create the
                                        first
                                        administrator
                                        account.
                                    </p>

                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={
                                            openNewUser
                                        }
                                    >
                                        Add User
                                    </button>
                                </div>
                            ) : (
                                <div className="users-table-wrapper">
                                    <table className="users-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    User
                                                </th>

                                                <th>
                                                    Phone
                                                </th>

                                                <th>
                                                    Roles
                                                </th>

                                                <th>
                                                    Email
                                                </th>

                                                <th>
                                                    Phone
                                                    Status
                                                </th>

                                                <th>
                                                    2FA
                                                </th>

                                                <th>
                                                    Last
                                                    Login
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
                                            {sortedUsers.map(
                                                user => (
                                                    <tr
                                                        key={
                                                            user.id
                                                        }
                                                        className={
                                                            !user.isActive
                                                                ? 'users-row-inactive'
                                                                : ''
                                                        }
                                                    >
                                                        <td>
                                                            <div className="users-name-cell">
                                                                <div>
                                                                    <strong>
                                                                        {getDisplayName(
                                                                            user
                                                                        )}
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            {user.phoneNumber ??
                                                                '—'}
                                                        </td>

                                                        <td>
                                                            <div className="users-role-list">
                                                                {user.roles.length >
                                                                    0 ? (
                                                                    user.roles.map(
                                                                        role => (
                                                                            <span
                                                                                key={
                                                                                    role
                                                                                }
                                                                                className="users-badge users-badge-role"
                                                                            >
                                                                                {
                                                                                    role
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )
                                                                ) : (
                                                                    <span className="users-table-secondary">
                                                                        No
                                                                        role
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`users-badge ${user.emailConfirmed
                                                                    ? 'users-badge-success'
                                                                    : 'users-badge-warning'
                                                                    }`}
                                                            >
                                                                {user.emailConfirmed
                                                                    ? 'Verified'
                                                                    : 'Unverified'}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`users-badge ${user.phoneNumberConfirmed
                                                                    ? 'users-badge-success'
                                                                    : 'users-badge-neutral'
                                                                    }`}
                                                            >
                                                                {user.phoneNumberConfirmed
                                                                    ? 'Verified'
                                                                    : user.phoneNumber
                                                                        ? 'Unverified'
                                                                        : 'Not set'}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`users-badge ${user.twoFactorEnabled
                                                                    ? 'users-badge-success'
                                                                    : 'users-badge-neutral'
                                                                    }`}
                                                            >
                                                                {user.twoFactorEnabled
                                                                    ? 'Enabled'
                                                                    : 'Off'}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            {formatLastLogin(
                                                                user.lastLoginAt
                                                            )}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`users-badge ${user.isActive
                                                                    ? 'users-badge-active'
                                                                    : 'users-badge-inactive'
                                                                    }`}
                                                            >
                                                                {user.isActive
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <div className="users-actions">
                                                                <button
                                                                    type="button"
                                                                    className="users-action-icon"
                                                                    onClick={() =>
                                                                        openEditUser(
                                                                            user
                                                                        )
                                                                    }
                                                                    aria-label={`Edit ${getDisplayName(
                                                                        user
                                                                    )}`}
                                                                    title="Edit user"
                                                                >
                                                                    ✎
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className={`users-action-icon ${user.isActive
                                                                        ? 'warning'
                                                                        : 'success'
                                                                        }`}
                                                                    onClick={() =>
                                                                        requestStatusChange(
                                                                            user
                                                                        )
                                                                    }
                                                                    aria-label={
                                                                        user.isActive
                                                                            ? `Deactivate ${getDisplayName(
                                                                                user
                                                                            )}`
                                                                            : `Activate ${getDisplayName(
                                                                                user
                                                                            )}`
                                                                    }
                                                                    title={
                                                                        user.isActive
                                                                            ? 'Deactivate user'
                                                                            : 'Activate user'
                                                                    }
                                                                >
                                                                    {user.isActive
                                                                        ? '⏸'
                                                                        : '▶'}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="users-action-icon danger"
                                                                    onClick={() =>
                                                                        requestDeleteUser(
                                                                            user
                                                                        )
                                                                    }
                                                                    aria-label={`Delete ${getDisplayName(
                                                                        user
                                                                    )}`}
                                                                    title="Delete user"
                                                                >
                                                                    🗑
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
                    </>
                )}

                {userFormOpen && (
                    <div
                        className="users-modal-backdrop"
                        onMouseDown={
                            closeUserForm
                        }
                    >
                        <div
                            className="users-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="user-form-title"
                            onMouseDown={
                                event =>
                                    event.stopPropagation()
                            }
                        >
                            <div className="users-modal-header">
                                <div>
                                    <span>
                                        Administration
                                    </span>

                                    <h2 id="user-form-title">
                                        {editingUser
                                            ? 'Edit User'
                                            : 'Add User'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeUserForm
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
                                    submitUser
                                }
                            >
                                <div className="users-form-grid">
                                    <label className="users-field">
                                        <span>
                                            First Name
                                            *
                                        </span>

                                        <input
                                            required
                                            value={
                                                userForm.firstName
                                            }
                                            onChange={
                                                event =>
                                                    setUserForm(
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

                                    <label className="users-field">
                                        <span>
                                            Last Name
                                            *
                                        </span>

                                        <input
                                            required
                                            value={
                                                userForm.lastName
                                            }
                                            onChange={
                                                event =>
                                                    setUserForm(
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

                                    <label className="users-field users-field-wide">
                                        <span>
                                            Email
                                            Address *
                                        </span>

                                        <input
                                            type="email"
                                            required
                                            value={
                                                userForm.email
                                            }
                                            onChange={
                                                event =>
                                                    setUserForm(
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

                                        {editingUser &&
                                            userForm.email.trim().toLowerCase() !==
                                            editingUser.email
                                                .trim()
                                                .toLowerCase() && (
                                                <small>
                                                    Changing
                                                    the email
                                                    address
                                                    will
                                                    require
                                                    the new
                                                    address
                                                    to be
                                                    verified.
                                                </small>
                                            )}
                                    </label>

                                    <label className="users-field users-field-wide">
                                        <span>
                                            Phone
                                            Number
                                        </span>

                                        <input
                                            type="tel"
                                            value={
                                                userForm.phoneNumber
                                            }
                                            onChange={
                                                event =>
                                                    setUserForm(
                                                        current => ({
                                                            ...current,
                                                            phoneNumber:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            placeholder="+44..."
                                        />
                                    </label>

                                    {!editingUser && (
                                        <label className="users-field users-field-wide">
                                            <span>
                                                Temporary
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
                                                    userForm.password
                                                }
                                                onChange={
                                                    event =>
                                                        setUserForm(
                                                            current => ({
                                                                ...current,
                                                                password:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                }
                                            />

                                            <small>
                                                Minimum 8
                                                characters.
                                                The password
                                                must satisfy
                                                the server
                                                password
                                                policy.
                                            </small>
                                        </label>
                                    )}

                                    <fieldset className="users-field users-field-wide users-role-fieldset">
                                        <legend>
                                            Roles
                                        </legend>

                                        {sortedRoles.length ===
                                            0 ? (
                                            <p className="users-no-roles">
                                                No roles
                                                are
                                                currently
                                                configured.
                                            </p>
                                        ) : (
                                            <div className="users-role-options">
                                                {sortedRoles.map(
                                                    role => (
                                                        <label
                                                            key={
                                                                role.id
                                                            }
                                                            className="users-role-option"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={userForm.roles.includes(
                                                                    role.name
                                                                )}
                                                                onChange={() =>
                                                                    toggleRole(
                                                                        role.name
                                                                    )
                                                                }
                                                            />

                                                            <span>
                                                                {
                                                                    role.name
                                                                }
                                                            </span>
                                                        </label>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </fieldset>
                                </div>

                                <div className="users-modal-actions">
                                    <button
                                        type="button"
                                        className="users-secondary-button"
                                        onClick={
                                            closeUserForm
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
                                            : editingUser
                                                ? 'Save Changes'
                                                : 'Create User'}
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

export default Users;