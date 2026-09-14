export default function Events() {
    const events = [
        { title: 'Annual Thanksgiving Service', date: 'December 31, 2024', time: '10:00 AM - 2:00 PM', icon: '🎉', color: 'gold' },
        { title: 'Youth Conference 2025', date: 'January 15-17, 2025', time: '6:00 PM Daily', icon: '👥', color: 'blue' },
        { title: 'Marriage Enrichment Seminar', date: 'February 14, 2025', time: '9:00 AM - 4:00 PM', icon: '💑', color: 'rose' }
    ];

    return (
        <section id="events" className="section bg-white">
            <div className="container">
                <div className="section-header-center">
                    <span className="section-tag">GET INVOLVED</span>
                    <h2 className="section-title">Upcoming Events</h2>
                    <div className="title-divider-center"></div>
                    <p className="section-description">Join us for these special gatherings and grow together in faith</p>
                </div>
                <div className="events-list-modern">
                    {events.map((event, idx) => (
                        <div key={idx} className="event-card-modern">
                            <div className={`event-icon-modern event-${event.color}`}><span className="event-icon-text">{event.icon}</span></div>
                            <div className="event-details-modern">
                                <h3 className="event-title">{event.title}</h3>
                                <div className="event-meta-modern">
                                    <span className="event-meta-item">📅 {event.date}</span>
                                    <span className="event-meta-item"> {event.time}</span>
                                </div>
                            </div>
                            <button className="btn-primary btn-register">Register Now</button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}