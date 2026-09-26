import { useEffect, useMemo, useState } from 'react';

type CategoryStyleKey = 'general' | 'nigeria' | 'international';

interface Prophecy {
    id: string;
    categoryId: string;
    text: string;
    displayOrder: number;
    isActive: boolean;
}

interface ProphecyCategory {
    id: string;
    prophecyYearId: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    prophecies: Prophecy[];
}

interface ProphecyYearDetail {
    id: string;
    year: number;
    isPublished: boolean;
    categories: ProphecyCategory[];
}

interface ProphecyYear {
    id: string;
    year: number;
    isPublished: boolean;
}

interface CategoryPresentation {
    key: CategoryStyleKey;
    icon: string;
    accentLight: string;
    accentText: string;
}

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

const getCategoryPresentation = (
    category: ProphecyCategory,
): CategoryPresentation => {
    /*
     * DisplayOrder is used for presentation only.
     *
     * The actual category names, descriptions and prophecy text all
     * come from the API/database.
     */
    switch (category.displayOrder) {
        case 1:
            return {
                key: 'general',
                icon: '✨',
                accentLight: 'bg-amber-50',
                accentText: 'text-amber-600',
            };

        case 2:
            return {
                key: 'nigeria',
                icon: 'NG',
                accentLight: 'bg-green-50',
                accentText: 'text-green-600',
            };

        case 3:
            return {
                key: 'international',
                icon: '🌍',
                accentLight: 'bg-blue-50',
                accentText: 'text-blue-600',
            };

        default:
            return {
                key: 'general',
                icon: '✨',
                accentLight: 'bg-amber-50',
                accentText: 'text-amber-600',
            };
    }
};

const getApiUrl = (path: string): string => {
    if (!API_BASE_URL) {
        return `/api${path}`;
    }

    return `${API_BASE_URL}/api${path}`;
};

