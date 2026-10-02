import { useEffect, useMemo, useState } from 'react';
import {
    useChurchServices,
    dayNameToNumber,
} from '../../hooks/useChurchServices';
import { useServiceBroadcasts } from '../../hooks/useServiceBroadcasts';

const CHURCH_LOCATION = 'RCCG Hope House Parish, Burnt Oak, Edgware, London';

function startOfDay(date: Date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function getNthWeekdayOfMonth(
    year: number,
    month: number,
    dayOfWeek: number,
    occurrence: number
) {
    const firstDay = new Date(year, month, 1);

    const offset = (dayOfWeek - firstDay.getDay() + 7) % 7;

    return new Date(year, month, 1 + offset + (occurrence - 1) * 7
    );
}

function getLastWeekdayOfMonth(
    year: number,
    month: number,
    dayOfWeek: number
) {
    const lastDay = new Date(year, month + 1, 0);

    const offset =
        (lastDay.getDay() - dayOfWeek + 7) % 7;

    return new Date(
        year,
        month,
        lastDay.getDate() - offset
    );
}

function getNextWeeklyDate(
    dayOfWeek: number,
    referenceDate: Date
) {
    const today = startOfDay(referenceDate);

    const daysUntil =
        (dayOfWeek - today.getDay() + 7) % 7;

    const target = new Date(today);

    target.setDate(
        today.getDate() + daysUntil
    );

    return target;
}

function getNextFirstOfMonthDate(
    dayOfWeek: number,
    referenceDate: Date
) {
    const today = startOfDay(referenceDate);

    let year = today.getFullYear();
    let month = today.getMonth();

    let target = getNthWeekdayOfMonth(
        year,
        month,
        dayOfWeek,
        1
    );

    if (target < today) {
        month += 1;

        if (month > 11) {
            month = 0;
            year += 1;
        }

        target = getNthWeekdayOfMonth(
            year,
            month,
            dayOfWeek,
            1
        );
    }

    return target;
}

function getNextLastOfMonthDate(
    dayOfWeek: number,
    referenceDate: Date
) {
    const today = startOfDay(referenceDate);

    let year = today.getFullYear();
    let month = today.getMonth();

    let target = getLastWeekdayOfMonth(
        year,
        month,
        dayOfWeek
    );

    if (target < today) {
        month += 1;

        if (month > 11) {
            month = 0;
            year += 1;
        }

        target = getLastWeekdayOfMonth(
            year,
            month,
            dayOfWeek
        );
    }

    return target;
}

function getNextMonthlyDate(
    dayOfMonth: number | null | undefined,
    referenceDate: Date
) {
    if (!dayOfMonth) {
        return null;
    }

    const today = startOfDay(referenceDate);

    let year = today.getFullYear();
    let month = today.getMonth();

    const createDate = (
        targetYear: number,
        targetMonth: number
    ) => {
        const daysInMonth = new Date(
            targetYear,
            targetMonth + 1,
            0
        ).getDate();

        return new Date(
            targetYear,
            targetMonth,
            Math.min(dayOfMonth, daysInMonth)
        );
    };

    let target = createDate(
        year,
        month
    );

    if (target < today) {
        month += 1;

        if (month > 11) {
            month = 0;
            year += 1;
        }

        target = createDate(
            year,
            month
        );
    }

    return target;
}

function getNextServiceDate(
    recurrence: string,
    dayOfWeek: number,
    dayOfMonth: number | null | undefined,
    referenceDate: Date
) {
    switch (recurrence) {
        case 'Weekly':
            return getNextWeeklyDate(
                dayOfWeek,
                referenceDate
            );

        case 'FirstOfMonth':
            return getNextFirstOfMonthDate(
                dayOfWeek,
                referenceDate
            );

        case 'LastOfMonth':
            return getNextLastOfMonthDate(
                dayOfWeek,
                referenceDate
            );

        case 'Monthly':
            return getNextMonthlyDate(
                dayOfMonth,
                referenceDate
            );

        /*
         * Fortnightly needs an anchor/reference date
         * to determine which alternate week applies.
         *
         * OneTime needs an explicit service/event date.
         *
         * Until those values exist in the backend,
         * we deliberately do not invent a date.
         */
        case 'Fortnightly':
        case 'OneTime':
            return null;

        default:
            return null;
    }
}

function getRecurrenceLabel(
    recurrence: string,
    dayName: string,
    dayOfMonth: number | null | undefined
) {
    switch (recurrence) {
        case 'Weekly':
            return `Every ${dayName}`;

        case 'FirstOfMonth':
            return `1st ${dayName} of the month`;

        case 'LastOfMonth':
            return `Last ${dayName} of the month`;

        case 'Fortnightly':
            return `Every other ${dayName}`;

        case 'Monthly':
            return dayOfMonth
                ? `Day ${dayOfMonth} of every month`
                : 'Monthly';

        case 'OneTime':
            return 'Special Service';

        default:
            return dayName;
    }
}

function getCountdown(
    serviceDate: Date,
    startTime: string,
    now: Date
) {
    const [hours, minutes] = startTime
        .split(':')
        .map(Number);

    const target = new Date(serviceDate);

    target.setHours(
        hours || 0,
        minutes || 0,
        0,
        0
    );

    const difference =
        target.getTime() - now.getTime();

    if (difference <= 0) {
        return 'Starting Soon';
    }

    const days = Math.floor(
        difference /
        (1000 * 60 * 60 * 24)
    );

    const hoursRemaining = Math.floor(
        (difference %
            (1000 * 60 * 60 * 24)) /
        (1000 * 60 * 60)
    );

    const minutesRemaining = Math.floor(
        (difference %
            (1000 * 60 * 60)) /
        (1000 * 60)
    );

    if (days > 0) {
        return `Starts in ${days} day${days === 1 ? '' : 's'
            }`;
    }

    if (hoursRemaining > 0) {
        return `Starts in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'
            }`;
    }

    return `Starts in ${Math.max(
        minutesRemaining,
        1
    )} minute${minutesRemaining === 1 ? '' : 's'
        }`;
}


function isSameCalendarDay(
    first: Date,
    second: Date
) {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
}

function createServiceWindow(
    serviceDate: Date,
    startTime: string,
    endTime: string
) {
    const [startHour, startMinute] =
        startTime.split(':').map(Number);

    const [endHour, endMinute] =
        endTime.split(':').map(Number);

    const start = new Date(serviceDate);

    start.setHours(
        startHour || 0,
        startMinute || 0,
        0,
        0
    );

    const end = new Date(serviceDate);

    end.setHours(
        endHour || 0,
        endMinute || 0,
        0,
        0
    );

    /*
     * An end time equal to or earlier than the start
     * time represents a service that finishes after
     * midnight on the following day.
     */
    if (end <= start) {
        end.setDate(
            end.getDate() + 1
        );
    }

    return {
        start,
        end,
    };
}

function getServiceTiming(
    recurrence: string,
    dayOfWeek: number,
    dayOfMonth: number | null | undefined,
    startTime: string,
    endTime: string,
    now: Date
) {
    /*
     * First check yesterday. This is required for
     * services that start late in the evening and
     * continue beyond midnight.
     */
    const yesterday = startOfDay(now);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    const yesterdayOccurrence =
        getNextServiceDate(
            recurrence,
            dayOfWeek,
            dayOfMonth,
            yesterday
        );

    if (
        yesterdayOccurrence &&
        isSameCalendarDay(
            yesterdayOccurrence,
            yesterday
        )
    ) {
        const yesterdayWindow =
            createServiceWindow(
                yesterdayOccurrence,
                startTime,
                endTime
            );

        if (
            now >= yesterdayWindow.start &&
            now < yesterdayWindow.end
        ) {
            return {
                isHappening: true,
                serviceDate:
                    yesterdayOccurrence,
                start:
                    yesterdayWindow.start,
                end:
                    yesterdayWindow.end,
            };
        }
    }

    /*
     * Next check today's occurrence. getNextServiceDate
     * works at calendar-day level, so the time window is
     * evaluated separately here.
     */
    const today = startOfDay(now);

    const todayOccurrence =
        getNextServiceDate(
            recurrence,
            dayOfWeek,
            dayOfMonth,
            today
        );

    if (
        todayOccurrence &&
        isSameCalendarDay(
            todayOccurrence,
            today
        )
    ) {
        const todayWindow =
            createServiceWindow(
                todayOccurrence,
                startTime,
                endTime
            );

        if (
            now >= todayWindow.start &&
            now < todayWindow.end
        ) {
            return {
                isHappening: true,
                serviceDate:
                    todayOccurrence,
                start:
                    todayWindow.start,
                end:
                    todayWindow.end,
            };
        }

        if (now < todayWindow.start) {
            return {
                isHappening: false,
                serviceDate:
                    todayOccurrence,
                start:
                    todayWindow.start,
                end:
                    todayWindow.end,
            };
        }
    }

    /*
     * Today's service has finished, or today is not a
     * service day. Start tomorrow when looking for the
     * next occurrence so a completed service is not
     * presented as "Starting Soon".
     */
    const tomorrow = startOfDay(now);

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );

    const nextOccurrence =
        getNextServiceDate(
            recurrence,
            dayOfWeek,
            dayOfMonth,
            tomorrow
        );

    if (!nextOccurrence) {
        return null;
    }

    const nextWindow =
        createServiceWindow(
            nextOccurrence,
            startTime,
            endTime
        );

    return {
        isHappening: false,
        serviceDate:
            nextOccurrence,
        start:
            nextWindow.start,
        end:
            nextWindow.end,
    };
}

