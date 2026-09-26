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
import '../styles/sermons.css';

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

interface FirstPointDto {
    title: string;
    content: string | null;
    bullets: string[] | null;
}

interface PrefaceSectionDto {
    mainHeading: string;
    preamble: string;
    subHeading: string;
}

interface DetailedLessonDto {
    title: string;
    bullets: string[];
}

interface StructuredContentDto {
    firstPoints: FirstPointDto[] | null;
    prefaceSection: PrefaceSectionDto | null;
    detailedLessons: DetailedLessonDto[] | null;
}

interface PastorPost {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    category: number;
    introHeading: string | null;
    introText: string | null;
    structuredContent: StructuredContentDto | null;
    closingText: string | null;
    coverImageData: string | null;
    coverImageContentType: string | null;
    authorName: string;
    publishedDate: string;
    isPublished: boolean;
    isPinned: boolean;
    isFeatured: boolean;
    viewCount: number;
    bibleReference: string | null;
    themeOfTheYearId: string;
    themeTitle: string | null;
}

interface FirstPointForm {
    title: string;
    content: string;
    bullets: string;
}

interface DetailedLessonForm {
    title: string;
    bullets: string;
}

interface SermonFormState {
    title: string;
    content: string;
    excerpt: string;
    category: string;
    themeOfTheYearId: string;
    bibleReference: string;
    authorName: string;
    introHeading: string;
    introText: string;
    closingText: string;
    coverImageData: string | null;
    coverImageContentType: string | null;
    firstPoints: FirstPointForm[];
    prefaceMainHeading: string;
    prefacePreamble: string;
    prefaceSubHeading: string;
    detailedLessons: DetailedLessonForm[];
}

type FilterType =
    | 'all'
    | 'published'
    | 'draft'
    | 'pinned';

type ConfirmationAction =
    | 'publish'
    | 'unpublish'
    | 'pin'
    | 'unpin'
    | 'delete';

interface ConfirmationState {
    post: PastorPost;
    action: ConfirmationAction;
}

const categories = [
    { value: 1, label: 'Welcome' },
    { value: 2, label: 'Announcement' },
    { value: 3, label: 'Devotional' },
    { value: 4, label: 'Prophetic' },
    { value: 5, label: 'Event' },
    { value: 6, label: 'General' },
    { value: 7, label: 'Prayer' },
    { value: 8, label: 'Testimony' },
];

const emptyForm: SermonFormState = {
    title: '',
    content: '',
    excerpt: '',
    category: '3',
    themeOfTheYearId: '',
    bibleReference: '',
    authorName: 'Pastor',
    introHeading: '',
    introText: '',
    closingText: '',
    coverImageData: null,
    coverImageContentType: null,
    firstPoints: [],
    prefaceMainHeading: '',
    prefacePreamble: '',
    prefaceSubHeading: '',
    detailedLessons: [],
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
        // Keep fallback.
    }

    return fallback;
}

function categoryName(value: number) {
    return (
        categories.find(
            category =>
                category.value === value
        )?.label ?? 'General'
    );
}

function linesToArray(value: string) {
    const values = value
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);

    return values.length > 0
        ? values
        : null;
}

