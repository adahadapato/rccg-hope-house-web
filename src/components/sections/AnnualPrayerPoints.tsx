import {
    useEffect,
    useState,
} from 'react';

import {
    apiFetch,
    getApiErrorDetails,
} from '@/api/api';

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

export default function AnnualPrayerPoints() {
    const [
        prayerData,
        setPrayerData,
    ] = useState<AnnualPrayer | null>(
        null
    );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const controller =
            new AbortController();

        async function loadAnnualPrayer() {
            try {
                setLoading(true);
                setError(null);

                const response =
                    await apiFetch(
                        '/api/annual-prayers/active',
                        {
                            signal:
                                controller.signal,
                        }
                    );

                if (!response.ok) {
                    if (
                        response.status ===
                        404
                    ) {
                        setPrayerData(null);
                        return;
                    }

                    throw await getApiErrorDetails(
                        response,
                        `Unable to load the Prayer for the Year (${response.status}).`
                    );
                }

                const data:
                    AnnualPrayer | null =
                    await response.json();

                if (
                    !controller.signal.aborted
                ) {
                    setPrayerData(data);
                }
            } catch (err) {
                if (
                    (err as Error).name ===
                    'AbortError' ||
                    controller.signal.aborted
                ) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load the Prayer for the Year.'
                );
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        }

        void loadAnnualPrayer();

        return () => {
            controller.abort();
        };
    }, []);

    if (loading) {
        return (
            <section
                id="prayer-for-the-year"
                className="section annual-prayer-section"
            >
                <div className="container">
                    <p>
                        Loading Prayer for the
                        Year...
                    </p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section
                id="prayer-for-the-year"
                className="section annual-prayer-section"
            >
                <div className="container">
                    <p>
                        {error}
                    </p>
                </div>
            </section>
        );
    }

    if (!prayerData) {
        return null;
    }

    const sortedPrayerPoints = [
        ...prayerData.prayerPoints,
    ].sort(
        (a, b) =>
            a.displayOrder -
            b.displayOrder
    );

    const imageUrl =
        prayerData.imageUrl?.trim() ||
        '/prayers-image.jpg';

    return (
        <section
            id="prayer-for-the-year"
            className="section annual-prayer-section"
        >
            <div className="container">
                <div className="annual-prayer-grid">
                    {/* Left Column - Prayer Points */}
                    <div className="prayer-points-column">
                        <div className="prayer-header">
                            <h2 className="prayer-title">
                                Prayer for the year{' '}
                                {prayerData.year}
                            </h2>

                            <div className="prayer-subtitle">
                                <p>
                                    Prayer Points
                                    from RCCG{' '}
                                    {
                                        prayerData.service
                                    }
                                </p>

                                <p className="hashtag">
                                    #
                                    {prayerData.theme.replace(
                                        /\s+/g,
                                        ''
                                    )}
                                </p>

                                <p>
                                    By{' '}
                                    {
                                        prayerData.author
                                    }
                                    .
                                </p>
                            </div>
                        </div>

                        <div className="prayer-points-list">
                            {sortedPrayerPoints.map(
                                point => (
                                    <div
                                        key={
                                            point.id
                                        }
                                        className="prayer-point-item"
                                    >
                                        <span className="prayer-point-number">
                                            {
                                                point.displayOrder
                                            }
                                            .
                                        </span>

                                        <p className="prayer-point-text">
                                            {
                                                point.text
                                            }
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Right Column - Bible Text & Image */}
                    <div className="prayer-sidebar-column">
                        <div className="prayer-image-wrapper">
                            <img
                                src={
                                    imageUrl
                                }
                                alt="Person praying in church"
                                className="prayer-image"
                            />
                        </div>

                        <div className="bible-text-section">
                            <h4 className="bible-text-heading">
                                BIBLE TEXT:{' '}
                                <span>
                                    {
                                        prayerData.bibleReference
                                    }
                                </span>
                            </h4>

                            <div className="bible-text-content">
                                <p>
                                    {
                                        prayerData.bibleText
                                    }
                                </p>

                                <p className="bible-declaration">
                                    {
                                        prayerData.declaration
                                    }
                                </p>

                                <p className="closing-verse">
                                    {
                                        prayerData.closingVerse
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}