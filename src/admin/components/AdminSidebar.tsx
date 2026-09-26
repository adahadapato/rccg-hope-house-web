import {
    useEffect,
    useState,
} from 'react';

interface AdminSidebarProps {
    mobileOpen: boolean;
    onMobileClose: () => void;
}

interface NavigationChild {
    label: string;
    path?: string;
}

interface NavigationItem {
    icon: string;
    label: string;
    path?: string;
    children?: NavigationChild[];
}

const navItems: NavigationItem[] = [
    {
        icon: '⌂',
        label: 'Dashboard',
        path: '/admin',
    },

    {
        icon: '▤',
        label: 'Ministries',
        children: [
            {
                label: 'Services',
                path: '/admin/services',
            },
            {
                label: 'Devotionals',
            },
            {
                label: "Pastor's Corner",
                path: '/admin/sermons',
            },
        ],
    },

    {
        icon: '□',
        label: 'Events',
        children: [
            {
                label: 'Events',
            },
            {
                label: 'News & Updates',
            },
        ],
    },

    {
        icon: '▧',
        label: 'Gallery',
        children: [
            {
                label: 'Gallery Images',
                path: '/admin/gallery',
            },
            {
                label: 'Categories',
                path: '/admin/gallery/categories',
            },
        ],
    },

    {
        icon: '✦',
        label: 'Annual Content',
        children: [
            {
                label: 'Theme of the Year',
                path: '/admin/themes',
            },
            {
                label: 'Prophecies',
                path: '/admin/prophecies',
            },
            {
                label: 'Prophecy Categories',
                path: '/admin/prophecies/categories',
            },
            {
                label: 'Prayer for the Year',
            },
        ],
    },

    {
        icon: '♡',
        label: 'Connect',
        children: [
            {
                label: 'Prayer Requests',
            },
            {
                label: 'Contacts',
            },
        ],
    },

    {
        icon: '⚙',
        label: 'Administration',
        children: [
            {
                label: 'Users',
            },
            {
                label: 'Members',
            },
            {
                label: 'Settings',
            },
        ],
    },
];

function pathMatches(
    currentPath: string,
    path?: string
) {
    if (!path) {
        return false;
    }

    if (path === '/admin') {
        return (
            currentPath === '/admin' ||
            currentPath === '/admin/'
        );
    }

    return (
        currentPath === path ||
        currentPath.startsWith(
            `${path}/`
        )
    );
}

