import {useCallback, useEffect, useState,} from 'react';

import type { FormEvent, } from 'react';

import { apiFetch } from '../../api/api';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin.css';

interface GalleryCategory {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    displayOrder: number;
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

function GalleryCategory() {
    const [
        categories,
        setCategories,
    ] = useState<GalleryCategory[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(null);

    const [
        formOpen,
        setFormOpen,
    ] = useState(false);

    const [
        editingCategory,
        setEditingCategory,
    ] = useState<GalleryCategory | null>(
        null
    );

    const [
        form,
        setForm,
    ] = useState<CategoryFormState>(
        emptyForm
    );

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        actionCategoryId,
        setActionCategoryId,
    ] = useState<string | null>(null);

    const loadCategories =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                try {
                    setError(null);

                    const response =
                        await apiFetch(
                            '/api/gallery-categories/admin/',
                            {
                                signal,
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Failed to load gallery categories (${response.status})`
                        );
                    }

                    const data:
                        GalleryCategory[] =
                        await response.json();

                    const ordered =
                        [...data].sort(
                            (a, b) =>
                                a.displayOrder -
                                b.displayOrder ||
                                a.name.localeCompare(
                                    b.name
                                )
                        );

                    setCategories(
                        ordered
                    );
                } catch (err) {
                    if (
                        (err as Error)
                            .name !==
                        'AbortError'
                    ) {
                        setError(
                            'Unable to load gallery categories. Please try again.'
                        );
                    }
                } finally {
                    if (
                        !signal?.aborted
                    ) {
                        setLoading(false);
                    }
                }
            },
            []
        );

    useEffect(() => {
        const controller =
            new AbortController();

        void loadCategories(
            controller.signal
        );

        return () => {
            controller.abort();
        };
    }, [loadCategories]);

    function openAddForm() {
        setEditingCategory(null);
        setForm(emptyForm);
        setError(null);
        setSuccessMessage(null);
        setFormOpen(true);
    }

    function openEditForm(
        category: GalleryCategory
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

        const name =
            form.name.trim();

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
                name,
                description:
                    form.description.trim() ||
                    null,
                displayOrder,
            };

            const response =
                editingCategory
                    ? await apiFetch(
                        `/api/gallery-categories/admin/${editingCategory.id}`,
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
                        '/api/gallery-categories/admin/',
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
                let message =
                    editingCategory
                        ? 'Unable to update the category.'
                        : 'Unable to create the category.';

                try {
                    const problem =
                        await response.json();

                    if (
                        typeof problem
                            ?.detail ===
                        'string'
                    ) {
                        message =
                            problem.detail;
                    } else if (
                        typeof problem
                            ?.title ===
                        'string'
                    ) {
                        message =
                            problem.title;
                    }
                } catch {
                    // Keep the default message.
                }

                throw new Error(
                    message
                );
            }

            setFormOpen(false);
            setEditingCategory(null);
            setForm(emptyForm);

            setSuccessMessage(
                editingCategory
                    ? 'Gallery category updated successfully.'
                    : 'Gallery category created successfully.'
            );

            await loadCategories();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save the gallery category.'
            );
        } finally {
            setSaving(false);
        }
    }

    async function changeStatus(
        category: GalleryCategory
    ) {
        const action =
            category.isActive
                ? 'deactivate'
                : 'activate';

        const confirmation =
            window.confirm(
                category.isActive
                    ? `Deactivate "${category.name}"? Existing gallery images will remain associated with this category.`
                    : `Reactivate "${category.name}"?`
            );

        if (!confirmation) {
            return;
        }

        setActionCategoryId(
            category.id
        );

        setError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/gallery-categories/admin/${category.id}/${action}`,
                    {
                        method: 'POST',
                    }
                );

            if (!response.ok) {
                throw new Error(
                    `Unable to ${action} the category.`
                );
            }

            setSuccessMessage(
                category.isActive
                    ? `"${category.name}" has been deactivated.`
                    : `"${category.name}" has been reactivated.`
            );

            await loadCategories();
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
            <section className="gallery-category-page">
                <div className="gallery-category-header">
                    <div>
                        <span className="admin-eyebrow">
                            Gallery Management
                        </span>

                        <h1>
                            Gallery Categories
                        </h1>

                        <p>
                            Create and manage the
                            categories used to
                            organise gallery
                            images.
                        </p>
                    </div>

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
                        {
                            successMessage
                        }
                    </div>
                )}

                <article className="admin-panel gallery-category-panel">
                    <div className="gallery-category-panel-header">
                        <div>
                            <h2>
                                Categories
                            </h2>

                            <p>
                                {
                                    categories.length
                                }{' '}
                                categor
                                {categories.length ===
                                    1
                                    ? 'y'
                                    : 'ies'}
                            </p>
                        </div>

                        <div className="gallery-category-summary">
                            <span>
                                {
                                    categories.filter(
                                        (
                                            category
                                        ) =>
                                            category.isActive
                                    ).length
                                }{' '}
                                active
                            </span>

                            <span>
                                {
                                    categories.filter(
                                        (
                                            category
                                        ) =>
                                            !category.isActive
                                    ).length
                                }{' '}
                                inactive
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-empty-state">
                            <div className="admin-loading-spinner" />

                            <strong>
                                Loading categories...
                            </strong>
                        </div>
                    ) : categories.length ===
                        0 ? (
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon">
                                ▧
                            </span>

                            <strong>
                                No gallery
                                categories yet
                            </strong>

                            <p>
                                Create your first
                                category to begin
                                organising gallery
                                images.
                            </p>

                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openAddForm
                                }
                            >
                                Add Category
                            </button>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-data-table">
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

