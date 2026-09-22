import { useState } from 'react';

interface NavigationItem {
    icon: string;
    label: string;
    path?: string;
    children?: NavigationChild[];
}

interface NavigationChild {
    label: string;
    path: string;
}

const navItems: NavigationItem[] = [
    {
        icon: '⌂',
        label: 'Dashboard',
        path: '/admin',
    },
    {
        icon: '▤',
        label: 'Devotionals',
    },
    {
        icon: '▶',
        label: 'Sermons',
    },
    {
        icon: '▣',
        label: 'Services',
    },
    {
        icon: '□',
        label: 'Events',
    },
    {
        icon: '▤',
        label: 'News & Updates',
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
        icon: '♡',
        label: 'Prayer Requests',
    },
    {
        icon: '♙',
        label: 'Contacts',
    },
    {
        icon: '♟',
        label: 'Users',
    },
    {
        icon: '♟',
        label: 'Members',
    },
    {
        icon: '⚙',
        label: 'Settings',
    },
];

function AdminSidebar() {
    const currentPath =
        window.location.pathname;

    const galleryIsActive =
        currentPath === '/admin/gallery' ||
        currentPath.startsWith(
            '/admin/gallery/'
        );

    const [
        galleryOpen,
        setGalleryOpen,
    ] = useState<boolean>(
        galleryIsActive
    );

    function navigate(
        path?: string
    ) {
        if (!path) {
            return;
        }

        window.location.assign(path);
    }

    return (
        <aside className="admin-sidebar">
            <div className="admin-brand">
                <img
                    src="/rccg-logo.png"
                    alt="RCCG logo"
                    className="admin-brand-logo"
                />

                <div>
                    <strong>RCCG</strong>
                    <strong>Hope House</strong>
                    <span>
                        A Place of Hope for All
                    </span>
                </div>
            </div>

            <nav className="admin-navigation">
                {navItems.map(
                    item => {
                        const hasChildren =
                            Boolean(
                                item.children
                                    ?.length
                            );

                        const isGallery =
                            item.label ===
                            'Gallery';

                        const isActive =
                            item.path ===
                                '/admin'
                                ? currentPath ===
                                '/admin' ||
                                currentPath ===
                                '/admin/'
                                : Boolean(
                                    item.path &&
                                    currentPath.startsWith(
                                        item.path
                                    )
                                );

                        if (
                            hasChildren &&
                            isGallery
                        ) {
                            return (
                                <div
                                    className="admin-nav-group"
                                    key={
                                        item.label
                                    }
                                >
                                    <button
                                        type="button"
                                        className={`admin-nav-item ${galleryIsActive
                                                ? 'active'
                                                : ''
                                            }`}
                                        onClick={() =>
                                            setGalleryOpen(
                                                (
                                                    current: boolean
                                                ) =>
                                                    !current
                                            )
                                        }
                                        aria-expanded={
                                            galleryOpen
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
                                            className={`admin-nav-chevron ${galleryOpen
                                                    ? 'open'
                                                    : ''
                                                }`}
                                        >
                                            ›
                                        </span>
                                    </button>

                                    {galleryOpen && (
                                        <div className="admin-subnavigation">
                                            {item.children?.map(
                                                child => {
                                                    const childActive =
                                                        currentPath ===
                                                        child.path;

                                                    return (
                                                        <button
                                                            key={
                                                                child.path
                                                            }
                                                            type="button"
                                                            className={`admin-subnav-item ${childActive
                                                                    ? 'active'
                                                                    : ''
                                                                }`}
                                                            onClick={() =>
                                                                navigate(
                                                                    child.path
                                                                )
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

                        return (
                            <button
                                key={
                                    item.label
                                }
                                type="button"
                                className={`admin-nav-item ${isActive
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

                                <span>
                                    {
                                        item.label
                                    }
                                </span>
                            </button>
                        );
                    }
                )}
            </nav>

            <div className="admin-sidebar-footer">
                <a
                    href="/"
                    className="admin-view-site"
                >
                    <span>↗</span>
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