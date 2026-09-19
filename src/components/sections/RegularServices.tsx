import { useChurchServices, formatTimeRange } from '../../hooks/useChurchServices';

// Maps each known service name to which visual group it belongs in.
// Simple lookup rather than deriving from Category, since the UI's
// grouping ("Sunday Services" / "Wednesday Service" / "Monthly & Special")
// doesn't correspond 1:1 to ServiceCategory.
const GROUP_MAP: Record<string, 'sunday' | 'wednesday' | 'monthly'> = {
    'Sunday School': 'sunday',
    'Worship Service': 'sunday',
    'Thanksgiving Sunday': 'sunday',
    'Fasting and Prayer Day': 'wednesday',
    'End of Month Vigil': 'monthly',
    'Evangelism': 'monthly',
};

export default function RegularServices() {
    const { services, loading } = useChurchServices(true);

    const byGroup = (group: 'sunday' | 'wednesday' | 'monthly') =>
        services.filter(s => GROUP_MAP[s.name] === group);

    const houseFellowship = services.find(s => s.name === 'House Fellowship');

    return (
        <section id="services" className="section regular-services-section">
            <div className="container">
                <div className="services-header">
                    <div className="services-title-block">
                        <span className="section-tag">WORSHIP WITH US</span>
                        <h2 className="section-title">Our Services</h2>
                        <div className="title-divider-left"></div>
                        <p className="services-subtitle">Join us for these regular gatherings</p>
                    </div>
                </div>

                {!loading && (
                    <div className="services-grid">
                        {/* Sunday Services */}
                        <div className="service-category">
                            <div className="service-category-icon">⛪</div>
                            <h3>Sunday Services</h3>
                            <div className="service-items">
                                {byGroup('sunday').map(s => (
                                    <div className="service-item" key={s.id}>
                                        <h4>{s.name}</h4>
                                        <p className="service-time">{formatTimeRange(s.startTime, s.endTime)}</p>
                                        {s.name === 'Worship Service' && <p className="service-note">Physical Service</p>}
                                        {s.name === 'Thanksgiving Sunday' && <p className="service-note">First Sunday of every month</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Wednesday Service */}
                        <div className="service-category">
                            <div className="service-category-icon">🙏</div>
                            <h3>Wednesday Service</h3>
                            <div className="service-items">
                                {byGroup('wednesday').map(s => (
                                    <div className="service-item" key={s.id}>
                                        <h4>{s.name}</h4>
                                        <p className="service-time">{formatTimeRange(s.startTime, s.endTime)}</p>
                                        {s.location && <p className="service-note">{s.location} Prayer</p>}
                                        {s.zoomId && <p className="service-note">Zoom ID {s.zoomId}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Monthly & Special Services */}
                        <div className="service-category">
                            <div className="service-category-icon">📅</div>
                            <h3>Monthly & Special</h3>
                            <div className="service-items">
                                {byGroup('monthly').map(s => (
                                    <div className="service-item" key={s.id}>
                                        <h4>{s.name}</h4>
                                        <p className="service-time">{formatTimeRange(s.startTime, s.endTime)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Info */}
                <div className="services-additional">
                    {houseFellowship && (
                        <div className="additional-card">
                            <div className="additional-icon">🏠</div>
                            <div>
                                <h4>House Fellowship</h4>
                                <p>{formatTimeRange(houseFellowship.startTime, houseFellowship.endTime)}
                                    {houseFellowship.location === 'Online' ? ' (Except 1st Sunday of the month)' : ''}</p>
                                {houseFellowship.location && <p className="service-note">Online on Zoom ID</p>}
                                {houseFellowship.zoomId && (
                                    <p className="service-note">
                                        {houseFellowship.zoomId}
                                        {houseFellowship.zoomPasscode ? ` PASSCODE = ${houseFellowship.zoomPasscode}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="additional-card">
                        <div className="additional-icon">📍</div>
                        <div>
                            <h4>Church Address</h4>
                            <p>230 Burnt Oak Broadway, Edgware.<br />HA8 0AP</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}