                                        <th className="admin-table-actions-heading">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {categories.map(
                                        (
                                            category
                                        ) => (
                                            <tr
                                                key={
                                                    category.id
                                                }
                                                className={
                                                    !category.isActive
                                                        ? 'inactive-row'
                                                        : ''
                                                }
                                            >
                                                <td>
                                                    <div className="gallery-category-name">
                                                        <span className="gallery-category-icon">
                                                            ▧
                                                        </span>

                                                        <strong>
                                                            {
                                                                category.name
                                                            }
                                                        </strong>
                                                    </div>
                                                </td>

                                                <td className="gallery-category-description">
                                                    {category.description ||
                                                        '—'}
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
                                                        <span />

                                                        {category.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
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
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={`admin-action-button ${category.isActive
                                                                    ? 'deactivate'
                                                                    : 'activate'
                                                                }`}
                                                            disabled={
                                                                actionCategoryId ===
                                                                category.id
                                                            }
                                                            onClick={() =>
                                                                void changeStatus(
                                                                    category
                                                                )
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
                </article>
            </section>

            {formOpen && (
                <div
                    className="admin-modal-backdrop"
                    role="presentation"
                    onMouseDown={
                        closeForm
                    }
                >
                    <div
                        className="admin-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="gallery-category-modal-title"
                        onMouseDown={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    {editingCategory
                                        ? 'Edit Category'
                                        : 'New Category'}
                                </span>

                                <h2 id="gallery-category-modal-title">
                                    {editingCategory
                                        ? editingCategory.name
                                        : 'Add Gallery Category'}
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
                                <label htmlFor="category-name">
                                    Category Name
                                    <span>
                                        *
                                    </span>
                                </label>

                                <input
                                    id="category-name"
                                    type="text"
                                    value={
                                        form.name
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                name:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="e.g. Church Services"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="category-description">
                                    Description
                                </label>

                                <textarea
                                    id="category-description"
                                    value={
                                        form.description
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                description:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Briefly describe this gallery category"
                                    rows={4}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="category-display-order">
                                    Display Order
                                </label>

                                <input
                                    id="category-display-order"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                        form.displayOrder
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
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
                                    Lower numbers
                                    appear first.
                                </small>
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
                                            : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default GalleryCategory;