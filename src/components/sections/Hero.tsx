
//import { useChurchServices, formatTimeRange } from '../../hooks/useChurchServices';

//export default function Hero() {
//    // true = Hope House/local services rather than national services
//    const { services } = useChurchServices(true);

//    const worship = services.find(s => s.name === 'Worship Service');
//    const fasting = services.find(s => s.name === 'Fasting and Prayer Day');
//    const vigil = services.find(s => s.name === 'End of Month Vigil');

//    // Wednesday and Vigil use the online Zoom details.
//    // Prefer Wednesday's details and fall back to Vigil.
//    const onlineService =
//        (fasting?.zoomId ? fasting : undefined) ??
//        (vigil?.zoomId ? vigil : undefined);

//    const zoomId = onlineService?.zoomId ?? '';
//    const zoomPasscode = onlineService?.zoomPasscode ?? '';

//    const joinZoomService = () => {
//        if (!zoomId) {
//            window.location.hash = 'monthly-services';
//            return;
//        }

//        const cleanMeetingId = zoomId.replace(/\s+/g, '');

//        window.open(
//            `https://zoom.us/j/${cleanMeetingId}`,
//            '_blank',
//            'noopener,noreferrer'
//        );
//    };

//    return (
//        <section id="home" className="hero-modern">
//            <div className="hero-overlay"></div>

//            <div className="hero-content-modern">
//                <h1 className="hero-title">
//                    <span className="text-gold">
//                        RCCG Hope House Parish
//                    </span>
//                </h1>

//                <p className="hero-tagline">
//                    A PLACE OF HIS ABIDING PRESENCE
//                </p>

//                <p className="hero-description">
//                    It's with great joy that we welcome you to this information platform of Hope House Church,
//                    a parish of The Redeemed Christian Church of God. We are a bible believing Christian church
//                    promoting the unconditional love of God and gospel of our Lord Jesus Christ to all.
//                </p>

//                <div className="hero-buttons">
//                    <button
//                        className="btn-primary btn-large"
//                        onClick={() => {
//                            window.location.hash = 'services';
//                        }}
//                    >
//                        Join Us This Sunday
//                    </button>

//                    <button
//                        className="btn-white btn-large"
//                        onClick={() => {
//                            window.location.hash = 'monthly-services';
//                        }}
//                    >
//                        <img
//                            src="/icon-play.png"
//                            alt=""
//                            className="hero-button-icon"
//                        />

//                        Watch Live Service
//                    </button>
//                </div>

//                <div className="service-times-modern">

//                    {/* Sunday Service */}
//                    <div className="service-time-item">
//                        <img
//                            src="/icon-sunday.png"
//                            alt=""
//                            className="service-main-icon"
//                        />

//                        <div className="service-time-content">
//                            <strong>Sunday Service</strong>

//                            <div className="service-mode">
//                                <img
//                                    src="/icon-location.png"
//                                    alt=""
//                                    className="service-detail-icon"
//                                />

//                                <span>On Site</span>
//                            </div>

//                            <p className="service-time">
//                                <img
//                                    src="/icon-clock.png"
//                                    alt=""
//                                    className="service-detail-icon"
//                                />

//                                <span className="time-nowrap">
//                                    {worship
//                                        ? formatTimeRange(
//                                            worship.startTime,
//                                            worship.endTime
//                                        )
//                                        : '11:00 AM - 12:40 PM'}
//                                </span>
//                            </p>
//                        </div>
//                    </div>

//                    <div className="service-time-divider"></div>

//                    {/* Wednesday Fasting */}
//                    <div className="service-time-item">
//                        <img
//                            src="/icon-bible.png"
//                            alt=""
//                            className="service-main-icon"
//                        />

//                        <div className="service-time-content">
//                            <strong>Wednesday Fasting</strong>

//                            <div className="service-mode">
//                                <img
//                                    src="/icon-online.png"
//                                    alt=""
//                                    className="service-detail-icon"
//                                />

//                                <span>Online via Zoom</span>
//                            </div>