function formatCalendarDate(date: Date) {
    return date
        .toISOString()
        .replace(/-|:|\.\d+/g, '')
        .slice(0, 15);
}

function getCalendarLink(
    title: string,
    description: string,
    startTime: string,
    endTime: string,
    startDate: Date,
    location?: string | null
) {
    const [startHour, startMinute] =
        startTime.split(':').map(Number);

    const startDateTime =
        new Date(startDate);

    startDateTime.setHours(
        startHour || 0,
        startMinute || 0,
        0,
        0
    );

    const [endHour, endMinute] =
        endTime.split(':').map(Number);

    const endDateTime =
        new Date(startDateTime);

    endDateTime.setHours(
        endHour || 0,
        endMinute || 0,
        0,
        0
    );

    if (endDateTime <= startDateTime) {
        endDateTime.setDate(
            endDateTime.getDate() + 1
        );
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates:
            `${formatCalendarDate(startDateTime)}` +
            `/${formatCalendarDate(endDateTime)}`,
        details: description,
        location:
            location?.trim() ||
            CHURCH_LOCATION,
    });

    return ('https://calendar.google.com/calendar/render?' + params.toString()
    );
}

function formatTime(time: string) {
    return time.slice(0, 5);
}

export default function MonthlyServices() {
    const { services = [] } =
        useChurchServices(false);

    const { broadcasts = [] } =
        useServiceBroadcasts();

    const [now, setNow] = useState(
        () => new Date()
    );

    useEffect(() => {
        const timer = window.setInterval(
            () => setNow(new Date()),
            60000
        );

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    const displayServices = useMemo(() => {
        return services
            .filter(
                (service) =>
                    service.showInMonthlyServices &&
                    service.isBroadcastEnabled
            )
            .sort(
                (a, b) =>
                    a.displayOrder -
                    b.displayOrder
            )
            .map((service) => {
                /*
                 * The latest broadcast is historical unless
                 * it is explicitly marked live. Its Theme is
                 * therefore never used as the upcoming/current
                 * service theme.
                 */
                const broadcast =
                    broadcasts.find(
                        (item) =>
                            item.churchServiceId ===
                            service.id
                    );

                const dayOfWeek =
                    dayNameToNumber(
                        service.dayOfWeek
                    );

                const timing =
                    getServiceTiming(
                        service.recurrence,
                        dayOfWeek,
                        service.dayOfMonth,
                        service.startTime,
                        service.endTime,
                        now
                    );

                const serviceDate =
                    timing?.serviceDate ??
                    null;

                const isHappening =
                    timing?.isHappening ??
                    false;

                const isLive =
                    Boolean(
                        isHappening &&
                        broadcast?.isLive
                    );

                const previousBroadcast =
                    broadcast &&
                        !broadcast.isLive
                        ? broadcast
                        : null;

                const liveBroadcast =
                    isLive
                        ? broadcast
                        : null;

                const dayName =
                    serviceDate
                        ? serviceDate.toLocaleDateString(
                            'en-GB',
                            {
                                weekday:
                                    'long',
                            }
                        )
                        : service.dayOfWeek;

                const recurrenceLabel =
                    getRecurrenceLabel(
                        service.recurrence,
                        dayName,
                        service.dayOfMonth
                    );

                const formattedDate =
                    serviceDate
                        ? serviceDate.toLocaleDateString(
                            'en-GB',
                            {
                                weekday:
                                    'long',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            }
                        )
                        : null;

                const description =
                    service.description?.trim() ||
                    service.name;

                return {
                    ...service,

                    currentTheme:
                        service.currentTheme?.trim() ??
                        '',

                    featured:
                        Boolean(
                            service.currentTheme?.trim()
                        ),

                    isHappening,
                    isLive,
                    liveBroadcast,
                    previousBroadcast,

                    recurrenceLabel,

                    formattedDate,

                    countdown:
                        timing &&
                            !isHappening
                            ? getCountdown(
                                timing.serviceDate,
                                service.startTime,
                                now
                            )
                            : null,

                    calendarLink:
                        timing &&
                            !isHappening
                            ? getCalendarLink(
                                service.name,
                                description,
                                service.startTime,
                                service.endTime,
                                timing.serviceDate,
                                service.location
                            )
                            : null,

                    displayTime:
                        `${formatTime(
                            service.startTime
                        )} - ${formatTime(
                            service.endTime
                        )}`,
                };
            });
    }, [
        services,
        broadcasts,
        now,
    ]);

    return (
        <section
            id="monthly-services"
            className="section monthly-services-section"
        >
            <div className="container">
                <div className="section-header-center">
                    <span className="section-tag">
                        MONTHLY GATHERINGS
                    </span>

                    <h2 className="section-title">
                        Special Monthly Services
                    </h2>

                    <div className="title-divider-center"></div>

                    <p className="section-description">
                        Beyond our regular Sunday
                        worship, join us for these
                        powerful gatherings designed
                        to deepen your faith.
                    </p>
                </div>

                <div className="monthly-services-grid">
                    {displayServices.map(
                        (service) => (
                            <div
                                key={service.id}
                                className={`service-card ${service.featured
                                    ? 'featured'
                                    : ''
                                    }`}
                            >
                                <div className="featured-badge">
                                    {service.isLive
                                        ? 'LIVE NOW'
                                        : service.isHappening
                                            ? 'HAPPENING NOW'
                                            : service.currentTheme ||
                                            'NEXT SERVICE'}
                                </div>

                                <div className="service-day-badge">
                                    <span className="day-name">
                                        {
                                            service.recurrenceLabel
                                        }
                                    </span>
                                </div>

                                {service.icon && (
                                    <div className="service-icon">
                                        {
                                            service.icon
                                        }
                                    </div>
                                )}

                                <h3>
                                    {service.name}
                                </h3>

                                {service.currentTheme &&
                                    service.isHappening && (
                                        <div className="countdown-badge">
                                            {
                                                service.currentTheme
                                            }
                                        </div>
                                    )}

                                {service.liveBroadcast && (
                                    <>
                                        <p className="video-meta">
                                            <strong>
                                                Watch Live
                                            </strong>
                                        </p>

                                        <a
                                            href={
                                                service
                                                    .liveBroadcast
                                                    .videoUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="youtube-preview-link"
                                        >
                                            <div className="video-thumbnail-container">
                                                <img
                                                    src={
                                                        service
                                                            .liveBroadcast
                                                            .thumbnailUrl
                                                    }
                                                    alt={
                                                        service
                                                            .liveBroadcast
                                                            .title
                                                    }
                                                    className="video-thumbnail"
                                                />

                                                <div className="live-badge">
                                                    <span className="live-dot"></span>
                                                    LIVE
                                                </div>

                                                <div className="play-overlay">
                                                    <div className="play-button">
                                                        ▶
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="video-info">
                                                <p className="video-title">
                                                    {
                                                        service
                                                            .liveBroadcast
                                                            .title
                                                    }
                                                </p>

                                                {service
                                                    .liveBroadcast
                                                    .description && (
                                                        <p className="video-meta">
                                                            <span>
                                                                {
                                                                    service
                                                                        .liveBroadcast
                                                                        .description
                                                                }
                                                            </span>
                                                        </p>
                                                    )}
                                            </div>
                                        </a>
                                    </>
                                )}



                                <div className="service-datetime">
                                    {service.formattedDate && (
                                        <div className="datetime-item">
                                            <span className="datetime-icon">
                                                📅
                                            </span>

                                            <span>
                                                {
                                                    service.formattedDate
                                                }
                                            </span>
                                        </div>
                                    )}

                                    <div className="datetime-item">
                                        <span className="datetime-icon">
                                            ⏰
                                        </span>

                                        <span>
                                            {
                                                service.displayTime
                                            }
                                        </span>
                                    </div>
                                </div>

                                {service.isHappening ? (
                                    <div className="countdown-badge">
                                        <span className="pulse-dot"></span>

                                        {service.isLive
                                            ? 'Live now'
                                            : 'Service happening now'}
                                    </div>
                                ) : (
                                    service.countdown && (
                                        <div className="countdown-badge">
                                            <span className="pulse-dot"></span>

                                            {
                                                service.countdown
                                            }
                                        </div>
                                    )
                                )}

                                {service.calendarLink && (
                                    <a
                                        href={
                                            service.calendarLink
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="calendar-link"
                                    >
                                        📅 Add to Calendar
                                    </a>
                                )}

                                {service.previousBroadcast && (
                                    <>
                                        <p className="video-meta">
                                            <strong>
                                                Watch Previous Service
                                            </strong>
                                        </p>

                                        {service
                                            .previousBroadcast
                                            .theme && (
                                                <div className="countdown-badge">
                                                    {
                                                        service
                                                            .previousBroadcast
                                                            .theme
                                                    }
                                                </div>
                                            )}

                                        <a
                                            href={
                                                service
                                                    .previousBroadcast
                                                    .videoUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="youtube-preview-link"
                                        >
                                            <div className="video-thumbnail-container">
                                                <img
                                                    src={
                                                        service
                                                            .previousBroadcast
                                                            .thumbnailUrl
                                                    }
                                                    alt={
                                                        service
                                                            .previousBroadcast
                                                            .title
                                                    }
                                                    className="video-thumbnail"
                                                />

                                                <div className="play-overlay">
                                                    <div className="play-button">
                                                        ▶
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="video-info">
                                                <p className="video-title">
                                                    {
                                                        service
                                                            .previousBroadcast
                                                            .title
                                                    }
                                                </p>

                                                {service
                                                    .previousBroadcast
                                                    .description && (
                                                        <p className="video-meta">
                                                            <span>
                                                                {
                                                                    service
                                                                        .previousBroadcast
                                                                        .description
                                                                }
                                                            </span>
                                                        </p>
                                                    )}
                                            </div>
                                        </a>
                                    </>
                                )}
                            </div>
                        )
                    )}
                </div>

                <div className="monthly-services-note">
                    <p>
                        💡{' '}
                        <strong>
                            Note:
                        </strong>{' '}
                        All services are in
                        addition to our regular
                        weekly gatherings. Everyone
                        is welcome!
                    </p>
                </div>
            </div>
        </section>
    );
}