export default function Prophecies() {
    const [prophecyYear, setProphecyYear] =
        useState<ProphecyYearDetail | null>(null);

    const [availableYears, setAvailableYears] =
        useState<ProphecyYear[]>([]);

    const [activeCategoryId, setActiveCategoryId] =
        useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isChangingYear, setIsChangingYear] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeCategory = useMemo(() => {
        if (!prophecyYear || !activeCategoryId) {
            return null;
        }

        return (
            prophecyYear.categories.find(
                category => category.id === activeCategoryId,
            ) ?? null
        );
    }, [prophecyYear, activeCategoryId]);

    const orderedCategories = useMemo(() => {
        if (!prophecyYear) {
            return [];
        }

        return [...prophecyYear.categories]
            .filter(category => category.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(category => ({
                ...category,
                prophecies: [...category.prophecies]
                    .filter(prophecy => prophecy.isActive)
                    .sort((a, b) => a.displayOrder - b.displayOrder),
            }));
    }, [prophecyYear]);

    const orderedYears = useMemo(() => {
        return [...availableYears]
            .filter(year => year.isPublished)
            .sort((a, b) => b.year - a.year);
    }, [availableYears]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActiveCategoryId(null);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        if (activeCategoryId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeCategoryId]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [latestResponse, yearsResponse] =
                    await Promise.all([
                        fetch(getApiUrl('/prophecies/latest')),
                        fetch(getApiUrl('/prophecies/years')),
                    ]);

                if (!latestResponse.ok) {
                    throw new Error(
                        `Unable to load the latest prophecies (${latestResponse.status}).`,
                    );
                }

                if (!yearsResponse.ok) {
                    throw new Error(
                        `Unable to load prophecy years (${yearsResponse.status}).`,
                    );
                }

                const latestData =
                    (await latestResponse.json()) as ProphecyYearDetail;

                const yearsData =
                    (await yearsResponse.json()) as ProphecyYear[];

                setProphecyYear(latestData);
                setAvailableYears(yearsData);
            } catch (loadError) {
                console.error(
                    'Failed to load prophecies:',
                    loadError,
                );

                setError(
                    'The prophecies could not be loaded at the moment. Please try again later.',
                );
            } finally {
                setIsLoading(false);
            }
        };

        void loadInitialData();
    }, []);

    const loadYear = async (year: number) => {
        if (prophecyYear?.year === year) {
            return;
        }

        setIsChangingYear(true);
        setError(null);
        setActiveCategoryId(null);

        try {
            const response = await fetch(
                getApiUrl(`/prophecies/${year}`),
            );

            if (!response.ok) {
                throw new Error(
                    `Unable to load prophecies for ${year} (${response.status}).`,
                );
            }

            const data =
                (await response.json()) as ProphecyYearDetail;

            setProphecyYear(data);
        } catch (loadError) {
            console.error(
                `Failed to load prophecies for ${year}:`,
                loadError,
            );

            setError(
                `The prophecies for ${year} could not be loaded. Please try again.`,
            );
        } finally {
            setIsChangingYear(false);
        }
    };

    const openModal = (categoryId: string) => {
        setActiveCategoryId(categoryId);
    };

    const closeModal = () => {
        setActiveCategoryId(null);
    };

    if (isLoading) {
        return (
            <section
                id="prophecy-of-the-year"
                className="section prophecies-section"
            >
                <div className="container">
                    <div className="prophecy-header">
                        <span className="prophecy-tag">
                            DIVINE REVELATION
                        </span>

                        <h2 className="prophecy-title">
                            RCCG Prophecies
                        </h2>

                        <div className="title-divider-center"></div>

                        <p className="prophecy-subtitle">
                            Loading prophetic declarations...
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    if (!prophecyYear) {
        return (
            <section
                id="prophecy-of-the-year"
                className="section prophecies-section"
            >
                <div className="container">
                    <div className="prophecy-header">
                        <span className="prophecy-tag">
                            DIVINE REVELATION
                        </span>

                        <h2 className="prophecy-title">
                            RCCG Prophecies
                        </h2>

                        <div className="title-divider-center"></div>

                        <p className="prophecy-subtitle">
                            {error ??
                                'No published prophecies are currently available.'}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            id="prophecy-of-the-year"
            className="section prophecies-section"
        >
            <div className="container">
                <div className="prophecy-header">
                    <span className="prophecy-tag">
                        DIVINE REVELATION
                    </span>

                    <h2 className="prophecy-title">
                        RCCG Prophecies for {prophecyYear.year}
                    </h2>

                    <div className="title-divider-center"></div>

                    <p className="prophecy-subtitle">
                        Prophetic declarations and revelations for the
                        year from our General Overseer
                    </p>

                    {orderedYears.length > 1 && (
                        <div className="prophecy-year-selector">
                            <label htmlFor="prophecy-year">
                                View prophecies from:
                            </label>

                            <select
                                id="prophecy-year"
                                value={prophecyYear.year}
                                disabled={isChangingYear}
                                onChange={event => {
                                    void loadYear(
                                        Number(event.target.value),
                                    );
                                }}
                            >
                                {orderedYears.map(year => (
                                    <option
                                        key={year.id}
                                        value={year.year}
                                    >
                                        {year.year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isChangingYear && (
                        <p className="prophecy-loading-message">
                            Loading prophecies...
                        </p>
                    )}

                    {error && (
                        <p className="prophecy-error-message">
                            {error}
                        </p>
                    )}
                </div>

                <div className="prophecy-cards">
                    {orderedCategories.map(category => {
                        const presentation =
                            getCategoryPresentation(category);

                        return (
                            <div
                                key={category.id}
                                className="prophecy-card"
                            >
                                <div className="card-header">
                                    <div
                                        className={`card-icon-wrapper ${presentation.accentLight}`}
                                    >
                                        <span className="card-icon">
                                            {presentation.icon}
                                        </span>
                                    </div>

                                    <h3 className="card-title">
                                        {category.name}
                                    </h3>

                                    <p className="card-subtitle">
                                        {category.description ?? ''}
                                    </p>
                                </div>

                                <div className="card-preview">
                                    {category.prophecies
                                        .slice(0, 2)
                                        .map((prophecy, index) => (
                                            <div
                                                key={prophecy.id}
                                                className="preview-item"
                                            >
                                                <span
                                                    className={`preview-number ${presentation.accentText}`}
                                                >
                                                    {String(index + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>

                                                <p className="preview-text">
                                                    {prophecy.text}
                                                </p>
                                            </div>
                                        ))}

                                    {category.prophecies.length > 2 && (
                                        <div className="preview-more">
                                            <span>
                                                +
                                                {category.prophecies.length -
                                                    2}{' '}
                                                more prophecies
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className={`view-full-btn ${presentation.key}`}
                                    onClick={() =>
                                        openModal(category.id)
                                    }
                                >
                                    <span>
                                        View Full Prophecies
                                    </span>

                                    <span className="btn-arrow">
                                        →
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {activeCategory &&
                (() => {
                    const presentation =
                        getCategoryPresentation(activeCategory);

                    const prophecies = [...activeCategory.prophecies]
                        .filter(prophecy => prophecy.isActive)
                        .sort(
                            (a, b) =>
                                a.displayOrder -
                                b.displayOrder,
                        );

                    return (
                        <div
                            className="prophecy-modal-overlay"
                            onClick={closeModal}
                        >
                            <div
                                className="prophecy-modal"
                                onClick={event =>
                                    event.stopPropagation()
                                }
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="prophecy-modal-title"
                            >
                                <button
                                    type="button"
                                    className="modal-close-icon"
                                    onClick={closeModal}
                                    aria-label="Close"
                                >
                                    ✕
                                </button>

                                <div
                                    className={`modal-header ${presentation.key}`}
                                >
                                    <div className="modal-header-content">
                                        <span className="modal-icon">
                                            {presentation.icon}
                                        </span>

                                        <div>
                                            <h3
                                                id="prophecy-modal-title"
                                                className="modal-title"
                                            >
                                                {activeCategory.name}
                                            </h3>

                                            <p className="modal-subtitle">
                                                {activeCategory.description ??
                                                    ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-body">
                                    <div className="modal-intro">
                                        <p>
                                            Here are the complete
                                            prophetic declarations for{' '}
                                            <strong>
                                                {activeCategory.name.toLowerCase()}
                                            </strong>{' '}
                                            in {prophecyYear.year}:
                                        </p>
                                    </div>

                                    <div className="full-prophecy-list">
                                        {prophecies.map(
                                            (prophecy, index) => (
                                                <div
                                                    key={prophecy.id}
                                                    className="full-prophecy-item"
                                                >
                                                    <div
                                                        className={`item-number ${presentation.key}`}
                                                    >
                                                        {String(
                                                            index + 1,
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )}
                                                    </div>

                                                    <div className="item-content">
                                                        <p>
                                                            {
                                                                prophecy.text
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    <div className="modal-footer">
                                        <p className="footer-note">
                                            💡 These prophecies are
                                            from the General Overseer
                                            of RCCG. Hold on to them
                                            in faith!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
        </section>
    );
}