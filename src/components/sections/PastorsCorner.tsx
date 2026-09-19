import { apiFetch } from '@/api/api';
import { useState, useEffect, useRef, useCallback } from 'react';

// ==================== Types matching the backend DTOs ====================

interface StructuredFirstPoint {
    title: string;
    content?: string | null;
    bullets?: string[] | null;
}

interface StructuredPrefaceSection {
    mainHeading: string;
    preamble: string;
    subHeading: string;
}

interface StructuredDetailedLesson {
    title: string;
    bullets: string[];
}

interface StructuredContent {
    firstPoints?: StructuredFirstPoint[] | null;
    prefaceSection?: StructuredPrefaceSection | null;
    detailedLessons?: StructuredDetailedLesson[] | null;
}

interface PastorPostDto {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    category: string;
    introHeading: string | null;
    introText: string | null;
    structuredContent: StructuredContent | null;
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

interface PastorPostFeedDto {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    coverImageData: string | null;
    authorName: string;
    publishedDate: string;
    isPinned: boolean;
    isFeatured: boolean;
    themeOfTheYearId: string;
    themeTitle: string | null;
}

export default function PastorsCorner() {
    const [feed, setFeed] = useState<PastorPostFeedDto[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState<string | null>(null);

    const [activePost, setActivePost] = useState<PastorPostDto | null>(null);
    const [articleLoading, setArticleLoading] = useState(false);

    const [siblings, setSiblings] = useState<PastorPostFeedDto[]>([]);
    const [siblingsLoading, setSiblingsLoading] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);

    const popupRef = useRef<HTMLDivElement | null>(null);

    // ---- Load the public feed on mount ----
    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                setFeedLoading(true);
                setFeedError(null);
                const res = await apiFetch('/api/pastor-posts?skip=0&take=10', { signal: controller.signal });
                if (!res.ok) throw new Error(`Failed to load articles (${res.status})`);
                const data: PastorPostFeedDto[] = await res.json();
                setFeed(data);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setFeedError('Unable to load articles right now. Please try again later.');
                }
            } finally {
                setFeedLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

    // ---- Fetch full article + its theme siblings ----
    const openArticle = useCallback(async (postId: string) => {
        setArticleLoading(true);
        setPopupOpen(false);
        try {
            const res = await apiFetch(`/api/pastor-posts/${postId}`);
            if (!res.ok) throw new Error(`Failed to load article (${res.status})`);
            const post: PastorPostDto = await res.json();
            setActivePost(post);

            setSiblingsLoading(true);
            const sibRes = await apiFetch(`/api/pastor-posts/${postId}/siblings`);
            if (sibRes.ok) {
                const sibs: PastorPostFeedDto[] = await sibRes.json();
                setSiblings(sibs);
            } else {
                setSiblings([]);
            }
        } catch {
            setActivePost(null);
        } finally {
            setArticleLoading(false);
            setSiblingsLoading(false);
        }
    }, []);

    const closeModal = () => {
        setActivePost(null);
        setSiblings([]);
        setPopupOpen(false);
    };

    // ---- Escape key + body scroll lock, same pattern as before ----
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (popupOpen) setPopupOpen(false);
                else closeModal();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [popupOpen]);

    useEffect(() => {
        document.body.style.overflow = activePost ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [activePost]);

    // ---- Close the sibling popup on outside click ----
    useEffect(() => {
        if (!popupOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setPopupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [popupOpen]);

    const hasSiblings = siblings.length > 0;

    return (
        <section id="pastors-corner" className="section pastors-corner-section">
            <div className="pastors-header">
                <div className="pastors-header-content">
                    <h1 className="pastors-title">PASTOR'S CORNER</h1>
                    <p className="pastors-subtitle">Articles &amp; teaching from the pulpit</p>
                </div>
            </div>

            <div className="container">
                {feedLoading && <p className="preview-excerpt">Loading articles…</p>}
                {feedError && <p className="error-msg">{feedError}</p>}

                {!feedLoading && !feedError && feed.length === 0 && (
                    <p className="preview-excerpt">No articles have been published yet — check back soon.</p>
                )}

                {!feedLoading && !feedError && feed.length > 0 && (
                    <div className="article-card">
                        <div className="article-preview">
                            <div className="preview-header">
                                <span className="article-category">
                                    {feed[0].themeTitle ?? feed[0].category}
                                </span>
                                <h2 className="article-title">{feed[0].title}</h2>
                            </div>
                            <div className="preview-content">
                                <p className="preview-excerpt">{feed[0].excerpt}</p>
                            </div>
                            <button
                                className="btn-read-full"
                                onClick={() => openArticle(feed[0].id)}
                                disabled={articleLoading}
                            >
                                <span>📖</span> Read Full Article <span className="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Article Modal */}
            {activePost && (
                <div className="article-modal-overlay" onClick={closeModal}>
                    <div className="article-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closeModal} aria-label="Close">✕</button>

                        <div className="modal-article-header">
                            <span className="article-category">
                                {activePost.themeTitle ?? activePost.category}
                            </span>

                            {/* Heading with hover/tap popup listing other topics under this theme */}
                            <div
                                className="article-title-popup-wrapper"
                                ref={popupRef}
                                onMouseEnter={() => hasSiblings && setPopupOpen(true)}
                                onMouseLeave={() => setPopupOpen(false)}
                            >
                                <h2
                                    className="article-title article-title-interactive"
                                    onClick={() => hasSiblings && setPopupOpen((o) => !o)}
                                    role={hasSiblings ? 'button' : undefined}
                                    tabIndex={hasSiblings ? 0 : undefined}
                                    aria-haspopup={hasSiblings ? 'listbox' : undefined}
                                    aria-expanded={hasSiblings ? popupOpen : undefined}
                                >
                                    {activePost.title}
                                    {hasSiblings && <span className="title-popup-caret">▾</span>}
                                </h2>

                                {popupOpen && hasSiblings && (
                                    <div className="topic-popup" role="listbox">
                                        <div className="topic-popup-label">
                                            Other topics under {activePost.themeTitle ?? 'this theme'}
                                        </div>
                                        {siblingsLoading ? (
                                            <div className="topic-popup-item topic-popup-loading">Loading…</div>
                                        ) : (
                                            siblings.map((sib) => (
                                                <button
                                                    key={sib.id}
                                                    className="topic-popup-item"
                                                    role="option"
                                                    onClick={() => openArticle(sib.id)}
                                                >
                                                    {sib.title}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="article-divider"></div>
                            {activePost.bibleReference && (
                                <p className="article-scripture">{activePost.bibleReference}</p>
                            )}
                        </div>

                        <div className="modal-article-body">
                            {activePost.introText && (
                                <div className="intro-section">
                                    <h3 className="intro-heading">
                                        {activePost.introHeading ?? 'INTRODUCTION'}
                                    </h3>
                                    <p className="intro-text">{activePost.introText}</p>
                                </div>
                            )}

                            {activePost.structuredContent?.firstPoints && (
                                <div className="content-block first-points-block">
                                    {activePost.structuredContent.firstPoints.map((point, idx) => (
                                        <div key={idx} className="point-card simple-point">
                                            <h4 className="point-title">{point.title}</h4>
                                            {point.content && <p className="point-text">{point.content}</p>}
                                            {point.bullets && (
                                                <ul className="point-bullets">
                                                    {point.bullets.map((bullet, bIdx) => (
                                                        <li key={bIdx}>{bullet}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activePost.structuredContent?.prefaceSection && (
                                <div className="content-block preface-block">
                                    <h3 className="preface-main-heading">
                                        {activePost.structuredContent.prefaceSection.mainHeading}
                                    </h3>
                                    <div className="preface-content-wrapper">
                                        <p className="preface-preamble">
                                            {activePost.structuredContent.prefaceSection.preamble}
                                        </p>
                                    </div>
                                    <p className="preface-sub-heading">
                                        {activePost.structuredContent.prefaceSection.subHeading}
                                    </p>
                                </div>
                            )}

                            {activePost.structuredContent?.detailedLessons && (
                                <div className="content-block detailed-lessons-block">
                                    {activePost.structuredContent.detailedLessons.map((lesson, idx) => (
                                        <div key={idx} className="point-card detailed-point">
                                            <h4 className="point-title">{lesson.title}</h4>
                                            <ul className="point-bullets">
                                                {lesson.bullets.map((bullet, bIdx) => (
                                                    <li key={bIdx}>{bullet}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback: plain content for posts with no structured sections */}
                            {!activePost.structuredContent && !activePost.introText && (
                                <div
                                    className="content-block"
                                    dangerouslySetInnerHTML={{ __html: activePost.content }}
                                />
                            )}

                            {activePost.closingText && (
                                <div className="content-block closing-block">
                                    <p className="closing-text">{activePost.closingText}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
