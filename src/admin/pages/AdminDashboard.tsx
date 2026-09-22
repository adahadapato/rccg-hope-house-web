import AdminLayout from '../components/AdminLayout';
import '../styles/admin.css';

const summaryCards = [
    {
        icon: '▣',
        label: 'Devotionals',
        value: '186',
        description: 'Total published',
        className: 'blue',
    },
    {
        icon: '▶',
        label: 'Sermons',
        value: '42',
        description: 'Total uploaded',
        className: 'green',
    },
    {
        icon: '□',
        label: 'Upcoming Events',
        value: '5',
        description: 'Next 30 days',
        className: 'orange',
    },
    {
        icon: '♥',
        label: 'Prayer Requests',
        value: '12',
        description: 'New this week',
        className: 'pink',
    },
];

function AdminDashboard() {
    /*
     * Get the authenticated administrator's
     * name saved during login.
     */
    const adminName =
        localStorage.getItem('adminName') ||
        'Administrator';

    return (
        <AdminLayout>
            <section className="admin-welcome">
                <div>
                    <span className="admin-eyebrow">
                        Welcome back,
                    </span>

                    <h1>{adminName}</h1>

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

                    <cite>Jeremiah 29:11</cite>
                </blockquote>
            </section>

            <section className="admin-summary-grid">
                {summaryCards.map((card) => (
                    <article
                        className={`admin-summary-card ${card.className}`}
                        key={card.label}
                    >
                        <div className="summary-icon">
                            {card.icon}
                        </div>

                        <div className="summary-information">
                            <span>{card.label}</span>
                            <strong>{card.value}</strong>
                            <small>{card.description}</small>
                        </div>

                        <span className="summary-arrow">
                            ›
                        </span>
                    </article>
                ))}
            </section>

            <section className="admin-dashboard-grid">
                <article className="admin-panel overview-panel">
                    <div className="admin-panel-heading">
                        <h2>▥ Website Overview</h2>

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
                            <strong>2,845</strong>
                            <span>Total Visitors</span>
                            <small>↑ 12%</small>
                        </div>

                        <div>
                            <strong>5,132</strong>
                            <span>Page Views</span>
                            <small>↑ 18%</small>
                        </div>

                        <div>
                            <strong>1m 42s</strong>
                            <span>Avg. Time on Site</span>
                            <small>↑ 9%</small>
                        </div>

                        <div>
                            <strong>68%</strong>
                            <span>Mobile Users</span>
                            <small>↑ 5%</small>
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
                            <span>Aug 22</span>
                            <span>Aug 29</span>
                            <span>Sep 5</span>
                            <span>Sep 12</span>
                            <span>Sep 19</span>
                        </div>
                    </div>
                </article>

                <article className="admin-panel quick-actions-panel">
                    <div className="admin-panel-heading">
                        <h2>ϟ Quick Actions</h2>
                    </div>

                    <div className="quick-actions">
                        <button
                            type="button"
                            className="quick-action blue"
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

                            <b>›</b>
                        </button>

                        <button
                            type="button"
                            className="quick-action green"
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

                            <b>›</b>
                        </button>

                        <button
                            type="button"
                            className="quick-action orange"
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

                            <b>›</b>
                        </button>

                        <button
                            type="button"
                            className="quick-action purple"
                        >
                            <span className="quick-action-icon">
                                ▤
                            </span>

                            <span>
                                <strong>
                                    Publish News
                                </strong>

                                <small>
                                    Share an announcement
                                </small>
                            </span>

                            <b>›</b>
                        </button>
                    </div>
                </article>
            </section>

            <section className="admin-bottom-grid">
                <article className="admin-panel">
                    <div className="admin-panel-heading">
                        <h2>▣ Recent Devotionals</h2>

                        <button type="button">
                            View All
                        </button>
                    </div>

                    <div className="admin-list">
                        <div className="admin-list-row">
                            <span>
                                <strong>
                                    Divine Repositioning
                                </strong>

                                <small>
                                    June 6, 2026
                                </small>
                            </span>

                            <span className="status published">
                                Published
                            </span>

                            <b>•••</b>
                        </div>

                        <div className="admin-list-row">
                            <span>
                                <strong>
                                    Walking by Faith
                                </strong>

                                <small>
                                    June 5, 2026
                                </small>
                            </span>

                            <span className="status published">
                                Published
                            </span>

                            <b>•••</b>
                        </div>

                        <div className="admin-list-row">
                            <span>
                                <strong>
                                    God's Perfect Timing
                                </strong>

                                <small>
                                    June 4, 2026
                                </small>
                            </span>

                            <span className="status published">
                                Published
                            </span>

                            <b>•••</b>
                        </div>
                    </div>
                </article>

                <article className="admin-panel">
                    <div className="admin-panel-heading">
                        <h2>□ Upcoming Events</h2>

                        <button type="button">
                            View All
                        </button>
                    </div>

                    <div className="admin-list">
                        <div className="event-row">
                            <div className="event-date">
                                <span>JUN</span>
                                <strong>14</strong>
                            </div>

                            <span>
                                <strong>
                                    Sunday Service
                                </strong>

                                <small>
                                    10:00 AM – 12:00 PM
                                </small>
                            </span>

                            <b>›</b>
                        </div>

                        <div className="event-row">
                            <div className="event-date">
                                <span>JUN</span>
                                <strong>18</strong>
                            </div>

                            <span>
                                <strong>
                                    Prayer Meeting
                                </strong>

                                <small>
                                    7:00 PM – 8:00 PM
                                </small>
                            </span>

                            <b>›</b>
                        </div>

                        <div className="event-row">
                            <div className="event-date">
                                <span>JUN</span>
                                <strong>21</strong>
                            </div>

                            <span>
                                <strong>
                                    Youth Fellowship
                                </strong>

                                <small>
                                    6:00 PM – 8:00 PM
                                </small>
                            </span>

                            <b>›</b>
                        </div>
                    </div>
                </article>

                <article className="admin-panel">
                    <div className="admin-panel-heading">
                        <h2>
                            ♥ Recent Prayer Requests
                        </h2>

                        <button type="button">
                            View All
                        </button>
                    </div>

                    <div className="admin-list">
                        <div className="prayer-row">
                            <span>
                                <strong>
                                    Healing and Strength
                                </strong>

                                <small>
                                    Anonymous
                                </small>
                            </span>

                            <small>
                                2 hours ago
                            </small>

                            <span className="status new">
                                New
                            </span>
                        </div>

                        <div className="prayer-row">
                            <span>
                                <strong>
                                    Job Opportunity
                                </strong>

                                <small>
                                    Sister Anna
                                </small>
                            </span>

                            <small>
                                5 hours ago
                            </small>

                            <span className="status new">
                                New
                            </span>
                        </div>

                        <div className="prayer-row">
                            <span>
                                <strong>
                                    Family Restoration
                                </strong>

                                <small>
                                    Brother Tunde
                                </small>
                            </span>

                            <small>
                                1 day ago
                            </small>

                            <span className="status read">
                                Read
                            </span>
                        </div>
                    </div>
                </article>
            </section>
        </AdminLayout>
    );
}

export default AdminDashboard;