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

import AdminActionButtons from '../components/AdminActionButtons';
import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/devotionals.css';

interface Devotional {
    id: string;
    devotionalDate: string;
    theme: string;
    scriptureReference: string;
    passageId: string;
    thought: string;
    commentaryPoints: string[];
    prayerPoints: string[];
    declaration: string;
    isPublished: boolean;
    publishedAt: string | null;
}

interface BibleBookReference {
    name: string;
    code: string;
    chapterVerseCounts: number[];
}

interface ScriptureSelection {
    bookCode: string;
    chapter: number;
    startVerse: number;
    endVerse: number;
}

interface DevotionalFormState {
    devotionalDate: string;
    theme: string;
    scriptureReference: string;
    passageId: string;
    thought: string;
    commentaryPoints: string[];
    prayerPoints: string[];
    declaration: string;
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

const emptyConfirmation: ConfirmationState = {
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: null,
};

function getTodayValue() {
    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, '0');

    const day =
        String(
            today.getDate()
        ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function createEmptyForm():
    DevotionalFormState {
    return {
        devotionalDate:
            getTodayValue(),
        theme: '',
        scriptureReference: '',
        passageId: '',
        thought: '',
        commentaryPoints: [
            '',
        ],
        prayerPoints: [
            '',
        ],
        declaration: '',
    };
}

function formatDate(
    value: string
) {
    const parts =
        value.split('-');

    if (parts.length !== 3) {
        return value;
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    ).format(date);
}

function getDateStatus(
    value: string
) {
    const today =
        getTodayValue();

    if (value === today) {
        return 'today';
    }

    if (value > today) {
        return 'future';
    }

    return 'past';
}

function Devotionals() {
    const [
        devotionals,
        setDevotionals,
    ] =
        useState<Devotional[]>([]);

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
        formOpen,
        setFormOpen,
    ] = useState(false);

    const [
        editingDevotional,
        setEditingDevotional,
    ] =
        useState<Devotional | null>(
            null
        );

    const [
        form,
        setForm,
    ] =
        useState<DevotionalFormState>(
            createEmptyForm
        );

    const [
        bibleBooks,
        setBibleBooks,
    ] = useState<BibleBookReference[]>([]);

    const [
        scriptureSelection,
        setScriptureSelection,
    ] = useState<ScriptureSelection>({
        bookCode: '',
        chapter: 1,
        startVerse: 1,
        endVerse: 1,
    });

    const [
        confirmation,
        setConfirmation,
    ] =
        useState<ConfirmationState>(
            emptyConfirmation
        );

    const selectedBibleBook =
        useMemo(
            () =>
                bibleBooks.find(
                    book =>
                        book.code ===
                        scriptureSelection.bookCode
                ) ?? null,
            [
                bibleBooks,
                scriptureSelection.bookCode,
            ]
        );

    const selectedChapterVerseCount =
        selectedBibleBook &&
            scriptureSelection.chapter >= 1 &&
            scriptureSelection.chapter <=
            selectedBibleBook.chapterVerseCounts.length
            ? selectedBibleBook
                .chapterVerseCounts[
            scriptureSelection.chapter - 1
            ]
            : 0;

    const chapterOptions =
        useMemo(
            () =>
                selectedBibleBook
                    ? Array.from(
                        {
                            length:
                                selectedBibleBook
                                    .chapterVerseCounts
                                    .length,
                        },
                        (_, index) =>
                            index + 1
                    )
                    : [],
            [selectedBibleBook]
        );

    const verseOptions =
        useMemo(
            () =>
                Array.from(
                    {
                        length:
                            selectedChapterVerseCount,
                    },
                    (_, index) =>
                        index + 1
                ),
            [selectedChapterVerseCount]
        );

    const sortedDevotionals =
        useMemo(
            () =>
                [
                    ...devotionals,
                ].sort(
                    (a, b) =>
                        b.devotionalDate
                            .localeCompare(
                                a.devotionalDate
                            )
                ),
            [
                devotionals,
            ]
        );

    const publishedCount =
        useMemo(
            () =>
                devotionals.filter(
                    devotional =>
                        devotional
                            .isPublished
                ).length,
            [
                devotionals,
            ]
        );

    const draftCount =
        devotionals.length -
        publishedCount;

    const futureCount =
        useMemo(
            () =>
                devotionals.filter(
                    devotional =>
                        getDateStatus(
                            devotional
                                .devotionalDate
                        ) === 'future'
                ).length,
            [
                devotionals,
            ]
        );

    const fetchDevotionals =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/devotionals/admin',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load devotionals.'
                    );
                }

                return (
                    await response.json()
                ) as Devotional[];
            },
            []
        );

    const fetchBibleReferenceData =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                const response =
                    await apiFetch(
                        '/api/bible/reference-data',
                        {
                            signal,
                        }
                    );

                if (!response.ok) {
                    throw await getApiErrorDetails(
                        response,
                        'Unable to load Bible reference data.'
                    );
                }

                return (
                    await response.json()
                ) as BibleBookReference[];
            },
            []
        );

   useEffect(() => {
        const controller =
            new AbortController();

        const initialise =
            async () => {
                try {
                    setLoading(true);

                    const [
                        devotionalData,
                        bibleReferenceData,
                    ] = await Promise.all([
                        fetchDevotionals(
                            controller.signal
                        ),
                        fetchBibleReferenceData(
                            controller.signal
                        ),
                    ]);

                    setDevotionals(
                        devotionalData
                    );

                    setBibleBooks(
                        bibleReferenceData
                    );

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
                            error as
                            ApiErrorDetails
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
    }, [
        fetchDevotionals,
        fetchBibleReferenceData,
    ]);

    async function retryLoad():
        Promise<boolean> {
        setRetrying(true);
        setActionError(null);

        try {
            const [
                devotionalData,
                bibleReferenceData,
            ] = await Promise.all([
                fetchDevotionals(),
                fetchBibleReferenceData(),
            ]);

            setDevotionals(
                devotionalData
            );

            setBibleBooks(
                bibleReferenceData
            );

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
                    error as
                    ApiErrorDetails
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

    async function refreshDevotionals() {
        setDevotionals(
            await fetchDevotionals()
        );
    }

    function openNewDevotional() {
        setEditingDevotional(
            null
        );

        setForm(
            createEmptyForm()
        );

        setScriptureSelection({
            bookCode: '',
            chapter: 1,
            startVerse: 1,
            endVerse: 1,
        });

        setFormOpen(true);
        setActionError(null);
    }

    function openEditDevotional(
        devotional: Devotional
    ) {
        setEditingDevotional(
            devotional
        );

        setForm({
            devotionalDate:
                devotional
                    .devotionalDate,
            theme:
                devotional.theme,
            scriptureReference:
                devotional
                    .scriptureReference,
            passageId:
                devotional.passageId,
            thought:
                devotional.thought,
            commentaryPoints:
                devotional
                    .commentaryPoints
                    .length > 0
                    ? [
                        ...devotional
                            .commentaryPoints,
                    ]
                    : [
                        '',
                    ],
            prayerPoints:
                devotional
                    .prayerPoints
                    .length > 0
                    ? [
                        ...devotional
                            .prayerPoints,
                    ]
                    : [
                        '',
                    ],
            declaration:
                devotional.declaration,
        });

        const passageMatch =
            devotional.passageId.match(
                /^([1-3A-Z]+)\.(\d+)\.(\d+)(?:-\1\.\2\.(\d+))?$/i
            );

        if (passageMatch) {
            const chapter =
                Number(passageMatch[2]);

            const startVerse =
                Number(passageMatch[3]);

            const endVerse =
                passageMatch[4]
                    ? Number(passageMatch[4])
                    : startVerse;

            setScriptureSelection({
                bookCode:
                    passageMatch[1]
                        .toUpperCase(),
                chapter,
                startVerse,
                endVerse,
            });
        } else {
            setScriptureSelection({
                bookCode: '',
                chapter: 1,
                startVerse: 1,
                endVerse: 1,
            });
        }

        setFormOpen(true);
        setActionError(null);
    }

    function closeForm() {
        if (saving) {
            return;
        }

        setFormOpen(false);

        setEditingDevotional(
            null
        );

        setForm(
            createEmptyForm()
        );

        setScriptureSelection({
            bookCode: '',
            chapter: 1,
            startVerse: 1,
            endVerse: 1,
        });
    }

    function updateCommentaryPoint(
        index: number,
        value: string
    ) {
        setForm(
            current => ({
                ...current,
                commentaryPoints:
                    current
                        .commentaryPoints
                        .map(
                            (
                                point,
                                pointIndex
                            ) =>
                                pointIndex ===
                                    index
                                    ? value
                                    : point
                        ),
            })
        );
    }

    function addCommentaryPoint() {
        setForm(
            current => ({
                ...current,
                commentaryPoints: [
                    ...current
                        .commentaryPoints,
                    '',
                ],
            })
        );
    }

    function removeCommentaryPoint(
        index: number
    ) {
        setForm(
            current => {
                if (
                    current
                        .commentaryPoints
                        .length <= 1
                ) {
                    return {
                        ...current,
                        commentaryPoints: [
                            '',
                        ],
                    };
                }

                return {
                    ...current,
                    commentaryPoints:
                        current
                            .commentaryPoints
                            .filter(
                                (
                                    _,
                                    pointIndex
                                ) =>
                                    pointIndex !==
                                    index
                            ),
                };
            }
        );
    }

    function updatePrayerPoint(
        index: number,
        value: string
    ) {
        setForm(
            current => ({
                ...current,
                prayerPoints:
                    current
                        .prayerPoints
                        .map(
                            (
                                point,
                                pointIndex
                            ) =>
                                pointIndex ===
                                    index
                                    ? value
                                    : point
                        ),
            })
        );
    }

    function addPrayerPoint() {
        setForm(
            current => ({
                ...current,
                prayerPoints: [
                    ...current
                        .prayerPoints,
                    '',
                ],
            })
        );
    }

    function removePrayerPoint(
        index: number
    ) {
        setForm(
            current => {
                if (
                    current
                        .prayerPoints
                        .length <= 1
                ) {
                    return {
                        ...current,
                        prayerPoints: [
                            '',
                        ],
                    };
                }

                return {
                    ...current,
                    prayerPoints:
                        current
                            .prayerPoints
                            .filter(
                                (
                                    _,
                                    pointIndex
                                ) =>
                                    pointIndex !==
                                    index
                            ),
                };
            }
        );
    }

    function updateScriptureSelection(
        next: ScriptureSelection
    ) {
        const book =
            bibleBooks.find(
                item =>
                    item.code ===
                    next.bookCode
            );

        if (!book) {
            setScriptureSelection(next);

            setForm(current => ({
                ...current,
                scriptureReference: '',
                passageId: '',
            }));

            return;
        }

        const verseCount =
            book.chapterVerseCounts[
            next.chapter - 1
            ] ?? 0;

        const startVerse =
            Math.min(
                Math.max(next.startVerse, 1),
                Math.max(verseCount, 1)
            );

        const endVerse =
            Math.min(
                Math.max(
                    next.endVerse,
                    startVerse
                ),
                Math.max(verseCount, 1)
            );

        const normalised = {
            ...next,
            startVerse,
            endVerse,
        };

        const scriptureReference =
            startVerse === endVerse
                ? `${book.name} ${next.chapter}:${startVerse}`
                : `${book.name} ${next.chapter}:${startVerse}-${endVerse}`;

        const passageId =
            startVerse === endVerse
                ? `${book.code}.${next.chapter}.${startVerse}`
                : `${book.code}.${next.chapter}.${startVerse}-${book.code}.${next.chapter}.${endVerse}`;

        setScriptureSelection(
            normalised
        );

        setForm(current => ({
            ...current,
            scriptureReference,
            passageId,
        }));
    }

    async function submitDevotional(
        event: FormEvent
    ) {
        event.preventDefault();

        setSaving(true);
        setActionError(null);

        try {
            if (
                !selectedBibleBook ||
                selectedChapterVerseCount < 1
            ) {
                throw new Error(
                    'Please select a valid Bible book and chapter.'
                );
            }

            if (
                scriptureSelection.startVerse < 1 ||
                scriptureSelection.endVerse <
                scriptureSelection.startVerse ||
                scriptureSelection.endVerse >
                selectedChapterVerseCount
            ) {
                throw new Error(
                    'Please select a valid scripture verse range.'
                );
            }

            const commentaryPoints =
                form.commentaryPoints
                    .map(
                        point =>
                            point.trim()
                    )
                    .filter(Boolean);

            const prayerPoints =
                form.prayerPoints
                    .map(
                        point =>
                            point.trim()
                    )
                    .filter(Boolean);

            if (
                commentaryPoints
                    .length === 0
            ) {
                throw new Error(
                    'At least one commentary paragraph is required.'
                );
            }

            if (
                prayerPoints
                    .length === 0
            ) {
                throw new Error(
                    'At least one prayer point is required.'
                );
            }

            const payload = {
                devotionalDate:
                    form
                        .devotionalDate,
                theme:
                    form.theme.trim(),
                scriptureReference:
                    form
                        .scriptureReference
                        .trim(),
                passageId:
                    form
                        .passageId
                        .trim(),
                thought:
                    form
                        .thought
                        .trim(),
                commentaryPoints,
                prayerPoints,
                declaration:
                    form
                        .declaration
                        .trim(),
            };

            if (
                editingDevotional
            ) {
                const response =
                    await apiFetch(
                        `/api/devotionals/admin/${editingDevotional.id}`,
                        {
                            method: 'PUT',
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
                        'Unable to update devotional.'
                    );
                }

                await refreshDevotionals();

                closeForm();

                showSuccess(
                    'Devotional updated successfully.'
                );

                return;
            }

            const response =
                await apiFetch(
                    '/api/devotionals/admin',
                    {
                        method: 'POST',
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
                    'Unable to create devotional.'
                );
            }

            await refreshDevotionals();

            closeForm();

            showSuccess(
                'Devotional created successfully.'
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : editingDevotional
                        ? 'Unable to update devotional.'
                        : 'Unable to create devotional.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestPublishToggle(
        devotional: Devotional
    ) {
        const publishing =
            !devotional.isPublished;

        setActionError(null);

        setConfirmation({
            open: true,

            title: publishing
                ? 'Publish devotional?'
                : 'Unpublish devotional?',

            message: publishing
                ? `Publish "${devotional.theme}"? It will become available publicly when its devotional date is reached.`
                : `Unpublish "${devotional.theme}"? It will no longer be available on the public website.`,

            confirmText:
                publishing
                    ? 'Publish'
                    : 'Unpublish',

            variant:
                publishing
                    ? 'success'
                    : 'warning',

            action: async () => {
                const response =
                    await apiFetch(
                        `/api/devotionals/admin/${devotional.id}/${publishing
                            ? 'publish'
                            : 'unpublish'
                        }`,
                        {
                            method:
                                'POST',
                        }
                    );

                if (!response.ok) {
                    await actionFailure(
                        response,
                        publishing
                            ? 'Unable to publish devotional.'
                            : 'Unable to unpublish devotional.'
                    );
                }

                await refreshDevotionals();

                showSuccess(
                    publishing
                        ? 'Devotional published successfully.'
                        : 'Devotional unpublished successfully.'
                );
            },
        });
    }

    function requestDelete(
        devotional: Devotional
    ) {
        setActionError(null);

        setConfirmation({
            open: true,
            title:
                'Delete devotional?',
            message:
                `Permanently delete "${devotional.theme}"? ` +
                'This action cannot be undone.',
            confirmText:
                'Delete',
            variant:
                'danger',

            action: async () => {
                const response =
                    await apiFetch(
                        `/api/devotionals/admin/${devotional.id}`,
                        {
                            method:
                                'DELETE',
                        }
                    );

                if (!response.ok) {
                    await actionFailure(
                        response,
                        'Unable to delete devotional.'
                    );
                }

                setDevotionals(
                    current =>
                        current.filter(
                            item =>
                                item.id !==
                                devotional.id
                        )
                );

                showSuccess(
                    'Devotional deleted successfully.'
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
            await confirmation
                .action();

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
            <div className="devotionals-admin">

                <div className="devotionals-admin-header">

                    <div>
                        <span className="devotionals-admin-eyebrow">
                            Ministries
                        </span>

                        <h1>
                            Daily Devotionals
                        </h1>

                        <p>
                            Create, edit,
                            schedule and publish
                            daily devotional
                            content.
                        </p>
                    </div>

                    {!loadError &&
                        !loading && (

                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openNewDevotional
                                }
                            >
                                <span>
                                    ＋
                                </span>

                                Add Devotional
                            </button>

                        )}

                </div>


                {actionError && (

                    <div className="devotionals-admin-alert devotionals-admin-alert-error">

                        <span>
                            !
                        </span>

                        <div>
                            <strong>
                                Something went wrong
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

                    <div className="devotionals-admin-alert devotionals-admin-alert-success">

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

                    <div className="devotionals-admin-panel devotionals-admin-empty">

                        <div className="admin-loading-spinner" />

                        <strong>
                            Loading devotionals...
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

                        <div className="devotionals-admin-stats">

                            <div className="devotionals-stat-card">

                                <div>
                                    <strong>
                                        {
                                            devotionals.length
                                        }
                                    </strong>

                                    <span>
                                        Total
                                    </span>
                                </div>

                            </div>


                            <div className="devotionals-stat-card">

                                <div>
                                    <strong>
                                        {
                                            publishedCount
                                        }
                                    </strong>

                                    <span>
                                        Published
                                    </span>
                                </div>

                            </div>


                            <div className="devotionals-stat-card">

                                <div>
                                    <strong>
                                        {
                                            draftCount
                                        }
                                    </strong>

                                    <span>
                                        Drafts
                                    </span>
                                </div>

                            </div>


                            <div className="devotionals-stat-card">

                                <div>
                                    <strong>
                                        {
                                            futureCount
                                        }
                                    </strong>

                                    <span>
                                        Future
                                    </span>
                                </div>

                            </div>

                        </div>


                        <section className="devotionals-admin-panel">

                            <div className="devotionals-panel-heading">

                                <div>
                                    <h2>
                                        Devotional Content
                                    </h2>

                                    <p>
                                        {
                                            devotionals.length
                                        }{' '}
                                        devotional
                                        {
                                            devotionals.length ===
                                                1
                                                ? ''
                                                : 's'
                                        }{' '}
                                        configured
                                    </p>
                                </div>

                            </div>


                            {sortedDevotionals
                                .length === 0 ? (

                                <div className="devotionals-admin-empty">

                                    <strong>
                                        No devotionals found
                                    </strong>

                                    <p>
                                        Create the first
                                        daily devotional.
                                    </p>

                                    <button
                                        type="button"
                                        className="admin-primary-button"
                                        onClick={
                                            openNewDevotional
                                        }
                                    >
                                        Add Devotional
                                    </button>

                                </div>

                            ) : (

                                <div className="devotionals-table-wrapper">

                                    <table className="devotionals-table">

                                        <thead>
                                            <tr>
                                                <th>
                                                    Date
                                                </th>

                                                <th>
                                                    Theme
                                                </th>

                                                <th>
                                                    Scripture
                                                </th>

                                                <th>
                                                    Schedule
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

                                            {sortedDevotionals.map(
                                                devotional => {
                                                    const dateStatus =
                                                        getDateStatus(
                                                            devotional
                                                                .devotionalDate
                                                        );

                                                    return (
                                                        <tr
                                                            key={
                                                                devotional.id
                                                            }
                                                        >

                                                            <td>
                                                                <strong>
                                                                    {
                                                                        formatDate(
                                                                            devotional
                                                                                .devotionalDate
                                                                        )
                                                                    }
                                                                </strong>
                                                            </td>


                                                            <td>
                                                                <div className="devotionals-theme-cell">

                                                                    <strong>
                                                                        {
                                                                            devotional.theme
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            devotional.thought
                                                                        }
                                                                    </span>

                                                                </div>
                                                            </td>


                                                            <td>
                                                                <div className="devotionals-scripture-cell">

                                                                    <strong>
                                                                        {
                                                                            devotional
                                                                                .scriptureReference
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            devotional
                                                                                .passageId
                                                                        }
                                                                    </span>

                                                                </div>
                                                            </td>


                                                            <td>
                                                                <span
                                                                    className={`devotionals-badge devotionals-badge-${dateStatus}`}
                                                                >
                                                                    {
                                                                        dateStatus ===
                                                                            'today'
                                                                            ? 'Today'
                                                                            : dateStatus ===
                                                                                'future'
                                                                                ? 'Future'
                                                                                : 'Past'
                                                                    }
                                                                </span>
                                                            </td>


                                                            <td>
                                                                <span
                                                                    className={`devotionals-badge ${devotional.isPublished
                                                                        ? 'devotionals-badge-published'
                                                                        : 'devotionals-badge-draft'
                                                                        }`}
                                                                >
                                                                    {
                                                                        devotional.isPublished
                                                                            ? 'Published'
                                                                            : 'Draft'
                                                                    }
                                                                </span>
                                                            </td>


                                                            <td>
                                                                <AdminActionButtons
                                                                    itemName={
                                                                        devotional.theme
                                                                    }
                                                                    isPublic={
                                                                        devotional
                                                                            .isPublished
                                                                    }
                                                                    onVisibilityToggle={() =>
                                                                        requestPublishToggle(
                                                                            devotional
                                                                        )
                                                                    }
                                                                    onEdit={() =>
                                                                        openEditDevotional(
                                                                            devotional
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        requestDelete(
                                                                            devotional
                                                                        )
                                                                    }
                                                                    makePublicTitle="Publish"
                                                                    makePrivateTitle="Unpublish"
                                                                    deleteTitle="Delete"
                                                                    disabled={
                                                                        confirming
                                                                    }
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


                {formOpen && (

                    <div
                        className="devotionals-modal-backdrop"
                        onMouseDown={
                            closeForm
                        }
                    >

                        <div
                            className="devotionals-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="devotional-form-title"
                            onMouseDown={
                                event =>
                                    event.stopPropagation()
                            }
                        >

                            <div className="devotionals-modal-header">

                                <div>
                                    <span>
                                        Daily Devotional
                                    </span>

                                    <h2 id="devotional-form-title">
                                        {
                                            editingDevotional
                                                ? 'Edit Devotional'
                                                : 'Add Devotional'
                                        }
                                    </h2>
                                </div>

                                <button
                                    type="button"
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
                                    submitDevotional
                                }
                            >

                                <div className="devotionals-form-grid">

                                    <label className="devotionals-field">

                                        <span>
                                            Devotional Date *
                                        </span>

                                        <input
                                            type="date"
                                            required
                                            value={
                                                form
                                                    .devotionalDate
                                            }
                                            onChange={
                                                event =>
                                                    setForm(
                                                        current => ({
                                                            ...current,
                                                            devotionalDate:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />

                                        <small>
                                            Future dates can
                                            be prepared in
                                            advance.
                                        </small>

                                    </label>


                                    <label className="devotionals-field">

                                        <span>
                                            Theme *
                                        </span>

                                        <input
                                            type="text"
                                            required
                                            maxLength={
                                                200
                                            }
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
                                            placeholder="e.g. DIVINE REPOSITIONING"
                                        />

                                    </label>


                                    <label className="devotionals-field">

                                        <span>
                                            Bible Book *
                                        </span>

                                        <select
                                            required
                                            value={
                                                scriptureSelection
                                                    .bookCode
                                            }
                                            onChange={event => {
                                                const bookCode =
                                                    event.target.value;

                                                updateScriptureSelection({
                                                    bookCode,
                                                    chapter: 1,
                                                    startVerse: 1,
                                                    endVerse: 1,
                                                });
                                            }}
                                        >
                                            <option value="">
                                                Select Bible book
                                            </option>

                                            {bibleBooks.map(
                                                book => (
                                                    <option
                                                        key={book.code}
                                                        value={book.code}
                                                    >
                                                        {book.name}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </label>


                                    <label className="devotionals-field">

                                        <span>
                                            Chapter *
                                        </span>

                                        <select
                                            required
                                            disabled={
                                                !selectedBibleBook
                                            }
                                            value={
                                                scriptureSelection
                                                    .chapter
                                            }
                                            onChange={event =>
                                                updateScriptureSelection({
                                                    ...scriptureSelection,
                                                    chapter:
                                                        Number(
                                                            event.target.value
                                                        ),
                                                    startVerse: 1,
                                                    endVerse: 1,
                                                })
                                            }
                                        >
                                            {chapterOptions.map(
                                                chapter => (
                                                    <option
                                                        key={chapter}
                                                        value={chapter}
                                                    >
                                                        {chapter}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </label>


                                    <label className="devotionals-field">

                                        <span>
                                            Start Verse *
                                        </span>

                                        <select
                                            required
                                            disabled={
                                                !selectedBibleBook ||
                                                selectedChapterVerseCount < 1
                                            }
                                            value={
                                                scriptureSelection
                                                    .startVerse
                                            }
                                            onChange={event => {
                                                const startVerse =
                                                    Number(
                                                        event.target.value
                                                    );

                                                updateScriptureSelection({
                                                    ...scriptureSelection,
                                                    startVerse,
                                                    endVerse:
                                                        Math.max(
                                                            scriptureSelection
                                                                .endVerse,
                                                            startVerse
                                                        ),
                                                });
                                            }}
                                        >
                                            {verseOptions.map(
                                                verse => (
                                                    <option
                                                        key={verse}
                                                        value={verse}
                                                    >
                                                        {verse}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </label>


                                    <label className="devotionals-field">

                                        <span>
                                            End Verse *
                                        </span>

                                        <select
                                            required
                                            disabled={
                                                !selectedBibleBook ||
                                                selectedChapterVerseCount < 1
                                            }
                                            value={
                                                scriptureSelection
                                                    .endVerse
                                            }
                                            onChange={event =>
                                                updateScriptureSelection({
                                                    ...scriptureSelection,
                                                    endVerse:
                                                        Number(
                                                            event.target.value
                                                        ),
                                                })
                                            }
                                        >
                                            {verseOptions
                                                .filter(
                                                    verse =>
                                                        verse >=
                                                        scriptureSelection
                                                            .startVerse
                                                )
                                                .map(verse => (
                                                    <option
                                                        key={verse}
                                                        value={verse}
                                                    >
                                                        {verse}
                                                    </option>
                                                ))}
                                        </select>

                                    </label>


                                    <div className="devotionals-field devotionals-field-wide">

                                        <span>
                                            Selected Scripture
                                        </span>

                                        <div className="devotionals-scripture-preview">
                                            {form.scriptureReference
                                                ? form.scriptureReference
                                                : 'Select a Bible book, chapter and verse range.'}
                                        </div>

                                        {form.passageId && (
                                            <small>
                                                Passage ID: {form.passageId}
                                            </small>
                                        )}

                                    </div>


                                    <label className="devotionals-field devotionals-field-wide">

                                        <span>
                                            Thought for the Day *
                                        </span>

                                        <textarea
                                            required
                                            rows={
                                                4
                                            }
                                            maxLength={
                                                2000
                                            }
                                            value={
                                                form.thought
                                            }
                                            onChange={
                                                event =>
                                                    setForm(
                                                        current => ({
                                                            ...current,
                                                            thought:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />

                                    </label>

                                </div>


                                <div className="devotionals-points-section">

                                    <div className="devotionals-points-heading">

                                        <div>
                                            <h3>
                                                Commentary
                                            </h3>

                                            <p>
                                                Add each
                                                commentary
                                                paragraph
                                                separately.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="devotionals-add-point-button"
                                            onClick={
                                                addCommentaryPoint
                                            }
                                        >
                                            ＋ Add Paragraph
                                        </button>

                                    </div>


                                    {form
                                        .commentaryPoints
                                        .map(
                                            (
                                                point,
                                                index
                                            ) => (

                                                <div
                                                    className="devotionals-point-row"
                                                    key={
                                                        index
                                                    }
                                                >

                                                    <span className="devotionals-point-number">
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </span>

                                                    <textarea
                                                        required
                                                        rows={
                                                            4
                                                        }
                                                        value={
                                                            point
                                                        }
                                                        onChange={
                                                            event =>
                                                                updateCommentaryPoint(
                                                                    index,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                        }
                                                        aria-label={`Commentary paragraph ${index + 1}`}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="devotionals-remove-point"
                                                        onClick={() =>
                                                            removeCommentaryPoint(
                                                                index
                                                            )
                                                        }
                                                        aria-label={`Remove commentary paragraph ${index + 1}`}
                                                        title="Remove paragraph"
                                                    >
                                                        ×
                                                    </button>

                                                </div>

                                            )
                                        )}

                                </div>


                                <div className="devotionals-points-section">

                                    <div className="devotionals-points-heading">

                                        <div>
                                            <h3>
                                                Prayer Points
                                            </h3>

                                            <p>
                                                Add each prayer
                                                point separately.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="devotionals-add-point-button"
                                            onClick={
                                                addPrayerPoint
                                            }
                                        >
                                            ＋ Add Prayer Point
                                        </button>

                                    </div>


                                    {form
                                        .prayerPoints
                                        .map(
                                            (
                                                point,
                                                index
                                            ) => (

                                                <div
                                                    className="devotionals-point-row"
                                                    key={
                                                        index
                                                    }
                                                >

                                                    <span className="devotionals-point-number">
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </span>

                                                    <textarea
                                                        required
                                                        rows={
                                                            3
                                                        }
                                                        value={
                                                            point
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
                                                        aria-label={`Prayer point ${index + 1}`}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="devotionals-remove-point"
                                                        onClick={() =>
                                                            removePrayerPoint(
                                                                index
                                                            )
                                                        }
                                                        aria-label={`Remove prayer point ${index + 1}`}
                                                        title="Remove prayer point"
                                                    >
                                                        ×
                                                    </button>

                                                </div>

                                            )
                                        )}

                                </div>


                                <div className="devotionals-form-grid">

                                    <label className="devotionals-field devotionals-field-wide">

                                        <span>
                                            Declaration *
                                        </span>

                                        <textarea
                                            required
                                            rows={
                                                4
                                            }
                                            maxLength={
                                                2000
                                            }
                                            value={
                                                form
                                                    .declaration
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
                                        />

                                    </label>

                                </div>


                                <div className="devotionals-modal-actions">

                                    <button
                                        type="button"
                                        className="devotionals-secondary-button"
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
                                        {
                                            saving
                                                ? 'Saving...'
                                                : editingDevotional
                                                    ? 'Save Changes'
                                                    : 'Create Devotional'
                                        }
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

export default Devotionals;