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
import '../styles/roles.css';


/* =========================================
   TYPES
   ========================================= */

interface AdminRole {
    id: string;
    name: string;
    description: string | null;
}

interface RoleFormState {
    name: string;
    description: string;
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


/* =========================================
   DEFAULT STATE
   ========================================= */

const emptyRoleForm: RoleFormState = {
    name: '',
    description: '',
};

const emptyConfirmation: ConfirmationState = {
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: null,
};


/* =========================================
   ROLES PAGE
   ========================================= */

function Roles() {
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
        roleFormOpen,
        setRoleFormOpen,
    ] = useState(false);

    const [
        editingRole,
        setEditingRole,
    ] = useState<AdminRole | null>(
        null
    );

    const [
        roleForm,
        setRoleForm,
    ] = useState<RoleFormState>(
        emptyRoleForm
    );

    const [
        confirmation,
        setConfirmation,
    ] = useState<ConfirmationState>(
        emptyConfirmation
    );


    /* =========================================
       SORTED ROLES
       ========================================= */

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


    /* =========================================
       LOAD ROLES
       ========================================= */

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


    /* =========================================
       INITIAL LOAD
       ========================================= */

    useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(true);

                    const roleData =
                        await fetchRoles(
                            controller.signal
                        );

                    setRoles(roleData);
                    setLoadError(null);
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
                        setLoading(false);
                    }
                }
            };

        void initialise();

        return () =>
            controller.abort();
    }, [fetchRoles]);


    /* =========================================
       RETRY
       ========================================= */

    async function retryLoad():
        Promise<boolean> {
        setRetrying(true);
        setActionError(null);

        try {
            const roleData =
                await fetchRoles();

            setRoles(roleData);
            setLoadError(null);

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


    /* =========================================
       SUCCESS MESSAGE
       ========================================= */

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


    /* =========================================
       API ACTION FAILURE
       ========================================= */

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


    /* =========================================
       REFRESH ROLES
       ========================================= */

    async function refreshRoles() {
        const roleData =
            await fetchRoles();

        setRoles(roleData);
    }


    /* =========================================
       OPEN CREATE ROLE
       ========================================= */

    function openNewRole() {
        setEditingRole(null);

        setRoleForm({
            ...emptyRoleForm,
        });

        setRoleFormOpen(true);
        setActionError(null);
    }


    /* =========================================
       OPEN EDIT ROLE
       ========================================= */

    function openEditRole(
        role: AdminRole
    ) {
        setEditingRole(role);

        setRoleForm({
            name: role.name,
            description:
                role.description ?? '',
        });

        setRoleFormOpen(true);
        setActionError(null);
    }


    /* =========================================
       CLOSE ROLE FORM
       ========================================= */

    function closeRoleForm() {
        if (saving) {
            return;
        }

        setRoleFormOpen(false);
        setEditingRole(null);

        setRoleForm({
            ...emptyRoleForm,
        });
    }


    /* =========================================
       CREATE / UPDATE ROLE
       ========================================= */

    async function submitRole(
        event: FormEvent
    ) {
        event.preventDefault();

        const roleName =
            roleForm.name.trim();

        const roleDescription =
            roleForm.description.trim();

        if (!roleName) {
            setActionError(
                'Role name is required.'
            );

            return;
        }

        if (roleDescription.length > 500) {
            setActionError(
                'Role description cannot exceed 500 characters.'
            );

            return;
        }

        setSaving(true);
        setActionError(null);

        try {
            if (editingRole) {
                const response =
                    await apiFetch(
                        `/api/admin/roles/${editingRole.id}`,
                        {
                            method: 'PUT',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify(
                                    {
                                        name:
                                            roleName,
                                        description:
                                            roleDescription ||
                                            null,
                                    }
                                ),
                        }
                    );

                if (!response.ok) {
                    await actionFailure(
                        response,
                        'Unable to update role.'
                    );
                }

                await refreshRoles();

                setRoleFormOpen(false);
                setEditingRole(null);
                setRoleForm({
                    ...emptyRoleForm,
                });

                showSuccess(
                    'Role updated successfully.'
                );

                return;
            }

            const response =
                await apiFetch(
                    '/api/admin/roles',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify(
                                {
                                    name:
                                        roleName,
                                    description:
                                        roleDescription ||
                                        null,
                                }
                            ),
                    }
                );

            if (!response.ok) {
                await actionFailure(
                    response,
                    'Unable to create role.'
                );
            }

            await refreshRoles();

            setRoleFormOpen(false);
            setEditingRole(null);
            setRoleForm({
                ...emptyRoleForm,
            });

            showSuccess(
                'Role created successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : editingRole
                        ? 'Unable to update role.'
                        : 'Unable to create role.'
            );
        } finally {
            setSaving(false);
        }
    }


    /* =========================================
       DELETE ROLE REQUEST
       ========================================= */

    function requestDeleteRole(
        role: AdminRole
    ) {
        setConfirmation({
            open: true,
            title: 'Delete role?',
            message:
                `Permanently delete the "${role.name}" role? ` +
                'This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger',
            action: async () => {
                const response =
                    await apiFetch(
                        `/api/admin/roles/${role.id}`,
                        {
                            method:
                                'DELETE',
                        }
                    );

                if (!response.ok) {
                    await actionFailure(
                        response,
                        'Unable to delete role.'
                    );
                }

                setRoles(
                    current =>
                        current.filter(
                            existingRole =>
                                existingRole.id !==
                                role.id
                        )
                );

                showSuccess(
                    'Role deleted successfully.'
                );
            },
        });
    }


    /* =========================================
       RUN CONFIRMATION
       ========================================= */

    async function runConfirmation() {
        if (!confirmation.action) {
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


    /* =========================================
       PAGE
       ========================================= */

    return (
        <AdminLayout>
            <div className="roles-admin">

                {/* =================================
                    PAGE HEADER
                   ================================= */}

                <div className="roles-admin-header">
                    <div>
                        <span className="roles-admin-eyebrow">
                            Administration
                        </span>

                        <h1>
                            Roles
                        </h1>

                        <p>
                            Create and manage
                            administration roles used
                            to control user access.
                        </p>
                    </div>

                    {!loadError &&
                        !loading && (
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openNewRole
                                }
                            >
                                <span>
                                    ＋
                                </span>

                                Add Role
                            </button>
                        )}
                </div>


                {/* =================================
                    ACTION ERROR
                   ================================= */}

                {actionError && (
                    <div className="roles-admin-alert roles-admin-alert-error">
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


                {/* =================================
                    SUCCESS
                   ================================= */}

                {successMessage && (
                    <div className="roles-admin-alert roles-admin-alert-success">
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


                {/* =================================
                    LOADING / ERROR / CONTENT
                   ================================= */}

                {loading ? (
                    <div className="roles-admin-panel roles-admin-empty">
                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading roles...
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

                        {/* =============================
                            STATISTICS
                           ============================= */}

                        <div className="roles-admin-stats">

                            <div className="roles-stat-card">
                                <span className="roles-stat-icon">
                                    ◈
                                </span>

                                <div>
                                    <strong>
                                        {roles.length}
                                    </strong>

                                    <span>
                                        Total Roles
                                    </span>
                                </div>
                            </div>

                        </div>


                        {/* =============================
                            ROLES TABLE
                           ============================= */}

                        <section className="roles-admin-panel">

                            <div className="roles-panel-heading">
                                <div>
                                    <h2>
                                        Access Roles
                                    </h2>

                                    <p>
                                        {roles.length}{' '}
                                        role
                                        {roles.length ===
                                            1
                                            ? ''
                                            : 's'}{' '}
                                        configured
                                    </p>
                                </div>
                            </div>


                            {sortedRoles.length ===
                                0 ? (
                                <div className="roles-admin-empty">

                                    <strong>
                                        No roles found
                                    </strong>

                                    <p>
                                        Create the first
                                        administration
                                        role.
                                    </p>

                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={
                                            openNewRole
                                        }
                                    >
                                        Add Role
                                    </button>

                                </div>
                            ) : (
                                <div className="roles-table-wrapper">

                                    <table className="roles-table">

                                        <thead>
                                            <tr>
                                                <th>
                                                    Role
                                                </th>

                                                <th>
                                                    Description
                                                </th>

                                                <th>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {sortedRoles.map(
                                                role => (
                                                    <tr
                                                        key={
                                                            role.id
                                                        }
                                                    >
                                                        <td>
                                                            <div className="roles-name-cell">

                                                                <span className="roles-role-icon">
                                                                    ◈
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        role.name
                                                                    }
                                                                </strong>

                                                            </div>
                                                        </td>

                                                        <td>
                                                            <div className="roles-description-cell">
                                                                {
                                                                    role.description
                                                                        ? role.description
                                                                        : (
                                                                            <span className="roles-description-empty">
                                                                                No description
                                                                            </span>
                                                                        )
                                                                }
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <AdminActionButtons
                                                                itemName={role.name}
                                                                onEdit={() =>
                                                                    openEditRole(
                                                                        role
                                                                    )
                                                                }
                                                                onDelete={() =>
                                                                    requestDeleteRole(
                                                                        role
                                                                    )
                                                                }
                                                                editTitle="Edit role"
                                                                deleteTitle="Delete role"
                                                            />
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


                {/* =================================
                    CREATE / EDIT ROLE MODAL
                   ================================= */}

                {roleFormOpen && (
                    <div
                        className="roles-modal-backdrop"
                        onMouseDown={
                            closeRoleForm
                        }
                    >
                        <div
                            className="roles-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="role-form-title"
                            onMouseDown={
                                event =>
                                    event.stopPropagation()
                            }
                        >

                            <div className="roles-modal-header">
                                <div>
                                    <span>
                                        Administration
                                    </span>

                                    <h2 id="role-form-title">
                                        {editingRole
                                            ? 'Edit Role'
                                            : 'Add Role'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeRoleForm
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
                                    submitRole
                                }
                            >

                                <div className="roles-form-grid">

                                    <label className="roles-field">

                                        <span>
                                            Role Name *
                                        </span>

                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            maxLength={256}
                                            value={
                                                roleForm.name
                                            }
                                            onChange={
                                                event =>
                                                    setRoleForm(
                                                        current => ({
                                                            ...current,
                                                            name:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            placeholder="e.g. Administrator"
                                        />

                                        <small>
                                            Enter a clear
                                            name describing
                                            the access role.
                                        </small>

                                    </label>


                                    <label className="roles-field">

                                        <span>
                                            Description
                                        </span>

                                        <textarea
                                            value={
                                                roleForm.description
                                            }
                                            onChange={
                                                event =>
                                                    setRoleForm(
                                                        current => ({
                                                            ...current,
                                                            description:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            maxLength={500}
                                            rows={4}
                                            placeholder="Describe what users with this role can access or manage."
                                        />

                                        <div className="roles-field-footer">
                                            <small>
                                                Briefly explain
                                                the permissions
                                                or responsibilities
                                                of this role.
                                            </small>

                                            <small className="roles-character-count">
                                                {
                                                    roleForm
                                                        .description
                                                        .length
                                                }/500
                                            </small>
                                        </div>

                                    </label>

                                </div>


                                <div className="roles-modal-actions">

                                    <button
                                        type="button"
                                        className="roles-secondary-button"
                                        onClick={
                                            closeRoleForm
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
                                            : editingRole
                                                ? 'Save Changes'
                                                : 'Create Role'}
                                    </button>

                                </div>

                            </form>

                        </div>
                    </div>
                )}


                {/* =================================
                    CONFIRM DELETE
                   ================================= */}

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

export default Roles;