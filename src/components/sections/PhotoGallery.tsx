import { useState, useEffect } from 'react';

export default function PhotoGallery() {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [scrollPosition, setScrollPosition] = useState(0);

    const galleryImages = [
        {
            src: "/IMG-01.jpg",
            alt: "Worship Service",
            category: "Services"
        },
        {
            src: "/IMG-02.jpg",
            alt: "Community Gathering",
            category: "Fellowship"
        },
        {
            src: "/IMG-03.jpg",
            alt: "Youth Ministry",
            category: "Youth"
        },
        {
            src: "/IMG-04.jpg",
            alt: "Church Event",
            category: "Events"
        },
        {
            src: "/IMG-05.jpg",
            alt: "Prayer Meeting",
            category: "Prayer"
        },
        {
            src: "/IMG-06.jpg",
            alt: "Sunday Service",
            category: "Services"
        },
        {
            src: "/IMG-07.jpg",
            alt: "Baptism",
            category: "Sacraments"
        },
        {
            src: "/IMG-08.jpg",
            alt: "Community Outreach",
            category: "Outreach"
        }
    ];

    // Auto-scroll
    useEffect(() => {
        const timer = setInterval(() => {
            setScrollPosition((prev) => {
                const maxScroll = Math.max(0, galleryImages.length - 5);
                return prev >= maxScroll ? 0 : prev + 1;
            });
        }, 3000);

        return () => clearInterval(timer);
    }, [galleryImages.length]);

    const scrollToIndex = (index: number) => {
        const maxScroll = Math.max(0, galleryImages.length - 5);
        const newPosition = Math.min(index, maxScroll);
        setScrollPosition(newPosition);
    };

    return (
        <>
            <section id="photo-gallery" className="section photo-gallery-section">
                <div className="container">
                    {/* Header */}
                    <div className="gallery-header">
                        <span className="gallery-tag">CAPTURED MOMENTS</span>
                        <h2 className="gallery-title">Photo Gallery</h2>
                        <div className="title-divider-center"></div>
                        <p className="gallery-subtitle">
                            Glimpses of our vibrant community in worship, fellowship, and service
                        </p>
                    </div>

                    {/* Gallery Container */}
                    <div className="gallery-scroll-container">
                        <div
                            className="gallery-track"
                            style={{ transform: `translateX(-${scrollPosition * (100 / 5)}%)` }}
                        >
                            {galleryImages.map((image, index) => (
                                <div
                                    key={index}
                                    className="gallery-item-small"
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <div className="gallery-image-wrapper-small">
                                        <img
                                            src={image.src}
                                            alt={image.alt}
                                            className="gallery-image-small"/>
                                        <div className="gallery-overlay-small">
                                            <span className="overlay-icon-small">🔍</span>
                                            <span className="overlay-category-small">{image.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            className="gallery-nav-btn prev"
                            onClick={() => setScrollPosition(Math.max(0, scrollPosition - 1))}
                            disabled={scrollPosition === 0}
                        >
                            ‹
                        </button>
                        <button
                            className="gallery-nav-btn next"
                            onClick={() => setScrollPosition(Math.min(galleryImages.length - 5, scrollPosition + 1))}
                            disabled={scrollPosition >= galleryImages.length - 5}
                        >
                            ›
                        </button>
                    </div>

                    {/* Dots Indicator */}
                    <div className="gallery-dots">
                        {galleryImages.map((_, index) => (
                            <button
                                key={index}
                                className={`gallery-dot ${index === scrollPosition ? 'active' : ''}`}
                                onClick={() => scrollToIndex(index)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            {selectedImage !== null && (
                <div
                    className="lightbox-overlay"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="lightbox-close"
                            onClick={() => setSelectedImage(null)}
                        >
                            ✕
                        </button>

                        <img
                            src={galleryImages[selectedImage].src}
                            alt={galleryImages[selectedImage].alt}
                            className="lightbox-image"
                        />

                        <div className="lightbox-info">
                            <span className="lightbox-category">
                                {galleryImages[selectedImage].category}
                            </span>
                            <h3 className="lightbox-title">
                                {galleryImages[selectedImage].alt}
                            </h3>
                        </div>

                        {/* Navigation */}
                        <button
                            className="lightbox-nav prev"
                            onClick={() => setSelectedImage((prev) =>
                                prev === 0 ? galleryImages.length - 1 : prev - 1
                            )}
                        >
                            ‹
                        </button>
                        <button
                            className="lightbox-nav next"
                            onClick={() => setSelectedImage((prev) =>
                                prev === galleryImages.length - 1 ? 0 : prev + 1
                            )}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}