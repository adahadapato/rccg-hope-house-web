

import { useChurchServices, formatTimeRange } from '../../hooks/useChurchServices';

// Maps each known service name to which visual group it belongs in.
// The UI grouping does not correspond 1:1 to ServiceCategory.
const GROUP_MAP: Record<string, 'sunday' | 'wednesday' | 'monthly'> = {
    'Sunday School': 'sunday',
    'Worship Service': 'sunday',
    'Thanksgiving Sunday': 'sunday',
    'Fasting and Prayer Day': 'wednesday',
    'End of Month Vigil': 'monthly',
    'Evangelism': 'monthly',
};

export default function RegularServices() {
    // true = Hope House/local services
    const { services, loading } = useChurchServices(true);

    const byGroup = (group: 'sunday' | 'wednesday' | 'monthly') =>
        services.filter(s => GROUP_MAP[s.name] === group);

    const houseFellowship = services.find(
        s => s.name === 'House Fellowship'
    );

    /**
     * Opens Zoom using the meeting ID supplied by the API.
     * Spaces are removed before constructing the Zoom URL.
     */
    const joinZoomService = (zoomId: string) => {
        const cleanMeetingId = zoomId.replace(/\s+/g, '');

        window.open(
            `https://zoom.us/j/${cleanMeetingId}`,
            '_blank',
            'noopener,noreferrer'
        );
    };

    return (
        <section
            id="services"
            className="section regular-services-section"
        >
            <div className="container">

                {/* =====================================
                    HEADER
                   ===================================== */}

                <div className="services-header">
                    <div className="services-title-block">

                        <span className="section-tag">
                            WORSHIP WITH US
                        </span>

                        <h2 className="section-title">
                            Our Services
                        </h2>

                        <div className="title-divider-left"></div>

                        <p className="services-subtitle">
                            Join us for these regular gatherings
                        </p>

                    </div>
                </div>


                {/* =====================================
                    MAIN SERVICE CARDS
                   ===================================== */}

                {!loading && (
                    <div className="services-grid">

                        {/* =================================
                            SUNDAY SERVICES
                           ================================= */}

                        <div className="service-category">

                            <img
                                src="/icon-sunday.png"
                                alt=""
                                className="service-category-icon"
                            />

                            <h3>Sunday Services</h3>

                            <div className="service-items">

                                {byGroup('sunday').map(s => (
                                    <div
                                        className="service-item"
                                        key={s.id}
                                    >

                                        <h4>{s.name}</h4>

                                        {/* Time */}
                                        <p className="service-time">

                                            <img
                                                src="/icon-clock.png"
                                                alt=""
                                                className="regular-detail-icon"
                                            />

                                            <span className="time-nowrap">
                                                {formatTimeRange(
                                                    s.startTime,
                                                    s.endTime
                                                )}
                                            </span>

                                        </p>


                                        {/* All Sunday services are On Site */}
                                        <p className="service-note service-note-with-icon">

                                            <img
                                                src="/icon-location.png"
                                                alt=""
                                                className="regular-detail-icon"
                                            />

                                            <span>On Site</span>

                                        </p>


                                        {/* Thanksgiving frequency */}
                                        {s.name === 'Thanksgiving Sunday' && (
                                            <p className="service-note service-note-with-icon">

                                                <img
                                                    src="/icon-calendar.png"
                                                    alt=""
                                                    className="regular-detail-icon"
                                                />

                                                <span>
                                                    First Sunday of every month
                                                </span>

                                            </p>
                                        )}

                                    </div>
                                ))}

                            </div>
                        </div>


                        {/* =================================
                            WEDNESDAY SERVICE
                           ================================= */}

                        <div className="service-category">

                            <img
                                src="/icon-prayer.png"
                                alt=""
                                className="service-category-icon"
                            />

                            <h3>Wednesday Service</h3>

                            <div className="service-items">

                                {byGroup('wednesday').map(s => (
                                    <div
                                        className="service-item"
                                        key={s.id}
                                    >

                                        <h4>{s.name}</h4>


                                        {/* Time */}
                                        <p className="service-time">

                                            <img
                                                src="/icon-clock.png"
                                                alt=""
                                                className="regular-detail-icon"
                                            />

                                            <span className="time-nowrap">
                                                {formatTimeRange(
                                                    s.startTime,
                                                    s.endTime
                                                )}
                                            </span>

                                        </p>


                                        {/* Every Wednesday */}
                                        <p className="service-note service-note-with-icon">

                                            <img
                                                src="/icon-calendar.png"
                                                alt=""
                                                className="regular-detail-icon"
                                            />

                                            <span>
                                                Every Wednesday
                                            </span>

                                        </p>


                                        {/* Online */}
                                        <p className="service-note service-note-with-icon">

                                            <img
                                                src="/icon-online.png"
                                                alt=""
                                                className="regular-detail-icon"
                                            />

                                            <span>
                                                Online via Zoom
                                            </span>

                                        </p>


                                        {/* Zoom Details */}
                                        {s.zoomId && (
                                            <div className="regular-zoom-details">

                                                <div className="regular-zoom-heading">

                                                    <img
                                                        src="/icon-zoom.png"
                                                        alt=""
                                                        className="regular-zoom-icon"
                                                    />

                                                    <span>
                                                        Zoom Details
                                                    </span>

                                                </div>


                                                <p>
                                                    Meeting ID:{' '}
                                                    <strong>
                                                        {s.zoomId}
                                                    </strong>
                                                </p>


                                                {s.zoomPasscode && (
                                                    <p>
                                                        Passcode:{' '}
                                                        <strong>
                                                            {s.zoomPasscode}
                                                        </strong>
                                                    </p>
                                                )}


                                                {/* Join Zoom */}
                                                <button
                                                    type="button"
                                                    className="regular-zoom-button"
                                                    onClick={() =>
                                                        joinZoomService(s.zoomId!)
                                                    }
                                                >

                                                    <img
                                                        src="/icon-zoom.png"
                                                        alt=""
                                                        className="regular-zoom-button-icon"
                                                    />

                                                    <span>
                                                        Join Zoom Service
                                                    </span>

                                                </button>

                                            </div>
                                        )}

                                    </div>
                                ))}

                            </div>
                        </div>


                        {/* =================================
                            MONTHLY & SPECIAL
                           ================================= */}

                        <div className="service-category">

                            <img
                                src="/icon-calendar.png"
                                alt=""
                                className="service-category-icon"
                            />

                            <h3>Monthly &amp; Special</h3>

                            <div className="service-items">

                                {byGroup('monthly').map(s => (
                                    <div
                                        className="service-item"
                                        key={s.id}
                                    >

                                        <h4>{s.name}</h4>


                                        {/* Time */}
                                        <p className="service-time">

                                            <img
                                                src="/icon-clock.png"
                                                alt=""
                                                className="regular-detail-icon"
                                            />

                                            <span className="time-nowrap">
                                                {formatTimeRange(
                                                    s.startTime,
                                                    s.endTime
                                                )}
                                            </span>

                                        </p>


                                        {/* =================================
                                            END OF MONTH VIGIL
                                           ================================= */}

                                        {s.name === 'End of Month Vigil' && (
                                            <>

                                                <p className="service-note service-note-with-icon">

                                                    <img
                                                        src="/icon-calendar.png"
                                                        alt=""
                                                        className="regular-detail-icon"
                                                    />

                                                    <span>
                                                        Last {s.dayOfWeek || 'Friday'} of the Month
                                                    </span>

                                                </p>


                                                <p className="service-note service-note-with-icon">

                                                    <img
                                                        src="/icon-online.png"
                                                        alt=""
                                                        className="regular-detail-icon"
                                                    />

                                                    <span>
                                                        Online via Zoom
                                                    </span>

                                                </p>

                                            </>
                                        )}


                                        {/* =================================
    EVANGELISM
   ================================= */}

                                        {s.name === 'Evangelism' && (
                                            <>
                                                {/* Frequency */}
                                                <p className="service-note service-note-with-icon">
                                                    <img
                                                        src="/icon-calendar.png"
                                                        alt=""
                                                        className="regular-detail-icon"
                                                    />

                                                    <span>
                                                        Every Fortnight – Saturday
                                                    </span>
                                                </p>

                                                {/* Location */}
                                                {s.location && (
                                                    <p className="service-note service-note-with-icon">
                                                        <img
                                                            src="/icon-location.png"
                                                            alt=""
                                                            className="regular-detail-icon"
                                                        />

                                                        <span>
                                                            {s.location}
                                                        </span>
                                                    </p>
                                                )}
                                            </>
                                        )}


                                        {/* =================================
                                            ZOOM DETAILS
                                            Used when the API has a Zoom ID.
                                           ================================= */}

                                        {s.zoomId && (
                                            <div className="regular-zoom-details">

                                                <div className="regular-zoom-heading">

                                                    <img
                                                        src="/icon-zoom.png"
                                                        alt=""
                                                        className="regular-zoom-icon"
                                                    />

                                                    <span>
                                                        Zoom Details
                                                    </span>

                                                </div>


                                                <p>
                                                    Meeting ID:{' '}
                                                    <strong>
                                                        {s.zoomId}
                                                    </strong>
                                                </p>


                                                {s.zoomPasscode && (
                                                    <p>
                                                        Passcode:{' '}
                                                        <strong>
                                                            {s.zoomPasscode}
                                                        </strong>
                                                    </p>
                                                )}


                                                <button
                                                    type="button"
                                                    className="regular-zoom-button"
                                                    onClick={() =>
                                                        joinZoomService(s.zoomId!)
                                                    }
                                                >

                                                    <img
                                                        src="/icon-zoom.png"
                                                        alt=""
                                                        className="regular-zoom-button-icon"
                                                    />

                                                    <span>
                                                        Join Zoom Service
                                                    </span>

                                                </button>

                                            </div>
                                        )}

                                    </div>
                                ))}

                            </div>
                        </div>

                    </div>
                )}


                {/* =====================================
                    ADDITIONAL INFORMATION
                   ===================================== */}

                <div className="services-additional">


                    {/* =================================
                        HOUSE FELLOWSHIP
                       ================================= */}

                    {houseFellowship && (
                        <div className="additional-card">

                            <img
                                src="/icon-house-fellowship.png"
                                alt=""
                                className="additional-icon"
                            />

                            <div className="additional-content">

                                <h4>
                                    House Fellowship
                                </h4>


                                <p className="additional-time">

                                    <img
                                        src="/icon-clock.png"
                                        alt=""
                                        className="regular-detail-icon"
                                    />

                                    <span>

                                        {formatTimeRange(
                                            houseFellowship.startTime,
                                            houseFellowship.endTime
                                        )}

                                        {houseFellowship.location === 'Online'
                                            ? ' (Except 1st Sunday of the month)'
                                            : ''}

                                    </span>

                                </p>


                                {houseFellowship.location && (
                                    <p className="service-note service-note-with-icon">

                                        <img
                                            src="/icon-online.png"
                                            alt=""
                                            className="regular-detail-icon"
                                        />

                                        <span>
                                            Online via Zoom
                                        </span>

                                    </p>
                                )}


                                {houseFellowship.zoomId && (
                                    <div className="regular-zoom-details additional-zoom-details">

                                        <div className="regular-zoom-heading">

                                            <img
                                                src="/icon-zoom.png"
                                                alt=""
                                                className="regular-zoom-icon"
                                            />

                                            <span>
                                                Zoom Details
                                            </span>

                                        </div>


                                        <p>
                                            Meeting ID:{' '}
                                            <strong>
                                                {houseFellowship.zoomId}
                                            </strong>
                                        </p>


                                        {houseFellowship.zoomPasscode && (
                                            <p>
                                                Passcode:{' '}
                                                <strong>
                                                    {houseFellowship.zoomPasscode}
                                                </strong>
                                            </p>
                                        )}


                                        <button
                                            type="button"
                                            className="regular-zoom-button"
                                            onClick={() =>
                                                joinZoomService(
                                                    houseFellowship.zoomId!
                                                )
                                            }
                                        >

                                            <img
                                                src="/icon-zoom.png"
                                                alt=""
                                                className="regular-zoom-button-icon"
                                            />

                                            <span>
                                                Join Zoom Service
                                            </span>

                                        </button>

                                    </div>
                                )}

                            </div>
                        </div>
                    )}


                    {/* =================================
                        CHURCH ADDRESS
                       ================================= */}

                    <div className="additional-card">

                        <img
                            src="/icon-location.png"
                            alt=""
                            className="additional-icon"
                        />

                        <div className="additional-content">

                            <h4>
                                Church Address
                            </h4>

                            <p>
                                230 Burnt Oak Broadway, Edgware.
                                <br />
                                HA8 0AP
                            </p>

                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}