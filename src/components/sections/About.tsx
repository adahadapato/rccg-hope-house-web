export default function About() {
    return (
        <section id="about" className="section about-modern">
            <div className="container">
                <div className="about-grid-modern">
                    <div className="about-visual-modern">
                        <div className="est-badge">Est. 2012</div>
                        <img src="https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&auto=format&fit=crop" alt="Church community" className="about-image-modern" />
                        <div className="about-accent-card">
                            <span className="accent-icon">‍👩‍👧‍👦</span>
                            <p>"A family within a family"</p>
                        </div>
                    </div>
                    <div className="about-content-modern">
                        <span className="section-tag">WHO WE ARE</span>
                        <h2 className="section-title">RCCG Hope House Parish</h2>
                        <div className="title-divider"></div>
                        <p className="about-lead">Located in Burnt Oak, Edgware, Greater London, we are a multi-cultural, evangelical ministry rooted in faith, love, and community.</p>
                        <p className="about-text">Established in 2012, our church believes that everyone is important to God and should be treated with the care and love of Christ. We are building a sanctuary where faith grows, lives are transformed, and believers find a true spiritual home.</p>
                        <div className="about-stats-modern">
                            <div className="stat-item"><span className="stat-value">12+</span><span className="stat-label">Years of Ministry</span></div>
                            <div className="stat-divider"></div>
                            <div className="stat-item"><span className="stat-value">500+</span><span className="stat-label">Church Family</span></div>
                            <div className="stat-divider"></div>
                            <div className="stat-item"><span className="stat-value">100%</span><span className="stat-label">Multi-Cultural</span></div>
                        </div>
                        <button className="btn-primary btn-large">Join Our Community</button>
                    </div>
                </div>
            </div>
        </section>
    );
}