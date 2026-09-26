import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';

import { apiFetch } from '@/api/api';
import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/themes-of-the-year.css';

interface ThemeOfTheYear {
    id: string;
    year: number;
    themeTitle: string;
    scriptureText: string;
    scriptureReference: string;
    primaryDescription: string;
    secondaryDescription: string | null;
    callToActionText: string | null;
}

interface ThemeFormState {
    year: string;
    themeTitle: string;
    scriptureText: string;
    scriptureReference: string;
    primaryDescription: string;
    secondaryDescription: string;
    callToActionText: string;
}

const currentCalendarYear =
    new Date().getFullYear();

const emptyForm: ThemeFormState = {
    year: currentCalendarYear.toString(),
    themeTitle: '',
    scriptureText: '',
    scriptureReference: '',
    primaryDescription: '',
    secondaryDescription: '',
    callToActionText: '',
};

async function readProblem(
    response: Response,
    fallback: string
) {
    try {
        const body = await response.json();

        if (typeof body?.detail === 'string') {
            return body.detail;
        }

        if (typeof body?.title === 'string') {
            return body.title;
        }

        if (body?.errors) {
            const messages = Object.values(
                body.errors
            )
                .flat()
                .filter(
                    (item): item is string =>
                        typeof item === 'string'
                );

            if (messages.length > 0) {
                return messages.join(' ');
            }
        }
    } catch {
        // Use fallback.
    }

    return fallback;
}

