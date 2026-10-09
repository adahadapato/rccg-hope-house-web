import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    apiFetch,
} from '@/api/api';

import AdminLayout from '../components/AdminLayout';

import '../styles/admin.css';


interface Devotional {
    id: string;
    devotionalDate: string;
    theme: string;
    scriptureReference: string;
    passageId: string;
    thought: string;
    commentaryPoints: string[];
    prayerPoints: string[];
    declaration: string;
    isPublished: boolean;
    publishedAt: string | null;
}


interface PastorPost {
    id: string;
    title: string;
    isPublished: boolean;
}


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
    isActive: boolean;
    displayOrder: number;
}


interface PrayerRequestStats {
    pendingCount: number;
    inProgressCount: number;
    resolvedCount: number;
    totalCount: number;
}


interface PrayerRequestItem {
    id: string;
    name?: string | null;
    title?: string | null;
    subject?: string | null;
    prayerRequest?: string | null;
    request?: string | null;
    status?: string | null;
    createdAt?: string | null;
    submittedAt?: string | null;
}


interface DashboardData {
    devotionals: Devotional[];
    sermons: PastorPost[];
    events: ChurchEvent[];
    prayerStats: PrayerRequestStats;
    prayerRequests: PrayerRequestItem[];
}


const emptyDashboardData: DashboardData = {
    devotionals: [],
    sermons: [],
    events: [],
    prayerStats: {
        pendingCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        totalCount: 0,
    },
    prayerRequests: [],
};


function isPastEvent(
    churchEvent: ChurchEvent
) {
    const comparisonDate =
        churchEvent.endDateTime ??
        churchEvent.startDateTime;

    const date =
        new Date(comparisonDate);

    return (
        !Number.isNaN(
            date.getTime()
        ) &&
        date.getTime() <
        Date.now()
    );
}


