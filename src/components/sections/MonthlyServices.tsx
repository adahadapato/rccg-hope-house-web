import { useEffect, useMemo, useState } from 'react';
import {
    useChurchServices,
    dayNameToNumber,
} from '../../hooks/useChurchServices';
import { useServiceBroadcasts } from '../../hooks/useServiceBroadcasts';

const CHURCH_LOCATION =
    'RCCG Hope House Parish, Burnt Oak, Edgware, London';

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

    const offset =
        (dayOfWeek - firstDay.getDay() + 7) % 7;

    return new Date(
        year,
        month,
        1 + offset + (occurrence - 1) * 7
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

    return (
        'https://calendar.google.com/calendar/render?' +
        params.toString()
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
                    service.isActive &&
                    service.showInMonthlyServices
            )
            .sort(
                (a, b) =>
                    a.displayOrder -
                    b.displayOrder
            )
            .map((service) => {
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

                const nextDate =
                    getNextServiceDate(
                        service.recurrence,
                        dayOfWeek,
                        service.dayOfMonth,
                        now
                    );

                const dayName =
                    nextDate
                        ? nextDate.toLocaleDateString(
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
                    nextDate
                        ? nextDate.toLocaleDateString(
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
                    broadcast,

                    featured:
                        Boolean(
                            broadcast?.theme
                        ),

                    theme:
                        broadcast?.theme ?? '',

                    recurrenceLabel,

                    formattedDate,

                    countdown:
                        nextDate
                            ? getCountdown(
                                nextDate,
                                service.startTime,
                                now
                            )
                            : null,

                    calendarLink:
                        nextDate
                            ? getCalendarLink(
                                service.name,
                                description,
                                service.startTime,
                                service.endTime,
                                nextDate,
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
                                {service.featured && (
                                    <div className="featured-badge">
                                        {
                                            service.theme
                                        }
                                    </div>
                                )}

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

                                {service.broadcast && (
                                    <a
                                        href={
                                            service
                                                .broadcast
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
                                                        .broadcast
                                                        .thumbnailUrl
                                                }
                                                alt={
                                                    service
                                                        .broadcast
                                                        .title
                                                }
                                                className="video-thumbnail"
                                            />

                                            {service
                                                .broadcast
                                                .isLive && (
                                                    <div className="live-badge">
                                                        <span className="live-dot"></span>
                                                        LIVE
                                                    </div>
                                                )}

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
                                                        .broadcast
                                                        .title
                                                }
                                            </p>

                                            {service
                                                .broadcast
                                                .description && (
                                                    <p className="video-meta">
                                                        <span>
                                                            {
                                                                service
                                                                    .broadcast
                                                                    .description
                                                            }
                                                        </span>
                                                    </p>
                                                )}
                                        </div>
                                    </a>
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

                                {service.countdown && (
                                    <div className="countdown-badge">
                                        <span className="pulse-dot"></span>

                                        {
                                            service.countdown
                                        }
                                    </div>
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