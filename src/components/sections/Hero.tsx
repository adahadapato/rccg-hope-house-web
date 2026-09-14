export default function Hero() {
    return (
        <section id="home" className="hero-modern">
            <div className="hero-overlay"></div>
            <div className="hero-content-modern">
                
                <h1 className="hero-title">
                    <span className="text-gold">RCCG Hope House Parish</span>
                </h1>
                <p className="hero-tagline">A PLACE OF HIS ABIDING PRESENCE</p>
                <p className="hero-description">
                    It's with great joy that we welcome you to this information platform of Hope House Church,
                    a parish of The Redeemed Christian Church of God. We are a bible believing Christian church
                    promoting the unconditional love of God and gospel of our Lord Jesus Christ to all.
                </p>
                <div className="hero-buttons">
                    <button className="btn-primary btn-large"><span></span> Join Us This Sunday</button>
                    <button className="btn-white btn-large"><span>▶</span> Watch Live Service</button>
                </div>
                <div className="service-times-modern">
                    <div className="service-time-item">
                        <span className="service-icon">☀️</span>
                        <div><strong>Sunday Service</strong><p>10:00 AM - 12:450 PM</p></div>
                    </div>
                    <div className="service-time-divider"></div>
                    <div className="service-time-item">
                        <span className="service-icon">📖</span>
                        <div><strong>Wednesday Fasting</strong><p> 7:00 PM - 7:30 PM</p></div>
                    </div>
                    <div className="service-time-divider"></div>
                    <div className="service-time-item">
                        <span className="service-icon">🙏</span>
                        <div><strong>Prayer Meeting</strong><p>Friday 10:00 PM - 12:00 AM</p></div>
                    </div>
                </div>
            </div>
            <div className="scroll-indicator"><span></span></div>
        </section>
    );
}