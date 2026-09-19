import { useState, useEffect } from 'react';
import { useChurchServices, dayNameToNumber } from '../../hooks/useChurchServices';
import { useServiceBroadcasts } from '../../hooks/useServiceBroadcasts';

const META: Record<string, { icon: string }> = {
    'Holy Communion': { icon: '🍞' },
    'Holy Ghost Service': { icon: '🕊️' },
    'Thanksgiving Service': { icon: '🙏' },
};

export default function MonthlyServices() {
    const { services = [] } = useChurchServices(false);
    const { broadcasts = [] } = useServiceBroadcasts();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getNextServiceDate = (dayOfWeek: number) => {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();

        const firstDay = new Date(year, month, 1);
        const daysUntil = (dayOfWeek - firstDay.getDay() + 7) % 7;
        let target = new Date(year, month, 1 + daysUntil);

        if (target < new Date(today.setHours(0, 0, 0, 0))) {
            month++;
            if (month > 11) { month = 0; year++; }
            const nextFirst = new Date(year, month, 1);
            const nextUntil = (dayOfWeek - nextFirst.getDay() + 7) % 7;
            target = new Date(year, month, 1 + nextUntil);
        }

        return {
            date: target,
            formatted: target.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
            dayName: target.toLocaleDateString('en-US', { weekday: 'long' })
        };
    };

    const getCountdown = (target: Date) => {
        const diff = target.getTime() - now.getTime();
        if (diff <= 0) return 'Starting Soon';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
        return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    };

    const getCalendarLink = (title: string, desc: string, startTime: string, endTime: string, startDate: Date) => {
        const format = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15);

        const [sh, sm] = startTime.split(':').map(Number);
        const startDT = new Date(startDate);
        startDT.setHours(sh, sm, 0, 0);

        const [eh, em] = endTime.split(':').map(Number);
        const endDT = new Date(startDT);
        endDT.setHours(eh, em, 0, 0);
        if (endDT <= startDT) endDT.setDate(endDT.getDate() + 1);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${format(startDT)}/${format(endDT)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent("RCCG Hope House Parish, Burnt Oak, Edgware, London")}`;
    };

    const displayServices = services
        .filter(s => META[s.name])
        .map(s => {
            const meta = META[s.name];
            const broadcast = broadcasts.find(b => b.category === s.category);
            const dayNum = dayNameToNumber(s.dayOfWeek);
            const next = getNextServiceDate(dayNum);
            const displayTime = `${s.startTime.slice(0, 5)} - ${s.endTime.slice(0, 5)}`;

            return {
                ...s,
                ...meta,
                broadcast,
                // ✅ Pulls the theme directly from the broadcast data
                featured: !!broadcast?.theme,
                theme: broadcast?.theme || '',
                formattedDate: next.formatted,
                dayName: next.dayName,
                countdown: getCountdown(next.date),
                calendarLink: getCalendarLink(s.name, s.name, s.startTime, s.endTime, next.date),
                displayTime
            };
        });

    return (
        <section id="monthly-services" className="section monthly-services-section">
            <div className="container">
                <div className="section-header-center">
                    <span className="section-tag">MONTHLY GATHERINGS</span>
                    <h2 className="section-title">Special Monthly Services</h2>
                    <div className="title-divider-center"></div>
                    <p className="section-description">
                        Beyond our regular Sunday worship, join us for these powerful gatherings designed to deepen your faith.
                    </p>
                </div>

                <div className="monthly-services-grid">
                    {displayServices.map((service) => (
                        <div key={service.id} className={`service-card ${service.featured ? 'featured' : ''}`}>
                            {service.featured && <div className="featured-badge">{service.theme}</div>}

                            <div className="service-day-badge">
                                <span className="day-name">1st {service.dayName}s</span>
                            </div>

                            <div className="service-icon">{service.icon}</div>
                            <h3>{service.name}</h3>

                            {service.broadcast && (
                                <a
                                    href={service.broadcast.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="youtube-preview-link"
                                >
                                    <div className="video-thumbnail-container">
                                        <img
                                            src={service.broadcast.thumbnailUrl}
                                            alt={service.broadcast.title}
                                            className="video-thumbnail"
                                        />
                                        {service.broadcast.isLive && (
                                            <div className="live-badge">
                                                <span className="live-dot"></span>
                                                LIVE
                                            </div>
                                        )}
                                        <div className="play-overlay">
                                            <div className="play-button">▶</div>
                                        </div>
                                    </div>
                                    <div className="video-info">
                                        <p className="video-title">{service.broadcast.title}</p>
                                        <p className="video-meta">
                                            <span>{service.broadcast.description}</span>
                                        </p>
                                    </div>
                                </a>
                            )}

                            <div className="service-datetime">
                                <div className="datetime-item">
                                    <span className="datetime-icon">📅</span>
                                    <span>{service.formattedDate}</span>
                                </div>
                                <div className="datetime-item">
                                    <span className="datetime-icon">⏰</span>
                                    <span>{service.displayTime}</span>
                                </div>
                            </div>

                            <div className="countdown-badge">
                                <span className="pulse-dot"></span>
                                {service.countdown}
                            </div>

                            <a
                                href={service.calendarLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="calendar-link"
                            >
                                📅 Add to Calendar
                            </a>
                        </div>
                    ))}
                </div>

                <div className="monthly-services-note">
                    <p>💡 <strong>Note:</strong> All services are in addition to our regular weekly gatherings. Everyone is welcome!</p>
                </div>
            </div>
        </section>
    );
}