function formatDevotionalDate(
    value: string
) {
    const date =
        new Date(
            `${value}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        'en-GB',
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }
    );
}


function formatEventTime(
    startDateTime: string,
    endDateTime: string | null
) {
    const start =
        new Date(startDateTime);

    if (
        Number.isNaN(
            start.getTime()
        )
    ) {
        return '';
    }

    const startTime =
        start.toLocaleTimeString(
            'en-GB',
            {
                hour: '2-digit',
                minute: '2-digit',
            }
        );

    if (!endDateTime) {
        return startTime;
    }

    const end =
        new Date(endDateTime);

    if (
        Number.isNaN(
            end.getTime()
        )
    ) {
        return startTime;
    }

    const endTime =
        end.toLocaleTimeString(
            'en-GB',
            {
                hour: '2-digit',
                minute: '2-digit',
            }
        );

    return `${startTime} - ${endTime}`;
}


function getEventMonth(
    value: string
) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    return date
        .toLocaleDateString(
            'en-GB',
            {
                month: 'short',
            }
        )
        .toUpperCase();
}


function getEventDay(
    value: string
) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    return date.getDate();
}


function formatRelativeTime(
    value?: string | null
) {
    if (!value) {
        return '';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    const difference =
        Date.now() -
        date.getTime();

    const minutes =
        Math.floor(
            difference / 60_000
        );

    if (minutes < 1) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    return `${days} day${days === 1 ? '' : 's'} ago`;
}


function getPrayerTitle(
    prayer: PrayerRequestItem
) {
    return (
        prayer.title ||
        prayer.subject ||
        prayer.prayerRequest ||
        prayer.request ||
        'Prayer Request'
    );
}


function AdminDashboard() {
    const [
        dashboardData,
        setDashboardData,
    ] =
        useState<DashboardData>(
            emptyDashboardData
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        loadError,
        setLoadError,
    ] =
        useState<string | null>(
            null
        );


    const adminName =
        localStorage.getItem(
            'adminName'
        ) ||
        'Administrator';


    /*
     * Keep dashboard navigation consistent
     * with the existing admin sidebar.
     */
    function navigate(
        path: string
    ) {
        window.location.assign(
            path
        );
    }


    useEffect(() => {
        const controller =
            new AbortController();


        async function fetchJson<T>(
            url: string
        ): Promise<T> {
            const response =
                await apiFetch(
                    url,
                    {
                        signal:
                            controller.signal,
                    }
                );

            if (!response.ok) {
                throw new Error(
                    `Unable to load ${url}.`
                );
            }

            return (
                await response.json()
            ) as T;
        }


        async function initialise() {
            try {
                setLoading(true);
                setLoadError(null);

                const [
                    devotionals,
                    sermons,
                    events,
                    prayerStats,
                    prayerRequests,
                ] =
                    await Promise.all([
                        fetchJson<
                            Devotional[]
                        >(
                            '/api/devotionals/admin'
                        ),

                        fetchJson<
                            PastorPost[]
                        >(
                            '/api/pastor-posts/admin/?includeDrafts=true'
                        ),

                        fetchJson<
                            ChurchEvent[]
                        >(
                            '/api/events/admin?skip=0&take=500'
                        ),

                        fetchJson<
                            PrayerRequestStats
                        >(
                            '/api/prayer-requests/admin/stats'
                        ),

                        fetchJson<
                            PrayerRequestItem[]
                        >(
                            '/api/prayer-requests/admin'
                        ),
                    ]);

                if (
                    controller.signal.aborted
                ) {
                    return;
                }

                setDashboardData({
                    devotionals,
                    sermons,
                    events,
                    prayerStats,
                    prayerRequests,
                });
            } catch (error) {
                if (
                    controller.signal.aborted
                ) {
                    return;
                }

                setLoadError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load dashboard information.'
                );
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        }


        void initialise();


        return () => {
            controller.abort();
        };
    }, []);


    const upcomingEvents =
        useMemo(
            () =>
                dashboardData.events
                    .filter(
                        churchEvent =>
                            churchEvent.isActive &&
                            !isPastEvent(
                                churchEvent
                            )
                    )
                    .sort(
                        (a, b) =>
                            new Date(
                                a.startDateTime
                            ).getTime() -
                            new Date(
                                b.startDateTime
                            ).getTime()
                    ),
            [
                dashboardData.events,
            ]
        );


    const recentDevotionals =
        useMemo(
            () =>
                [
                    ...dashboardData
                        .devotionals,
                ]
                    .sort(
                        (a, b) =>
                            b.devotionalDate
                                .localeCompare(
                                    a.devotionalDate
                                )
                    )
                    .slice(
                        0,
                        3
                    ),
            [
                dashboardData.devotionals,
            ]
        );


    const recentPrayerRequests =
        useMemo(
            () =>
                [
                    ...dashboardData
                        .prayerRequests,
                ]
                    .sort(
                        (a, b) => {
                            const aDate =
                                new Date(
                                    a.createdAt ??
                                    a.submittedAt ??
                                    0
                                ).getTime();

                            const bDate =
                                new Date(
                                    b.createdAt ??
                                    b.submittedAt ??
                                    0
                                ).getTime();

                            return (
                                bDate -
                                aDate
                            );
                        }
                    )
                    .slice(
                        0,
                        3
                    ),
            [
                dashboardData
                    .prayerRequests,
            ]
        );


    const summaryCards = [
        {
            icon: '▣',
            label: 'Devotionals',
            value: loading
                ? '...'
                : dashboardData
                    .devotionals
                    .length
                    .toString(),
            description:
                'Total configured',
            className: 'blue',
            path:
                '/admin/devotionals',
        },
        {
            icon: '▶',
            label: 'Sermons',
            value: loading
                ? '...'
                : dashboardData
                    .sermons
                    .length
                    .toString(),
            description:
                'Total uploaded',
            className: 'green',
            path:
                '/admin/sermons',
        },
        {
            icon: '□',
            label:
                'Upcoming Events',
            value: loading
                ? '...'
                : upcomingEvents
                    .length
                    .toString(),
            description:
                'Active upcoming',
            className: 'orange',
            path:
                '/admin/events',
        },
        {
            icon: '♥',
            label:
                'Prayer Requests',
            value: loading
                ? '...'
                : dashboardData
                    .prayerStats
                    .totalCount
                    .toString(),
            description:
                'Total requests',
            className: 'pink',
            path:
                '/admin/prayer-requests',
        },
    ];


    return (
        <AdminLayout>

            <section className="admin-welcome">
                <div>
                    <span className="admin-eyebrow">
                        Welcome back,
                    </span>

                    <h1>
                        {adminName}
                    </h1>

                    <p>
                        Manage your church website content and keep your
                        community connected.
                    </p>
                </div>

                <blockquote className="admin-scripture">
                    <p>
                        “For I know the plans I have for you, plans to give you
                        hope and a future.”
                    </p>

                    <cite>
                        Jeremiah 29:11
                    </cite>
                </blockquote>
            </section>


            {loadError && (
                <div
                    className="admin-message admin-message-error"
                    role="alert"
                >
                    <strong>
                        Some dashboard information could not be loaded.
                    </strong>

                    <p>
                        {loadError}
                    </p>
                </div>
            )}


            <section className="admin-summary-grid">

                {summaryCards.map(
                    card => (

                        <article
                            className={`admin-summary-card ${card.className}`}
                            key={
                                card.label
                            }
                            onClick={() =>
                                navigate(
                                    card.path
                                )
                            }
                            onKeyDown={
                                event => {
                                    if (
                                        event.key ===
                                        'Enter' ||
                                        event.key ===
                                        ' '
                                    ) {
                                        navigate(
                                            card.path
                                        );
                                    }
                                }
                            }
                            role="button"
                            tabIndex={0}
                        >

                            <div className="summary-icon">
                                {card.icon}
                            </div>

                            <div className="summary-information">
                                <span>
                                    {
                                        card.label
                                    }
                                </span>

                                <strong>
                                    {
                                        card.value
                                    }
                                </strong>

                                <small>
                                    {
                                        card.description
                                    }
                                </small>
                            </div>

                            <span className="summary-arrow">
                                ›
                            </span>

                        </article>

                    )
                )}

            </section>


            <section className="admin-dashboard-grid">

                <article className="admin-panel overview-panel">

                    <div className="admin-panel-heading">
                        <h2>
                            ▥ Website Overview
                        </h2>

                        <select defaultValue="30">
                            <option value="7">
                                Last 7 days
                            </option>

                            <option value="30">
                                Last 30 days
                            </option>

                            <option value="90">
                                Last 90 days
                            </option>
                        </select>
                    </div>


                    <div className="admin-statistics">

                        <div>
                            <strong>
                                2,845
                            </strong>

                            <span>
                                Total Visitors
                            </span>

                            <small>
                                ↑ 12%
                            </small>
                        </div>

                        <div>
                            <strong>
                                5,132
                            </strong>

                            <span>
                                Page Views
                            </span>

                            <small>
                                ↑ 18%
                            </small>
                        </div>

                        <div>
                            <strong>
                                1m 42s
                            </strong>

                            <span>
                                Avg. Time on Site
                            </span>

                            <small>
                                ↑ 9%
                            </small>
                        </div>

                        <div>
                            <strong>
                                68%
                            </strong>

                            <span>
                                Mobile Users
                            </span>

                            <small>
                                ↑ 5%
                            </small>
                        </div>

                    </div>


                    <div className="admin-chart">

                        <div className="chart-grid-line line-one" />
                        <div className="chart-grid-line line-two" />
                        <div className="chart-grid-line line-three" />

                        <svg
                            viewBox="0 0 800 170"
                            preserveAspectRatio="none"
                            aria-label="Website visitor trend"
                            role="img"
                        >
                            <path
                                className="chart-area"
                                d="M0,135 C50,135 55,100 100,120 C145,140 150,95 200,105 C250,115 260,60 315,85 C370,110 380,125 430,75 C480,25 490,110 550,75 C610,40 620,100 680,50 C720,20 745,75 800,35 L800,170 L0,170 Z"
                            />

                            <path
                                className="chart-line"
                                d="M0,135 C50,135 55,100 100,120 C145,140 150,95 200,105 C250,115 260,60 315,85 C370,110 380,125 430,75 C480,25 490,110 550,75 C610,40 620,100 680,50 C720,20 745,75 800,35"
                            />
                        </svg>

                        <div className="chart-labels">
                            <span>
                                Aug 22
                            </span>

                            <span>
                                Aug 29
                            </span>

                            <span>
                                Sep 5
                            </span>

                            <span>
                                Sep 12
                            </span>

                            <span>
                                Sep 19
                            </span>
                        </div>

                    </div>

                </article>


                <article className="admin-panel quick-actions-panel">

                    <div className="admin-panel-heading">
                        <h2>
                            ϟ Quick Actions
                        </h2>
                    </div>


                    <div className="quick-actions">

                        <button
                            type="button"
                            className="quick-action blue"
                            onClick={() =>
                                navigate(
                                    '/admin/devotionals'
                                )
                            }
                        >
                            <span className="quick-action-icon">
                                ▣
                            </span>

                            <span>
                                <strong>
                                    Create New Devotional
                                </strong>

                                <small>
                                    Add today's devotional content
                                </small>
                            </span>

                            <b>
                                ›
                            </b>
                        </button>


                        <button
                            type="button"
                            className="quick-action green"
                            onClick={() =>
                                navigate(
                                    '/admin/sermons'
                                )
                            }
                        >
                            <span className="quick-action-icon">
                                ▶
                            </span>

                            <span>
                                <strong>
                                    Upload Sermon
                                </strong>

                                <small>
                                    Add audio or video sermon
                                </small>
                            </span>

                            <b>
                                ›
                            </b>
                        </button>


                        <button
                            type="button"
                            className="quick-action orange"
                            onClick={() =>
                                navigate(
                                    '/admin/events'
                                )
                            }
                        >
                            <span className="quick-action-icon">
                                □
                            </span>

                            <span>
                                <strong>
                                    Add New Event
                                </strong>

                                <small>
                                    Create a church event
                                </small>
                            </span>

                            <b>
                                ›
                            </b>
                        </button>


                        <button
                            type="button"
                            className="quick-action purple"
                            disabled
                            title="News & Updates is coming soon"
                        >
                            <span className="quick-action-icon">
                                ▤
                            </span>

                            <span>
                                <strong>
                                    Publish News
                                </strong>

                                <small>
                                    Coming soon
                                </small>
                            </span>

                            <b>
                                ›
                            </b>
                        </button>

                    </div>

                </article>

            </section>


            <section className="admin-bottom-grid">

                <article className="admin-panel">

                    <div className="admin-panel-heading">
                        <h2>
                            ▣ Recent Devotionals
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    '/admin/devotionals'
                                )
                            }
                        >
                            View All
                        </button>
                    </div>


                    <div className="admin-list">

                        {loading ? (

                            <div className="admin-list-row">
                                Loading...
                            </div>

                        ) : recentDevotionals.length === 0 ? (

                            <div className="admin-list-row">
                                No devotionals found.
                            </div>

                        ) : (

                            recentDevotionals.map(
                                devotional => (

                                    <div
                                        className="admin-list-row"
                                        key={
                                            devotional.id
                                        }
                                    >

                                        <span>
                                            <strong>
                                                {
                                                    devotional.theme
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    formatDevotionalDate(
                                                        devotional
                                                            .devotionalDate
                                                    )
                                                }
                                            </small>
                                        </span>

                                        <span
                                            className={`status ${devotional.isPublished
                                                    ? 'published'
                                                    : 'read'
                                                }`}
                                        >
                                            {
                                                devotional.isPublished
                                                    ? 'Published'
                                                    : 'Draft'
                                            }
                                        </span>

                                        <b>
                                            •••
                                        </b>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </article>


                <article className="admin-panel">

                    <div className="admin-panel-heading">
                        <h2>
                            □ Upcoming Events
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    '/admin/events'
                                )
                            }
                        >
                            View All
                        </button>
                    </div>


                    <div className="admin-list">

                        {loading ? (

                            <div className="event-row">
                                Loading...
                            </div>

                        ) : upcomingEvents.length === 0 ? (

                            <div className="event-row">
                                No upcoming events.
                            </div>

                        ) : (

                            upcomingEvents
                                .slice(
                                    0,
                                    3
                                )
                                .map(
                                    churchEvent => (

                                        <div
                                            className="event-row"
                                            key={
                                                churchEvent.id
                                            }
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                navigate(
                                                    '/admin/events'
                                                )
                                            }
                                            onKeyDown={
                                                event => {
                                                    if (
                                                        event.key ===
                                                        'Enter' ||
                                                        event.key ===
                                                        ' '
                                                    ) {
                                                        navigate(
                                                            '/admin/events'
                                                        );
                                                    }
                                                }
                                            }
                                        >

                                            <div className="event-date">
                                                <span>
                                                    {
                                                        getEventMonth(
                                                            churchEvent
                                                                .startDateTime
                                                        )
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        getEventDay(
                                                            churchEvent
                                                                .startDateTime
                                                        )
                                                    }
                                                </strong>
                                            </div>

                                            <span>
                                                <strong>
                                                    {
                                                        churchEvent.title
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        formatEventTime(
                                                            churchEvent
                                                                .startDateTime,
                                                            churchEvent
                                                                .endDateTime
                                                        )
                                                    }
                                                </small>
                                            </span>

                                            <b>
                                                ›
                                            </b>

                                        </div>

                                    )
                                )

                        )}

                    </div>

                </article>


                <article className="admin-panel">

                    <div className="admin-panel-heading">

                        <h2>
                            ♥ Recent Prayer Requests
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    '/admin/prayer-requests'
                                )
                            }
                        >
                            View All
                        </button>

                    </div>


                    <div className="admin-list">

                        {loading ? (

                            <div className="prayer-row">
                                Loading...
                            </div>

                        ) : recentPrayerRequests.length === 0 ? (

                            <div className="prayer-row">
                                No prayer requests found.
                            </div>

                        ) : (

                            recentPrayerRequests.map(
                                prayer => {

                                    const status =
                                        (
                                            prayer.status ??
                                            'pending'
                                        )
                                            .trim()
                                            .toLowerCase();

                                    const submittedDate =
                                        prayer.createdAt ??
                                        prayer.submittedAt;

                                    return (

                                        <div
                                            className="prayer-row"
                                            key={
                                                prayer.id
                                            }
                                        >

                                            <span>
                                                <strong>
                                                    {
                                                        getPrayerTitle(
                                                            prayer
                                                        )
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        prayer.name ||
                                                        'Anonymous'
                                                    }
                                                </small>
                                            </span>

                                            <small>
                                                {
                                                    formatRelativeTime(
                                                        submittedDate
                                                    )
                                                }
                                            </small>

                                            <span
                                                className={`status ${status ===
                                                        'pending'
                                                        ? 'new'
                                                        : 'read'
                                                    }`}
                                            >
                                                {
                                                    status ===
                                                        'pending'
                                                        ? 'New'
                                                        : status ===
                                                            'inprogress' ||
                                                            status ===
                                                            'in progress'
                                                            ? 'In Progress'
                                                            : status ===
                                                                'resolved'
                                                                ? 'Resolved'
                                                                : prayer.status ||
                                                                'Read'
                                                }
                                            </span>

                                        </div>

                                    );
                                }
                            )

                        )}

                    </div>

                </article>

            </section>

        </AdminLayout>
    );
}


export default AdminDashboard;