//                            <p className="service-time">
//                                <img
//                                    src="/icon-clock.png"
//                                    alt=""
//                                    className="service-detail-icon"
//                                />

//                                <span className="time-nowrap">
//                                    {fasting
//                                        ? formatTimeRange(
//                                            fasting.startTime,
//                                            fasting.endTime
//                                        )
//                                        : '7:00 PM - 7:30 PM'}
//                                </span>
//                            </p>
//                        </div>
//                    </div>

//                    <div className="service-time-divider"></div>

//                    {/* End of Month Vigil */}
//                    <div className="service-time-item">
//                        <img
//                            src="/icon-prayer.png"
//                            alt=""
//                            className="service-main-icon"
//                        />

//                        <div className="service-time-content">
//                            <strong>End of Month Vigil</strong>

//                            <div className="service-mode">
//                                <img
//                                    src="/icon-online.png"
//                                    alt=""
//                                    className="service-detail-icon"
//                                />

//                                <span>Online via Zoom</span>
//                            </div>

//                            <div className="service-vigil-day">
//                                <img
//                                    src="/icon-calendar.png"
//                                    alt=""
//                                    className="service-detail-icon"
//                                />

//                                <span>
//                                    Last {vigil?.dayOfWeek ?? 'Friday'} of the Month
//                                </span>
//                            </div>

//                            <p className="service-time">
//                                <img
//                                    src="/icon-clock.png"
//                                    alt=""
//                                    className="service-detail-icon"
//                                />

//                                <span className="time-nowrap">
//                                    {vigil
//                                        ? formatTimeRange(
//                                            vigil.startTime,
//                                            vigil.endTime
//                                        )
//                                        : '10:00 PM - 1:00 AM'}
//                                </span>
//                            </p>
//                        </div>
//                    </div>

//                    <div className="service-time-divider"></div>

//                    {/* Zoom Details */}
//                    <div className="zoom-service-card">
//                        <div className="zoom-heading">
//                            <img
//                                src="/icon-zoom.png"
//                                alt=""
//                                className="zoom-heading-icon"
//                            />

//                            <strong>JOIN US ONLINE</strong>
//                        </div>

//                        {zoomId ? (
//                            <>
//                                <p className="zoom-detail">
//                                    Meeting ID:{' '}
//                                    <strong>{zoomId}</strong>
//                                </p>

//                                {zoomPasscode && (
//                                    <p className="zoom-detail">
//                                        Passcode:{' '}
//                                        <strong>{zoomPasscode}</strong>
//                                    </p>
//                                )}

//                                <button
//                                    type="button"
//                                    className="zoom-join-button"
//                                    onClick={joinZoomService}
//                                >
//                                    <img
//                                        src="/icon-zoom.png"
//                                        alt=""
//                                        className="zoom-button-icon"
//                                    />

//                                    Join Zoom Service
//                                </button>

//                                <p className="zoom-note">
//                                    Same details for Wednesday and Vigil services.
//                                </p>
//                            </>
//                        ) : (
//                            <>
//                                <p className="zoom-detail">
//                                    Join our Wednesday and Vigil services online.
//                                </p>

//                                <button
//                                    type="button"
//                                    className="zoom-join-button"
//                                    onClick={() => {
//                                        window.location.hash = 'monthly-services';
//                                    }}
//                                >
//                                    <img
//                                        src="/icon-online.png"
//                                        alt=""
//                                        className="zoom-button-icon"
//                                    />

//                                    View Online Service Details
//                                </button>
//                            </>
//                        )}
//                    </div>
//                </div>
//            </div>

//            <div className="scroll-indicator">
//                <span></span>
//            </div>
//        </section>
//    );
//}


import { useChurchServices, formatTimeRange } from '../../hooks/useChurchServices';

