import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/api';

interface ThemeOfTheYearDto {
    id: string;
    year: number;
    themeTitle: string;
    scriptureText: string;
    scriptureReference: string;
    primaryDescription: string;
    secondaryDescription: string | null;
    callToActionText: string | null;
}

export default function ThemeOfTheYear() {
    const [theme, setTheme] = useState<ThemeOfTheYearDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadTheme() {
            try {
                setLoading(true);
                setError(null);

                const response = await apiFetch(
                    '/api/themes-of-the-year/current'
                );

                if (!response.ok) {
                    throw new Error(
                        `Unable to load Theme of the Year (${response.status}).`
                    );
                }

                const data =
                    (await response.json()) as ThemeOfTheYearDto;

                if (!cancelled) {
                    setTheme(data);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        'Failed to load Theme of the Year:',
                        err
                    );

                    setError(
                        'The Theme of the Year is temporarily unavailable.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadTheme();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <section
                id="theme-of-year"
                className="section theme-of-year-section"
            >
                <div className="theme-bg-elements">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="glow-orb orb-1"></div>
                </div>

                <div className="container">
                    <div className="theme-centered-content">
                        <div className="theme-header-animated">
                            <div className="theme-label">
                                <span className="label-line"></span>
                                <span>ANNUAL THEME</span>
                                <span className="label-line"></span>
                            </div>

                            <h2 className="theme-main-title centered">
                                <span className="title-word">THEME</span>
                                <span className="title-word">OF THE</span>
                                <span className="title-word highlight">
                                    YEAR
                                </span>
                            </h2>

                            <div className="theme-divider">
                                <div className="divider-line"></div>
                                <div className="divider-icon">✦</div>
                                <div className="divider-line"></div>
                            </div>

                            <p className="theme-subtitle centered">
                                Loading annual theme...
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error || !theme) {
        return (
            <section
                id="theme-of-year"
                className="section theme-of-year-section"
            >
                <div className="theme-bg-elements">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="glow-orb orb-1"></div>
                </div>

                <div className="container">
                    <div className="theme-centered-content">
                        <div className="theme-header-animated">
                            <div className="theme-label">
                                <span className="label-line"></span>
                                <span>ANNUAL THEME</span>
                                <span className="label-line"></span>
                            </div>

                            <h2 className="theme-main-title centered">
                                <span className="title-word">THEME</span>
                                <span className="title-word">OF THE</span>
                                <span className="title-word highlight">
                                    YEAR
                                </span>
                            </h2>

                            <div className="theme-divider">
                                <div className="divider-line"></div>
                                <div className="divider-icon">✦</div>
                                <div className="divider-line"></div>
                            </div>

                            <p className="theme-subtitle centered">
                                {error ??
                                    'The Theme of the Year is temporarily unavailable.'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            id="theme-of-year"
            className="section theme-of-year-section"
        >
            {/* Animated Background Elements */}
            <div className="theme-bg-elements">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="glow-orb orb-1"></div>
            </div>

            <div className="container">
                <div className="theme-centered-content">
                    {/* Header with Animation */}
                    <div className="theme-header-animated">
                        <div className="theme-label">
                            <span className="label-line"></span>
                            <span>ANNUAL THEME {theme.year}</span>
                            <span className="label-line"></span>
                        </div>

                        <h2 className="theme-main-title centered">
                            <span className="title-word">THEME</span>
                            <span className="title-word">OF THE</span>
                            <span className="title-word highlight">
                                YEAR
                            </span>
                        </h2>

                        <div className="theme-divider">
                            <div className="divider-line"></div>
                            <div className="divider-icon">✦</div>
                            <div className="divider-line"></div>
                        </div>

                        <h3 className="theme-subtitle centered">
                            {theme.themeTitle}
                        </h3>
                    </div>

                    {/* Scripture with Style */}
                    <div className="theme-scripture-box centered">
                        <div className="scripture-icon">📖</div>

                        <blockquote className="scripture-text">
                            &ldquo;{theme.scriptureText}&rdquo;
                        </blockquote>

                        <cite className="scripture-reference">
                            {theme.scriptureReference}
                        </cite>

                        <div className="scripture-accent"></div>
                    </div>

                    {/* Description */}
                    <div className="theme-description-container centered">
                        <div className="description-card">
                            <div className="card-icon">✨</div>

                            <p className="description-text">
                                {theme.primaryDescription}
                            </p>
                        </div>

                        {theme.secondaryDescription && (
                            <>
                                <div className="description-divider">
                                    <div className="divider-dot"></div>
                                    <div className="divider-line"></div>
                                    <div className="divider-dot"></div>
                                </div>

                                <div className="description-card secondary">
                                    <div className="card-accent"></div>

                                    <p className="description-text">
                                        {theme.secondaryDescription}
                                    </p>

                                    <div className="card-footer">
                                        <span className="footer-icon">
                                            🙌
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Call to Action */}
                    {theme.callToActionText && (
                        <div className="theme-cta-box centered">
                            <div className="cta-content">
                                <div className="cta-icon">🙏</div>

                                <p className="cta-text">
                                    {theme.callToActionText}
                                </p>
                            </div>

                            <div className="cta-decoration"></div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}