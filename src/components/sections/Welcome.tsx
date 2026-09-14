export default function Welcome() {
    return (
        <section id="welcome" className="section bg-white">
            <div className="container">
                <div className="welcome-grid-modern">
                    <div className="welcome-content">
                        <div className="section-header">
                            <span className="section-tag">OUR FAMILY</span>
                            <h2 className="section-title">Welcome to Our Church Family</h2>
                            <div className="title-divider"></div>
                        </div>
                        <p className="welcome-text">At RCCG Hope House, we believe in creating a warm, welcoming environment where everyone can experience the love of God. Whether you're taking your first steps in faith or looking to deepen your relationship with Christ, you'll find a home here.</p>
                        <p className="welcome-text">Our passionate leadership team is dedicated to helping you grow spiritually through dynamic teaching, meaningful fellowship, and opportunities to serve in your community.</p>
                        <div className="welcome-stats-modern">
                            <div className="stat-card"><div className="stat-number">500+</div><div className="stat-label">Active Members</div></div>
                            <div className="stat-card"><div className="stat-number">15+</div><div className="stat-label">Years of Ministry</div></div>
                            <div className="stat-card"><div className="stat-number">50+</div><div className="stat-label">Ministries</div></div>
                        </div>
                        <button className="btn-primary btn-large">Learn More About Us</button>
                    </div>
                    <div className="welcome-image-modern">
                        <div className="vision-image">
                            <img src="/congragation-image.jpg" alt="Church congregation" 
                            className="vision-photo" />
                            <div className="image-accent"></div>
                        </div>
                        <div className="welcome-badge-modern">
                            <div className="badge-icon">✨</div>
                            <div className="badge-text">
                                <p className="badge-quote">"Come as you are"</p>
                                <p className="badge-subtitle">Leave transformed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}