export default function Hero() {
    // true = Hope House/local services rather than national services
    const { services } = useChurchServices(true);

    const worship = services.find(s => s.name === 'Worship Service');
    const fasting = services.find(s => s.name === 'Fasting and Prayer Day');
    const vigil = services.find(s => s.name === 'End of Month Vigil');

    // Wednesday and Vigil use the online Zoom details.
    // Prefer Wednesday's details and fall back to Vigil.
    const onlineService =
        (fasting?.zoomId ? fasting : undefined) ??
        (vigil?.zoomId ? vigil : undefined);

    const zoomId = onlineService?.zoomId ?? '';
    const zoomPasscode = onlineService?.zoomPasscode ?? '';

    /**
     * Opens the Zoom meeting.
     *
     * The meeting ID and passcode come from the API.
     * If a passcode exists, copy it to the clipboard so
     * the visitor can paste it if Zoom asks for it.
     */
    const joinZoomService = async () => {
        if (!zoomId) {
            window.location.hash = 'monthly-services';
            return;
        }

        const cleanMeetingId = zoomId.replace(/\s+/g, '');

        if (zoomPasscode) {
            try {
                await navigator.clipboard.writeText(zoomPasscode);
            } catch {
                // Some browsers may block clipboard access.
                // The passcode is still displayed on the page.
            }
        }

        window.open(
            `https://zoom.us/j/${cleanMeetingId}`,
            '_blank',
            'noopener,noreferrer'
        );
    };

    return (
        <section id="home" className="hero-modern">

            <div className="hero-overlay"></div>

            <div className="hero-content-modern">

                {/* =====================================
                    HERO TITLE
                   ===================================== */}

                <h1 className="hero-title">
                    <span className="text-gold">
                        RCCG Hope House Parish
                    </span>
                </h1>

                <p className="hero-tagline">
                    A PLACE OF HIS ABIDING PRESENCE
                </p>

                <p className="hero-description">
                    It's with great joy that we welcome you to this
                    information platform of Hope House Church, a parish
                    of The Redeemed Christian Church of God. We are a
                    bible believing Christian church promoting the
                    unconditional love of God and gospel of our Lord
                    Jesus Christ to all.
                </p>


                {/* =====================================
                    HERO BUTTONS
                   ===================================== */}

                <div className="hero-buttons">

                    <button
                        className="btn-primary btn-large"
                        onClick={() => {
                            window.location.hash = 'services';
                        }}
                    >
                        Join Us This Sunday
                    </button>

                    <button
                        className="btn-white btn-large"
                        onClick={() => {
                            window.location.hash = 'monthly-services';
                        }}
                    >
                        <img
                            src="/icon-play.png"
                            alt=""
                            className="hero-button-icon"
                        />

                        Watch Live Service
                    </button>

                </div>


                {/* =====================================
                    SERVICE PANEL
                   ===================================== */}

                <div className="service-times-modern">


                    {/* =================================
                        SUNDAY SERVICE
                       ================================= */}

                    <div className="service-time-item">

                        <img
                            src="/icon-sunday.png"
                            alt=""
                            className="service-main-icon"
                        />

                        <div className="service-time-content">

                            <strong>
                                Sunday Service
                            </strong>

                            <div className="service-mode">

                                <img
                                    src="/icon-location.png"
                                    alt=""
                                    className="service-detail-icon"
                                />

                                <span>
                                    On Site
                                </span>

                            </div>

                            <p className="service-time">

                                <img
                                    src="/icon-clock.png"
                                    alt=""
                                    className="service-detail-icon"
                                />

                                <span className="time-nowrap">

                                    {worship
                                        ? formatTimeRange(
                                            worship.startTime,
                                            worship.endTime
                                        )
                                        : '11:00 AM - 12:40 PM'}

                                </span>

                            </p>

                        </div>
                    </div>


                    <div className="service-time-divider"></div>


                    {/* =================================
                        WEDNESDAY FASTING
                       ================================= */}

                    <div className="service-time-item">

                        <img
                            src="/icon-bible.png"
                            alt=""
                            className="service-main-icon"
                        />

                        <div className="service-time-content">

                            <strong>
                                Wednesday Fasting
                            </strong>

                            <div className="service-mode">

                                <img
                                    src="/icon-online.png"
                                    alt=""
                                    className="service-detail-icon"
                                />

                                <span>
                                    Online via Zoom
                                </span>

                            </div>

                            <p className="service-time">

                                <img
                                    src="/icon-clock.png"
                                    alt=""
                                    className="service-detail-icon"
                                />

                                <span className="time-nowrap">

                                    {fasting
                                        ? formatTimeRange(
                                            fasting.startTime,
                                            fasting.endTime
                                        )
                                        : '7:00 PM - 7:30 PM'}

                                </span>

                            </p>

                        </div>
                    </div>


                    <div className="service-time-divider"></div>


                    {/* =================================
                        END OF MONTH VIGIL
                       ================================= */}

                    <div className="service-time-item">

                        <img
                            src="/icon-prayer.png"
                            alt=""
                            className="service-main-icon"
                        />

                        <div className="service-time-content">

                            <strong>
                                End of Month Vigil
                            </strong>

                            <div className="service-mode">

                                <img
                                    src="/icon-online.png"
                                    alt=""
                                    className="service-detail-icon"
                                />

                                <span>
                                    Online via Zoom
                                </span>

                            </div>


                            <div className="service-vigil-day">

                                <img
                                    src="/icon-calendar.png"
                                    alt=""
                                    className="service-detail-icon"
                                />

                                <span>
                                    Last {vigil?.dayOfWeek ?? 'Friday'} of the Month
                                </span>

                            </div>


                            <p className="service-time">

                                <img
                                    src="/icon-clock.png"
                                    alt=""
                                    className="service-detail-icon"
                                />

                                <span className="time-nowrap">

                                    {vigil
                                        ? formatTimeRange(
                                            vigil.startTime,
                                            vigil.endTime
                                        )
                                        : '10:00 PM - 1:00 AM'}

                                </span>

                            </p>

                        </div>
                    </div>


                    <div className="service-time-divider"></div>


                    {/* =================================
                        ZOOM DETAILS
                       ================================= */}

                    <div className="zoom-service-card">

                        <div className="zoom-heading">

                            <img
                                src="/icon-zoom.png"
                                alt=""
                                className="zoom-heading-icon"
                            />

                            <strong>
                                JOIN US ONLINE
                            </strong>

                        </div>


                        {zoomId ? (
                            <>

                                {/* Meeting ID */}
                                <p className="zoom-detail">

                                    Meeting ID:{' '}

                                    <strong>
                                        {zoomId}
                                    </strong>

                                </p>


                                {/* Passcode */}
                                {zoomPasscode && (
                                    <p className="zoom-detail">

                                        Passcode:{' '}

                                        <strong>
                                            {zoomPasscode}
                                        </strong>

                                    </p>
                                )}


                                {/* Join Zoom Button */}
                                <button
                                    type="button"
                                    className="zoom-join-button"
                                    onClick={joinZoomService}
                                >

                                    <img
                                        src="/icon-zoom.png"
                                        alt=""
                                        className="zoom-button-icon"
                                    />

                                    <span>
                                        Join Zoom Service
                                    </span>

                                </button>


                                {/* Information */}
                                <p className="zoom-note">

                                    Same details for Wednesday and Vigil services.

                                    {zoomPasscode && (
                                        <>
                                            <br />
                                            Passcode is copied when you join.
                                        </>
                                    )}

                                </p>

                            </>
                        ) : (
                            <>

                                <p className="zoom-detail">
                                    Join our Wednesday and Vigil services online.
                                </p>


                                <button
                                    type="button"
                                    className="zoom-join-button"
                                    onClick={() => {
                                        window.location.hash =
                                            'monthly-services';
                                    }}
                                >

                                    <img
                                        src="/icon-online.png"
                                        alt=""
                                        className="zoom-button-icon"
                                    />

                                    <span>
                                        View Online Service Details
                                    </span>

                                </button>

                            </>
                        )}

                    </div>

                </div>

            </div>


            {/* =====================================
                SCROLL INDICATOR
               ===================================== */}

            <div className="scroll-indicator">
                <span></span>
            </div>

        </section>
    );
}