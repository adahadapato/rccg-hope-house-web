export default function ThemeOfTheYear() {
    return (
        <section id="theme-of-year" className="section theme-of-year-section">
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
                            <span>ANNUAL THEME</span>
                            <span className="label-line"></span>
                        </div>
                        <h2 className="theme-main-title centered">
                            <span className="title-word">THEME</span>
                            <span className="title-word">OF THE</span>
                            <span className="title-word highlight">YEAR</span>
                        </h2>
                        <div className="theme-divider">
                            <div className="divider-line"></div>
                            <div className="divider-icon">✦</div>
                            <div className="divider-line"></div>
                        </div>
                        <h3 className="theme-subtitle centered">"A Brand New Beginning"</h3>
                    </div>

                    {/* Scripture with Style */}
                    <div className="theme-scripture-box centered">
                        <div className="scripture-icon">📖</div>
                        <blockquote className="scripture-text">
                            "Forget the former things; do not dwell on the past. See, I am doing a new thing! Now it springs up; do you not perceive it? I am making a way in the wilderness and streams in the wasteland."
                        </blockquote>
                        <cite className="scripture-reference">Isaiah 43:18-19 (NIV)</cite>
                        <div className="scripture-accent"></div>
                    </div>

                    {/* Description */}
                    <div className="theme-description-container centered">
                        <div className="description-card">
                            <div className="card-icon">✨</div>
                            <p className="description-text">
                                According to prophecy for the year 2026 as declared by our father in the Lord (Daddy GO), we are in a season of a Brand-New beginning. <span className="highlight-text">To God be all the glory.</span>
                            </p>
                        </div>

                        <div className="description-divider">
                            <div className="divider-dot"></div>
                            <div className="divider-line"></div>
                            <div className="divider-dot"></div>
                        </div>

                        <div className="description-card secondary">
                            <div className="card-accent"></div>
                            <p className="description-text">
                                More so, in agreement with the above text, the Lord is set to do a new thing. Let us put the ugly past behind us and be expectant for brand new things from the Lord, by living a brand-new life of complete obedience in holy living, good works, in giving of praises, thanksgiving and supplications.
                            </p>
                            <div className="card-footer">
                                <span className="footer-icon">🙌</span>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="theme-cta-box centered">
                        <div className="cta-content">
                            <div className="cta-icon">🙏</div>
                            <p className="cta-text">Join us as we embark on this transformative journey!</p>
                        </div>
                        <div className="cta-decoration"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}