function AdminSidebar({
    mobileOpen,
    onMobileClose,
}: AdminSidebarProps) {
    const currentPath =
        window.location.pathname.replace(
            /\/+$/,
            ''
        ) || '/';

    const initiallyOpenGroups =
        navItems
            .filter(item =>
                item.children?.some(
                    child =>
                        pathMatches(
                            currentPath,
                            child.path
                        )
                )
            )
            .map(item => item.label);

    const [
        openGroups,
        setOpenGroups,
    ] = useState<string[]>(
        initiallyOpenGroups
    );

    useEffect(() => {
        const activeGroups =
            navItems
                .filter(item =>
                    item.children?.some(
                        child =>
                            pathMatches(
                                currentPath,
                                child.path
                            )
                    )
                )
                .map(item => item.label);

        if (
            activeGroups.length === 0
        ) {
            return;
        }

        setOpenGroups(current => {
            const next =
                new Set(current);

            activeGroups.forEach(
                group =>
                    next.add(group)
            );

            return Array.from(next);
        });
    }, [currentPath]);

    function navigate(
        path?: string
    ) {
        if (!path) {
            return;
        }

        onMobileClose();

        window.location.assign(
            path
        );
    }

    function toggleGroup(
        label: string
    ) {
        setOpenGroups(current =>
            current.includes(label)
                ? current.filter(
                    item =>
                        item !== label
                )
                : [
                    ...current,
                    label,
                ]
        );
    }

    return (
        <aside
            className={`admin-sidebar ${mobileOpen
                    ? 'mobile-open'
                    : ''
                }`}
        >
            <div className="admin-brand">
                <img
                    src="/rccg-logo.png"
                    alt="RCCG logo"
                    className="admin-brand-logo"
                />

                <div>
                    <strong>
                        RCCG
                    </strong>

                    <strong>
                        Hope House
                    </strong>

                    <span>
                        A Place of Hope for All
                    </span>
                </div>

                <button
                    type="button"
                    className="admin-mobile-sidebar-close"
                    onClick={
                        onMobileClose
                    }
                    aria-label="Close navigation menu"
                >
                    ×
                </button>
            </div>

            <nav className="admin-navigation">
                {navItems.map(
                    item => {
                        const hasChildren =
                            Boolean(
                                item.children
                                    ?.length
                            );

                        if (
                            !hasChildren
                        ) {
                            const active =
                                pathMatches(
                                    currentPath,
                                    item.path
                                );

                            return (
                                <button
                                    key={
                                        item.label
                                    }
                                    type="button"
                                    className={`admin-nav-item ${active
                                            ? 'active'
                                            : ''
                                        }`}
                                    onClick={() =>
                                        navigate(
                                            item.path
                                        )
                                    }
                                >
                                    <span className="admin-nav-icon">
                                        {
                                            item.icon
                                        }
                                    </span>

                                    <span className="admin-nav-label">
                                        {
                                            item.label
                                        }
                                    </span>
                                </button>
                            );
                        }

                        const groupOpen =
                            openGroups.includes(
                                item.label
                            );

                        const groupActive =
                            item.children?.some(
                                child =>
                                    pathMatches(
                                        currentPath,
                                        child.path
                                    )
                            ) ?? false;

                        return (
                            <div
                                key={
                                    item.label
                                }
                                className="admin-nav-group"
                            >
                                <button
                                    type="button"
                                    className={`admin-nav-item ${groupActive
                                            ? 'active'
                                            : ''
                                        }`}
                                    onClick={() =>
                                        toggleGroup(
                                            item.label
                                        )
                                    }
                                    aria-expanded={
                                        groupOpen
                                    }
                                >
                                    <span className="admin-nav-icon">
                                        {
                                            item.icon
                                        }
                                    </span>

                                    <span className="admin-nav-label">
                                        {
                                            item.label
                                        }
                                    </span>

                                    <span
                                        className={`admin-nav-chevron ${groupOpen
                                                ? 'open'
                                                : ''
                                            }`}
                                        aria-hidden="true"
                                    >
                                        ›
                                    </span>
                                </button>

                                {groupOpen && (
                                    <div className="admin-subnavigation">
                                        {item.children?.map(
                                            child => {
                                                const childActive =
                                                    pathMatches(
                                                        currentPath,
                                                        child.path
                                                    );

                                                const available =
                                                    Boolean(
                                                        child.path
                                                    );

                                                return (
                                                    <button
                                                        key={
                                                            child.label
                                                        }
                                                        type="button"
                                                        className={`admin-subnav-item ${childActive
                                                                ? 'active'
                                                                : ''
                                                            } ${!available
                                                                ? 'admin-subnav-item-disabled'
                                                                : ''
                                                            }`}
                                                        onClick={() =>
                                                            navigate(
                                                                child.path
                                                            )
                                                        }
                                                        disabled={
                                                            !available
                                                        }
                                                        aria-current={
                                                            childActive
                                                                ? 'page'
                                                                : undefined
                                                        }
                                                        title={
                                                            available
                                                                ? undefined
                                                                : 'Coming soon'
                                                        }
                                                    >
                                                        <span className="admin-subnav-dot" />

                                                        <span>
                                                            {
                                                                child.label
                                                            }
                                                        </span>
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }
                )}
            </nav>

            <div className="admin-sidebar-footer">
                <a
                    href="/"
                    className="admin-view-site"
                >
                    <span>
                        ↗
                    </span>

                    View Website
                </a>

                <div className="admin-version">
                    <span>
                        RCCG Hope House
                    </span>

                    <span>
                        Admin Panel v1.0.0
                    </span>
                </div>
            </div>
        </aside>
    );
}

export default AdminSidebar;