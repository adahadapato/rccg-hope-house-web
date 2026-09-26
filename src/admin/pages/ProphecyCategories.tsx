import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';

import { apiFetch } from '../../api/api';
import ConfirmDialog from '@/components/sections/ConfirmDialog';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin.css';
import '../styles/prophecy-categories.css';

interface ProphecyYear {
    id: string;
    year: number;
    isPublished: boolean;
}

interface Prophecy {
    id: string;
    categoryId: string;
    text: string;
    displayOrder: number;
    isActive: boolean;
}

interface ProphecyCategory {
    id: string;
    prophecyYearId: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    prophecies: Prophecy[];
}

interface CategoryFormState {
    name: string;
    description: string;
    displayOrder: string;
}

const emptyForm: CategoryFormState = {
    name: '',
    description: '',
    displayOrder: '0',
};

async function readProblem(
    response: Response,
    fallback: string
) {
    try {
        const problem = await response.json();

        if (typeof problem?.detail === 'string') {
            return problem.detail;
        }

        if (typeof problem?.title === 'string') {
            return problem.title;
        }
    } catch {
        // Keep the fallback message.
    }

    return fallback;
}

function ProphecyCategories() {
    const [years, setYears] =
        useState<ProphecyYear[]>([]);

    const [selectedYearId, setSelectedYearId] =
        useState('');

    const [categories, setCategories] =
        useState<ProphecyCategory[]>([]);

    const [loadingYears, setLoadingYears] =
        useState(true);

    const [loadingCategories, setLoadingCategories] =
        useState(false);

    const [formOpen, setFormOpen] =
        useState(false);

    const [editingCategory, setEditingCategory] =
        useState<ProphecyCategory | null>(null);

    const [form, setForm] =
        useState<CategoryFormState>(emptyForm);

    const [saving, setSaving] =
        useState(false);

    const [actionCategoryId, setActionCategoryId] =
        useState<string | null>(null);

    const [
        confirmationCategory,
        setConfirmationCategory,
    ] = useState<ProphecyCategory | null>(
        null
    );

    const [error, setError] =
        useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const selectedYear = useMemo(
        () =>
            years.find(
                year => year.id === selectedYearId
            ) ?? null,
        [years, selectedYearId]
    );

    const activeCount = useMemo(
        () =>
            categories.filter(
                category => category.isActive
            ).length,
        [categories]
    );

    const inactiveCount =
        categories.length - activeCount;

    const loadCategories = useCallback(
        async (
            prophecyYearId: string,
            signal?: AbortSignal
        ) => {
            if (!prophecyYearId) {
                setCategories([]);
                return;
            }

            setLoadingCategories(true);

            try {
                setError(null);

                const response = await apiFetch(
                    `/api/prophecies/admin/years/${prophecyYearId}/categories?activeOnly=false`,
                    { signal }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load prophecy categories (${response.status})`
                    );
                }

                const data: ProphecyCategory[] =
                    await response.json();

                setCategories(
                    [...data].sort(
                        (a, b) =>
                            a.displayOrder -
                            b.displayOrder ||
                            a.name.localeCompare(
                                b.name
                            )
                    )
                );
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError'
                ) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Unable to load prophecy categories.'
                    );
                }
            } finally {
                if (!signal?.aborted) {
                    setLoadingCategories(false);
                }
            }
        },
        []
    );

    const loadYears = useCallback(
        async (signal?: AbortSignal) => {
            setLoadingYears(true);

            try {
                setError(null);

                const response = await apiFetch(
                    '/api/prophecies/admin/years',
                    { signal }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load prophecy years (${response.status})`
                    );
                }

                const data: ProphecyYear[] =
                    await response.json();

                const ordered = [...data].sort(
                    (a, b) => b.year - a.year
                );

                setYears(ordered);

                setSelectedYearId(current => {
                    if (
                        current &&
                        ordered.some(
                            year =>
                                year.id === current
                        )
                    ) {
                        return current;
                    }

                    return ordered[0]?.id ?? '';
                });
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError'
                ) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Unable to load prophecy years.'
                    );
                }
            } finally {
                if (!signal?.aborted) {
                    setLoadingYears(false);
                }
            }
        },
        []
    );

    useEffect(() => {
        const controller =
            new AbortController();

        void Promise.resolve().then(() =>
            loadYears(controller.signal)
        );

        return () => {
            controller.abort();
        };
    }, [loadYears]);

    useEffect(() => {
        const controller =
            new AbortController();

        void Promise.resolve().then(() =>
            loadCategories(
                selectedYearId,
                controller.signal
            )
        );

        return () => {
            controller.abort();
        };
    }, [
        selectedYearId,
        loadCategories,
    ]);

    function openAddForm() {
        if (!selectedYear) {
            setError(
                'Create a prophecy year before adding categories.'
            );
            return;
        }

        const nextOrder =
            categories.length > 0
                ? Math.max(
                    ...categories.map(
                        category =>
                            category.displayOrder
                    )
                ) + 1
                : 0;

        setEditingCategory(null);
        setForm({
            ...emptyForm,
            displayOrder:
                nextOrder.toString(),
        });
        setError(null);
        setSuccessMessage(null);
        setFormOpen(true);
    }

    function openEditForm(
        category: ProphecyCategory
    ) {
        setEditingCategory(category);

        setForm({
            name: category.name,
            description:
                category.description ?? '',
            displayOrder:
                category.displayOrder.toString(),
        });

        setError(null);
        setSuccessMessage(null);
        setFormOpen(true);
    }

    function closeForm() {
        if (saving) {
            return;
        }

        setFormOpen(false);
        setEditingCategory(null);
        setForm(emptyForm);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!selectedYear) {
            setError(
                'Please select a prophecy year.'
            );
            return;
        }

        const name = form.name.trim();

        if (!name) {
            setError(
                'Category name is required.'
            );
            return;
        }

        const displayOrder =
            Number.parseInt(
                form.displayOrder,
                10
            );

        if (
            Number.isNaN(displayOrder) ||
            displayOrder < 0
        ) {
            setError(
                'Display order must be zero or greater.'
            );
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const body = {
                ...(editingCategory
                    ? {
                        id:
                            editingCategory.id,
                    }
                    : {}),
                prophecyYearId:
                    selectedYear.id,
                name,
                description:
                    form.description.trim() ||
                    null,
                displayOrder,
            };

            const response =
                editingCategory
                    ? await apiFetch(
                        `/api/prophecies/admin/categories/${editingCategory.id}`,
                        {
                            method: 'PUT',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify(
                                    body
                                ),
                        }
                    )
                    : await apiFetch(
                        '/api/prophecies/admin/categories',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify(
                                    body
                                ),
                        }
                    );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        editingCategory
                            ? 'Unable to update the category.'
                            : 'Unable to create the category.'
                    )
                );
            }

            setFormOpen(false);
            setEditingCategory(null);
            setForm(emptyForm);

            setSuccessMessage(
                editingCategory
                    ? 'Prophecy category updated successfully.'
                    : 'Prophecy category created successfully.'
            );

            await loadCategories(
                selectedYear.id
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save the prophecy category.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestStatusChange(
        category: ProphecyCategory
    ) {
        setError(null);
        setSuccessMessage(null);
        setConfirmationCategory(
            category
        );
    }

    function closeConfirmation() {
        if (actionCategoryId) {
            return;
        }

        setConfirmationCategory(
            null
        );
    }

    async function confirmStatusChange() {
        if (!confirmationCategory) {
            return;
        }

        const category =
            confirmationCategory;

        const action =
            category.isActive
                ? 'deactivate'
                : 'activate';

        setActionCategoryId(
            category.id
        );
        setError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/prophecies/admin/categories/${category.id}/${action}`,
                    {
                        method: 'POST',
                    }
                );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        `Unable to ${action} the category.`
                    )
                );
            }

            setSuccessMessage(
                category.isActive
                    ? `"${category.name}" has been deactivated.`
                    : `"${category.name}" has been activated.`
            );

            setConfirmationCategory(
                null
            );

            await loadCategories(
                selectedYearId
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `Unable to ${action} the category.`
            );
        } finally {
            setActionCategoryId(
                null
            );
        }
    }

    return (
        <AdminLayout>
            <section className="prophecy-category-page">
                <div className="prophecy-category-header">
                    <div>
                        <span className="admin-eyebrow">
                            Prophecy Management
                        </span>

                        <h1>
                            Prophecy Categories
                        </h1>

                        <p>
                            Create and manage the
                            categories used to
                            organise yearly RCCG
                            prophecies.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={
                            openAddForm
                        }
                        disabled={
                            !selectedYear ||
                            loadingYears
                        }
                    >
                        <span>＋</span>
                        Add Category
                    </button>
                </div>

                {error && (
                    <div
                        className="admin-message admin-message-error"
                        role="alert"
                    >
                        {error}
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

                <div className="prophecy-category-year-panel admin-panel">
                    <div>
                        <span className="prophecy-category-year-label">
                            Prophecy Year
                        </span>

                        <p>
                            Select the year whose
                            categories you want to
                            manage.
                        </p>
                    </div>

                    <select
                        value={
                            selectedYearId
                        }
                        onChange={event => {
                            setSelectedYearId(
                                event.target.value
                            );
                            setSuccessMessage(
                                null
                            );
                            setError(null);
                        }}
                        disabled={
                            loadingYears ||
                            years.length === 0
                        }
                        aria-label="Prophecy year"
                    >
                        {years.length === 0 && (
                            <option value="">
                                No prophecy years
                            </option>
                        )}

                        {years.map(year => (
                            <option
                                key={year.id}
                                value={year.id}
                            >
                                {year.year}
                                {year.isPublished
                                    ? ' • Published'
                                    : ' • Unpublished'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="admin-panel prophecy-category-panel">
                    <div className="prophecy-category-panel-heading">
                        <div>
                            <h2>
                                Categories
                            </h2>

                            <p>
                                {selectedYear
                                    ? `${categories.length} ${categories.length === 1
                                        ? 'category'
                                        : 'categories'} for ${selectedYear.year}`
                                    : 'No prophecy year selected'}
                            </p>
                        </div>

                        <div className="prophecy-category-counts">
                            <span>
                                {activeCount} active
                            </span>

                            <span>
                                {inactiveCount} inactive
                            </span>
                        </div>
                    </div>

                    {loadingYears ||
                        loadingCategories ? (
                        <div className="admin-empty-state">
                            <div className="admin-loading-spinner" />
                            <p>
                                Loading prophecy
                                categories...
                            </p>
                        </div>
                    ) : !selectedYear ? (
                        <div className="admin-empty-state">
                            <h3>
                                No prophecy years
                            </h3>
                            <p>
                                Add a prophecy year
                                from the Prophecies
                                page first.
                            </p>
                        </div>
                    ) : categories.length ===
                        0 ? (
                        <div className="admin-empty-state">
                            <h3>
                                No categories for{' '}
                                {selectedYear.year}
                            </h3>
                            <p>
                                Add the first
                                category for this
                                prophecy year.
                            </p>

                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openAddForm
                                }
                            >
                                <span>＋</span>
                                Add Category
                            </button>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-data-table prophecy-category-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Category
                                        </th>
                                        <th>
                                            Description
                                        </th>
                                        <th>
                                            Order
                                        </th>
                                        <th>
                                            Status
                                        </th>
                                        <th>
                                            Prophecies
                                        </th>
                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {categories.map(
                                        category => (
                                            <tr
                                                key={
                                                    category.id
                                                }
                                                className={
                                                    category.isActive
                                                        ? ''
                                                        : 'inactive-row'
                                                }
                                            >
                                                <td>
                                                    <div className="prophecy-category-name">
                                                        <span className="prophecy-category-symbol">
                                                            ✦
                                                        </span>

                                                        <strong>
                                                            {
                                                                category.name
                                                            }
                                                        </strong>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="prophecy-category-description">
                                                        {category.description ||
                                                            '—'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="display-order-badge">
                                                        {
                                                            category.displayOrder
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`category-status ${category.isActive
                                                            ? 'active'
                                                            : 'inactive'
                                                            }`}
                                                    >
                                                        <span>
                                                            ●
                                                        </span>
                                                        {category.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="prophecy-category-prophecy-count">
                                                        {category.prophecies?.length ??
                                                            0}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button
                                                            type="button"
                                                            className="admin-action-button edit"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    category
                                                                )
                                                            }
                                                            disabled={
                                                                actionCategoryId ===
                                                                category.id
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={`admin-action-button ${category.isActive
                                                                ? 'deactivate'
                                                                : 'activate'
                                                                }`}
                                                            onClick={() =>
                                                                requestStatusChange(
                                                                    category
                                                                )
                                                            }
                                                            disabled={
                                                                actionCategoryId ===
                                                                category.id
                                                            }
                                                        >
                                                            {actionCategoryId ===
                                                                category.id
                                                                ? 'Working...'
                                                                : category.isActive
                                                                    ? 'Deactivate'
                                                                    : 'Activate'}
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
                </div>
            </section>

            {formOpen && (
                <div
                    className="admin-modal-backdrop"
                    onMouseDown={
                        event => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeForm();
                            }
                        }
                    }
                >
                    <div
                        className="admin-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="prophecy-category-form-title"
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    {selectedYear
                                        ? `${selectedYear.year} Prophecies`
                                        : 'Prophecies'}
                                </span>

                                <h2 id="prophecy-category-form-title">
                                    {editingCategory
                                        ? 'Edit Category'
                                        : 'Add Category'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={
                                    closeForm
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
                                handleSubmit
                            }
                        >
                            <div className="admin-form-group">
                                <label htmlFor="prophecy-category-name">
                                    Category name
                                </label>

                                <input
                                    id="prophecy-category-name"
                                    type="text"
                                    value={
                                        form.name
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    name:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    maxLength={
                                        150
                                    }
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="prophecy-category-description">
                                    Description
                                </label>

                                <textarea
                                    id="prophecy-category-description"
                                    value={
                                        form.description
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    description:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    maxLength={
                                        500
                                    }
                                    rows={4}
                                    placeholder="Optional category description"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="prophecy-category-order">
                                    Display order
                                </label>

                                <input
                                    id="prophecy-category-order"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                        form.displayOrder
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    displayOrder:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    required
                                />
                            </div>

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={
                                        closeForm
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
                                        : editingCategory
                                            ? 'Save Changes'
                                            : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={
                    confirmationCategory !==
                    null
                }
                title={
                    confirmationCategory
                        ?.isActive
                        ? 'Deactivate Category'
                        : 'Activate Category'
                }
                message={
                    confirmationCategory
                        ? confirmationCategory
                            .isActive
                            ? `Are you sure you want to deactivate "${confirmationCategory.name}"? Its prophecies will no longer appear in the active public category list.`
                            : `Are you sure you want to activate "${confirmationCategory.name}"?`
                        : ''
                }
                confirmText={
                    confirmationCategory
                        ?.isActive
                        ? 'Deactivate'
                        : 'Activate'
                }
                loadingText={
                    confirmationCategory
                        ?.isActive
                        ? 'Deactivating...'
                        : 'Activating...'
                }
                variant={
                    confirmationCategory
                        ?.isActive
                        ? 'danger'
                        : 'success'
                }
                loading={
                    actionCategoryId !==
                    null
                }
                onConfirm={
                    confirmStatusChange
                }
                onCancel={
                    closeConfirmation
                }
            />
        </AdminLayout>
    );
}

export default ProphecyCategories;