function ThemesOfTheYear() {
    const [themes, setThemes] =
        useState<ThemeOfTheYear[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(null);

    const [formOpen, setFormOpen] =
        useState(false);

    const [
        editingTheme,
        setEditingTheme,
    ] = useState<ThemeOfTheYear | null>(
        null
    );

    const [form, setForm] =
        useState<ThemeFormState>(
            emptyForm
        );

    const sortedThemes = useMemo(
        () =>
            [...themes].sort(
                (a, b) => b.year - a.year
            ),
        [themes]
    );

    const currentTheme = useMemo(
        () =>
            sortedThemes.find(
                theme =>
                    theme.year ===
                    currentCalendarYear
            ) ??
            sortedThemes[0] ??
            null,
        [sortedThemes]
    );

    const loadThemes = useCallback(
        async (signal?: AbortSignal) => {
            const response = await apiFetch(
                '/api/themes-of-the-year/admin',
                { signal }
            );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        `Unable to load themes (${response.status}).`
                    )
                );
            }

            const data: ThemeOfTheYear[] =
                await response.json();

            setThemes(data);
        },
        []
    );

    useEffect(() => {
        const controller =
            new AbortController();

        async function initialise() {
            try {
                setError(null);

                await loadThemes(
                    controller.signal
                );
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError' &&
                    !controller.signal.aborted
                ) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Unable to load themes.'
                    );
                }
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        }

        void initialise();

        return () => {
            controller.abort();
        };
    }, [loadThemes]);

    function openCreateForm() {
        const highestYear =
            sortedThemes[0]?.year;

        const suggestedYear =
            highestYear &&
                highestYear >=
                currentCalendarYear
                ? highestYear + 1
                : currentCalendarYear;

        setEditingTheme(null);

        setForm({
            ...emptyForm,
            year:
                suggestedYear.toString(),
        });

        setError(null);
        setSuccessMessage(null);
        setFormOpen(true);
    }

    function openEditForm(
        theme: ThemeOfTheYear
    ) {
        setEditingTheme(theme);

        setForm({
            year: theme.year.toString(),
            themeTitle:
                theme.themeTitle,
            scriptureText:
                theme.scriptureText,
            scriptureReference:
                theme.scriptureReference,
            primaryDescription:
                theme.primaryDescription,
            secondaryDescription:
                theme.secondaryDescription ??
                '',
            callToActionText:
                theme.callToActionText ??
                '',
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
        setEditingTheme(null);
        setForm(emptyForm);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const year =
            Number.parseInt(
                form.year,
                10
            );

        if (
            Number.isNaN(year) ||
            year < 2000 ||
            year > 2100
        ) {
            setError(
                'Year must be between 2000 and 2100.'
            );
            return;
        }

        if (!form.themeTitle.trim()) {
            setError(
                'Theme title is required.'
            );
            return;
        }

        if (!form.scriptureText.trim()) {
            setError(
                'Scripture text is required.'
            );
            return;
        }

        if (
            !form.scriptureReference.trim()
        ) {
            setError(
                'Scripture reference is required.'
            );
            return;
        }

        if (
            !form.primaryDescription.trim()
        ) {
            setError(
                'Primary description is required.'
            );
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const body = {
                year,
                themeTitle:
                    form.themeTitle.trim(),
                scriptureText:
                    form.scriptureText.trim(),
                scriptureReference:
                    form.scriptureReference.trim(),
                primaryDescription:
                    form.primaryDescription.trim(),
                secondaryDescription:
                    form.secondaryDescription.trim() ||
                    null,
                callToActionText:
                    form.callToActionText.trim() ||
                    null,
            };

            const response =
                editingTheme
                    ? await apiFetch(
                        `/api/themes-of-the-year/admin/${editingTheme.id}`,
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
                        '/api/themes-of-the-year/admin',
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
                        editingTheme
                            ? 'Unable to update the theme.'
                            : 'Unable to create the theme.'
                    )
                );
            }

            setFormOpen(false);
            setEditingTheme(null);
            setForm(emptyForm);

            setSuccessMessage(
                editingTheme
                    ? 'Theme updated successfully.'
                    : 'Theme created successfully.'
            );

            await loadThemes();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save the theme.'
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout>
            <section className="theme-admin-page">
                <div className="theme-admin-header">
                    <div>
                        <span className="admin-eyebrow">
                            Annual Theme
                        </span>

                        <h1>
                            Theme of the Year
                        </h1>

                        <p>
                            Manage the annual
                            theme displayed on the
                            Hope House website and
                            used to organise
                            Pastor&apos;s Corner
                            messages.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={
                            openCreateForm
                        }
                    >
                        <span>＋</span>
                        New Theme
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

                {!loading &&
                    currentTheme && (
                        <article className="theme-current-card">
                            <div className="theme-current-year">
                                <span>
                                    CURRENT
                                </span>

                                <strong>
                                    {
                                        currentTheme.year
                                    }
                                </strong>
                            </div>

                            <div className="theme-current-content">
                                <span className="admin-eyebrow">
                                    Current Theme
                                </span>

                                <h2>
                                    {
                                        currentTheme.themeTitle
                                    }
                                </h2>

                                <blockquote>
                                    &ldquo;
                                    {
                                        currentTheme.scriptureText
                                    }
                                    &rdquo;
                                </blockquote>

                                <strong className="theme-scripture-reference">
                                    {
                                        currentTheme.scriptureReference
                                    }
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                    openEditForm(
                                        currentTheme
                                    )
                                }
                            >
                                Edit Theme
                            </button>
                        </article>
                    )}

                <article className="admin-panel theme-history-panel">
                    <div className="theme-panel-heading">
                        <div>
                            <h2>
                                Theme History
                            </h2>

                            <p>
                                Annual themes stored
                                in the database.
                            </p>
                        </div>

                        <span className="theme-count">
                            {themes.length}{' '}
                            {themes.length === 1
                                ? 'theme'
                                : 'themes'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="admin-empty-state">
                            <div className="admin-loading-spinner" />

                            <strong>
                                Loading themes...
                            </strong>
                        </div>
                    ) : sortedThemes.length ===
                        0 ? (
                        <div className="admin-empty-state">
                            <strong>
                                No themes yet
                            </strong>

                            <p>
                                Create the first
                                Theme of the Year.
                            </p>

                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openCreateForm
                                }
                            >
                                New Theme
                            </button>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-data-table theme-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Year
                                        </th>

                                        <th>
                                            Theme
                                        </th>

                                        <th>
                                            Scripture
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
                                    {sortedThemes.map(
                                        theme => {
                                            const isCurrent =
                                                theme.id ===
                                                currentTheme
                                                    ?.id;

                                            return (
                                                <tr
                                                    key={
                                                        theme.id
                                                    }
                                                >
                                                    <td>
                                                        <strong className="theme-year-cell">
                                                            {
                                                                theme.year
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <div className="theme-title-cell">
                                                            <strong>
                                                                {
                                                                    theme.themeTitle
                                                                }
                                                            </strong>

                                                            <small>
                                                                {
                                                                    theme.primaryDescription
                                                                }
                                                            </small>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="theme-reference-cell">
                                                            <strong>
                                                                {
                                                                    theme.scriptureReference
                                                                }
                                                            </strong>

                                                            <small>
                                                                {
                                                                    theme.scriptureText
                                                                }
                                                            </small>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {isCurrent ? (
                                                            <span className="theme-status current">
                                                                Current
                                                            </span>
                                                        ) : theme.year >
                                                            currentCalendarYear ? (
                                                            <span className="theme-status future">
                                                                Future
                                                            </span>
                                                        ) : (
                                                            <span className="theme-status previous">
                                                                Previous
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="admin-action-button edit"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    theme
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>
            </section>

            {formOpen && (
                <div
                    className="admin-modal-backdrop theme-modal-backdrop"
                    onMouseDown={event => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeForm();
                        }
                    }}
                >
                    <div
                        className="admin-modal theme-editor-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="theme-form-title"
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    Annual Theme
                                </span>

                                <h2 id="theme-form-title">
                                    {editingTheme
                                        ? `Edit ${editingTheme.year} Theme`
                                        : 'New Theme of the Year'}
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
                            <div className="theme-form-grid">
                                <div className="admin-form-group theme-year-field">
                                    <label htmlFor="theme-year">
                                        Year{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="theme-year"
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={
                                            form.year
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        year:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                        disabled={
                                            Boolean(
                                                editingTheme
                                            )
                                        }
                                        required
                                    />

                                    {editingTheme && (
                                        <small>
                                            The year
                                            cannot be
                                            changed after
                                            creation.
                                        </small>
                                    )}
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="theme-title">
                                        Theme Title{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="theme-title"
                                        type="text"
                                        value={
                                            form.themeTitle
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        themeTitle:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                        placeholder="e.g. A Brand New Beginning"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="theme-scripture-reference">
                                    Scripture
                                    Reference{' '}
                                    <span>
                                        *
                                    </span>
                                </label>

                                <input
                                    id="theme-scripture-reference"
                                    type="text"
                                    value={
                                        form.scriptureReference
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    scriptureReference:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    placeholder="e.g. Isaiah 43:18-19 (NIV)"
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="theme-scripture-text">
                                    Scripture Text{' '}
                                    <span>
                                        *
                                    </span>
                                </label>

                                <textarea
                                    id="theme-scripture-text"
                                    rows={5}
                                    value={
                                        form.scriptureText
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    scriptureText:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="theme-primary-description">
                                    Primary
                                    Description{' '}
                                    <span>
                                        *
                                    </span>
                                </label>

                                <textarea
                                    id="theme-primary-description"
                                    rows={5}
                                    value={
                                        form.primaryDescription
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    primaryDescription:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="theme-secondary-description">
                                    Secondary
                                    Description
                                </label>

                                <textarea
                                    id="theme-secondary-description"
                                    rows={5}
                                    value={
                                        form.secondaryDescription
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    secondaryDescription:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="theme-call-to-action">
                                    Call to Action
                                </label>

                                <textarea
                                    id="theme-call-to-action"
                                    rows={3}
                                    value={
                                        form.callToActionText
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    callToActionText:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    placeholder="e.g. Join us as we embark on this transformative journey!"
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
                                        : editingTheme
                                            ? 'Save Changes'
                                            : 'Create Theme'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default ThemesOfTheYear;