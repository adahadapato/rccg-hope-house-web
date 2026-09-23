import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties
} from 'react';

import useGallery, {
    getGalleryImageDetail,
    type GalleryFeedImage,
    type GalleryImageDetail
} from '@/hooks/useGallery';

import { apiUrl } from '@/api/api';

const INITIAL_VISIBLE_IMAGES = 9;
const LOAD_MORE_COUNT = 9;

function getImageUrl(path: string | null | undefined): string {
    if (!path) {
        return '';
    }

    if (
        path.startsWith('http://') ||
        path.startsWith('https://')
    ) {
        return path;
    }

    return apiUrl(path);
}

function formatEventDate(
    date: string | null | undefined
): string | null {
    if (!date) {
        return null;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(parsedDate);
}

function getAspectRatioStyle(
    image: GalleryFeedImage
): CSSProperties {
    const safeWidth =
        image.width > 0 ? image.width : 4;

    const safeHeight =
        image.height > 0 ? image.height : 3;

    return {
        '--gallery-aspect-ratio':
            safeWidth / safeHeight
    } as CSSProperties;
}

export default function PhotoGallery() {
    const {
        images,
        loading,
        error,
        refresh
    } = useGallery();

    const [selectedCategory, setSelectedCategory] =
        useState('All');

    const [visibleCount, setVisibleCount] =
        useState(INITIAL_VISIBLE_IMAGES);

    const [selectedImageId, setSelectedImageId] =
        useState<string | null>(null);

    const [selectedDetail, setSelectedDetail] =
        useState<GalleryImageDetail | null>(null);

    const [detailLoading, setDetailLoading] =
        useState(false);

    const [detailError, setDetailError] =
        useState<string | null>(null);

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(
            new Set(
                images
                    .map((image) => image.categoryName)
                    .filter(
                        (category): category is string =>
                            Boolean(category?.trim())
                    )
            )
        ).sort((a, b) => a.localeCompare(b));

        return ['All', ...uniqueCategories];
    }, [images]);

    const filteredImages = useMemo(() => {
        if (selectedCategory === 'All') {
            return images;
        }

        return images.filter(
            (image) =>
                image.categoryName === selectedCategory
        );
    }, [images, selectedCategory]);

    const featuredImages = useMemo(() => {
        const explicitlyFeatured = images.filter(
            (image) => image.isFeatured
        );

        if (explicitlyFeatured.length > 0) {
            return explicitlyFeatured;
        }

        return images.length > 0
            ? [images[0]]
            : [];
    }, [images]);

    const visibleImages = useMemo(
        () => filteredImages.slice(0, visibleCount),
        [filteredImages, visibleCount]
    );

    const hasMultipleFeaturedImages =
        featuredImages.length > 1;

    const currentSelectedFeedImage = useMemo(
        () =>
            selectedImageId
                ? images.find(
                    (image) =>
                        image.id === selectedImageId
                ) ?? null
                : null,
        [images, selectedImageId]
    );

    const handleCategoryChange = useCallback(
        (category: string) => {
            setSelectedCategory(category);
            setVisibleCount(INITIAL_VISIBLE_IMAGES);
        },
        []
    );

    const featuredTrackRef =
        useRef<HTMLDivElement | null>(null);

    const featuredPausedRef =
        useRef(false);

    const featuredCarouselImages = useMemo(
        () =>
            hasMultipleFeaturedImages
                ? [
                    ...featuredImages,
                    ...featuredImages
                ]
                : featuredImages,
        [
            featuredImages,
            hasMultipleFeaturedImages
        ]
    );

    const getFeaturedLoopWidth = useCallback(() => {
        const track = featuredTrackRef.current;

        if (
            !track ||
            !hasMultipleFeaturedImages
        ) {
            return 0;
        }

        const cards = Array.from(
            track.querySelectorAll<HTMLElement>(
                '.featured-gallery-card'
            )
        );

        if (
            cards.length <=
            featuredImages.length
        ) {
            return 0;
        }

        return (
            cards[featuredImages.length]
                .offsetLeft -
            cards[0].offsetLeft
        );
    }, [
        featuredImages.length,
        hasMultipleFeaturedImages
    ]);

    useEffect(() => {
        const track = featuredTrackRef.current;

        if (
            !track ||
            !hasMultipleFeaturedImages
        ) {
            return;
        }

        let cancelled = false;

        const initialise = () => {
            if (cancelled) {
                return;
            }

            const loopWidth =
                getFeaturedLoopWidth();

            if (loopWidth > 0) {
                track.scrollLeft = 0;
            }
        };

        const frame =
            window.requestAnimationFrame(
                initialise
            );

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame);
        };
    }, [
        getFeaturedLoopWidth,
        hasMultipleFeaturedImages
    ]);

    useEffect(() => {
        const track = featuredTrackRef.current;

        if (
            !track ||
            !hasMultipleFeaturedImages
        ) {
            return;
        }

        const AUTO_SCROLL_INTERVAL_MS = 35;
        const AUTO_SCROLL_STEP_PX = 1;

        const timer = window.setInterval(() => {
            if (featuredPausedRef.current) {
                return;
            }

            const loopWidth =
                getFeaturedLoopWidth();

            if (loopWidth <= 0) {
                return;
            }

            const nextPosition =
                track.scrollLeft +
                AUTO_SCROLL_STEP_PX;

            if (nextPosition >= loopWidth) {
                track.scrollLeft =
                    nextPosition - loopWidth;
            } else {
                track.scrollLeft =
                    nextPosition;
            }
        }, AUTO_SCROLL_INTERVAL_MS);

        return () => {
            window.clearInterval(timer);
        };
    }, [
        getFeaturedLoopWidth,
        hasMultipleFeaturedImages
    ]);

    const moveFeaturedByCard = useCallback(
        (
            direction:
                | 'previous'
                | 'next'
        ) => {
            const track =
                featuredTrackRef.current;

            if (!track) {
                return;
            }

            const loopWidth =
                getFeaturedLoopWidth();

            if (loopWidth <= 0) {
                return;
            }

            const cards = Array.from(
                track.querySelectorAll<HTMLElement>(
                    '.featured-gallery-card'
                )
            );

            if (cards.length === 0) {
                return;
            }

            const currentLeft =
                track.scrollLeft;

            let targetLeft: number;

            if (direction === 'next') {
                const nextCard =
                    cards.find(
                        (card) =>
                            card.offsetLeft >
                            currentLeft + 12
                    );

                targetLeft =
                    nextCard
                        ? nextCard.offsetLeft
                        : currentLeft + 280;
            } else {
                const previousCards =
                    cards.filter(
                        (card) =>
                            card.offsetLeft <
                            currentLeft - 12
                    );

                const previousCard =
                    previousCards[
                    previousCards.length - 1
                    ];

                targetLeft =
                    previousCard
                        ? previousCard.offsetLeft
                        : currentLeft - 280;
            }

            if (targetLeft >= loopWidth) {
                targetLeft -= loopWidth;
            }

            if (targetLeft < 0) {
                targetLeft += loopWidth;
            }

            track.scrollTo({
                left: targetLeft,
                behavior: 'smooth'
            });
        },
        [getFeaturedLoopWidth]
    );

    const showPreviousFeatured =
        useCallback(() => {
            moveFeaturedByCard(
                'previous'
            );
        }, [moveFeaturedByCard]);

    const showNextFeatured =
        useCallback(() => {
            moveFeaturedByCard('next');
        }, [moveFeaturedByCard]);

    const pauseFeaturedCarousel =
        useCallback(() => {
            featuredPausedRef.current =
                true;
        }, []);

    const resumeFeaturedCarousel =
        useCallback(() => {
            featuredPausedRef.current =
                false;
        }, []);

    const openLightbox = useCallback(
        async (imageId: string) => {
            setSelectedImageId(imageId);
            setSelectedDetail(null);
            setDetailError(null);
            setDetailLoading(true);

            document.body.classList.add(
                'gallery-lightbox-open'
            );

            try {
                const detail =
                    await getGalleryImageDetail(
                        imageId
                    );

                setSelectedDetail(detail);
            } catch (err) {
                console.error(
                    'Unable to retrieve gallery image detail:',
                    err
                );

                setDetailError(
                    'The full-size photograph is temporarily unavailable. The preview is shown instead.'
                );
            } finally {
                setDetailLoading(false);
            }
        },
        []
    );

    const closeLightbox = useCallback(() => {
        setSelectedImageId(null);
        setSelectedDetail(null);
        setDetailError(null);
        setDetailLoading(false);

        document.body.classList.remove(
            'gallery-lightbox-open'
        );
    }, []);

    const navigateLightbox = useCallback(
        (direction: 'previous' | 'next') => {
            if (
                !selectedImageId ||
                filteredImages.length === 0
            ) {
                return;
            }

            const currentIndex =
                filteredImages.findIndex(
                    (image) =>
                        image.id === selectedImageId
                );

            if (currentIndex === -1) {
                return;
            }

            let nextIndex: number;

            if (direction === 'previous') {
                nextIndex =
                    currentIndex === 0
                        ? filteredImages.length - 1
                        : currentIndex - 1;
            } else {
                nextIndex =
                    currentIndex ===
                        filteredImages.length - 1
                        ? 0
                        : currentIndex + 1;
            }

            void openLightbox(
                filteredImages[nextIndex].id
            );
        },
        [
            filteredImages,
            openLightbox,
            selectedImageId
        ]
    );

    useEffect(() => {
        if (!selectedImageId) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowLeft') {
                navigateLightbox('previous');
            } else if (event.key === 'ArrowRight') {
                navigateLightbox('next');
            }
        };

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [
        selectedImageId,
        closeLightbox,
        navigateLightbox
    ]);

    useEffect(() => {
        return () => {
            document.body.classList.remove(
                'gallery-lightbox-open'
            );
        };
    }, []);

    const selectedPosition =
        selectedImageId
            ? filteredImages.findIndex(
                (image) =>
                    image.id === selectedImageId
            )
            : -1;

    const lightboxImagePath =
        selectedDetail?.imagePath ??
        currentSelectedFeedImage?.thumbnailPath ??
        '';

    const lightboxTitle =
        selectedDetail?.title ??
        currentSelectedFeedImage?.title ??
        '';

    const lightboxAltText =
        selectedDetail?.altText ??
        currentSelectedFeedImage?.altText ??
        lightboxTitle;

    const lightboxCategory =
        selectedDetail?.categoryName ??
        currentSelectedFeedImage?.categoryName;

    const lightboxEventDate =
        selectedDetail?.eventDate ??
        currentSelectedFeedImage?.eventDate;

    const lightboxTags =
        selectedDetail?.tags ??
        currentSelectedFeedImage?.tags ??
        [];

    return (
        <>
            <section
                id="photo-gallery"
                className="section photo-gallery-section"
            >
                <div className="container">
                    <div className="gallery-header">
                        <span className="gallery-tag">
                            CAPTURED MOMENTS
                        </span>

                        <h2 className="gallery-title">
                            Photo Gallery
                        </h2>

                        <div className="title-divider-center" />

                        <p className="gallery-subtitle">
                            Glimpses of our vibrant community
                            in worship, fellowship, and service
                        </p>
                    </div>

                    {loading && (
                        <div className="public-gallery-status">
                            <div
                                className="gallery-loading-spinner"
                                aria-hidden="true"
                            />

                            <p>
                                Loading our captured moments...
                            </p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="public-gallery-status gallery-error-state">
                            <h3>
                                We couldn't load the gallery
                            </h3>

                            <p>{error}</p>

                            <button
                                type="button"
                                className="gallery-retry-button"
                                onClick={() =>
                                    void refresh()
                                }
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        images.length === 0 && (
                            <div className="public-gallery-status">
                                <h3>
                                    New moments are coming soon
                                </h3>

                                <p>
                                    Photographs from our church
                                    family and events will appear
                                    here.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        images.length > 0 && (
                            <>
                                {featuredImages.length > 0 && (
                                    <section className="featured-gallery-section">
                                        <div className="gallery-section-heading">
                                            <span className="gallery-section-eyebrow">
                                                HIGHLIGHTS
                                            </span>

                                            <h3>
                                                Featured Moments
                                            </h3>

                                            <p>
                                                A glimpse into life,
                                                worship and fellowship
                                                at Hope House.
                                            </p>
                                        </div>

                                        <div className="featured-gallery">
                                            {hasMultipleFeaturedImages && (
                                                <button
                                                    type="button"
                                                    className="featured-gallery-nav featured-gallery-prev"
                                                    onClick={
                                                        showPreviousFeatured
                                                    }
                                                    aria-label="Scroll featured photographs left"
                                                >
                                                    ‹
                                                </button>
                                            )}

                                            <div
                                                ref={featuredTrackRef}
                                                className="featured-gallery-track"
                                            >
                                                {featuredCarouselImages.map(
                                                    (image, carouselIndex) => {
                                                        const date =
                                                            formatEventDate(
                                                                image.eventDate
                                                            );

                                                        return (
                                                            <button
                                                                key={`${image.id}-${carouselIndex}`}
                                                                type="button"
                                                                className="featured-gallery-card"
                                                                style={
                                                                    getAspectRatioStyle(
                                                                        image
                                                                    )
                                                                }
                                                                onMouseEnter={
                                                                    pauseFeaturedCarousel
                                                                }
                                                                onMouseLeave={
                                                                    resumeFeaturedCarousel
                                                                }
                                                                onFocus={
                                                                    pauseFeaturedCarousel
                                                                }
                                                                onBlur={
                                                                    resumeFeaturedCarousel
                                                                }
                                                                onClick={() =>
                                                                    void openLightbox(
                                                                        image.id
                                                                    )
                                                                }
                                                                aria-label={`Open ${image.title}`}
                                                            >
                                                                <img
                                                                    src={getImageUrl(
                                                                        image.thumbnailPath
                                                                    )}
                                                                    alt={
                                                                        image.altText ||
                                                                        image.title
                                                                    }
                                                                />

                                                                <div className="featured-gallery-shade" />

                                                                <div className="featured-gallery-caption">
                                                                    {image.categoryName && (
                                                                        <span className="featured-gallery-category">
                                                                            {
                                                                                image.categoryName
                                                                            }
                                                                        </span>
                                                                    )}

                                                                    <h4>
                                                                        {
                                                                            image.title
                                                                        }
                                                                    </h4>

                                                                    {date && (
                                                                        <span className="featured-gallery-date">
                                                                            {
                                                                                date
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>

                                            {hasMultipleFeaturedImages && (
                                                <button
                                                    type="button"
                                                    className="featured-gallery-nav featured-gallery-next"
                                                    onClick={
                                                        showNextFeatured
                                                    }
                                                    aria-label="Scroll featured photographs right"
                                                >
                                                    ›
                                                </button>
                                            )}
                                        </div>
                                    </section>
                                )}

                                <section className="explore-gallery-section">
                                    <div className="gallery-section-heading">
                                        <span className="gallery-section-eyebrow">
                                            OUR CHURCH FAMILY
                                        </span>

                                        <h3>
                                            Explore Our Gallery
                                        </h3>

                                        <p>
                                            Browse moments from our
                                            services, ministries,
                                            celebrations, outreach and
                                            community.
                                        </p>
                                    </div>

                                    <div
                                        className="gallery-category-filters"
                                        aria-label="Gallery categories"
                                    >
                                        {categories.map(
                                            (category) => (
                                                <button
                                                    key={
                                                        category
                                                    }
                                                    type="button"
                                                    className={`gallery-filter-button ${selectedCategory ===
                                                        category
                                                        ? 'active'
                                                        : ''
                                                        }`}
                                                    onClick={() =>
                                                        handleCategoryChange(
                                                            category
                                                        )
                                                    }
                                                >
                                                    {category}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {filteredImages.length ===
                                        0 ? (
                                        <div className="public-gallery-status gallery-category-empty">
                                            <h3>
                                                No photographs yet
                                            </h3>

                                            <p>
                                                There are currently
                                                no public photographs
                                                in this category.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="public-gallery-grid">
                                                {visibleImages.map(
                                                    (
                                                        image,
                                                        index
                                                    ) => (
                                                        <GalleryCard
                                                            key={
                                                                image.id
                                                            }
                                                            image={
                                                                image
                                                            }
                                                            index={
                                                                index
                                                            }
                                                            onOpen={() =>
                                                                void openLightbox(
                                                                    image.id
                                                                )
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>

                                            <div className="gallery-results-summary">
                                                Showing{' '}
                                                {Math.min(
                                                    visibleCount,
                                                    filteredImages.length
                                                )}{' '}
                                                of{' '}
                                                {
                                                    filteredImages.length
                                                }{' '}
                                                photographs
                                            </div>

                                            {visibleCount <
                                                filteredImages.length && (
                                                    <div className="gallery-load-more-wrapper">
                                                        <button
                                                            type="button"
                                                            className="gallery-load-more-button"
                                                            onClick={() =>
                                                                setVisibleCount(
                                                                    (
                                                                        current
                                                                    ) =>
                                                                        current +
                                                                        LOAD_MORE_COUNT
                                                                )
                                                            }
                                                        >
                                                            Load More
                                                            Photos
                                                        </button>
                                                    </div>
                                                )}
                                        </>
                                    )}
                                </section>
                            </>
                        )}
                </div>
            </section>

            {selectedImageId &&
                currentSelectedFeedImage && (
                    <div
                        className="lightbox-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Gallery photograph"
                        onClick={closeLightbox}
                    >
                        <div
                            className="lightbox-content"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <div className="lightbox-topbar">
                                <span className="lightbox-counter">
                                    {selectedPosition >= 0
                                        ? selectedPosition + 1
                                        : 1}{' '}
                                    / {filteredImages.length}
                                </span>

                                <button
                                    type="button"
                                    className="lightbox-close"
                                    onClick={closeLightbox}
                                    aria-label="Close gallery"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="lightbox-image-area">
                                {filteredImages.length >
                                    1 && (
                                        <button
                                            type="button"
                                            className="lightbox-nav prev"
                                            onClick={() =>
                                                navigateLightbox(
                                                    'previous'
                                                )
                                            }
                                            aria-label="Previous photograph"
                                        >
                                            ‹
                                        </button>
                                    )}

                                <img
                                    src={getImageUrl(
                                        lightboxImagePath
                                    )}
                                    alt={lightboxAltText}
                                    className="lightbox-image"
                                />

                                {detailLoading && (
                                    <div className="lightbox-loading">
                                        Loading full-size
                                        photograph...
                                    </div>
                                )}

                                {filteredImages.length >
                                    1 && (
                                        <button
                                            type="button"
                                            className="lightbox-nav next"
                                            onClick={() =>
                                                navigateLightbox(
                                                    'next'
                                                )
                                            }
                                            aria-label="Next photograph"
                                        >
                                            ›
                                        </button>
                                    )}
                            </div>

                            <div className="lightbox-info">
                                <div className="lightbox-meta-row">
                                    {lightboxCategory && (
                                        <span className="lightbox-category">
                                            {
                                                lightboxCategory
                                            }
                                        </span>
                                    )}

                                    {formatEventDate(
                                        lightboxEventDate
                                    ) && (
                                            <span className="lightbox-date">
                                                {formatEventDate(
                                                    lightboxEventDate
                                                )}
                                            </span>
                                        )}
                                </div>

                                <h3 className="lightbox-title">
                                    {lightboxTitle}
                                </h3>

                                {selectedDetail?.description && (
                                    <p className="lightbox-description">
                                        {
                                            selectedDetail.description
                                        }
                                    </p>
                                )}

                                {selectedDetail?.photographer && (
                                    <p className="lightbox-photographer">
                                        Photo by{' '}
                                        <strong>
                                            {
                                                selectedDetail.photographer
                                            }
                                        </strong>
                                    </p>
                                )}

                                {lightboxTags.length >
                                    0 && (
                                        <div className="lightbox-tags">
                                            {lightboxTags.map(
                                                (tag) => (
                                                    <span
                                                        key={tag}
                                                        className="lightbox-tag"
                                                    >
                                                        #{tag}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}

                                {detailError && (
                                    <p className="lightbox-detail-warning">
                                        {detailError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
}

interface GalleryCardProps {
    image: GalleryFeedImage;
    index: number;
    onOpen: () => void;
}

function GalleryCard({
    image,
    index,
    onOpen
}: GalleryCardProps) {
    const date = formatEventDate(
        image.eventDate
    );

    return (
        <button
            type="button"
            className={`public-gallery-card gallery-card-${index % 5
                }`}
            style={getAspectRatioStyle(image)}
            onClick={onOpen}
            aria-label={`Open ${image.title}`}
        >
            <div className="public-gallery-image-wrapper">
                <img
                    src={getImageUrl(
                        image.thumbnailPath
                    )}
                    alt={
                        image.altText ||
                        image.title
                    }
                    className="public-gallery-image"
                    loading="lazy"
                />

                <div className="public-gallery-overlay">
                    <span className="public-gallery-view-icon">
                        ⤢
                    </span>

                    <span>
                        View Photograph
                    </span>
                </div>
            </div>

            <div className="public-gallery-card-info">
                {image.categoryName && (
                    <span className="public-gallery-card-category">
                        {image.categoryName}
                    </span>
                )}

                <h4>{image.title}</h4>

                {date && (
                    <span className="public-gallery-card-date">
                        {date}
                    </span>
                )}
            </div>
        </button>
    );
}