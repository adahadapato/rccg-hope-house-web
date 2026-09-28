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
} from '@/api/api';
import type { ApiErrorDetails } from '@/api/api';
import ApiErrorState from '@/components/sections/ApiErrorState';
import AdminLayout from '../components/AdminLayout';
import AdminActionButtons from '../components/AdminActionButtons';

import '../styles/admin.css';
import '../styles/annual-prayers.css';

interface AnnualPrayerPoint {
    id: string;
    text: string;
    displayOrder: number;
}

interface AnnualPrayer {
    id: string;
    year: number;
    theme: string;
    service: string;
    author: string;
    bibleReference: string;
    bibleText: string;
    declaration: string;
    closingVerse: string;
    imageUrl: string | null;
    isActive: boolean;
    prayerPoints: AnnualPrayerPoint[];
}

interface PrayerPointFormState {
    text: string;
}

interface AnnualPrayerFormState {
    year: string;
    theme: string;
    service: string;
    author: string;
    bibleReference: string;
    bibleText: string;
    declaration: string;
    closingVerse: string;
    imageUrl: string;
    isActive: boolean;
    prayerPoints: PrayerPointFormState[];
}

const currentCalendarYear =
    new Date().getFullYear();

const createEmptyForm =
    (): AnnualPrayerFormState => ({
        year: currentCalendarYear.toString(),
        theme: '',
        service: '',
        author: '',
        bibleReference: '',
        bibleText: '',
        declaration: '',
        closingVerse: '',
        imageUrl: '/prayers-image.jpg',
        isActive: true,
        prayerPoints: [
            {
                text: '',
            },
        ],
    });

function toApiErrorDetails(
    error: unknown
): ApiErrorDetails {
    if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        'message' in error
    ) {
        return error as ApiErrorDetails;
    }

    return getNetworkErrorDetails(error);
}

