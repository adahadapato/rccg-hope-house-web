import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import type {
    ChangeEvent,
    FormEvent,
} from 'react';

import {
    apiFetch,
    apiUrl,
} from '../../api/api';

import {
    useGalleryCategories,
} from '../../hooks/useGalleryCategories';

import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';
import '../styles/gallery-images.css';

interface GalleryImageDto {
    id: string;
    title: string;
    description: string | null;
    imagePath: string;
    thumbnailPath: string | null;
    contentType: string;
    altText: string;
    categoryId: string;
    categoryName: string;
    tags: string[];
    fileSizeBytes: number;
    width: number;
    height: number;
    displayOrder: number;
    isFeatured: boolean;
    isPublic: boolean;
    eventDate: string | null;
    photographer: string | null;
    viewCount: number;
    createdAt: string;
}

interface UploadFormState {
    title: string;
    altText: string;
    categoryId: string;
    description: string;
    eventDate: string;
    photographer: string;
    tags: string;
    displayOrder: string;
}

interface EditFormState {
    title: string;
    altText: string;
    categoryId: string;
    description: string;
    eventDate: string;
    photographer: string;
    tags: string;
    displayOrder: string;
}

const emptyUploadForm: UploadFormState = {
    title: '',
    altText: '',
    categoryId: '',
    description: '',
    eventDate: '',
    photographer: '',
    tags: '',
    displayOrder: '0',
};

