
import { useState } from 'react';

type BibleTranslation = 'KJV' | 'NKJV' | 'NIV' | 'NLT';

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

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://adahadapato-003-site2.dtempurl.com';

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

export default function DailyDevotional() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('devotional');

    const [activeTranslation, setActiveTranslation] =
        useState<BibleTranslation>('KJV');

    const [bibleText, setBibleText] = useState('');
    const [bibleCopyright, setBibleCopyright] = useState('');
    const [isLoadingBible, setIsLoadingBible] = useState(false);
    const [bibleError, setBibleError] = useState('');

    // =========================================================
    // DEVOTIONAL DATA
    //
    // This data is currently local to the component.
    // In production, the devotional content will eventually
    // come from the Hope House backend.
    // =========================================================

    const devotional = {
        date: 'June 6, 2026',

        theme: 'DIVINE REPOSITIONING',

        scripture: 'Exodus 14:1-4',

        // API.Bible uses USFM-style passage identifiers.
        passageId: 'EXO.14.1-EXO.14.4',

        thought:
            'Beloved, divine repositioning is a strategic move by God to place you in a position where His glory will be manifested. What looks like a dead end is actually a setup for your breakthrough.',

        fullCommentary: `
            <p>
                Beloved, divine repositioning is a strategic move by God to place
                you in a position where His glory will be manifested in your life.
                Just as God instructed the children of Israel to change their
                direction and encamp by the sea, He may ask you to make seemingly
                unusual decisions that will ultimately lead to your breakthrough.
            </p>

            <p>
                The Israelites appeared to be trapped and confused, but God had
                a greater plan. What looks like a dead end to you is actually a
                setup for God's mighty deliverance. Your current position is not
                your final destination.
            </p>

            <p>
                When God repositions you, He does so for a purpose: to display
                His power, to confound your enemies, and to bring you into a new
                season of victory. Trust His leading even when it doesn't make
                sense to your natural understanding.
            </p>
        `,

        prayerPoints: [
            'Father, thank You for Your divine repositioning in my life.',
            'Lord, give me the grace to follow Your instructions precisely.',
            'Father, reposition me for breakthrough and divine manifestation.',
            "Lord, confuse every Pharaoh pursuing my destiny in Jesus' name.",
            'Father, let my life be a testimony of Your power and deliverance.',
        ],

        declaration:
            "I am divinely repositioned for breakthrough. My enemies shall be confounded, and the glory of God shall be manifested in my life. In Jesus' name!",
    };

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
        const option = translationOptions.find(
            (item) => item.label === translation
        );

        if (!option || !option.enabled) {
            throw new Error(
                `${translation} is not currently available.`
            );
        }

        const response = await fetch(
            `${API_BASE_URL}/api/bible/bibles`
        );

        if (!response.ok) {
            throw new Error(
                `Unable to retrieve Bible translations (${response.status}).`
            );
        }

        const translations =
            (await response.json()) as ApiBibleTranslation[];

        const bible = translations.find(
            (item) =>
                item.abbreviation.toLowerCase() ===
                option.apiAbbreviation.toLowerCase()
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
        translation: BibleTranslation
    ) => {
        const option = translationOptions.find(
            (item) => item.label === translation
        );

        // NKJV remains visible in the interface but is disabled
        // until it becomes available through our API.Bible account.
        if (!option?.enabled) {
            return;
        }

        setIsLoadingBible(true);
        setBibleError('');
        setBibleText('');
        setBibleCopyright('');
        setActiveTranslation(translation);

        try {
            // -------------------------------------------------
            // 1. Get the API.Bible resource ID for the selected
            //    translation from our own backend.
            // -------------------------------------------------

            const bible = await getBibleResource(translation);

            // -------------------------------------------------
            // 2. Build the query for our passage endpoint.
            // -------------------------------------------------

            const query = new URLSearchParams({
                bibleId: bible.code,
                passageId: devotional.passageId,
            });

            // -------------------------------------------------
            // 3. Request the scripture from the Hope House API.
            // -------------------------------------------------

            const response = await fetch(
                `${API_BASE_URL}/api/bible/passage?${query.toString()}`
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
            //
            // This is important because API.Bible returns
            // translation/licensing information that must not
            // appear as though it is part of the scripture.
            // -------------------------------------------------

            setBibleText(passage.content);
            setBibleCopyright(passage.copyright);
        } catch (error) {
            console.error(
                'Unable to load Bible passage:',
                error
            );

            setBibleError(
                'Unable to load scripture. Please check your connection and try again.'
            );
        } finally {
            setIsLoadingBible(false);
        }
    };

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
                                    {devotional.date}
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
                            <div
                                className="highlight-scripture clickable"
                                onClick={() => {
                                    setIsModalOpen(true);
                                    setActiveTab('bible');

                                    if (!bibleText) {
                                        void fetchBibleText('KJV');
                                    }
                                }}
                            >
                                <span className="scripture-label">
                                    📜 Click to Read Scripture
                                </span>

                                <p className="scripture-text">
                                    {devotional.scripture}
                                </p>

                            </div>

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
                                onClick={() =>
                                    setIsModalOpen(true)
                                }
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
                        setIsModalOpen(false)
                    }
                >

                    <div
                        className="devotional-modal"
                        onClick={(event) =>
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
                                    {devotional.date}
                                </span>

                            </div>


                            {/* =========================
                                CLOSE BUTTON

                                This button stays inside
                                the modal header.

                                The × is deliberately
                                included as visible content
                                instead of relying on CSS.
                            ========================== */}

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() =>
                                    setIsModalOpen(false)
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
                                className={`tab-btn ${activeTab === 'devotional'
                                        ? 'active'
                                        : ''
                                    }`}
                                onClick={() =>
                                    setActiveTab('devotional')
                                }
                            >
                                📖 Devotional
                            </button>


                            <button
                                type="button"
                                className={`tab-btn ${activeTab === 'bible'
                                        ? 'active'
                                        : ''
                                    }`}
                                onClick={() => {
                                    setActiveTab('bible');

                                    if (!bibleText) {
                                        void fetchBibleText(
                                            activeTranslation
                                        );
                                    }
                                }}
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

                            {activeTab === 'devotional' && (

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
                                            onClick={() => {
                                                setActiveTab('bible');

                                                if (!bibleText) {
                                                    void fetchBibleText(
                                                        activeTranslation
                                                    );
                                                }
                                            }}
                                        >
                                            {devotional.scripture}

                                            <span className="click-hint">
                                                {' '}
                                                (Click to read)
                                            </span>

                                        </p>

                                    </div>


                                    {/* =========================
                                        COMMENTARY
                                    ========================== */}

                                    <div className="modal-section">

                                        <h3>
                                            💡 Commentary
                                        </h3>

                                        <div
                                            className="commentary-body"
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    devotional.fullCommentary,
                                            }}
                                        />

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
                                                (point, index) => (

                                                    <li key={index}>

                                                        <span className="prayer-num">
                                                            {index + 1}
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
                                            "{devotional.declaration}"
                                        </p>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                BIBLE READING TAB
                            ================================================== */}

                            {activeTab === 'bible' && (

                                <div className="tab-content bible-tab">


                                    {/* =========================
                                        TRANSLATION SELECTOR
                                    ========================== */}

                                    <div className="translation-selector">

                                        {translationOptions.map(
                                            (translation) => (

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
                                                    {translation.label}
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
                                                {devotional.scripture}
                                            </h3>

                                            <span className="trans-badge">
                                                {activeTranslation}
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