function AnnualPrayers() {
    const [
        annualPrayers,
        setAnnualPrayers,
    ] = useState<AnnualPrayer[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [retrying, setRetrying] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [
        loadError,
        setLoadError,
    ] = useState<ApiErrorDetails | null>(
        null
    );

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(null);

    const [formOpen, setFormOpen] =
        useState(false);

    const [
        editingPrayer,
        setEditingPrayer,
    ] = useState<AnnualPrayer | null>(
        null
    );

    const [form, setForm] =
        useState<AnnualPrayerFormState>(
            createEmptyForm
        );

    const sortedPrayers = useMemo(
        () =>
            [...annualPrayers].sort(
                (a, b) =>
                    b.year - a.year
            ),
        [annualPrayers]
    );

    const activePrayer = useMemo(
        () =>
            sortedPrayers.find(
                prayer =>
                    prayer.isActive
            ) ?? null,
        [sortedPrayers]
    );

    const loadAnnualPrayers =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/annual-prayers/admin',
                        { signal }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        `Unable to load annual prayers (${response.status}).`
                    );
                }

                const data:
                    AnnualPrayer[] =
                    await response.json();

                setAnnualPrayers(data);
            },
            []
        );

    useEffect(() => {
        const controller =
            new AbortController();

        async function initialise() {
            try {
                setError(null);
                setLoadError(null);

                await loadAnnualPrayers(
                    controller.signal
                );
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError' &&
                    !controller.signal.aborted
                ) {
                    setLoadError(
                        toApiErrorDetails(
                            err
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
        }

        void initialise();

        return () => {
            controller.abort();
        };
    }, [loadAnnualPrayers]);

    async function retryLoad():
        Promise<boolean> {
        setRetrying(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await loadAnnualPrayers();
            setLoadError(null);

            return true;
        } catch (err) {
            setLoadError(
                toApiErrorDetails(err)
            );

            return false;
        } finally {
            setRetrying(false);
        }
    }

    function openCreateForm() {
        const highestYear =
            sortedPrayers[0]?.year;

        const suggestedYear =
            highestYear &&
                highestYear >=
                currentCalendarYear
                ? highestYear + 1
                : currentCalendarYear;

        setEditingPrayer(null);

        setForm({
            ...createEmptyForm(),
            year:
                suggestedYear.toString(),
        });

        setError(null);
        setSuccessMessage(null);
        setFormOpen(true);
    }

    function openEditForm(
        prayer: AnnualPrayer
    ) {
        setEditingPrayer(prayer);

        setForm({
            year:
                prayer.year.toString(),
            theme: prayer.theme,
            service: prayer.service,
            author: prayer.author,
            bibleReference:
                prayer.bibleReference,
            bibleText:
                prayer.bibleText,
            declaration:
                prayer.declaration,
            closingVerse:
                prayer.closingVerse,
            imageUrl:
                prayer.imageUrl ?? '',
            isActive:
                prayer.isActive,
            prayerPoints:
                [...prayer.prayerPoints]
                    .sort(
                        (a, b) =>
                            a.displayOrder -
                            b.displayOrder
                    )
                    .map(point => ({
                        text: point.text,
                    })),
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
        setEditingPrayer(null);
        setForm(createEmptyForm());
    }

    function addPrayerPoint() {
        setForm(current => ({
            ...current,
            prayerPoints: [
                ...current.prayerPoints,
                {
                    text: '',
                },
            ],
        }));
    }

    function removePrayerPoint(
        index: number
    ) {
        setForm(current => {
            if (
                current.prayerPoints
                    .length <= 1
            ) {
                return current;
            }

            return {
                ...current,
                prayerPoints:
                    current.prayerPoints.filter(
                        (_, pointIndex) =>
                            pointIndex !==
                            index
                    ),
            };
        });
    }

    function updatePrayerPoint(
        index: number,
        text: string
    ) {
        setForm(current => ({
            ...current,
            prayerPoints:
                current.prayerPoints.map(
                    (
                        point,
                        pointIndex
                    ) =>
                        pointIndex === index
                            ? {
                                ...point,
                                text,
                            }
                            : point
                ),
        }));
    }

    function movePrayerPoint(
        index: number,
        direction: -1 | 1
    ) {
        setForm(current => {
            const targetIndex =
                index + direction;

            if (
                targetIndex < 0 ||
                targetIndex >=
                current.prayerPoints
                    .length
            ) {
                return current;
            }

            const prayerPoints = [
                ...current.prayerPoints,
            ];

            [
                prayerPoints[index],
                prayerPoints[targetIndex],
            ] = [
                    prayerPoints[targetIndex],
                    prayerPoints[index],
                ];

            return {
                ...current,
                prayerPoints,
            };
        });
    }

    async function handleSubmit(
        event:
            FormEvent<HTMLFormElement>
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

        if (!form.theme.trim()) {
            setError(
                'Theme is required.'
            );
            return;
        }

        if (!form.service.trim()) {
            setError(
                'Service is required.'
            );
            return;
        }

        if (!form.author.trim()) {
            setError(
                'Author is required.'
            );
            return;
        }

        if (
            !form.bibleReference.trim()
        ) {
            setError(
                'Bible reference is required.'
            );
            return;
        }

        if (!form.bibleText.trim()) {
            setError(
                'Bible text is required.'
            );
            return;
        }

        if (!form.declaration.trim()) {
            setError(
                'Declaration is required.'
            );
            return;
        }

        if (!form.closingVerse.trim()) {
            setError(
                'Closing verse is required.'
            );
            return;
        }

        if (
            form.prayerPoints.length ===
            0 ||
            form.prayerPoints.some(
                point =>
                    !point.text.trim()
            )
        ) {
            setError(
                'Every prayer point must contain text.'
            );
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const body = {
                year,
                theme:
                    form.theme.trim(),
                service:
                    form.service.trim(),
                author:
                    form.author.trim(),
                bibleReference:
                    form.bibleReference.trim(),
                bibleText:
                    form.bibleText.trim(),
                declaration:
                    form.declaration.trim(),
                closingVerse:
                    form.closingVerse.trim(),
                imageUrl:
                    form.imageUrl.trim() ||
                    null,
                isActive:
                    form.isActive,
                prayerPoints:
                    form.prayerPoints.map(
                        (
                            point,
                            index
                        ) => ({
                            text:
                                point.text.trim(),
                            displayOrder:
                                index + 1,
                        })
                    ),
            };

            const response =
                editingPrayer
                    ? await apiFetch(
                        `/api/annual-prayers/admin/${editingPrayer.id}`,
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
                        '/api/annual-prayers/admin',
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
                    (
                        await getApiErrorDetails(
                            response,
                            editingPrayer
                                ? 'Unable to update the annual prayer.'
                                : 'Unable to create the annual prayer.'
                        )
                    ).message
                );
            }

            setFormOpen(false);
            setEditingPrayer(null);
            setForm(
                createEmptyForm()
            );

            setSuccessMessage(
                editingPrayer
                    ? 'Annual prayer updated successfully.'
                    : 'Annual prayer created successfully.'
            );

            await loadAnnualPrayers();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save the annual prayer.'
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout>
            <section className="annual-prayers-admin-page">
                <div className="annual-prayers-admin-header">
                    <div>
                        <span className="admin-eyebrow">
                            Annual Content
                        </span>

                        <h1>
                            Prayer for the Year
                        </h1>

                        <p>
                            Manage the annual
                            prayer, scripture,
                            declaration and prayer
                            points displayed on the
                            Hope House website.
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
                        New Annual Prayer
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

                {loadError ? (
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
                        {!loading &&
                            activePrayer && (
                                <article className="annual-prayer-current-card annual-prayer-current-card-expanded">
                                    <div className="annual-prayer-current-summary">
                                        <div className="annual-prayer-current-year">
                                            <span>
                                                ACTIVE
                                            </span>

                                            <strong>
                                                {
                                                    activePrayer.year
                                                }
                                            </strong>
                                        </div>

                                        <div className="annual-prayer-current-content">
                                            <span className="admin-eyebrow">
                                                Prayer
                                                for the
                                                Year
                                            </span>

                                            <h2>
                                                {
                                                    activePrayer.theme
                                                }
                                            </h2>

                                            <p>
                                                {
                                                    activePrayer.service
                                                }
                                            </p>

                                            <strong>
                                                By{' '}
                                                {
                                                    activePrayer.author
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    activePrayer
                                                        .prayerPoints
                                                        .length
                                                }{' '}
                                                prayer{' '}
                                                {activePrayer
                                                    .prayerPoints
                                                    .length ===
                                                    1
                                                    ? 'point'
                                                    : 'points'}
                                            </small>
                                        </div>

                                        <AdminActionButtons
                                            itemName={`${activePrayer.year} annual prayer`}
                                            onEdit={() =>
                                                openEditForm(
                                                    activePrayer
                                                )
                                            }
                                            editTitle="Edit annual prayer"
                                        />
                                    </div>

                                    <div className="annual-prayer-current-details">
                                        <section className="annual-prayer-points-preview">
                                            <div className="annual-prayer-detail-heading">
                                                <span className="admin-eyebrow">
                                                    Prayer
                                                    Points
                                                </span>

                                                <h3>
                                                    Prayer
                                                    Points
                                                </h3>
                                            </div>

                                            <div className="annual-prayer-preview-list">
                                                {[
                                                    ...activePrayer.prayerPoints,
                                                ]
                                                    .sort(
                                                        (
                                                            a,
                                                            b
                                                        ) =>
                                                            a.displayOrder -
                                                            b.displayOrder
                                                    )
                                                    .map(
                                                        point => (
                                                            <div
                                                                key={
                                                                    point.id
                                                                }
                                                                className="annual-prayer-preview-point"
                                                            >
                                                                <span>
                                                                    {
                                                                        point.displayOrder
                                                                    }
                                                                </span>

                                                                <p>
                                                                    {
                                                                        point.text
                                                                    }
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                            </div>
                                        </section>

                                        <aside className="annual-prayer-scripture-preview">
                                            <div className="annual-prayer-detail-heading">
                                                <span className="admin-eyebrow">
                                                    Bible
                                                    Text
                                                </span>

                                                <h3>
                                                    {
                                                        activePrayer.bibleReference
                                                    }
                                                </h3>
                                            </div>

                                            <blockquote>
                                                &ldquo;
                                                {
                                                    activePrayer.bibleText
                                                }
                                                &rdquo;
                                            </blockquote>

                                            <div className="annual-prayer-declaration-preview">
                                                <strong>
                                                    Declaration
                                                </strong>

                                                <p>
                                                    {
                                                        activePrayer.declaration
                                                    }
                                                </p>
                                            </div>

                                            <div className="annual-prayer-closing-preview">
                                                <strong>
                                                    Closing
                                                    Verse
                                                </strong>

                                                <p>
                                                    {
                                                        activePrayer.closingVerse
                                                    }
                                                </p>
                                            </div>
                                        </aside>
                                    </div>
                                </article>
                            )}

                        <article className="admin-panel annual-prayers-history-panel">
                            <div className="annual-prayers-panel-heading">
                                <div>
                                    <h2>
                                        Annual Prayer
                                        History
                                    </h2>

                                    <p>
                                        Annual prayers
                                        stored in the
                                        database.
                                    </p>
                                </div>

                                <span className="annual-prayers-count">
                                    {
                                        annualPrayers.length
                                    }{' '}
                                    {annualPrayers.length ===
                                        1
                                        ? 'record'
                                        : 'records'}
                                </span>
                            </div>

                            {loading ? (
                                <div className="admin-empty-state">
                                    <div className="admin-loading-spinner" />

                                    <strong>
                                        Loading annual
                                        prayers...
                                    </strong>
                                </div>
                            ) : sortedPrayers.length ===
                                0 ? (
                                <div className="admin-empty-state">
                                    <strong>
                                        No annual
                                        prayers yet
                                    </strong>

                                    <p>
                                        Create the
                                        first Prayer
                                        for the Year.
                                    </p>

                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={
                                            openCreateForm
                                        }
                                    >
                                        New Annual
                                        Prayer
                                    </button>
                                </div>
                            ) : (
                                <div className="admin-table-wrapper">
                                    <table className="admin-data-table annual-prayers-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Year
                                                </th>

                                                <th>
                                                    Theme
                                                </th>

                                                <th>
                                                    Service
                                                </th>

                                                <th>
                                                    Prayer
                                                    Points
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
                                            {sortedPrayers.map(
                                                prayer => (
                                                    <tr
                                                        key={
                                                            prayer.id
                                                        }
                                                    >
                                                        <td>
                                                            <strong className="annual-prayers-year-cell">
                                                                {
                                                                    prayer.year
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            <div className="annual-prayers-title-cell">
                                                                <strong>
                                                                    {
                                                                        prayer.theme
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    By{' '}
                                                                    {
                                                                        prayer.author
                                                                    }
                                                                </small>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <div className="annual-prayers-service-cell">
                                                                {
                                                                    prayer.service
                                                                }
                                                            </div>
                                                        </td>

                                                        <td>
                                                            {
                                                                prayer
                                                                    .prayerPoints
                                                                    .length
                                                            }
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`annual-prayers-status ${prayer.isActive
                                                                    ? 'active'
                                                                    : 'inactive'
                                                                    }`}
                                                            >
                                                                {prayer.isActive
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <AdminActionButtons
                                                                itemName={`${prayer.year} annual prayer`}
                                                                onEdit={() =>
                                                                    openEditForm(
                                                                        prayer
                                                                    )
                                                                }
                                                                editTitle="Edit annual prayer"
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </article>
                    </>
                )}
            </section>

            {formOpen && (
                <div
                    className="admin-modal-backdrop annual-prayers-modal-backdrop"
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
                        className="admin-modal annual-prayers-editor-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="annual-prayer-form-title"
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    Annual Content
                                </span>

                                <h2 id="annual-prayer-form-title">
                                    {editingPrayer
                                        ? `Edit ${editingPrayer.year} Prayer`
                                        : 'New Prayer for the Year'}
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
                            <div className="annual-prayers-form-grid">
                                <div className="admin-form-group">
                                    <label htmlFor="annual-prayer-year">
                                        Year{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="annual-prayer-year"
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
                                        required
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="annual-prayer-theme">
                                        Theme{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="annual-prayer-theme"
                                        type="text"
                                        value={
                                            form.theme
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        theme:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="annual-prayers-form-grid">
                                <div className="admin-form-group">
                                    <label htmlFor="annual-prayer-service">
                                        Service{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="annual-prayer-service"
                                        type="text"
                                        value={
                                            form.service
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        service:
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
                                    <label htmlFor="annual-prayer-author">
                                        Author{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="annual-prayer-author"
                                        type="text"
                                        value={
                                            form.author
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        author:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="annual-prayer-bible-reference">
                                    Bible Reference{' '}
                                    <span>
                                        *
                                    </span>
                                </label>

                                <input
                                    id="annual-prayer-bible-reference"
                                    type="text"
                                    value={
                                        form.bibleReference
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    bibleReference:
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
                                <label htmlFor="annual-prayer-bible-text">
                                    Bible Text{' '}
                                    <span>
                                        *
                                    </span>
                                </label>

                                <textarea
                                    id="annual-prayer-bible-text"
                                    rows={5}
                                    value={
                                        form.bibleText
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    bibleText:
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
                                <label htmlFor="annual-prayer-declaration">
                                    Declaration{' '}
                                    <span>
                                        *
                                    </span>
                                </label>

                                <textarea
                                    id="annual-prayer-declaration"
                                    rows={4}
                                    value={
                                        form.declaration
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    declaration:
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
                                <label htmlFor="annual-prayer-closing-verse">
                                    Closing Verse{' '}
                                    <span>
                                        *
                                    </span>
                                </label>

                                <textarea
                                    id="annual-prayer-closing-verse"
                                    rows={3}
                                    value={
                                        form.closingVerse
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    closingVerse:
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
                                <label htmlFor="annual-prayer-image-url">
                                    Image URL
                                </label>

                                <input
                                    id="annual-prayer-image-url"
                                    type="text"
                                    value={
                                        form.imageUrl
                                    }
                                    onChange={
                                        event =>
                                            setForm(
                                                current => ({
                                                    ...current,
                                                    imageUrl:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                    }
                                    placeholder="/prayers-image.jpg"
                                />
                            </div>

                            <div className="annual-prayers-active-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={
                                            form.isActive
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        isActive:
                                                            event
                                                                .target
                                                                .checked,
                                                    })
                                                )
                                        }
                                    />

                                    <span>
                                        Set as the
                                        active Prayer
                                        for the Year
                                    </span>
                                </label>
                            </div>

                            <div className="annual-prayers-points-section">
                                <div className="annual-prayers-points-heading">
                                    <div>
                                        <h3>
                                            Prayer
                                            Points
                                        </h3>

                                        <p>
                                            The order
                                            below is
                                            the order
                                            shown on
                                            the
                                            website.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            addPrayerPoint
                                        }
                                    >
                                        ＋ Add Prayer
                                        Point
                                    </button>
                                </div>

                                <div className="annual-prayers-points-list">
                                    {form.prayerPoints.map(
                                        (
                                            point,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    index
                                                }
                                                className="annual-prayers-point-editor"
                                            >
                                                <div className="annual-prayers-point-number">
                                                    {
                                                        index +
                                                        1
                                                    }
                                                </div>

                                                <textarea
                                                    rows={
                                                        3
                                                    }
                                                    value={
                                                        point.text
                                                    }
                                                    onChange={
                                                        event =>
                                                            updatePrayerPoint(
                                                                index,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                    }
                                                    aria-label={`Prayer point ${index +
                                                        1
                                                        }`}
                                                    required
                                                />

                                                <div className="annual-prayers-point-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            movePrayerPoint(
                                                                index,
                                                                -1
                                                            )
                                                        }
                                                        disabled={
                                                            index ===
                                                            0
                                                        }
                                                        aria-label="Move prayer point up"
                                                    >
                                                        ↑
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            movePrayerPoint(
                                                                index,
                                                                1
                                                            )
                                                        }
                                                        disabled={
                                                            index ===
                                                            form
                                                                .prayerPoints
                                                                .length -
                                                            1
                                                        }
                                                        aria-label="Move prayer point down"
                                                    >
                                                        ↓
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="remove"
                                                        onClick={() =>
                                                            removePrayerPoint(
                                                                index
                                                            )
                                                        }
                                                        disabled={
                                                            form
                                                                .prayerPoints
                                                                .length <=
                                                            1
                                                        }
                                                        aria-label="Remove prayer point"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
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
                                        : editingPrayer
                                            ? 'Save Changes'
                                            : 'Create Annual Prayer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default AnnualPrayers;