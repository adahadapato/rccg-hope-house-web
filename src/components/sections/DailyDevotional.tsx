import {
    useEffect,
    useState,
    useRef,
} from 'react';

import {
    apiFetch,
} from '@/api/api';

type BibleTranslation =
    | 'KJV'
    | 'NKJV'
    | 'NIV'
    | 'NLT';

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
    memoryVerseReference?: string;
    memoryVersePassageId?: string;
    bibleInOneYearReference?: string;
    bibleInOneYearPassageIds?: string[];
    hymnNumber?: string | null;
    hymnTitle?: string | null;
    hymnLyrics?: string | null;
    additionalReading?: string;
    keyPoint?: string;
    author?: string;
    sourceUrl?: string;
    isPublished: boolean;
    publishedAt: string | null;
}

interface ApiBibleTranslation {
    code: string;
    name: string;
    abbreviation: string;
}

interface BiblePassage {
    bibleId: string;
    reference: string;
    content: string;
    copyright: string;
}

interface TranslationOption {
    label: BibleTranslation;
    apiAbbreviation: string;
    enabled: boolean;
}

const translationOptions: TranslationOption[] = [
    {
        label: 'KJV',
        apiAbbreviation: 'engKJVCPB',
        enabled: true,
    },
    {
        label: 'NKJV',
        apiAbbreviation: 'NKJV',
        enabled: false,
    },
    {
        label: 'NIV',
        apiAbbreviation: 'NIV11',
        enabled: true,
    },
    {
        label: 'NLT',
        apiAbbreviation: 'NLT',
        enabled: true,
    },
];

function formatDevotionalDate(
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
            month: 'long',
            year: 'numeric',
        }
    ).format(date);
}

