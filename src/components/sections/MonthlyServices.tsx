import { useState, useEffect} from 'react';

export default function MonthlyServices() {
    const [now, setNow] = useState(new Date());

    // Update time every minute to keep countdowns accurate
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // YouTube video data extracted from the channel
    const youtubeVideos = {
        holyGhostService: {
            videoId: "RXgNUBev7Ko",
            title: "PASTOR E.A ADEBOYE",
            thumbnail: "https://i.ytimg.com/vi/RXgNUBev7Ko/hqdefault.jpg",
            views: "JUNE 2026 HOLY GHOST SERVICE",
            //published: "Streamed 12 hours ago",
            isLive: false
        },
        holyCommunionService: {
            videoId: "9sjD8MINjSo",
            title: "PASTOR E.A ADEBOYE",
            thumbnail: "https://i.ytimg.com/vi/9sjD8MINjSo/hqdefault.jpg",
            views: "JUNE 2026 HOLY COMMUNION SERVICE",
            //published: "Streamed recently",
            isLive: false
        }
    };

    // Calculate next upcoming 1st [DayOfWeek] of the month
    const getNextServiceDate = (dayOfWeek: number) => {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();

        const firstDay = new Date(year, month, 1);
        const daysUntil = (dayOfWeek - firstDay.getDay() + 7) % 7;
        let target = new Date(year, month, 1 + daysUntil);

        // If passed this month, calculate for next month
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
            dayNum: target.getDate(),
            dayName: target.toLocaleDateString('en-US', { weekday: 'long' })
        };
    };

    // Countdown logic
    const getCountdown = (target: Date) => {
        const diff = target.getTime() - now.getTime();
        if (diff <= 0) return 'Starting Soon';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
        return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    };

    // Generate Google Calendar link
    const getCalendarLink = (title: string, desc: string, timeStr: string, startDate: Date) => {
        const format = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15);
        const [start, end] = timeStr.split('-').map(t => t.trim());

        // Parse start time
        const [sh, sm] = start.split(':');
        const startDT = new Date(startDate);
        const isStartPM = start.includes('PM');
        let shNum = parseInt(sh);
        if (isStartPM && shNum < 12) shNum += 12;
        if (!isStartPM && shNum === 12) shNum = 0;
        startDT.setHours(shNum, parseInt(sm), 0, 0);

        // Parse end time (handle overnight)
        const [eh, em] = end.split(':');
        const endDT = new Date(startDT);
        const isEndPM = end.includes('PM');
        let ehNum = parseInt(eh);
        if (isEndPM && ehNum < 12) ehNum += 12;
        if (!isEndPM && ehNum === 12) ehNum = 0;
        endDT.setHours(ehNum, parseInt(em), 0, 0);
        if (endDT <= startDT) endDT.setDate(endDT.getDate() + 1);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${format(startDT)}/${format(endDT)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent("RCCG Hope House Parish, Burnt Oak, Edgware, London")}`;
    };

    const services = (() => {
        const base = [
            /*{ 
                id: 0, 
                icon: "🔥", 
                title: "Divine Encounter", 
                dayOfWeek: 4, 
                time: "6:00 PM - 8:00 PM", 
                desc: "Powerful midweek prayer & worship service.", 
                featured: false 
            },*/
             { 
                id: 1, 
                icon: "🍞", 
                title: "Holy Communion", 
                dayOfWeek: 3, 
                time: "6:00 PM - 8:00 PM", 
                desc: "Sacred remembrance of Christ's sacrifice.", 
                featured: false,
                youtubeVideo: youtubeVideos.holyCommunionService,
                theme:""
            },
            { 
                id: 2, 
                icon: "🕊️", 
                title: "Holy Ghost Service", 
                dayOfWeek: 5, 
                time: "10:00 PM - 12:00 AM", 
                desc: "Intense Holy Spirit infilling & miracles.", 
                featured: true,
                youtubeVideo: youtubeVideos.holyGhostService,
                theme:"Divine Faithfulness"
            },
            { 
                id: 3, 
                icon: "🙏", 
                title: "Thanksgiving Service", 
                dayOfWeek: 0, 
                time: "9:00 AM - 12:00 PM", 
                desc: "Celebrating God's faithfulness & blessings.", 
                featured: true,
                theme:"Divine Partnership"
            }
           
        ];

        return base.map(s => {
            const next = getNextServiceDate(s.dayOfWeek);
            return {
                ...s,
                date: next.date,
                formattedDate: next.formatted,
                dayNum: next.dayNum,
                dayName: next.dayName,
                countdown: getCountdown(next.date),
                calendarLink: getCalendarLink(s.title, s.desc, s.time, next.date)
            };
        });
    })();

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
                    {services.map((service) => (
                        <div key={service.id} className={`service-card ${service.featured ? 'featured' : ''}`}>
                            {service.featured && <div className="featured-badge">{service.theme}</div>}

                            <div className="service-day-badge">
                                {/*<span className="day-number">{service.dayNum}</span>*/}
                                <span className="day-name">1st {service.dayName}s</span>
                                {/*<span className="day-name">{service.dayName}</span>*/}
                            </div>

                            <div className="service-icon">{service.icon}</div>
                            <h3>{service.title}</h3>
                            {/*<p className="service-description">{service.desc}</p>*/}

                            {/* YouTube Video Preview - Clickable */}
                            {service.youtubeVideo && (
                                <a 
                                    href={`https://www.youtube.com/watch?v=${service.youtubeVideo.videoId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="youtube-preview-link"
                                >
                                    <div className="video-thumbnail-container">
                                        <img 
                                            src={service.youtubeVideo.thumbnail} 
                                            alt={service.youtubeVideo.title}
                                            className="video-thumbnail"
                                        />
                                        {service.youtubeVideo.isLive && (
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
                                        <p className="video-title">{service.youtubeVideo.title}</p>
                                        <p className="video-meta">
                                            <span>{service.youtubeVideo.views}</span>
                                            {/*<span>•</span>*
                                            <span>{service.youtubeVideo.published}</span>*/}
                                        </p>
                                    </div>
                                </a>
                            )}

                            {/* Date & Time - Single Line, No Wrap */}
                            <div className="service-datetime">
                                <div className="datetime-item">
                                    <span className="datetime-icon">📅</span>
                                    <span>{service.formattedDate}</span>
                                </div>
                                <div className="datetime-item">
                                    <span className="datetime-icon">⏰</span>
                                    <span>{service.time}</span>
                                </div>
                            </div>

                            {/* Live Countdown */}
                            <div className="countdown-badge">
                                <span className="pulse-dot"></span>
                                {service.countdown}
                            </div>

                            {/* Calendar Sync */}
                            <a
                                href={service.calendarLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="calendar-link">
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