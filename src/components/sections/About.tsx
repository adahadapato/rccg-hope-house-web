
import { useChurchInfo } from '../../hooks/useChurchInfo';

export default function About() {
    const { churchInfo, loading } = useChurchInfo();

    return (
        <section id="about" className="section about-modern">
            <div className="container">
                <div className="about-grid-modern">
                    <div className="about-visual-modern">
                        <div className="est-badge">
                            Est. {churchInfo?.establishedYear ?? '2012'}
                        </div>
                        <img src="https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&auto=format&fit=crop" alt="Church community" className="about-image-modern" />
                        <div className="about-accent-card">
                            <span className="accent-icon">‍👩‍👧‍👦</span>
                            <p>"A family within a family"</p>
                        </div>
                    </div>
                    <div className="about-content-modern">
                        <span className="section-tag">WHO WE ARE</span>
                        <h2 className="section-title">{churchInfo?.parishName ?? 'RCCG Hope House Parish'}</h2>
                        <div className="title-divider"></div>
                        <p className="about-lead">
                            {loading ? '' : churchInfo?.aboutLead}
                        </p>
                        <p className="about-text">
                            {loading ? '' : churchInfo?.aboutText}
                        </p>
                        <div className="about-stats-modern">
                            <div className="stat-item">
                                <span className="stat-value">{churchInfo ? `${churchInfo.yearsOfMinistry}+` : ''}</span>
                                <span className="stat-label">Years of Ministry</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">{churchInfo ? `${churchInfo.activeMemberCount}+` : ''}</span>
                                <span className="stat-label">Church Family</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">{churchInfo?.multiCulturalStat ?? ''}</span>
                                <span className="stat-label">Multi-Cultural</span>
                            </div>
                        </div>
                        <button className="btn-primary btn-large">Join Our Community</button>
                    </div>
                </div>
            </div>
        </section>
    );
}