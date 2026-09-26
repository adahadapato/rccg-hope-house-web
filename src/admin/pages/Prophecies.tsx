import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import type { FormEvent } from 'react';

import { apiFetch } from '../../api/api';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin.css';
import '../styles/prophecies.css';

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

interface ProphecyYear {
    id: string;
    year: number;
    isPublished: boolean;
}

interface YearFormState {
    year: string;
}

interface CategoryFormState {
    name: string;
    description: string;
    displayOrder: string;
}

interface ProphecyFormState {
    text: string;
    displayOrder: string;
}

const emptyYearForm: YearFormState = { year: new Date().getFullYear().toString() };
const emptyCategoryForm: CategoryFormState = { name: '', description: '', displayOrder: '0' };
const emptyProphecyForm: ProphecyFormState = { text: '', displayOrder: '0' };

async function readProblem(response: Response, fallback: string) {
    try {
        const body = await response.json();
        if (typeof body?.detail === 'string') return body.detail;
        if (typeof body?.title === 'string') return body.title;
    } catch {
        // Keep fallback.
    }
    return fallback;
}

function Prophecies() {
    const [years, setYears] = useState<ProphecyYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
    const [categories, setCategories] = useState<ProphecyCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingContent, setLoadingContent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [actionKey, setActionKey] = useState<string | null>(null);

    const [yearFormOpen, setYearFormOpen] = useState(false);
    const [editingYear, setEditingYear] = useState<ProphecyYear | null>(null);
    const [yearForm, setYearForm] = useState<YearFormState>(emptyYearForm);
    const [savingYear, setSavingYear] = useState(false);

    const [categoryFormOpen, setCategoryFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProphecyCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
    const [savingCategory, setSavingCategory] = useState(false);

    const [prophecyFormOpen, setProphecyFormOpen] = useState(false);
    const [editingProphecy, setEditingProphecy] = useState<Prophecy | null>(null);
    const [prophecyCategoryId, setProphecyCategoryId] = useState<string | null>(null);
    const [prophecyForm, setProphecyForm] = useState<ProphecyFormState>(emptyProphecyForm);
    const [savingProphecy, setSavingProphecy] = useState(false);

    const selectedYear = useMemo(
        () => years.find(item => item.id === selectedYearId) ?? null,
        [years, selectedYearId]
    );

    const orderedCategories = useMemo(
        () => [...categories].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
        [categories]
    );

    const prophecyCount = useMemo(
        () => categories.reduce((total, category) => total + category.prophecies.length, 0),
        [categories]
    );

    const activeCategoryCount = useMemo(
        () => categories.filter(category => category.isActive).length,
        [categories]
    );

    const loadCategories = useCallback(async (prophecyYearId: string, signal?: AbortSignal) => {
        const response = await apiFetch(
            `/api/prophecies/admin/years/${prophecyYearId}/categories?activeOnly=false`,
            { signal }
        );

        if (!response.ok) {
            throw new Error(await readProblem(response, `Unable to load prophecy categories (${response.status}).`));
        }

        const data: ProphecyCategory[] = await response.json();
        return data.map(category => ({
            ...category,
            prophecies: [...(category.prophecies ?? [])].sort(
                (a, b) => a.displayOrder - b.displayOrder
            ),
        }));
    }, []);

    const loadYears = useCallback(async (preferredYearId?: string | null, signal?: AbortSignal) => {
        const response = await apiFetch('/api/prophecies/admin/years', { signal });
        if (!response.ok) {
            throw new Error(await readProblem(response, `Unable to load prophecy years (${response.status}).`));
        }

        const data: ProphecyYear[] = await response.json();
        const ordered = [...data].sort((a, b) => b.year - a.year);
        setYears(ordered);

        const nextId =
            (preferredYearId && ordered.some(item => item.id === preferredYearId)
                ? preferredYearId
                : null) ?? ordered[0]?.id ?? null;

        setSelectedYearId(nextId);
        return nextId;
    }, []);

    const refresh = useCallback(async (preferredYearId?: string | null) => {
        setError(null);
        const nextId = await loadYears(preferredYearId ?? selectedYearId);
        if (nextId) {
            setCategories(await loadCategories(nextId));
        } else {
            setCategories([]);
        }
    }, [loadCategories, loadYears, selectedYearId]);

    useEffect(() => {
        const controller = new AbortController();

        async function initialise() {
            try {
                setError(null);
                const yearId = await loadYears(null, controller.signal);
                if (yearId && !controller.signal.aborted) {
                    setCategories(await loadCategories(yearId, controller.signal));
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : 'Unable to load prophecies.');
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void initialise();
        return () => controller.abort();
    }, [loadCategories, loadYears]);

    async function selectYear(id: string) {
        if (id === selectedYearId) return;
        setSelectedYearId(id);
        setLoadingContent(true);
        setError(null);
        setSuccessMessage(null);
        try {
            setCategories(await loadCategories(id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load this prophecy year.');
        } finally {
            setLoadingContent(false);
        }
    }

    function openAddYear() {
        const nextYear = years.length ? Math.max(...years.map(item => item.year)) + 1 : new Date().getFullYear();
        setEditingYear(null);
        setYearForm({ year: nextYear.toString() });
        setError(null);
        setSuccessMessage(null);
        setYearFormOpen(true);
    }

    function openEditYear(year: ProphecyYear) {
        setEditingYear(year);
        setYearForm({ year: year.year.toString() });
        setError(null);
        setSuccessMessage(null);
        setYearFormOpen(true);
    }

    async function saveYear(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const year = Number.parseInt(yearForm.year, 10);
        if (Number.isNaN(year) || year < 1900 || year > 9999) {
            setError('Enter a valid four-digit year.');
            return;
        }

        setSavingYear(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = editingYear
                ? await apiFetch(`/api/prophecies/admin/years/${editingYear.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingYear.id, year }),
                })
                : await apiFetch('/api/prophecies/admin/years', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year }),
                });

            if (!response.ok) {
                throw new Error(await readProblem(response, editingYear ? 'Unable to update the prophecy year.' : 'Unable to create the prophecy year.'));
            }

            let preferredId = editingYear?.id ?? null;
            if (!editingYear) {
                try {
                    const created = await response.json();
                    if (typeof created?.id === 'string') preferredId = created.id;
                } catch {
                    // Refresh will select newest year.
                }
            }

            setYearFormOpen(false);
            setEditingYear(null);
            setSuccessMessage(editingYear ? 'Prophecy year updated successfully.' : 'Prophecy year created successfully.');
            await refresh(preferredId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save the prophecy year.');
        } finally {
            setSavingYear(false);
        }
    }

    async function toggleYearPublication(year: ProphecyYear) {
        const action = year.isPublished ? 'unpublish' : 'publish';
        if (!window.confirm(year.isPublished
            ? `Unpublish ${year.year}? It will no longer be available on the public prophecy page.`
            : `Publish ${year.year}? Its active categories and prophecies will become publicly available.`)) return;

        setActionKey(`year-${year.id}`);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await apiFetch(`/api/prophecies/admin/years/${year.id}/${action}`, { method: 'POST' });
            if (!response.ok) throw new Error(await readProblem(response, `Unable to ${action} ${year.year}.`));
            setSuccessMessage(`${year.year} has been ${year.isPublished ? 'unpublished' : 'published'}.`);
            await refresh(year.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Unable to ${action} the prophecy year.`);
        } finally {
            setActionKey(null);
        }
    }

    function openAddCategory() {
        if (!selectedYear) return;
        const nextOrder = categories.length ? Math.max(...categories.map(item => item.displayOrder)) + 1 : 0;
        setEditingCategory(null);
        setCategoryForm({ ...emptyCategoryForm, displayOrder: nextOrder.toString() });
        setError(null);
        setSuccessMessage(null);
        setCategoryFormOpen(true);
    }

    function openEditCategory(category: ProphecyCategory) {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            description: category.description ?? '',
            displayOrder: category.displayOrder.toString(),
        });
        setError(null);
        setSuccessMessage(null);
        setCategoryFormOpen(true);
    }

    async function saveCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedYear) return;
        const name = categoryForm.name.trim();
        const displayOrder = Number.parseInt(categoryForm.displayOrder, 10);
        if (!name) {
            setError('Category name is required.');
            return;
        }
        if (Number.isNaN(displayOrder) || displayOrder < 0) {
            setError('Display order must be zero or greater.');
            return;
        }

        setSavingCategory(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const body = {
                ...(editingCategory ? { id: editingCategory.id } : {}),
                prophecyYearId: selectedYear.id,
                name,
                description: categoryForm.description.trim() || null,
                displayOrder,
            };
            const response = editingCategory
                ? await apiFetch(`/api/prophecies/admin/categories/${editingCategory.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                })
                : await apiFetch('/api/prophecies/admin/categories', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                });

            if (!response.ok) throw new Error(await readProblem(response, editingCategory ? 'Unable to update the category.' : 'Unable to create the category.'));
            setCategoryFormOpen(false);
            setEditingCategory(null);
            setSuccessMessage(editingCategory ? 'Prophecy category updated successfully.' : 'Prophecy category created successfully.');
            await refresh(selectedYear.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save the prophecy category.');
        } finally {
            setSavingCategory(false);
        }
    }

    async function toggleCategory(category: ProphecyCategory) {
        const action = category.isActive ? 'deactivate' : 'activate';
        if (!window.confirm(`${category.isActive ? 'Deactivate' : 'Activate'} "${category.name}"?`)) return;
        setActionKey(`category-${category.id}`);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await apiFetch(`/api/prophecies/admin/categories/${category.id}/${action}`, { method: 'POST' });
            if (!response.ok) throw new Error(await readProblem(response, `Unable to ${action} the category.`));
            setSuccessMessage(`"${category.name}" has been ${category.isActive ? 'deactivated' : 'activated'}.`);
            await refresh(selectedYearId);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Unable to ${action} the category.`);
        } finally {
            setActionKey(null);
        }
    }

    function openAddProphecy(category: ProphecyCategory) {
        const nextOrder = category.prophecies.length ? Math.max(...category.prophecies.map(item => item.displayOrder)) + 1 : 0;
        setEditingProphecy(null);
        setProphecyCategoryId(category.id);
        setProphecyForm({ text: '', displayOrder: nextOrder.toString() });
        setError(null);
        setSuccessMessage(null);
        setProphecyFormOpen(true);
    }

    function openEditProphecy(prophecy: Prophecy) {
        setEditingProphecy(prophecy);
        setProphecyCategoryId(prophecy.categoryId);
        setProphecyForm({ text: prophecy.text, displayOrder: prophecy.displayOrder.toString() });
        setError(null);
        setSuccessMessage(null);
        setProphecyFormOpen(true);
    }

    async function saveProphecy(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!prophecyCategoryId) return;
        const text = prophecyForm.text.trim();
        const displayOrder = Number.parseInt(prophecyForm.displayOrder, 10);
        if (!text) {
            setError('Prophecy text is required.');
            return;
        }
        if (Number.isNaN(displayOrder) || displayOrder < 0) {
            setError('Display order must be zero or greater.');
            return;
        }

        setSavingProphecy(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const body = {
                ...(editingProphecy ? { id: editingProphecy.id } : {}),
                categoryId: prophecyCategoryId,
                text,
                displayOrder,
            };
            const response = editingProphecy
                ? await apiFetch(`/api/prophecies/admin/items/${editingProphecy.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                })
                : await apiFetch('/api/prophecies/admin/items', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                });

            if (!response.ok) throw new Error(await readProblem(response, editingProphecy ? 'Unable to update the prophecy.' : 'Unable to create the prophecy.'));
            setProphecyFormOpen(false);
            setEditingProphecy(null);
            setProphecyCategoryId(null);
            setSuccessMessage(editingProphecy ? 'Prophecy updated successfully.' : 'Prophecy created successfully.');
            await refresh(selectedYearId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save the prophecy.');
        } finally {
            setSavingProphecy(false);
        }
    }

    async function toggleProphecy(prophecy: Prophecy) {
        const action = prophecy.isActive ? 'deactivate' : 'activate';
        if (!window.confirm(`${prophecy.isActive ? 'Deactivate' : 'Activate'} this prophecy?`)) return;
        setActionKey(`prophecy-${prophecy.id}`);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await apiFetch(`/api/prophecies/admin/items/${prophecy.id}/${action}`, { method: 'POST' });
            if (!response.ok) throw new Error(await readProblem(response, `Unable to ${action} the prophecy.`));
            setSuccessMessage(`Prophecy ${prophecy.isActive ? 'deactivated' : 'activated'} successfully.`);
            await refresh(selectedYearId);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Unable to ${action} the prophecy.`);
        } finally {
            setActionKey(null);
        }
    }

    return (
        <AdminLayout>
            <section className="prophecies-admin-page">
                <div className="prophecies-admin-header">
                    <div>
                        <span className="admin-eyebrow">Content Management</span>
                        <h1>Prophecies</h1>
                        <p>Manage yearly RCCG prophetic declarations, categories and individual prophecy statements.</p>
                    </div>
                    <button type="button" className="admin-primary-button" onClick={openAddYear}>
                        <span>＋</span> Add Year
                    </button>
                </div>

                {error && <div className="admin-message admin-message-error" role="alert">{error}</div>}
                {successMessage && <div className="admin-message admin-message-success" role="status">{successMessage}</div>}

                {loading ? (
                    <article className="admin-panel prophecy-loading-panel">
                        <div className="admin-empty-state"><div className="admin-loading-spinner" /><strong>Loading prophecies...</strong></div>
                    </article>
                ) : years.length === 0 ? (
                    <article className="admin-panel">
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon">✦</span>
                            <strong>No prophecy years yet</strong>
                            <p>Create the first year, then add categories and prophecy statements.</p>
                            <button type="button" className="admin-primary-button" onClick={openAddYear}>Add Prophecy Year</button>
                        </div>
                    </article>
                ) : (
                    <>
                        <div className="prophecy-year-tabs" aria-label="Prophecy years">
                            {years.map(year => (
                                <button
                                    type="button"
                                    key={year.id}
                                    className={`prophecy-year-tab ${selectedYearId === year.id ? 'active' : ''}`}
                                    onClick={() => void selectYear(year.id)}
                                >
                                    <strong>{year.year}</strong>
                                    <span className={year.isPublished ? 'published' : 'draft'}>{year.isPublished ? 'Published' : 'Draft'}</span>
                                </button>
                            ))}
                        </div>

                        {selectedYear && (
                            <>
                                <div className="prophecy-summary-grid">
                                    <div className="prophecy-summary-card"><span>◷</span><div><strong>{selectedYear.year}</strong><small>Selected Year</small></div></div>
                                    <div className="prophecy-summary-card"><span>▤</span><div><strong>{categories.length}</strong><small>Categories</small></div></div>
                                    <div className="prophecy-summary-card"><span>✦</span><div><strong>{prophecyCount}</strong><small>Prophecies</small></div></div>
                                    <div className="prophecy-summary-card"><span>●</span><div><strong>{activeCategoryCount}</strong><small>Active Categories</small></div></div>
                                </div>

                                <article className="admin-panel prophecy-year-panel">
                                    <div className="prophecy-year-panel-header">
                                        <div>
                                            <div className="prophecy-year-title-row">
                                                <h2>RCCG Prophecies {selectedYear.year}</h2>
                                                <span className={`prophecy-publication-badge ${selectedYear.isPublished ? 'published' : 'draft'}`}>
                                                    {selectedYear.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <p>{selectedYear.isPublished ? 'This year is available to visitors on the public website.' : 'This year is not yet visible on the public website.'}</p>
                                        </div>
                                        <div className="prophecy-year-actions">
                                            <button type="button" className="admin-secondary-button" onClick={() => openEditYear(selectedYear)}>Edit Year</button>
                                            <button
                                                type="button"
                                                className={`admin-action-button ${selectedYear.isPublished ? 'deactivate' : 'activate'}`}
                                                disabled={actionKey === `year-${selectedYear.id}`}
                                                onClick={() => void toggleYearPublication(selectedYear)}
                                            >
                                                {actionKey === `year-${selectedYear.id}` ? 'Working...' : selectedYear.isPublished ? 'Unpublish' : 'Publish'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="prophecy-category-toolbar">
                                        <div><h3>Categories & Prophecies</h3><p>Lower display-order numbers appear first on the public page.</p></div>
                                        <button type="button" className="admin-primary-button" onClick={openAddCategory}><span>＋</span> Add Category</button>
                                    </div>

                                    {loadingContent ? (
                                        <div className="admin-empty-state"><div className="admin-loading-spinner" /><strong>Loading {selectedYear.year}...</strong></div>
                                    ) : orderedCategories.length === 0 ? (
                                        <div className="admin-empty-state">
                                            <span className="admin-empty-icon">▤</span>
                                            <strong>No categories for {selectedYear.year}</strong>
                                            <p>Add a category before adding individual prophecy statements.</p>
                                            <button type="button" className="admin-primary-button" onClick={openAddCategory}>Add Category</button>
                                        </div>
                                    ) : (
                                        <div className="prophecy-category-list">
                                            {orderedCategories.map(category => (
                                                <section key={category.id} className={`prophecy-category-card ${!category.isActive ? 'inactive' : ''}`}>
                                                    <div className="prophecy-category-header">
                                                        <div className="prophecy-category-heading">
                                                            <span className="prophecy-order-badge">{category.displayOrder}</span>
                                                            <div>
                                                                <div className="prophecy-category-name-row">
                                                                    <h3>{category.name}</h3>
                                                                    <span className={`category-status ${category.isActive ? 'active' : 'inactive'}`}><span />{category.isActive ? 'Active' : 'Inactive'}</span>
                                                                </div>
                                                                {category.description && <p>{category.description}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="prophecy-category-actions">
                                                            <button type="button" className="admin-action-button edit" onClick={() => openEditCategory(category)}>Edit</button>
                                                            <button
                                                                type="button"
                                                                className={`admin-action-button ${category.isActive ? 'deactivate' : 'activate'}`}
                                                                disabled={actionKey === `category-${category.id}`}
                                                                onClick={() => void toggleCategory(category)}
                                                            >
                                                                {actionKey === `category-${category.id}` ? 'Working...' : category.isActive ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                            <button type="button" className="admin-primary-button prophecy-small-primary" onClick={() => openAddProphecy(category)}>＋ Add Prophecy</button>
                                                        </div>
                                                    </div>

                                                    {category.prophecies.length === 0 ? (
                                                        <div className="prophecy-empty-category">No prophecy statements have been added to this category.</div>
                                                    ) : (
                                                        <div className="prophecy-item-list">
                                                            {category.prophecies.map((prophecy, index) => (
                                                                <div key={prophecy.id} className={`prophecy-admin-item ${!prophecy.isActive ? 'inactive' : ''}`}>
                                                                    <span className="prophecy-item-number">{String(index + 1).padStart(2, '0')}</span>
                                                                    <div className="prophecy-item-content">
                                                                        <p>{prophecy.text}</p>
                                                                        <div className="prophecy-item-meta">
                                                                            <span>Display order: {prophecy.displayOrder}</span>
                                                                            <span className={prophecy.isActive ? 'active-text' : 'inactive-text'}>{prophecy.isActive ? 'Active' : 'Inactive'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="prophecy-item-actions">
                                                                        <button type="button" className="admin-action-button edit" onClick={() => openEditProphecy(prophecy)}>Edit</button>
                                                                        <button
                                                                            type="button"
                                                                            className={`admin-action-button ${prophecy.isActive ? 'deactivate' : 'activate'}`}
                                                                            disabled={actionKey === `prophecy-${prophecy.id}`}
                                                                            onClick={() => void toggleProphecy(prophecy)}
                                                                        >
                                                                            {actionKey === `prophecy-${prophecy.id}` ? 'Working...' : prophecy.isActive ? 'Deactivate' : 'Activate'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </section>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            </>
                        )}
                    </>
                )}
            </section>

            {yearFormOpen && (
                <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !savingYear && setYearFormOpen(false)}>
                    <div className="admin-modal prophecy-compact-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
                        <div className="admin-modal-header"><div><span className="admin-eyebrow">{editingYear ? 'Edit Year' : 'New Year'}</span><h2>{editingYear ? `Edit ${editingYear.year}` : 'Add Prophecy Year'}</h2></div><button type="button" className="admin-modal-close" disabled={savingYear} onClick={() => setYearFormOpen(false)}>×</button></div>
                        <form onSubmit={saveYear}>
                            <div className="admin-form-group"><label htmlFor="prophecy-year">Year <span>*</span></label><input id="prophecy-year" type="number" min="1900" max="9999" step="1" value={yearForm.year} onChange={event => setYearForm({ year: event.target.value })} required autoFocus /><small>New years are created as drafts until you publish them.</small></div>
                            <div className="admin-modal-actions"><button type="button" className="admin-secondary-button" disabled={savingYear} onClick={() => setYearFormOpen(false)}>Cancel</button><button type="submit" className="admin-primary-button" disabled={savingYear}>{savingYear ? 'Saving...' : editingYear ? 'Save Changes' : 'Create Year'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {categoryFormOpen && selectedYear && (
                <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !savingCategory && setCategoryFormOpen(false)}>
                    <div className="admin-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
                        <div className="admin-modal-header"><div><span className="admin-eyebrow">{editingCategory ? 'Edit Category' : `${selectedYear.year} Prophecies`}</span><h2>{editingCategory ? editingCategory.name : 'Add Prophecy Category'}</h2></div><button type="button" className="admin-modal-close" disabled={savingCategory} onClick={() => setCategoryFormOpen(false)}>×</button></div>
                        <form onSubmit={saveCategory}>
                            <div className="admin-form-group"><label htmlFor="prophecy-category-name">Category Name <span>*</span></label><input id="prophecy-category-name" type="text" value={categoryForm.name} onChange={event => setCategoryForm(current => ({ ...current, name: event.target.value }))} placeholder="e.g. For Nigeria" required autoFocus /></div>
                            <div className="admin-form-group"><label htmlFor="prophecy-category-description">Description</label><textarea id="prophecy-category-description" rows={3} value={categoryForm.description} onChange={event => setCategoryForm(current => ({ ...current, description: event.target.value }))} placeholder="Short subtitle shown with this category" /></div>
                            <div className="admin-form-group"><label htmlFor="prophecy-category-order">Display Order</label><input id="prophecy-category-order" type="number" min="0" step="1" value={categoryForm.displayOrder} onChange={event => setCategoryForm(current => ({ ...current, displayOrder: event.target.value }))} required /><small>Lower numbers appear first.</small></div>
                            <div className="admin-modal-actions"><button type="button" className="admin-secondary-button" disabled={savingCategory} onClick={() => setCategoryFormOpen(false)}>Cancel</button><button type="submit" className="admin-primary-button" disabled={savingCategory}>{savingCategory ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {prophecyFormOpen && prophecyCategoryId && (
                <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => !savingProphecy && setProphecyFormOpen(false)}>
                    <div className="admin-modal prophecy-item-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
                        <div className="admin-modal-header"><div><span className="admin-eyebrow">{editingProphecy ? 'Edit Prophecy' : 'New Prophecy'}</span><h2>{editingProphecy ? 'Edit Prophecy Statement' : 'Add Prophecy Statement'}</h2></div><button type="button" className="admin-modal-close" disabled={savingProphecy} onClick={() => setProphecyFormOpen(false)}>×</button></div>
                        <form onSubmit={saveProphecy}>
                            <div className="admin-form-group"><label htmlFor="prophecy-text">Prophecy <span>*</span></label><textarea id="prophecy-text" rows={7} maxLength={4000} value={prophecyForm.text} onChange={event => setProphecyForm(current => ({ ...current, text: event.target.value }))} placeholder="Enter the prophecy exactly as it should appear on the website" required autoFocus /><small>{prophecyForm.text.length}/4000 characters</small></div>
                            <div className="admin-form-group"><label htmlFor="prophecy-order">Display Order</label><input id="prophecy-order" type="number" min="0" step="1" value={prophecyForm.displayOrder} onChange={event => setProphecyForm(current => ({ ...current, displayOrder: event.target.value }))} required /><small>Lower numbers appear first within the category.</small></div>
                            <div className="admin-modal-actions"><button type="button" className="admin-secondary-button" disabled={savingProphecy} onClick={() => setProphecyFormOpen(false)}>Cancel</button><button type="submit" className="admin-primary-button" disabled={savingProphecy}>{savingProphecy ? 'Saving...' : editingProphecy ? 'Save Changes' : 'Create Prophecy'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default Prophecies;