function Sermons() {
    const [posts, setPosts] =
        useState<PastorPost[]>([]);

    const [themes, setThemes] =
        useState<ThemeOfTheYear[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [actionPostId, setActionPostId] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const [filter, setFilter] =
        useState<FilterType>('all');

    const [search, setSearch] =
        useState('');

    const [formOpen, setFormOpen] =
        useState(false);

    const [editingPost, setEditingPost] =
        useState<PastorPost | null>(null);

    const [form, setForm] =
        useState<SermonFormState>(
            emptyForm
        );

    const [
        confirmation,
        setConfirmation,
    ] = useState<ConfirmationState | null>(
        null
    );

    const publishedCount = useMemo(
        () =>
            posts.filter(
                post => post.isPublished
            ).length,
        [posts]
    );

    const draftCount =
        posts.length - publishedCount;

    const pinnedCount = useMemo(
        () =>
            posts.filter(
                post => post.isPinned
            ).length,
        [posts]
    );

    const filteredPosts = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        return posts.filter(post => {
            const matchesFilter =
                filter === 'all' ||
                (filter === 'published' &&
                    post.isPublished) ||
                (filter === 'draft' &&
                    !post.isPublished) ||
                (filter === 'pinned' &&
                    post.isPinned);

            if (!matchesFilter) {
                return false;
            }

            if (!query) {
                return true;
            }

            return (
                post.title
                    .toLowerCase()
                    .includes(query) ||
                post.authorName
                    .toLowerCase()
                    .includes(query) ||
                (post.themeTitle ?? '')
                    .toLowerCase()
                    .includes(query) ||
                categoryName(post.category)
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [posts, filter, search]);

    const loadPosts = useCallback(
        async (signal?: AbortSignal) => {
            const response = await apiFetch(
                '/api/pastor-posts/admin/?includeDrafts=true',
                { signal }
            );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        `Unable to load sermons (${response.status}).`
                    )
                );
            }

            const data: PastorPost[] =
                await response.json();

            setPosts(data);
        },
        []
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

            setThemes(
                [...data].sort(
                    (a, b) => b.year - a.year
                )
            );
        },
        []
    );

    const refreshPosts = useCallback(
        async () => {
            await loadPosts();
        },
        [loadPosts]
    );

    useEffect(() => {
        const controller =
            new AbortController();

        async function initialise() {
            try {
                setError(null);

                await Promise.all([
                    loadPosts(controller.signal),
                    loadThemes(controller.signal),
                ]);
            } catch (err) {
                if (
                    (err as Error).name !==
                    'AbortError' &&
                    !controller.signal.aborted
                ) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Unable to load sermons.'
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
    }, [loadPosts, loadThemes]);

    function openAddForm() {
        setEditingPost(null);

        setForm({
            ...emptyForm,
            themeOfTheYearId:
                themes[0]?.id ?? '',
        });

        setError(null);
        setSuccessMessage(null);
        setFormOpen(true);
    }

    function openEditForm(
        post: PastorPost
    ) {
        setEditingPost(post);

        setForm({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt ?? '',
            category:
                post.category.toString(),
            themeOfTheYearId:
                post.themeOfTheYearId,
            bibleReference:
                post.bibleReference ?? '',
            authorName: post.authorName,
            introHeading:
                post.introHeading ?? '',
            introText:
                post.introText ?? '',
            closingText:
                post.closingText ?? '',
            coverImageData:
                post.coverImageData,
            coverImageContentType:
                post.coverImageContentType,

            firstPoints:
                post.structuredContent
                    ?.firstPoints?.map(
                        point => ({
                            title: point.title,
                            content:
                                point.content ?? '',
                            bullets:
                                point.bullets?.join(
                                    '\n'
                                ) ?? '',
                        })
                    ) ?? [],

            prefaceMainHeading:
                post.structuredContent
                    ?.prefaceSection
                    ?.mainHeading ?? '',

            prefacePreamble:
                post.structuredContent
                    ?.prefaceSection
                    ?.preamble ?? '',

            prefaceSubHeading:
                post.structuredContent
                    ?.prefaceSection
                    ?.subHeading ?? '',

            detailedLessons:
                post.structuredContent
                    ?.detailedLessons?.map(
                        lesson => ({
                            title: lesson.title,
                            bullets:
                                lesson.bullets.join(
                                    '\n'
                                ),
                        })
                    ) ?? [],
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
        setEditingPost(null);
        setForm(emptyForm);
    }

    function addFirstPoint() {
        setForm(current => ({
            ...current,
            firstPoints: [
                ...current.firstPoints,
                {
                    title: '',
                    content: '',
                    bullets: '',
                },
            ],
        }));
    }

    function updateFirstPoint(
        index: number,
        field: keyof FirstPointForm,
        value: string
    ) {
        setForm(current => ({
            ...current,
            firstPoints:
                current.firstPoints.map(
                    (point, pointIndex) =>
                        pointIndex === index
                            ? {
                                ...point,
                                [field]: value,
                            }
                            : point
                ),
        }));
    }

    function removeFirstPoint(
        index: number
    ) {
        setForm(current => ({
            ...current,
            firstPoints:
                current.firstPoints.filter(
                    (_, pointIndex) =>
                        pointIndex !== index
                ),
        }));
    }

    function addDetailedLesson() {
        setForm(current => ({
            ...current,
            detailedLessons: [
                ...current.detailedLessons,
                {
                    title: '',
                    bullets: '',
                },
            ],
        }));
    }

    function updateDetailedLesson(
        index: number,
        field: keyof DetailedLessonForm,
        value: string
    ) {
        setForm(current => ({
            ...current,
            detailedLessons:
                current.detailedLessons.map(
                    (
                        lesson,
                        lessonIndex
                    ) =>
                        lessonIndex === index
                            ? {
                                ...lesson,
                                [field]: value,
                            }
                            : lesson
                ),
        }));
    }

    function removeDetailedLesson(
        index: number
    ) {
        setForm(current => ({
            ...current,
            detailedLessons:
                current.detailedLessons.filter(
                    (_, lessonIndex) =>
                        lessonIndex !== index
                ),
        }));
    }

    async function handleCoverImage(
        file: File | null
    ) {
        if (!file) {
            return;
        }

        if (
            !file.type.startsWith(
                'image/'
            )
        ) {
            setError(
                'Please select a valid image file.'
            );
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const result =
                typeof reader.result ===
                    'string'
                    ? reader.result
                    : '';

            const commaIndex =
                result.indexOf(',');

            if (commaIndex < 0) {
                setError(
                    'Unable to read the selected image.'
                );
                return;
            }

            setForm(current => ({
                ...current,
                coverImageData:
                    result.substring(
                        commaIndex + 1
                    ),
                coverImageContentType:
                    file.type,
            }));
        };

        reader.onerror = () => {
            setError(
                'Unable to read the selected image.'
            );
        };

        reader.readAsDataURL(file);
    }

    function buildStructuredContent():
        StructuredContentDto | null {
        const firstPoints =
            form.firstPoints
                .map(point => ({
                    title:
                        point.title.trim(),
                    content:
                        point.content.trim() ||
                        null,
                    bullets:
                        linesToArray(
                            point.bullets
                        ),
                }))
                .filter(
                    point =>
                        point.title.length > 0
                );

        const hasPreface =
            Boolean(
                form.prefaceMainHeading.trim()
            ) ||
            Boolean(
                form.prefacePreamble.trim()
            ) ||
            Boolean(
                form.prefaceSubHeading.trim()
            );

        const detailedLessons =
            form.detailedLessons
                .map(lesson => ({
                    title:
                        lesson.title.trim(),
                    bullets:
                        linesToArray(
                            lesson.bullets
                        ) ?? [],
                }))
                .filter(
                    lesson =>
                        lesson.title.length > 0
                );

        if (
            firstPoints.length === 0 &&
            !hasPreface &&
            detailedLessons.length === 0
        ) {
            return null;
        }

        return {
            firstPoints:
                firstPoints.length > 0
                    ? firstPoints
                    : null,

            prefaceSection: hasPreface
                ? {
                    mainHeading:
                        form.prefaceMainHeading.trim(),
                    preamble:
                        form.prefacePreamble.trim(),
                    subHeading:
                        form.prefaceSubHeading.trim(),
                }
                : null,

            detailedLessons:
                detailedLessons.length > 0
                    ? detailedLessons
                    : null,
        };
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const title =
            form.title.trim();

        const content =
            form.content.trim();

        if (!title) {
            setError(
                'Sermon title is required.'
            );
            return;
        }

        if (!content) {
            setError(
                'Main sermon content is required.'
            );
            return;
        }

        if (!form.themeOfTheYearId) {
            setError(
                'Please select a Theme of the Year.'
            );
            return;
        }

        const category =
            Number.parseInt(
                form.category,
                10
            );

        if (
            Number.isNaN(category) ||
            category < 1 ||
            category > 8
        ) {
            setError(
                'Please select a valid category.'
            );
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const structuredContent =
                buildStructuredContent();

            const commonBody = {
                title,
                content,
                category,
                themeOfTheYearId:
                    form.themeOfTheYearId,
                excerpt:
                    form.excerpt.trim() ||
                    null,
                introHeading:
                    form.introHeading.trim() ||
                    null,
                introText:
                    form.introText.trim() ||
                    null,
                structuredContent,
                closingText:
                    form.closingText.trim() ||
                    null,
                coverImageData:
                    form.coverImageData,
                coverImageContentType:
                    form.coverImageContentType,
                bibleReference:
                    form.bibleReference.trim() ||
                    null,
            };

            const response =
                editingPost
                    ? await apiFetch(
                        `/api/pastor-posts/admin/${editingPost.id}`,
                        {
                            method: 'PUT',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify(
                                    commonBody
                                ),
                        }
                    )
                    : await apiFetch(
                        '/api/pastor-posts/admin/',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body:
                                JSON.stringify({
                                    ...commonBody,
                                    authorName:
                                        form.authorName.trim() ||
                                        'Pastor',
                                }),
                        }
                    );

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        editingPost
                            ? 'Unable to update the sermon.'
                            : 'Unable to create the sermon.'
                    )
                );
            }

            setFormOpen(false);
            setEditingPost(null);
            setForm(emptyForm);

            setSuccessMessage(
                editingPost
                    ? 'Sermon updated successfully.'
                    : 'Sermon created successfully as a draft.'
            );

            await refreshPosts();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save the sermon.'
            );
        } finally {
            setSaving(false);
        }
    }

    function requestAction(
        post: PastorPost,
        action: ConfirmationAction
    ) {
        setError(null);
        setSuccessMessage(null);

        setConfirmation({
            post,
            action,
        });
    }

    function closeConfirmation() {
        if (actionPostId) {
            return;
        }

        setConfirmation(null);
    }

    async function confirmAction() {
        if (!confirmation) {
            return;
        }

        const { post, action } =
            confirmation;

        setActionPostId(post.id);
        setError(null);
        setSuccessMessage(null);

        try {
            let response: Response;

            if (
                action === 'publish' ||
                action === 'unpublish'
            ) {
                response = await apiFetch(
                    `/api/pastor-posts/admin/${post.id}/${action}`,
                    {
                        method: 'POST',
                    }
                );
            } else if (
                action === 'pin' ||
                action === 'unpin'
            ) {
                response = await apiFetch(
                    `/api/pastor-posts/admin/${post.id}/pin`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body: JSON.stringify({
                            isPinned:
                                action ===
                                'pin',
                        }),
                    }
                );
            } else {
                response = await apiFetch(
                    `/api/pastor-posts/admin/${post.id}`,
                    {
                        method: 'DELETE',
                    }
                );
            }

            if (!response.ok) {
                throw new Error(
                    await readProblem(
                        response,
                        `Unable to ${action} the sermon.`
                    )
                );
            }

            const messages:
                Record<
                    ConfirmationAction,
                    string
                > = {
                publish:
                    'Sermon published successfully.',
                unpublish:
                    'Sermon unpublished successfully.',
                pin:
                    'Sermon pinned successfully.',
                unpin:
                    'Sermon unpinned successfully.',
                delete:
                    'Sermon deleted successfully.',
            };

            setSuccessMessage(
                messages[action]
            );

            setConfirmation(null);

            await refreshPosts();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `Unable to ${action} the sermon.`
            );
        } finally {
            setActionPostId(null);
        }
    }

    function confirmationTitle() {
        if (!confirmation) {
            return '';
        }

        switch (
        confirmation.action
        ) {
            case 'publish':
                return 'Publish Sermon';
            case 'unpublish':
                return 'Unpublish Sermon';
            case 'pin':
                return 'Pin Sermon';
            case 'unpin':
                return 'Unpin Sermon';
            case 'delete':
                return 'Delete Sermon';
        }
    }

    function confirmationMessage() {
        if (!confirmation) {
            return '';
        }

        const title =
            confirmation.post.title;

        switch (
        confirmation.action
        ) {
            case 'publish':
                return `Are you sure you want to publish "${title}"? It will become visible on the public Pastor's Corner.`;

            case 'unpublish':
                return `Are you sure you want to unpublish "${title}"? It will no longer appear on the public Pastor's Corner.`;

            case 'pin':
                return `Pin "${title}"? Pinned sermons are given priority in the public feed.`;

            case 'unpin':
                return `Remove "${title}" from the pinned sermons?`;

            case 'delete':
                return `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`;
        }
    }

    function confirmationText() {
        if (!confirmation) {
            return '';
        }

        switch (
        confirmation.action
        ) {
            case 'publish':
                return 'Publish';
            case 'unpublish':
                return 'Unpublish';
            case 'pin':
                return 'Pin';
            case 'unpin':
                return 'Unpin';
            case 'delete':
                return 'Delete';
        }
    }

    function loadingText() {
        if (!confirmation) {
            return 'Working...';
        }

        switch (
        confirmation.action
        ) {
            case 'publish':
                return 'Publishing...';
            case 'unpublish':
                return 'Unpublishing...';
            case 'pin':
                return 'Pinning...';
            case 'unpin':
                return 'Unpinning...';
            case 'delete':
                return 'Deleting...';
        }
    }

    return (
        <AdminLayout>
            <section className="sermons-admin-page">
                <div className="sermons-admin-header">
                    <div>
                        <span className="admin-eyebrow">
                            Pastor&apos;s Corner
                        </span>

                        <h1>Sermons</h1>

                        <p>
                            Create, edit and manage
                            Pastor&apos;s Corner
                            messages, devotionals and
                            sermon content.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={openAddForm}
                        disabled={
                            loading ||
                            themes.length === 0
                        }
                    >
                        <span>＋</span>
                        New Sermon
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
                    themes.length === 0 && (
                        <div
                            className="admin-message admin-message-error"
                            role="alert"
                        >
                            No Theme of the Year
                            records are available.
                            Create a theme before
                            creating a sermon.
                        </div>
                    )}

                <div className="sermon-summary-grid">
                    <div className="sermon-summary-card">
                        <span>▤</span>

                        <div>
                            <strong>
                                {posts.length}
                            </strong>
                            <small>
                                Total Sermons
                            </small>
                        </div>
                    </div>

                    <div className="sermon-summary-card">
                        <span>●</span>

                        <div>
                            <strong>
                                {publishedCount}
                            </strong>
                            <small>
                                Published
                            </small>
                        </div>
                    </div>

                    <div className="sermon-summary-card">
                        <span>◷</span>

                        <div>
                            <strong>
                                {draftCount}
                            </strong>
                            <small>Drafts</small>
                        </div>
                    </div>

                    <div className="sermon-summary-card">
                        <span>★</span>

                        <div>
                            <strong>
                                {pinnedCount}
                            </strong>
                            <small>Pinned</small>
                        </div>
                    </div>
                </div>

                <article className="admin-panel sermon-management-panel">
                    <div className="sermon-toolbar">
                        <div>
                            <h2>
                                Sermon Library
                            </h2>

                            <p>
                                Manage draft and
                                published Pastor&apos;s
                                Corner content.
                            </p>
                        </div>

                        <div className="sermon-toolbar-controls">
                            <input
                                type="search"
                                value={search}
                                onChange={event =>
                                    setSearch(
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Search sermons..."
                                aria-label="Search sermons"
                                className="sermon-search"
                            />

                            <select
                                value={filter}
                                onChange={event =>
                                    setFilter(
                                        event.target
                                            .value as FilterType
                                    )
                                }
                                aria-label="Filter sermons"
                                className="sermon-filter"
                            >
                                <option value="all">
                                    All sermons
                                </option>

                                <option value="published">
                                    Published
                                </option>

                                <option value="draft">
                                    Drafts
                                </option>

                                <option value="pinned">
                                    Pinned
                                </option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-empty-state">
                            <div className="admin-loading-spinner" />

                            <strong>
                                Loading sermons...
                            </strong>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon">
                                ▶
                            </span>

                            <strong>
                                No sermons yet
                            </strong>

                            <p>
                                Create your first
                                Pastor&apos;s Corner
                                sermon.
                            </p>

                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openAddForm
                                }
                                disabled={
                                    themes.length ===
                                    0
                                }
                            >
                                New Sermon
                            </button>
                        </div>
                    ) : filteredPosts.length ===
                        0 ? (
                        <div className="admin-empty-state">
                            <strong>
                                No matching sermons
                            </strong>

                            <p>
                                Try changing your
                                search or filter.
                            </p>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-data-table sermon-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Sermon
                                        </th>
                                        <th>
                                            Theme
                                        </th>
                                        <th>
                                            Category
                                        </th>
                                        <th>
                                            Status
                                        </th>
                                        <th>
                                            Views
                                        </th>
                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredPosts.map(
                                        post => (
                                            <tr
                                                key={
                                                    post.id
                                                }
                                            >
                                                <td>
                                                    <div className="sermon-title-cell">
                                                        {post.coverImageData &&
                                                            post.coverImageContentType ? (
                                                            <img
                                                                src={`data:${post.coverImageContentType};base64,${post.coverImageData}`}
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <span className="sermon-cover-placeholder">
                                                                ▶
                                                            </span>
                                                        )}

                                                        <div>
                                                            <strong>
                                                                {
                                                                    post.title
                                                                }
                                                            </strong>

                                                            <small>
                                                                {
                                                                    post.authorName
                                                                }
                                                            </small>

                                                            {post.bibleReference && (
                                                                <small>
                                                                    {
                                                                        post.bibleReference
                                                                    }
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="sermon-theme">
                                                        {post.themeTitle ??
                                                            '—'}
                                                    </span>
                                                </td>

                                                <td>
                                                    {categoryName(
                                                        post.category
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="sermon-status-list">
                                                        <span
                                                            className={`sermon-status ${post.isPublished
                                                                ? 'published'
                                                                : 'draft'
                                                                }`}
                                                        >
                                                            {post.isPublished
                                                                ? 'Published'
                                                                : 'Draft'}
                                                        </span>

                                                        {post.isPinned && (
                                                            <span className="sermon-status pinned">
                                                                ★
                                                                Pinned
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    {
                                                        post.viewCount
                                                    }
                                                </td>

                                                <td>
                                                    <div className="admin-table-actions sermon-actions">
                                                        <button
                                                            type="button"
                                                            className="admin-action-button edit"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    post
                                                                )
                                                            }
                                                            disabled={
                                                                actionPostId ===
                                                                post.id
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={`admin-action-button ${post.isPublished
                                                                ? 'deactivate'
                                                                : 'activate'
                                                                }`}
                                                            onClick={() =>
                                                                requestAction(
                                                                    post,
                                                                    post.isPublished
                                                                        ? 'unpublish'
                                                                        : 'publish'
                                                                )
                                                            }
                                                            disabled={
                                                                actionPostId ===
                                                                post.id
                                                            }
                                                        >
                                                            {post.isPublished
                                                                ? 'Unpublish'
                                                                : 'Publish'}
                                                        </button>

                                                        {post.isPublished && (
                                                            <button
                                                                type="button"
                                                                className="admin-action-button sermon-pin-button"
                                                                onClick={() =>
                                                                    requestAction(
                                                                        post,
                                                                        post.isPinned
                                                                            ? 'unpin'
                                                                            : 'pin'
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionPostId ===
                                                                    post.id
                                                                }
                                                            >
                                                                {post.isPinned
                                                                    ? 'Unpin'
                                                                    : 'Pin'}
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="admin-action-button sermon-delete-button"
                                                            onClick={() =>
                                                                requestAction(
                                                                    post,
                                                                    'delete'
                                                                )
                                                            }
                                                            disabled={
                                                                actionPostId ===
                                                                post.id
                                                            }
                                                        >
                                                            Delete
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
                    className="admin-modal-backdrop sermon-modal-backdrop"
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
                        className="admin-modal sermon-editor-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sermon-form-title"
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    Pastor&apos;s
                                    Corner
                                </span>

                                <h2 id="sermon-form-title">
                                    {editingPost
                                        ? 'Edit Sermon'
                                        : 'New Sermon'}
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
                            <div className="sermon-form-section">
                                <div className="sermon-form-section-heading">
                                    <span>
                                        01
                                    </span>

                                    <div>
                                        <h3>
                                            Basic
                                            Information
                                        </h3>

                                        <p>
                                            Main details
                                            used throughout
                                            Pastor&apos;s
                                            Corner.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="sermon-title">
                                        Title{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="sermon-title"
                                        type="text"
                                        value={
                                            form.title
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        title:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="sermon-form-grid">
                                    <div className="admin-form-group">
                                        <label htmlFor="sermon-theme">
                                            Theme of
                                            the Year{' '}
                                            <span>
                                                *
                                            </span>
                                        </label>

                                        <select
                                            id="sermon-theme"
                                            value={
                                                form.themeOfTheYearId
                                            }
                                            onChange={
                                                event =>
                                                    setForm(
                                                        current => ({
                                                            ...current,
                                                            themeOfTheYearId:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select
                                                theme
                                            </option>

                                            {themes.map(
                                                theme => (
                                                    <option
                                                        key={
                                                            theme.id
                                                        }
                                                        value={
                                                            theme.id
                                                        }
                                                    >
                                                        {
                                                            theme.year
                                                        }{' '}
                                                        —{' '}
                                                        {
                                                            theme.themeTitle
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="admin-form-group">
                                        <label htmlFor="sermon-category">
                                            Category
                                        </label>

                                        <select
                                            id="sermon-category"
                                            value={
                                                form.category
                                            }
                                            onChange={
                                                event =>
                                                    setForm(
                                                        current => ({
                                                            ...current,
                                                            category:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        >
                                            {categories.map(
                                                category => (
                                                    <option
                                                        key={
                                                            category.value
                                                        }
                                                        value={
                                                            category.value
                                                        }
                                                    >
                                                        {
                                                            category.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="sermon-form-grid">
                                    <div className="admin-form-group">
                                        <label htmlFor="sermon-reference">
                                            Bible
                                            Reference
                                        </label>

                                        <input
                                            id="sermon-reference"
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
                                            placeholder="e.g. Isaiah 43:18-19"
                                        />
                                    </div>

                                    <div className="admin-form-group">
                                        <label htmlFor="sermon-author">
                                            Author
                                        </label>

                                        <input
                                            id="sermon-author"
                                            type="text"
                                            value={
                                                form.authorName
                                            }
                                            onChange={
                                                event =>
                                                    setForm(
                                                        current => ({
                                                            ...current,
                                                            authorName:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                            disabled={
                                                Boolean(
                                                    editingPost
                                                )
                                            }
                                        />

                                        {editingPost && (
                                            <small>
                                                Author is
                                                set when
                                                the sermon
                                                is created.
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="sermon-excerpt">
                                        Excerpt
                                    </label>

                                    <textarea
                                        id="sermon-excerpt"
                                        rows={3}
                                        value={
                                            form.excerpt
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        excerpt:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                        placeholder="Short summary shown in the Pastor's Corner preview"
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="sermon-content">
                                        Main Content{' '}
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <textarea
                                        id="sermon-content"
                                        rows={10}
                                        value={
                                            form.content
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        content:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                        placeholder="Enter the main sermon content"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="sermon-form-section">
                                <div className="sermon-form-section-heading">
                                    <span>
                                        02
                                    </span>

                                    <div>
                                        <h3>
                                            Introduction
                                        </h3>

                                        <p>
                                            Optional
                                            introduction
                                            displayed before
                                            the structured
                                            lesson content.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="sermon-intro-heading">
                                        Introduction
                                        Heading
                                    </label>

                                    <input
                                        id="sermon-intro-heading"
                                        type="text"
                                        value={
                                            form.introHeading
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        introHeading:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="sermon-intro-text">
                                        Introduction
                                        Text
                                    </label>

                                    <textarea
                                        id="sermon-intro-text"
                                        rows={5}
                                        value={
                                            form.introText
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        introText:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="sermon-form-section">
                                <div className="sermon-form-section-heading sermon-section-with-action">
                                    <span>
                                        03
                                    </span>

                                    <div>
                                        <h3>
                                            First Points
                                        </h3>

                                        <p>
                                            Add introductory
                                            points with
                                            optional text
                                            and bullet
                                            lists.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            addFirstPoint
                                        }
                                    >
                                        ＋ Add Point
                                    </button>
                                </div>

                                {form.firstPoints.length ===
                                    0 ? (
                                    <div className="sermon-structured-empty">
                                        No first
                                        points added.
                                    </div>
                                ) : (
                                    <div className="sermon-repeat-list">
                                        {form.firstPoints.map(
                                            (
                                                point,
                                                index
                                            ) => (
                                                <div
                                                    className="sermon-repeat-card"
                                                    key={
                                                        index
                                                    }
                                                >
                                                    <div className="sermon-repeat-heading">
                                                        <strong>
                                                            Point{' '}
                                                            {index +
                                                                1}
                                                        </strong>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeFirstPoint(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>

                                                    <div className="admin-form-group">
                                                        <label>
                                                            Title
                                                        </label>

                                                        <input
                                                            type="text"
                                                            value={
                                                                point.title
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateFirstPoint(
                                                                        index,
                                                                        'title',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="admin-form-group">
                                                        <label>
                                                            Content
                                                        </label>

                                                        <textarea
                                                            rows={
                                                                4
                                                            }
                                                            value={
                                                                point.content
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateFirstPoint(
                                                                        index,
                                                                        'content',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="admin-form-group">
                                                        <label>
                                                            Bullets
                                                        </label>

                                                        <textarea
                                                            rows={
                                                                4
                                                            }
                                                            value={
                                                                point.bullets
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateFirstPoint(
                                                                        index,
                                                                        'bullets',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                            }
                                                            placeholder="Enter one bullet per line"
                                                        />

                                                        <small>
                                                            One
                                                            bullet
                                                            per
                                                            line.
                                                        </small>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="sermon-form-section">
                                <div className="sermon-form-section-heading">
                                    <span>
                                        04
                                    </span>

                                    <div>
                                        <h3>
                                            Preface
                                            Section
                                        </h3>

                                        <p>
                                            Optional
                                            transition into
                                            the detailed
                                            lessons.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="preface-heading">
                                        Main Heading
                                    </label>

                                    <input
                                        id="preface-heading"
                                        type="text"
                                        value={
                                            form.prefaceMainHeading
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        prefaceMainHeading:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="preface-preamble">
                                        Preamble
                                    </label>

                                    <textarea
                                        id="preface-preamble"
                                        rows={5}
                                        value={
                                            form.prefacePreamble
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        prefacePreamble:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="preface-subheading">
                                        Subheading
                                    </label>

                                    <input
                                        id="preface-subheading"
                                        type="text"
                                        value={
                                            form.prefaceSubHeading
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        prefaceSubHeading:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="sermon-form-section">
                                <div className="sermon-form-section-heading sermon-section-with-action">
                                    <span>
                                        05
                                    </span>

                                    <div>
                                        <h3>
                                            Detailed
                                            Lessons
                                        </h3>

                                        <p>
                                            Add lesson
                                            headings and
                                            their individual
                                            teaching points.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            addDetailedLesson
                                        }
                                    >
                                        ＋ Add Lesson
                                    </button>
                                </div>

                                {form.detailedLessons
                                    .length === 0 ? (
                                    <div className="sermon-structured-empty">
                                        No detailed
                                        lessons added.
                                    </div>
                                ) : (
                                    <div className="sermon-repeat-list">
                                        {form.detailedLessons.map(
                                            (
                                                lesson,
                                                index
                                            ) => (
                                                <div
                                                    className="sermon-repeat-card"
                                                    key={
                                                        index
                                                    }
                                                >
                                                    <div className="sermon-repeat-heading">
                                                        <strong>
                                                            Lesson{' '}
                                                            {index +
                                                                1}
                                                        </strong>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeDetailedLesson(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>

                                                    <div className="admin-form-group">
                                                        <label>
                                                            Lesson
                                                            Title
                                                        </label>

                                                        <input
                                                            type="text"
                                                            value={
                                                                lesson.title
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateDetailedLesson(
                                                                        index,
                                                                        'title',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="admin-form-group">
                                                        <label>
                                                            Teaching
                                                            Points
                                                        </label>

                                                        <textarea
                                                            rows={
                                                                6
                                                            }
                                                            value={
                                                                lesson.bullets
                                                            }
                                                            onChange={
                                                                event =>
                                                                    updateDetailedLesson(
                                                                        index,
                                                                        'bullets',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                            }
                                                            placeholder="Enter one teaching point per line"
                                                        />

                                                        <small>
                                                            One
                                                            teaching
                                                            point
                                                            per
                                                            line.
                                                        </small>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="sermon-form-section">
                                <div className="sermon-form-section-heading">
                                    <span>
                                        06
                                    </span>

                                    <div>
                                        <h3>
                                            Closing &
                                            Cover
                                        </h3>

                                        <p>
                                            Finish the
                                            message and
                                            optionally add
                                            a cover image.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="sermon-closing">
                                        Closing Text
                                    </label>

                                    <textarea
                                        id="sermon-closing"
                                        rows={6}
                                        value={
                                            form.closingText
                                        }
                                        onChange={
                                            event =>
                                                setForm(
                                                    current => ({
                                                        ...current,
                                                        closingText:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                        }
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="sermon-cover">
                                        Cover Image
                                    </label>

                                    <input
                                        id="sermon-cover"
                                        type="file"
                                        accept="image/*"
                                        onChange={
                                            event =>
                                                void handleCoverImage(
                                                    event
                                                        .target
                                                        .files?.[0] ??
                                                    null
                                                )
                                        }
                                    />

                                    <small>
                                        Selecting a new
                                        image replaces
                                        the existing
                                        sermon cover.
                                    </small>
                                </div>

                                {form.coverImageData &&
                                    form.coverImageContentType && (
                                        <div className="sermon-cover-preview">
                                            <img
                                                src={`data:${form.coverImageContentType};base64,${form.coverImageData}`}
                                                alt="Sermon cover preview"
                                            />
                                        </div>
                                    )}
                            </div>

                            <div className="admin-modal-actions sermon-modal-actions">
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
                                        : editingPost
                                            ? 'Save Changes'
                                            : 'Create Draft'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={
                    confirmation !== null
                }
                title={
                    confirmationTitle()
                }
                message={
                    confirmationMessage()
                }
                confirmText={
                    confirmationText()
                }
                loadingText={
                    loadingText()
                }
                variant={
                    confirmation?.action ===
                        'delete' ||
                        confirmation?.action ===
                        'unpublish'
                        ? 'danger'
                        : confirmation?.action ===
                            'publish' ||
                            confirmation?.action ===
                            'pin'
                            ? 'success'
                            : 'warning'
                }
                loading={
                    actionPostId !== null
                }
                onConfirm={
                    confirmAction
                }
                onCancel={
                    closeConfirmation
                }
            />
        </AdminLayout>
    );
}

export default Sermons;