export default function DailyDevotional() {
    const [
        devotional,
        setDevotional,
    ] =
        useState<Devotional | null>(
            null
        );

    const [
        isLoadingDevotional,
        setIsLoadingDevotional,
    ] = useState(true);

    const [
        devotionalError,
        setDevotionalError,
    ] = useState('');

    const [
        isModalOpen,
        setIsModalOpen,
    ] = useState(false);

    const [
        activeTab,
        setActiveTab,
    ] =
        useState<
            'devotional' | 'bible'
        >('devotional');

    const [
        activeTranslation,
        setActiveTranslation,
    ] =
        useState<BibleTranslation>(
            'KJV'
        );

    const [
        bibleText,
        setBibleText,
    ] = useState('');

    const [
        bibleCopyright,
        setBibleCopyright,
    ] = useState('');

    const [
        isLoadingBible,
        setIsLoadingBible,
    ] = useState(false);

    const [
        bibleError,
        setBibleError,
    ] = useState('');

    // Selected passage can be the main reading, memory verse or annual reading.
    const [selectedPassage, setSelectedPassage] = useState<{ id: string; label: string } | null>(null);
    const [loadedPassageReference, setLoadedPassageReference] = useState('');
    const passageRequestSequence = useRef(0);

    // =========================================================
    // LOAD DAILY DEVOTIONAL
    //
    // The Hope House backend determines which published
    // devotional should be shown publicly.
    //
    // If today's devotional is unavailable, the backend may
    // return the most recent published devotional dated today
    // or earlier.
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const loadDevotional =
            async () => {
                setIsLoadingDevotional(
                    true
                );

                setDevotionalError('');

                try {
                    const response =
                        await apiFetch(
                            '/api/devotionals/latest'
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Unable to retrieve devotional (${response.status}).`
                        );
                    }

                    const data =
                        (await response.json()) as Devotional;

                    if (cancelled) {
                        return;
                    }

                    setDevotional(
                        data
                    );
                } catch (error) {
                    console.error(
                        'Unable to load daily devotional:',
                        error
                    );

                    if (!cancelled) {
                        setDevotionalError(
                            'Unable to load the daily devotional. Please try again later.'
                        );
                    }
                } finally {
                    if (!cancelled) {
                        setIsLoadingDevotional(
                            false
                        );
                    }
                }
            };

        void loadDevotional();

        return () => {
            cancelled = true;
        };
    }, []);

    // =========================================================
    // GET BIBLE RESOURCE
    //
    // Finds the API.Bible resource corresponding to one of the
    // translations displayed by the Hope House website.
    //
    // The API.Bible IDs are deliberately NOT hard-coded into
    // the frontend. They are obtained from our own backend.
    // =========================================================

    const getBibleResource = async (
        translation: BibleTranslation
    ): Promise<ApiBibleTranslation> => {
        const option =
            translationOptions.find(
                item =>
                    item.label ===
                    translation
            );

        if (
            !option ||
            !option.enabled
        ) {
            throw new Error(
                `${translation} is not currently available.`
            );
        }

        const response =
            await apiFetch(
                '/api/bible/bibles'
            );

        if (!response.ok) {
            throw new Error(
                `Unable to retrieve Bible translations (${response.status}).`
            );
        }

        const translations =
            (await response.json()) as ApiBibleTranslation[];

        const bible =
            translations.find(
                item =>
                    item.abbreviation
                        .toLowerCase() ===
                    option.apiAbbreviation
                        .toLowerCase()
            );

        if (!bible) {
            throw new Error(
                `${translation} is not currently available from the Bible service.`
            );
        }

        return bible;
    };

    // =========================================================
    // FETCH BIBLE TEXT
    //
    // Retrieves scripture through the Hope House backend.
    //
    // IMPORTANT:
    // The React application never communicates directly with
    // API.Bible. The API key remains securely on the server.
    // =========================================================

    const fetchBibleText = async (
        translation: BibleTranslation,
        passageId?: string
    ) => {
        if (!devotional) {
            return;
        }

        const option =
            translationOptions.find(
                item =>
                    item.label ===
                    translation
            );

        const targetId = passageId ?? selectedPassage?.id ?? devotional.passageId;
        const sequence = ++passageRequestSequence.current;

        // NKJV remains visible in the interface but is disabled
        // until it becomes available through our API.Bible account.

        if (!option?.enabled) {
            return;
        }

        setIsLoadingBible(true);
        setBibleError('');
        setBibleText('');
        setBibleCopyright('');
        setLoadedPassageReference('');
        setActiveTranslation(
            translation
        );

        try {
            // -------------------------------------------------
            // 1. Get the API.Bible resource ID for the selected
            //    translation from our own backend.
            // -------------------------------------------------

            const bible =
                await getBibleResource(
                    translation
                );

            // -------------------------------------------------
            // 2. Build the query for our passage endpoint.
            // -------------------------------------------------

            const query =
                new URLSearchParams({
                    bibleId:
                        bible.code,
                    passageId:
                        targetId,
                });

            // -------------------------------------------------
            // 3. Request the scripture from the Hope House API.
            // -------------------------------------------------

            const response =
                await apiFetch(
                    `/api/bible/passage?${query.toString()}`
                );

            if (!response.ok) {
                throw new Error(
                    `Unable to retrieve scripture (${response.status}).`
                );
            }

            const passage =
                (await response.json()) as BiblePassage;

            // -------------------------------------------------
            // 4. Store scripture and copyright separately.
            // -------------------------------------------------

            if (sequence !== passageRequestSequence.current) return;
            setBibleText(
                passage.content
            );
            setLoadedPassageReference(passage.reference);

            setBibleCopyright(
                passage.copyright
            );
        } catch (error) {
            console.error(
                'Unable to load Bible passage:',
                error
            );

            if (sequence === passageRequestSequence.current) setBibleError(
                'Unable to load scripture. Please check your connection and try again.'
            );
        } finally {
            if (sequence === passageRequestSequence.current) setIsLoadingBible(
                false
            );
        }
    };

    const openBiblePassage = (id: string, label: string) => {
        if (!id) return;
        setSelectedPassage({ id, label });
        setActiveTab('bible');
        setIsModalOpen(true);
        void fetchBibleText(activeTranslation, id);
    };

    // =========================================================
    // LOADING STATE
    // =========================================================

    if (isLoadingDevotional) {
        return (
            <section
                id="devotional"
                className="section daily-devotional-section"
            >
                <div className="container">

                    <div className="devotional-header">

                        <span className="devotional-tag">
                            📖 DAILY BREAD
                        </span>

                        <h2 className="devotional-main-title">
                            Open Heavens Devotional
                        </h2>

                        <div className="title-divider-center"></div>

                        <p className="devotional-subtitle">
                            Loading daily devotional...
                        </p>

                    </div>

                </div>
            </section>
        );
    }

    // =========================================================
    // ERROR / NO DEVOTIONAL
    // =========================================================

    if (
        devotionalError ||
        !devotional
    ) {
        return (
            <section
                id="devotional"
                className="section daily-devotional-section"
            >
                <div className="container">

                    <div className="devotional-header">

                        <span className="devotional-tag">
                            📖 DAILY BREAD
                        </span>

                        <h2 className="devotional-main-title">
                            Open Heavens Devotional
                        </h2>

                        <div className="title-divider-center"></div>

                        <p className="devotional-subtitle">
                            {devotionalError ||
                                'No devotional is currently available.'}
                        </p>

                    </div>

                </div>
            </section>
        );
    }

    const devotionalDate =
        formatDevotionalDate(
            devotional.devotionalDate
        );

    return (
        <>
            {/* =====================================================
                DAILY DEVOTIONAL SECTION
            ====================================================== */}

            <section
                id="devotional"
                className="section daily-devotional-section"
            >
                <div className="container">

                    {/* =========================
                        SECTION HEADER
                    ========================== */}

                    <div className="devotional-header">

                        <span className="devotional-tag">
                            📖 DAILY BREAD
                        </span>

                        <h2 className="devotional-main-title">
                            Open Heavens Devotional
                        </h2>

                        <div className="title-divider-center"></div>

                        <p className="devotional-subtitle">
                            Start your day with spiritual nourishment
                            and divine direction.
                        </p>

                    </div>


                    {/* =========================
                        DEVOTIONAL CARD
                    ========================== */}

                    <div className="devotional-showcase">

                        {/* Left Highlight Panel */}

                        <div className="devotional-highlight">

                            <div className="highlight-date">

                                <span className="date-icon"></span>

                                <span>
                                    {devotionalDate}
                                </span>

                            </div>


                            <div className="highlight-theme">

                                <span className="theme-label">
                                    Today's Theme
                                </span>

                                <h3 className="theme-text">
                                    {devotional.theme}
                                </h3>

                            </div>


                            {/* Clickable Scripture */}

                            <button
                                type="button"
                                className="highlight-scripture clickable"
                                onClick={() => openBiblePassage(devotional.passageId, devotional.scriptureReference)}
                            >
                                <span className="scripture-label">
                                    📜 Click to Read Scripture
                                </span>

                                <p className="scripture-text">
                                    {
                                        devotional.scriptureReference
                                    }
                                </p>

                            </button>

                            {devotional.memoryVerseReference && devotional.memoryVersePassageId && (
                                <button type="button" className="devotional-memory-highlight"
                                    onClick={() => openBiblePassage(devotional.memoryVersePassageId!, devotional.memoryVerseReference!)}>
                                    <span className="devotional-memory-eyebrow">📖 Memory Verse</span>
                                    <span className="devotional-memory-reference">{devotional.memoryVerseReference}</span>
                                    <span className="devotional-memory-action">Read verse <span aria-hidden="true">↗</span></span>
                                </button>
                            )}
                        </div>


                        {/* Right Content Panel */}

                        <div className="devotional-content">

                            <div className="thought-block">

                                <h4>
                                    💡 Thought for the Day
                                </h4>

                                <p>
                                    {devotional.thought}
                                </p>

                            </div>


                            <button
                                type="button"
                                className="btn-read-devotional"
                                onClick={() => {
                                    setActiveTab(
                                        'devotional'
                                    );

                                    setIsModalOpen(
                                        true
                                    );
                                }}
                            >
                                Read Full Devotional{' '}

                                <span className="btn-arrow">
                                    →
                                </span>
                            </button>

                        </div>

                    </div>

                </div>
            </section>


            {/* =====================================================
                FULL DEVOTIONAL MODAL
            ====================================================== */}

            {isModalOpen && (

                <div
                    className="devotional-modal-overlay"
                    onClick={() =>
                        setIsModalOpen(
                            false
                        )
                    }
                >

                    <div
                        className="devotional-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        {/* =========================
                            MODAL HEADER
                        ========================== */}

                        <div className="modal-top-bar">

                            <div className="modal-title-group">

                                <h2>
                                    {devotional.theme}
                                </h2>

                                <span className="modal-date">
                                    {devotionalDate}
                                </span>

                            </div>


                            {/* =========================
                                CLOSE BUTTON
                            ========================== */}

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() =>
                                    setIsModalOpen(
                                        false
                                    )
                                }
                                aria-label="Close devotional"
                                title="Close"
                            >
                                ×
                            </button>

                        </div>


                        {/* =========================
                            MODAL TABS
                        ========================== */}

                        <div className="modal-tabs">

                            <button
                                type="button"
                                className={`tab-btn ${activeTab ===
                                    'devotional'
                                    ? 'active'
                                    : ''
                                    }`}
                                onClick={() =>
                                    setActiveTab(
                                        'devotional'
                                    )
                                }
                            >
                                📖 Devotional
                            </button>


                            <button
                                type="button"
                                className={`tab-btn ${activeTab ===
                                    'bible'
                                    ? 'active'
                                    : ''
                                    }`}
                                onClick={() => openBiblePassage(selectedPassage?.id ?? devotional.passageId, selectedPassage?.label ?? devotional.scriptureReference)}
                            >
                                Bible Reading
                            </button>

                        </div>


                        {/* =========================
                            MODAL CONTENT AREA
                        ========================== */}

                        <div className="modal-content-scroll">


                            {/* =================================================
                                DEVOTIONAL TAB
                            ================================================== */}

                            {activeTab ===
                                'devotional' && (

                                    <div className="tab-content devotional-tab">


                                        {/* =========================
                                        SCRIPTURE READING
                                    ========================== */}

                                        <div className="modal-section">

                                            <h3>
                                                📜 Scripture Reading
                                            </h3>

                                            <p
                                                className="modal-scripture-ref"
                                                onClick={() => openBiblePassage(devotional.passageId, devotional.scriptureReference)}
                                            >
                                                {
                                                    devotional.scriptureReference
                                                }

                                                <span className="click-hint">
                                                    {' '}
                                                    (Click to read)
                                                </span>

                                            </p>

                                        </div>


                                        {devotional.memoryVerseReference && devotional.memoryVersePassageId && (
                                            <div className="modal-section devotional-reading-section">
                                                <h3>📖 Memory Verse</h3>
                                                <button type="button" className="devotional-reading-link"
                                                    onClick={() => openBiblePassage(devotional.memoryVersePassageId!, devotional.memoryVerseReference!)}>
                                                    <span>{devotional.memoryVerseReference}</span><span className="devotional-reading-link-action">Read verse ↗</span>
                                                </button>
                                            </div>
                                        )}
                                        {!!devotional.bibleInOneYearPassageIds?.length && (
                                            <div className="modal-section devotional-reading-section">
                                                <h3>📚 Bible in One Year</h3>
                                                {devotional.bibleInOneYearPassageIds.map((id, index) => (
                                                    <button key={`${id}-${index}`} type="button" className="devotional-reading-link"
                                                        onClick={() => openBiblePassage(id, id.replaceAll('.', ' '))}>
                                                        <span>{id.replaceAll('.', ' ')}</span><span className="devotional-reading-link-action">Read chapter ↗</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {(devotional.hymnTitle || devotional.hymnNumber) && (
                                            <div className="modal-section devotional-detail-card devotional-hymn-card">
                                                <h3>🎵 Hymn</h3>
                                                <p>{devotional.hymnTitle}{devotional.hymnNumber ? ` (No. ${devotional.hymnNumber})` : ''}</p>
                                                {devotional.hymnLyrics && <p style={{ whiteSpace: 'pre-line' }}>{devotional.hymnLyrics}</p>}
                                            </div>
                                        )}
                                        {devotional.keyPoint && <div className="modal-section">
                                            <h3>✨ Key Point</h3><p>{devotional.keyPoint}</p>
                                        </div>}
                                        {devotional.additionalReading && <div className="modal-section">
                                            <h3>📚 Additional Reading</h3><p>{devotional.additionalReading}</p>
                                        </div>}
                                        {devotional.author && <div className="modal-section devotional-detail-card devotional-author-card">
                                            <h3>✍️ Author</h3><p>{devotional.author}</p>
                                        </div>}
                                        {devotional.sourceUrl && /^https:\/\//i.test(devotional.sourceUrl) &&
                                            <div className="modal-section devotional-source-section"><a href={devotional.sourceUrl} target="_blank" rel="noopener noreferrer">View original devotional <span aria-hidden="true">↗</span></a></div>}

                                        {/* =========================
                                        COMMENTARY
                                    ========================== */}

                                        <div className="modal-section">

                                            <h3>
                                                💡 Commentary
                                            </h3>

                                            <div className="commentary-body">

                                                {devotional.commentaryPoints.map(
                                                    (
                                                        point,
                                                        index
                                                    ) => (
                                                        <p
                                                            key={
                                                                index
                                                            }
                                                        >
                                                            {
                                                                point
                                                            }
                                                        </p>
                                                    )
                                                )}

                                            </div>

                                        </div>


                                        {/* =========================
                                        PRAYER POINTS
                                    ========================== */}

                                        <div className="modal-section prayer-section">

                                            <h3>
                                                🙏 Prayer Points
                                            </h3>

                                            <ul className="modal-prayer-list">

                                                {devotional.prayerPoints.map(
                                                    (
                                                        point,
                                                        index
                                                    ) => (

                                                        <li
                                                            key={
                                                                index
                                                            }
                                                        >

                                                            <span className="prayer-num">
                                                                {
                                                                    index +
                                                                    1
                                                                }
                                                            </span>

                                                            <span>
                                                                {point}
                                                            </span>

                                                        </li>

                                                    )
                                                )}

                                            </ul>

                                        </div>


                                        {/* =========================
                                        DECLARATION
                                    ========================== */}

                                        <div className="modal-section declaration-section">

                                            <h3>
                                                📢 Declaration
                                            </h3>

                                            <p className="declaration-text">
                                                "
                                                {
                                                    devotional.declaration
                                                }
                                                "
                                            </p>

                                        </div>

                                    </div>

                                )}


                            {/* =================================================
                                BIBLE READING TAB
                            ================================================== */}

                            {activeTab ===
                                'bible' && (

                                    <div className="tab-content bible-tab">


                                        {/* =========================
                                        TRANSLATION SELECTOR
                                    ========================== */}

                                        <div className="translation-selector">

                                            {translationOptions.map(
                                                translation => (

                                                    <button
                                                        type="button"
                                                        key={
                                                            translation.label
                                                        }
                                                        className={`trans-btn ${activeTranslation ===
                                                            translation.label
                                                            ? 'active'
                                                            : ''
                                                            } ${!translation.enabled
                                                                ? 'disabled'
                                                                : ''
                                                            }`}
                                                        disabled={
                                                            !translation.enabled
                                                        }
                                                        title={
                                                            translation.enabled
                                                                ? `Read in ${translation.label}`
                                                                : `${translation.label} coming soon`
                                                        }
                                                        onClick={() =>
                                                            void fetchBibleText(
                                                                translation.label
                                                            )
                                                        }
                                                    >
                                                        {
                                                            translation.label
                                                        }
                                                    </button>

                                                )
                                            )}

                                        </div>


                                        {/* =========================
                                        SCRIPTURE CARD
                                    ========================== */}

                                        <div className="bible-text-display">


                                            {/* =========================
                                            SCRIPTURE HEADER
                                        ========================== */}

                                            <div className="bible-header">

                                                <h3>
                                                    {loadedPassageReference || selectedPassage?.label || devotional.scriptureReference}
                                                </h3>

                                                <span className="trans-badge">
                                                    {
                                                        activeTranslation
                                                    }
                                                </span>

                                            </div>


                                            {/* =========================
                                            LOADING STATE
                                        ========================== */}

                                            {isLoadingBible ? (

                                                <div className="loading-spinner">

                                                    <div className="spinner"></div>

                                                    <p>
                                                        Fetching the Word...
                                                    </p>

                                                </div>

                                            ) : bibleError ? (


                                                /* =========================
                                                    ERROR STATE
                                                ========================== */

                                                <p className="actual-bible-text">
                                                    {bibleError}
                                                </p>

                                            ) : (


                                                /* =========================
                                                    SCRIPTURE CONTENT
                                                ========================== */

                                                <>

                                                    <p
                                                        className="actual-bible-text"
                                                        style={{
                                                            whiteSpace:
                                                                'pre-line',
                                                        }}
                                                    >
                                                        {bibleText}
                                                    </p>


                                                    {/* =================================
                                                    TRANSLATION COPYRIGHT

                                                    Copyright/licensing information
                                                    is deliberately placed in its
                                                    own section and separated from
                                                    the scripture by a horizontal
                                                    rule supplied by the CSS.

                                                    This prevents users from
                                                    confusing the attribution with
                                                    the actual Bible passage.
                                                ================================== */}

                                                    {bibleCopyright && (

                                                        <div className="bible-attribution">

                                                            <span className="bible-attribution-label">
                                                                Translation Copyright
                                                            </span>

                                                            <p className="bible-copyright">
                                                                {
                                                                    bibleCopyright
                                                                }
                                                            </p>

                                                        </div>

                                                    )}

                                                </>

                                            )}

                                        </div>

                                    </div>

                                )}

                        </div>

                    </div>

                </div>

            )}

        </>
    );
}