function GalleryImage() {
    const {
        galleryCategories,
        loading: categoriesLoading,
        error: categoriesError,
    } = useGalleryCategories();

    const [
        images,
        setImages,
    ] = useState<GalleryImageDto[]>([]);

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
        categoryFilter,
        setCategoryFilter,
    ] = useState('');

    const [
        visibilityFilter,
        setVisibilityFilter,
    ] = useState('all');

    const [
        featuredFilter,
        setFeaturedFilter,
    ] = useState('all');

    const [
        searchText,
        setSearchText,
    ] = useState('');

    const [
        uploadOpen,
        setUploadOpen,
    ] = useState(false);

    const [
        uploadForm,
        setUploadForm,
    ] = useState<UploadFormState>(
        emptyUploadForm
    );

    const [
        uploadFile,
        setUploadFile,
    ] = useState<File | null>(null);

    const [
        uploadPreview,
        setUploadPreview,
    ] = useState<string | null>(null);

    const [
        uploading,
        setUploading,
    ] = useState(false);

    const [
        editingImage,
        setEditingImage,
    ] = useState<GalleryImageDto | null>(
        null
    );

    const [
        editForm,
        setEditForm,
    ] = useState<EditFormState>({
        title: '',
        altText: '',
        categoryId: '',
        description: '',
        eventDate: '',
        photographer: '',
        tags: '',
        displayOrder: '0',
    });

    const [
        replacementFile,
        setReplacementFile,
    ] = useState<File | null>(null);

    const [
        replacementPreview,
        setReplacementPreview,
    ] = useState<string | null>(null);

    const [
        savingEdit,
        setSavingEdit,
    ] = useState(false);

    const [
        actionImageId,
        setActionImageId,
    ] = useState<string | null>(null);

    const loadImages =
        useCallback(
            async (
                signal?: AbortSignal
            ) => {
                try {
                    setError(null);

                    const response =
                        await apiFetch(
                            '/api/gallery/admin/?skip=0&take=200',
                            {
                                signal,
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Unable to load gallery images (${response.status}).`
                        );
                    }

                    const data:
                        GalleryImageDto[] =
                        await response.json();

                    setImages(data);
                } catch (err) {
                    if (
                        (err as Error).name !==
                        'AbortError'
                    ) {
                        setError(
                            err instanceof Error
                                ? err.message
                                : 'Unable to load gallery images.'
                        );
                    }
                } finally {
                    if (!signal?.aborted) {
                        setLoading(false);
                    }
                }
            },
            []
        );

    useEffect(() => {
        const controller =
            new AbortController();

        async function loadInitialImages() {
            try {
                const response =
                    await apiFetch(
                        '/api/gallery/admin/?skip=0&take=200',
                        {
                            signal:
                                controller.signal,
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        `Unable to load gallery images (${response.status}).`
                    );
                }

                const data:
                    GalleryImageDto[] =
                    await response.json();

                if (
                    !controller.signal.aborted
                ) {
                    setImages(data);
                }
            } catch (err) {
                if (
                    (err as Error).name !==
                        'AbortError' &&
                    !controller.signal.aborted
                ) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Unable to load gallery images.'
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

        void loadInitialImages();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        return () => {
            if (uploadPreview) {
                URL.revokeObjectURL(
                    uploadPreview
                );
            }
        };
    }, [uploadPreview]);

    useEffect(() => {
        return () => {
            if (replacementPreview) {
                URL.revokeObjectURL(
                    replacementPreview
                );
            }
        };
    }, [replacementPreview]);

    const filteredImages =
        useMemo(() => {
            const search =
                searchText
                    .trim()
                    .toLowerCase();

            return images.filter(
                image => {
                    if (
                        categoryFilter &&
                        image.categoryId !==
                        categoryFilter
                    ) {
                        return false;
                    }

                    if (
                        visibilityFilter ===
                        'public' &&
                        !image.isPublic
                    ) {
                        return false;
                    }

                    if (
                        visibilityFilter ===
                        'private' &&
                        image.isPublic
                    ) {
                        return false;
                    }

                    if (
                        featuredFilter ===
                        'featured' &&
                        !image.isFeatured
                    ) {
                        return false;
                    }

                    if (
                        featuredFilter ===
                        'not-featured' &&
                        image.isFeatured
                    ) {
                        return false;
                    }

                    if (!search) {
                        return true;
                    }

                    const searchable =
                        [
                            image.title,
                            image.description ?? '',
                            image.altText,
                            image.categoryName,
                            image.photographer ?? '',
                            ...image.tags,
                        ]
                            .join(' ')
                            .toLowerCase();

                    return searchable.includes(
                        search
                    );
                }
            );
        }, [
            images,
            categoryFilter,
            visibilityFilter,
            featuredFilter,
            searchText,
        ]);

    const publicCount =
        images.filter(
            image => image.isPublic
        ).length;

    const privateCount =
        images.length -
        publicCount;

    const featuredCount =
        images.filter(
            image => image.isFeatured
        ).length;

    function getImageUrl(
        image: GalleryImageDto
    ) {
        const path =
            image.thumbnailPath ||
            image.imagePath;

        return apiUrl(path);
    }

    function formatDate(
        value: string | null
    ) {
        if (!value) {
            return 'No event date';
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            undefined,
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }
        );
    }

    function formatFileSize(
        bytes: number
    ) {
        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (
            bytes <
            1024 * 1024
        ) {
            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;
        }

        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    }

    function toDateInputValue(
        value: string | null
    ) {
        if (!value) {
            return '';
        }

        return value.substring(
            0,
            10
        );
    }

    function parseDisplayOrder(
        value: string
    ) {
        const parsed =
            Number.parseInt(
                value,
                10
            );

        if (
            Number.isNaN(parsed) ||
            parsed < 0
        ) {
            return null;
        }

        return parsed;
    }

    function openUpload() {
        setError(null);
        setSuccessMessage(null);

        setUploadForm({
            ...emptyUploadForm,
            categoryId:
                galleryCategories[0]
                    ?.id ?? '',
        });

        setUploadFile(null);

        if (uploadPreview) {
            URL.revokeObjectURL(
                uploadPreview
            );
        }

        setUploadPreview(null);
        setUploadOpen(true);
    }

    function closeUpload() {
        if (uploading) {
            return;
        }

        if (uploadPreview) {
            URL.revokeObjectURL(
                uploadPreview
            );
        }

        setUploadPreview(null);
        setUploadFile(null);
        setUploadForm(
            emptyUploadForm
        );
        setUploadOpen(false);
    }

    function handleUploadFile(
        event:
            ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0] ??
            null;

        if (uploadPreview) {
            URL.revokeObjectURL(
                uploadPreview
            );
        }

        setUploadFile(file);

        setUploadPreview(
            file
                ? URL.createObjectURL(
                    file
                )
                : null
        );
    }

    async function handleUpload(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!uploadFile) {
            setError(
                'Please select an image to upload.'
            );
            return;
        }

        if (
            !uploadForm.title.trim()
        ) {
            setError(
                'Image title is required.'
            );
            return;
        }

        if (
            !uploadForm.altText.trim()
        ) {
            setError(
                'Alternative text is required.'
            );
            return;
        }

        if (
            !uploadForm.categoryId
        ) {
            setError(
                'Please select a gallery category.'
            );
            return;
        }

        const displayOrder =
            parseDisplayOrder(
                uploadForm.displayOrder
            );

        if (displayOrder === null) {
            setError(
                'Display order must be 0 or greater.'
            );
            return;
        }

        setUploading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const formData =
                new FormData();

            formData.append(
                'File',
                uploadFile
            );

            formData.append(
                'Title',
                uploadForm.title.trim()
            );

            formData.append(
                'AltText',
                uploadForm.altText.trim()
            );

            formData.append(
                'CategoryId',
                uploadForm.categoryId
            );

            formData.append(
                'DisplayOrder',
                displayOrder.toString()
            );

            if (
                uploadForm.description.trim()
            ) {
                formData.append(
                    'Description',
                    uploadForm.description.trim()
                );
            }

            if (
                uploadForm.eventDate
            ) {
                formData.append(
                    'EventDate',
                    uploadForm.eventDate
                );
            }

            if (
                uploadForm.photographer.trim()
            ) {
                formData.append(
                    'Photographer',
                    uploadForm.photographer.trim()
                );
            }

            if (
                uploadForm.tags.trim()
            ) {
                formData.append(
                    'Tags',
                    uploadForm.tags.trim()
                );
            }

            const response =
                await apiFetch(
                    '/api/gallery/admin/upload',
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

            if (!response.ok) {
                let message =
                    'Unable to upload the gallery image.';

                try {
                    const body =
                        await response.json();

                    if (
                        typeof body?.detail ===
                        'string'
                    ) {
                        message =
                            body.detail;
                    } else if (
                        typeof body?.title ===
                        'string'
                    ) {
                        message =
                            body.title;
                    }
                } catch {
                    // Keep default message.
                }

                throw new Error(
                    message
                );
            }

            closeUpload();

            setSuccessMessage(
                'Gallery image uploaded successfully.'
            );

            setLoading(true);

            await loadImages();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to upload the gallery image.'
            );
        } finally {
            setUploading(false);
        }
    }

    function openEdit(
        image: GalleryImageDto
    ) {
        setError(null);
        setSuccessMessage(null);

        setEditingImage(image);

        setEditForm({
            title:
                image.title,
            altText:
                image.altText,
            categoryId:
                image.categoryId,
            description:
                image.description ?? '',
            eventDate:
                toDateInputValue(
                    image.eventDate
                ),
            photographer:
                image.photographer ?? '',
            tags:
                image.tags.join(', '),
            displayOrder:
                image.displayOrder.toString(),
        });

        setReplacementFile(null);

        if (replacementPreview) {
            URL.revokeObjectURL(
                replacementPreview
            );
        }

        setReplacementPreview(
            null
        );
    }

    function closeEdit() {
        if (savingEdit) {
            return;
        }

        if (replacementPreview) {
            URL.revokeObjectURL(
                replacementPreview
            );
        }

        setReplacementPreview(
            null
        );

        setReplacementFile(null);
        setEditingImage(null);
    }

    function handleReplacementFile(
        event:
            ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0] ??
            null;

        if (replacementPreview) {
            URL.revokeObjectURL(
                replacementPreview
            );
        }

        setReplacementFile(file);

        setReplacementPreview(
            file
                ? URL.createObjectURL(
                    file
                )
                : null
        );
    }

    async function handleEdit(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!editingImage) {
            return;
        }

        if (
            !editForm.title.trim()
        ) {
            setError(
                'Image title is required.'
            );
            return;
        }

        if (
            !editForm.altText.trim()
        ) {
            setError(
                'Alternative text is required.'
            );
            return;
        }

        if (
            !editForm.categoryId
        ) {
            setError(
                'Please select a gallery category.'
            );
            return;
        }

        const displayOrder =
            parseDisplayOrder(
                editForm.displayOrder
            );

        if (displayOrder === null) {
            setError(
                'Display order must be 0 or greater.'
            );
            return;
        }

        setSavingEdit(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const formData =
                new FormData();

            formData.append(
                'Title',
                editForm.title.trim()
            );

            formData.append(
                'AltText',
                editForm.altText.trim()
            );

            formData.append(
                'CategoryId',
                editForm.categoryId
            );

            formData.append(
                'Tags',
                editForm.tags.trim()
            );

            formData.append(
                'DisplayOrder',
                displayOrder.toString()
            );

            if (
                editForm.description.trim()
            ) {
                formData.append(
                    'Description',
                    editForm.description.trim()
                );
            }

            if (
                editForm.photographer.trim()
            ) {
                formData.append(
                    'Photographer',
                    editForm.photographer.trim()
                );
            }

            if (
                editForm.eventDate
            ) {
                formData.append(
                    'EventDate',
                    editForm.eventDate
                );
            }

            if (replacementFile) {
                formData.append(
                    'NewImage',
                    replacementFile
                );
            }

            const response =
                await apiFetch(
                    `/api/gallery/admin/${editingImage.id}`,
                    {
                        method: 'PUT',
                        body: formData,
                    }
                );

            if (!response.ok) {
                let message =
                    'Unable to update the gallery image.';

                try {
                    const body =
                        await response.json();

                    if (
                        typeof body?.detail ===
                        'string'
                    ) {
                        message =
                            body.detail;
                    } else if (
                        typeof body?.title ===
                        'string'
                    ) {
                        message =
                            body.title;
                    }
                } catch {
                    // Keep default message.
                }

                throw new Error(
                    message
                );
            }

            closeEdit();

            setSuccessMessage(
                'Gallery image updated successfully.'
            );

            await loadImages();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to update the gallery image.'
            );
        } finally {
            setSavingEdit(false);
        }
    }

    async function toggleVisibility(
        image: GalleryImageDto
    ) {
        const action =
            image.isPublic
                ? 'make this image private'
                : 'publish this image';

        if (
            !window.confirm(
                `Are you sure you want to ${action}?`
            )
        ) {
            return;
        }

        setActionImageId(
            image.id
        );
        setError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/gallery/admin/${image.id}/visibility`,
                    {
                        method: 'POST',
                    }
                );

            if (!response.ok) {
                throw new Error(
                    'Unable to change image visibility.'
                );
            }

            setSuccessMessage(
                image.isPublic
                    ? `"${image.title}" is now private.`
                    : `"${image.title}" is now public.`
            );

            await loadImages();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to change image visibility.'
            );
        } finally {
            setActionImageId(
                null
            );
        }
    }

    async function toggleFeatured(
        image: GalleryImageDto
    ) {
        setActionImageId(
            image.id
        );
        setError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/gallery/admin/${image.id}/featured`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body:
                            JSON.stringify({
                                isFeatured:
                                    !image.isFeatured,
                            }),
                    }
                );

            if (!response.ok) {
                throw new Error(
                    'Unable to change featured status.'
                );
            }

            setSuccessMessage(
                image.isFeatured
                    ? `"${image.title}" is no longer featured.`
                    : `"${image.title}" is now featured.`
            );

            await loadImages();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to change featured status.'
            );
        } finally {
            setActionImageId(
                null
            );
        }
    }

    async function deleteImage(
        image: GalleryImageDto
    ) {
        const confirmed =
            window.confirm(
                `Permanently delete "${image.title}"?\n\nThis will remove both the database record and its stored image files. This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        setActionImageId(
            image.id
        );
        setError(null);
        setSuccessMessage(null);

        try {
            const response =
                await apiFetch(
                    `/api/gallery/admin/${image.id}`,
                    {
                        method: 'DELETE',
                    }
                );

            if (!response.ok) {
                throw new Error(
                    'Unable to delete the gallery image.'
                );
            }

            setImages(
                current =>
                    current.filter(
                        item =>
                            item.id !==
                            image.id
                    )
            );

            setSuccessMessage(
                `"${image.title}" has been deleted.`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to delete the gallery image.'
            );
        } finally {
            setActionImageId(
                null
            );
        }
    }

    return (
        <AdminLayout>
            <section className="gallery-images-page">
                <div className="gallery-images-header">
                    <div>
                        <span className="admin-eyebrow">
                            Gallery Management
                        </span>

                        <h1>
                            Gallery Images
                        </h1>

                        <p>
                            Upload, organise and
                            manage images displayed
                            across the church
                            gallery.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={
                            openUpload
                        }
                        disabled={
                            categoriesLoading ||
                            galleryCategories.length ===
                            0
                        }
                    >
                        <span>＋</span>
                        Upload Image
                    </button>
                </div>

                {(error ||
                    categoriesError) && (
                        <div
                            className="admin-message admin-message-error"
                            role="alert"
                        >
                            {error ||
                                categoriesError}
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

                <div className="gallery-image-summary-grid">
                    <div className="gallery-image-summary-card">
                        <span className="gallery-summary-symbol">
                            ▧
                        </span>

                        <div>
                            <strong>
                                {
                                    images.length
                                }
                            </strong>
                            <span>
                                Total Images
                            </span>
                        </div>
                    </div>

                    <div className="gallery-image-summary-card">
                        <span className="gallery-summary-symbol public">
                            ●
                        </span>

                        <div>
                            <strong>
                                {
                                    publicCount
                                }
                            </strong>
                            <span>
                                Public
                            </span>
                        </div>
                    </div>

                    <div className="gallery-image-summary-card">
                        <span className="gallery-summary-symbol private">
                            ●
                        </span>

                        <div>
                            <strong>
                                {
                                    privateCount
                                }
                            </strong>
                            <span>
                                Private
                            </span>
                        </div>
                    </div>

                    <div className="gallery-image-summary-card">
                        <span className="gallery-summary-symbol featured">
                            ★
                        </span>

                        <div>
                            <strong>
                                {
                                    featuredCount
                                }
                            </strong>
                            <span>
                                Featured
                            </span>
                        </div>
                    </div>
                </div>

                <article className="admin-panel gallery-images-panel">
                    <div className="gallery-images-toolbar">
                        <div className="gallery-images-search">
                            <span>⌕</span>

                            <input
                                type="search"
                                value={
                                    searchText
                                }
                                onChange={event =>
                                    setSearchText(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search gallery images..."
                            />
                        </div>

                        <select
                            value={
                                categoryFilter
                            }
                            onChange={event =>
                                setCategoryFilter(
                                    event.target
                                        .value
                                )
                            }
                            aria-label="Filter by category"
                        >
                            <option value="">
                                All Categories
                            </option>

                            {galleryCategories.map(
                                category => (
                                    <option
                                        key={
                                            category.id
                                        }
                                        value={
                                            category.id
                                        }
                                    >
                                        {
                                            category.name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        <select
                            value={
                                visibilityFilter
                            }
                            onChange={event =>
                                setVisibilityFilter(
                                    event.target
                                        .value
                                )
                            }
                            aria-label="Filter by visibility"
                        >
                            <option value="all">
                                All Visibility
                            </option>
                            <option value="public">
                                Public
                            </option>
                            <option value="private">
                                Private
                            </option>
                        </select>

                        <select
                            value={
                                featuredFilter
                            }
                            onChange={event =>
                                setFeaturedFilter(
                                    event.target
                                        .value
                                )
                            }
                            aria-label="Filter by featured status"
                        >
                            <option value="all">
                                All Images
                            </option>
                            <option value="featured">
                                Featured
                            </option>
                            <option value="not-featured">
                                Not Featured
                            </option>
                        </select>
                    </div>

                    <div className="gallery-images-result-heading">
                        <div>
                            <h2>
                                Images
                            </h2>

                            <p>
                                Showing{' '}
                                {
                                    filteredImages.length
                                }{' '}
                                of{' '}
                                {
                                    images.length
                                }{' '}
                                images
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-empty-state">
                            <div className="admin-loading-spinner" />

                            <strong>
                                Loading gallery
                                images...
                            </strong>
                        </div>
                    ) : images.length ===
                        0 ? (
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon">
                                ▧
                            </span>

                            <strong>
                                No gallery images
                                yet
                            </strong>

                            <p>
                                Upload your first
                                church gallery image
                                to begin building the
                                gallery.
                            </p>

                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={
                                    openUpload
                                }
                                disabled={
                                    galleryCategories.length ===
                                    0
                                }
                            >
                                Upload Image
                            </button>
                        </div>
                    ) : filteredImages.length ===
                        0 ? (
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon">
                                ⌕
                            </span>

                            <strong>
                                No matching images
                            </strong>

                            <p>
                                Try changing your
                                search or gallery
                                filters.
                            </p>
                        </div>
                    ) : (
                        <div className="gallery-admin-grid">
                            {filteredImages.map(
                                image => (
                                    <article
                                        key={
                                            image.id
                                        }
                                        className="gallery-admin-card"
                                    >
                                        <div className="gallery-admin-image-wrapper">
                                            <img
                                                src={getImageUrl(
                                                    image
                                                )}
                                                alt={
                                                    image.altText
                                                }
                                                className="gallery-admin-image"
                                            />

                                            <div className="gallery-card-badges">
                                                <span
                                                    className={`gallery-visibility-badge ${image.isPublic
                                                            ? 'public'
                                                            : 'private'
                                                        }`}
                                                >
                                                    {image.isPublic
                                                        ? 'Public'
                                                        : 'Private'}
                                                </span>

                                                {image.isFeatured && (
                                                    <span className="gallery-featured-badge">
                                                        ★
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="gallery-admin-card-body">
                                            <div className="gallery-admin-card-title">
                                                <div>
                                                    <h3>
                                                        {
                                                            image.title
                                                        }
                                                    </h3>

                                                    <span>
                                                        {
                                                            image.categoryName
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {image.description && (
                                                <p className="gallery-admin-description">
                                                    {
                                                        image.description
                                                    }
                                                </p>
                                            )}

                                            <div className="gallery-admin-meta">
                                                <span>
                                                    {
                                                        formatDate(
                                                            image.eventDate
                                                        )
                                                    }
                                                </span>

                                                <span>
                                                    {
                                                        image.width
                                                    }
                                                    ×
                                                    {
                                                        image.height
                                                    }
                                                </span>

                                                <span>
                                                    {
                                                        formatFileSize(
                                                            image.fileSizeBytes
                                                        )
                                                    }
                                                </span>

                                                <span>
                                                    Order:{' '}
                                                    {
                                                        image.displayOrder
                                                    }
                                                </span>
                                            </div>

                                            {image.tags.length >
                                                0 && (
                                                    <div className="gallery-admin-tags">
                                                        {image.tags.map(
                                                            tag => (
                                                                <span
                                                                    key={
                                                                        tag
                                                                    }
                                                                >
                                                                    #
                                                                    {
                                                                        tag
                                                                    }
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                            <div className="gallery-admin-card-actions">
                                                <button
                                                    type="button"
                                                    className="gallery-card-action edit"
                                                    onClick={() =>
                                                        openEdit(
                                                            image
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="gallery-card-action"
                                                    disabled={
                                                        actionImageId ===
                                                        image.id
                                                    }
                                                    onClick={() =>
                                                        void toggleFeatured(
                                                            image
                                                        )
                                                    }
                                                >
                                                    {image.isFeatured
                                                        ? 'Unfeature'
                                                        : 'Feature'}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="gallery-card-action"
                                                    disabled={
                                                        actionImageId ===
                                                        image.id
                                                    }
                                                    onClick={() =>
                                                        void toggleVisibility(
                                                            image
                                                        )
                                                    }
                                                >
                                                    {image.isPublic
                                                        ? 'Make Private'
                                                        : 'Publish'}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="gallery-card-action delete"
                                                    disabled={
                                                        actionImageId ===
                                                        image.id
                                                    }
                                                    onClick={() =>
                                                        void deleteImage(
                                                            image
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </article>
            </section>

            {uploadOpen && (
                <div
                    className="admin-modal-backdrop"
                    role="presentation"
                    onMouseDown={
                        closeUpload
                    }
                >
                    <div
                        className="admin-modal gallery-image-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="gallery-upload-title"
                        onMouseDown={event =>
                            event.stopPropagation()
                        }
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    Gallery
                                    Management
                                </span>

                                <h2 id="gallery-upload-title">
                                    Upload Gallery
                                    Image
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={
                                    closeUpload
                                }
                                disabled={
                                    uploading
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleUpload
                            }
                        >
                            <div className="gallery-upload-area">
                                {uploadPreview ? (
                                    <img
                                        src={
                                            uploadPreview
                                        }
                                        alt="Selected upload preview"
                                    />
                                ) : (
                                    <div className="gallery-upload-placeholder">
                                        <span>
                                            ▧
                                        </span>
                                        <strong>
                                            Select
                                            an
                                            image
                                        </strong>
                                        <small>
                                            JPEG,
                                            PNG
                                            or
                                            WebP
                                        </small>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handleUploadFile
                                    }
                                    required
                                />
                            </div>

                            <div className="gallery-form-grid">
                                <div className="admin-form-group">
                                    <label htmlFor="gallery-upload-title-input">
                                        Title
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="gallery-upload-title-input"
                                        type="text"
                                        value={
                                            uploadForm.title
                                        }
                                        onChange={event =>
                                            setUploadForm(
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
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="gallery-upload-category">
                                        Category
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="gallery-upload-category"
                                        value={
                                            uploadForm.categoryId
                                        }
                                        onChange={event =>
                                            setUploadForm(
                                                current => ({
                                                    ...current,
                                                    categoryId:
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
                                            category
                                        </option>

                                        {galleryCategories.map(
                                            category => (
                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {
                                                        category.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="gallery-form-grid">
                                <div className="admin-form-group">
                                    <label htmlFor="gallery-upload-order">
                                        Display Order
                                    </label>

                                    <input
                                        id="gallery-upload-order"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                            uploadForm.displayOrder
                                        }
                                        onChange={event =>
                                            setUploadForm(
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

                                    <small>
                                        Lower numbers
                                        appear first
                                        within the
                                        gallery.
                                    </small>
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="gallery-upload-date">
                                        Event Date
                                    </label>

                                    <input
                                        id="gallery-upload-date"
                                        type="date"
                                        value={
                                            uploadForm.eventDate
                                        }
                                        onChange={event =>
                                            setUploadForm(
                                                current => ({
                                                    ...current,
                                                    eventDate:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-upload-alt">
                                    Alternative
                                    Text
                                    <span>
                                        *
                                    </span>
                                </label>

                                <input
                                    id="gallery-upload-alt"
                                    type="text"
                                    value={
                                        uploadForm.altText
                                    }
                                    onChange={event =>
                                        setUploadForm(
                                            current => ({
                                                ...current,
                                                altText:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Describe the image for accessibility"
                                    required
                                />

                                <small>
                                    Describe what
                                    appears in the
                                    image for visitors
                                    using screen
                                    readers.
                                </small>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-upload-description">
                                    Description
                                </label>

                                <textarea
                                    id="gallery-upload-description"
                                    rows={3}
                                    value={
                                        uploadForm.description
                                    }
                                    onChange={event =>
                                        setUploadForm(
                                            current => ({
                                                ...current,
                                                description:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-upload-photographer">
                                    Photographer
                                </label>

                                <input
                                    id="gallery-upload-photographer"
                                    type="text"
                                    value={
                                        uploadForm.photographer
                                    }
                                    onChange={event =>
                                        setUploadForm(
                                            current => ({
                                                ...current,
                                                photographer:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-upload-tags">
                                    Tags
                                </label>

                                <input
                                    id="gallery-upload-tags"
                                    type="text"
                                    value={
                                        uploadForm.tags
                                    }
                                    onChange={event =>
                                        setUploadForm(
                                            current => ({
                                                ...current,
                                                tags:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="worship, youth, easter"
                                />

                                <small>
                                    Separate tags
                                    with commas.
                                </small>
                            </div>

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={
                                        closeUpload
                                    }
                                    disabled={
                                        uploading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-primary-button"
                                    disabled={
                                        uploading
                                    }
                                >
                                    {uploading
                                        ? 'Uploading...'
                                        : 'Upload Image'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingImage && (
                <div
                    className="admin-modal-backdrop"
                    role="presentation"
                    onMouseDown={
                        closeEdit
                    }
                >
                    <div
                        className="admin-modal gallery-image-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="gallery-edit-title"
                        onMouseDown={event =>
                            event.stopPropagation()
                        }
                    >
                        <div className="admin-modal-header">
                            <div>
                                <span className="admin-eyebrow">
                                    Edit Gallery
                                    Image
                                </span>

                                <h2 id="gallery-edit-title">
                                    {
                                        editingImage.title
                                    }
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={
                                    closeEdit
                                }
                                disabled={
                                    savingEdit
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleEdit
                            }
                        >
                            <div className="gallery-edit-current-image">
                                <img
                                    src={
                                        replacementPreview ||
                                        getImageUrl(
                                            editingImage
                                        )
                                    }
                                    alt={
                                        editingImage.altText
                                    }
                                />

                                <div>
                                    <strong>
                                        {
                                            editingImage.title
                                        }
                                    </strong>

                                    <span>
                                        Replace the
                                        image below
                                        only if a new
                                        photograph is
                                        required.
                                    </span>
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-replacement-image">
                                    Replace Image
                                </label>

                                <input
                                    id="gallery-replacement-image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handleReplacementFile
                                    }
                                />

                                <small>
                                    Leave empty to
                                    keep the current
                                    image.
                                </small>
                            </div>

                            <div className="gallery-form-grid">
                                <div className="admin-form-group">
                                    <label htmlFor="gallery-edit-title-input">
                                        Title
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="gallery-edit-title-input"
                                        type="text"
                                        value={
                                            editForm.title
                                        }
                                        onChange={event =>
                                            setEditForm(
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
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="gallery-edit-category">
                                        Category
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="gallery-edit-category"
                                        value={
                                            editForm.categoryId
                                        }
                                        onChange={event =>
                                            setEditForm(
                                                current => ({
                                                    ...current,
                                                    categoryId:
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
                                            category
                                        </option>

                                        {galleryCategories.map(
                                            category => (
                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {
                                                        category.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="gallery-form-grid">
                                <div className="admin-form-group">
                                    <label htmlFor="gallery-edit-order">
                                        Display Order
                                    </label>

                                    <input
                                        id="gallery-edit-order"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                            editForm.displayOrder
                                        }
                                        onChange={event =>
                                            setEditForm(
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

                                    <small>
                                        Lower numbers
                                        appear first.
                                    </small>
                                </div>

                                <div className="admin-form-group">
                                    <label htmlFor="gallery-edit-date">
                                        Event Date
                                    </label>

                                    <input
                                        id="gallery-edit-date"
                                        type="date"
                                        value={
                                            editForm.eventDate
                                        }
                                        onChange={event =>
                                            setEditForm(
                                                current => ({
                                                    ...current,
                                                    eventDate:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-edit-alt">
                                    Alternative
                                    Text
                                    <span>
                                        *
                                    </span>
                                </label>

                                <input
                                    id="gallery-edit-alt"
                                    type="text"
                                    value={
                                        editForm.altText
                                    }
                                    onChange={event =>
                                        setEditForm(
                                            current => ({
                                                ...current,
                                                altText:
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
                                <label htmlFor="gallery-edit-description">
                                    Description
                                </label>

                                <textarea
                                    id="gallery-edit-description"
                                    rows={3}
                                    value={
                                        editForm.description
                                    }
                                    onChange={event =>
                                        setEditForm(
                                            current => ({
                                                ...current,
                                                description:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-edit-photographer">
                                    Photographer
                                </label>

                                <input
                                    id="gallery-edit-photographer"
                                    type="text"
                                    value={
                                        editForm.photographer
                                    }
                                    onChange={event =>
                                        setEditForm(
                                            current => ({
                                                ...current,
                                                photographer:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="gallery-edit-tags">
                                    Tags
                                </label>

                                <input
                                    id="gallery-edit-tags"
                                    type="text"
                                    value={
                                        editForm.tags
                                    }
                                    onChange={event =>
                                        setEditForm(
                                            current => ({
                                                ...current,
                                                tags:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="worship, youth, easter"
                                />

                                <small>
                                    Separate tags
                                    with commas.
                                    Clear this field
                                    to remove all
                                    tags.
                                </small>
                            </div>

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={
                                        closeEdit
                                    }
                                    disabled={
                                        savingEdit
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-primary-button"
                                    disabled={
                                        savingEdit
                                    }
                                >
                                    {savingEdit
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default GalleryImage;
