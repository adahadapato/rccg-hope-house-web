import { useChurchServices, formatTimeRange } from '../../hooks/useChurchServices';

export default function Hero() {
    const { services } = useChurchServices(true);

    // Mapped by real service name. See conversation note: Hero previously
    // advertised a weekly "Prayer Meeting" (Fri 10PM-12AM) that does not
    // exist in the backend as a weekly service — only "End of Month Vigil"
    // exists on Fridays, and it's monthly (Last Friday), not weekly. Using
    // that here, relabeled accurately, until confirmed otherwise.
    const worship = services.find(s => s.name === 'Worship Service');
    const fasting = services.find(s => s.name === 'Fasting and Prayer Day');
    const vigil = services.find(s => s.name === 'End of Month Vigil');

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
                        <div>
                            <strong>Sunday Service</strong>
                            <p>{worship ? formatTimeRange(worship.startTime, worship.endTime) : '11:00 AM - 12:40 PM'}</p>
                        </div>
                    </div>
                    <div className="service-time-divider"></div>
                    <div className="service-time-item">
                        <span className="service-icon">📖</span>
                        <div>
                            <strong>Wednesday Fasting</strong>
                            <p>{fasting ? formatTimeRange(fasting.startTime, fasting.endTime) : '7:00 PM - 7:40 PM'}</p>
                        </div>
                    </div>
                    <div className="service-time-divider"></div>
                    <div className="service-time-item">
                        <span className="service-icon">🙏</span>
                        <div>
                            <strong>End of Month Vigil</strong>
                            <p>Last {vigil ? vigil.dayOfWeek : 'Friday'} {vigil ? formatTimeRange(vigil.startTime, vigil.endTime) : '10:00 PM - 1:00 AM'}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="scroll-indicator"><span></span></div>
        </section>
    );
}