import { useEffect, useState } from 'react';

interface ChurchEvent {
    id: string;
    title: string;
    category: string;
    startDateTime: string;
    endDateTime: string | null;
    description: string | null;
    location: string | null;
    icon: string | null;
    color: string | null;
    registrationUrl: string | null;
    registrationButtonText: string;
    imageUrl: string | null;
    displayOrder: number;
}

const formatDate = (
    startDateTime: string,
    endDateTime: string | null
) => {
    const start = new Date(startDateTime);

    if (!endDateTime) {
        return start.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    const end = new Date(endDateTime);

    const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    if (sameDay) {
        return start.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    const sameMonth =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth();

    if (sameMonth) {
        return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(
            'en-GB',
            {
                month: 'long',
                year: 'numeric',
            }
        )}`;
    }

    return `${start.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })} – ${end.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })}`;
};

const formatTime = (
    startDateTime: string,
    endDateTime: string | null
) => {
    const start = new Date(startDateTime);

    const startTime = start.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    if (!endDateTime) {
        return startTime;
    }

    const end = new Date(endDateTime);

    const endTime = end.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    /*
     * For multi-day events where the start and end times
     * are identical, display "Daily" rather than
     * something confusing such as "6:00 pm - 6:00 pm".
     */
    if (!sameDay && startTime === endTime) {
        return `${startTime} Daily`;
    }

    return `${startTime} - ${endTime}`;
};

export default function Events() {
    const [events, setEvents] = useState<ChurchEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const response = await fetch(
                    '/api/events/upcoming'
                );

                if (!response.ok) {
                    throw new Error(
                        'Unable to load upcoming events.'
                    );
                }

                const data: ChurchEvent[] =
                    await response.json();

                setEvents(data);
            } catch (err) {
                console.error(
                    'Failed to load upcoming events:',
                    err
                );

                setError(
                    'Upcoming events are currently unavailable.'
                );
            } finally {
                setLoading(false);
            }
        };

        void loadEvents();
    }, []);

    return (
        <section
            id="events"
            className="section bg-white"
        >
            <div className="container">
                <div className="section-header-center">
                    <span className="section-tag">
                        GET INVOLVED
                    </span>

                    <h2 className="section-title">
                        Upcoming Events
                    </h2>

                    <div className="title-divider-center"></div>

                    <p className="section-description">
                        Join us for these special gatherings and
                        grow together in faith
                    </p>
                </div>

                {loading && (
                    <p className="section-description">
                        Loading upcoming events...
                    </p>
                )}

                {!loading && error && (
                    <p className="section-description">
                        {error}
                    </p>
                )}

                {!loading &&
                    !error &&
                    events.length === 0 && (
                        <p className="section-description">
                            There are currently no upcoming
                            events. Please check back soon.
                        </p>
                    )}

                {!loading &&
                    !error &&
                    events.length > 0 && (
                        <div className="events-list-modern">
                            {events.map(event => (
                                <div
                                    key={event.id}
                                    className="event-card-modern"
                                >
                                    <div
                                        className={`event-icon-modern event-${event.color ?? 'blue'
                                            }`}
                                    >
                                        <span className="event-icon-text">
                                            {event.icon ?? '📅'}
                                        </span>
                                    </div>

                                    <div className="event-details-modern">
                                        <h3 className="event-title">
                                            {event.title}
                                        </h3>

                                        <div className="event-meta-modern">
                                            <span className="event-meta-item">
                                                📅{' '}
                                                {formatDate(
                                                    event.startDateTime,
                                                    event.endDateTime
                                                )}
                                            </span>

                                            <span className="event-meta-item">
                                                🕒{' '}
                                                {formatTime(
                                                    event.startDateTime,
                                                    event.endDateTime
                                                )}
                                            </span>

                                            {event.location && (
                                                <span className="event-meta-item">
                                                    📍{' '}
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>

                                        {event.description && (
                                            <p className="event-description">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>

                                    {event.registrationUrl ? (
                                        <a
                                            href={
                                                event.registrationUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary btn-register"
                                        >
                                            {event.registrationButtonText ||
                                                'Register Now'}
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-primary btn-register"
                                            disabled
                                            title="Registration details will be available soon"
                                        >
                                            Registration Soon
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </section>
    );
}