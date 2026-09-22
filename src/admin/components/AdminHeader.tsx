import {
    useEffect,
    useRef,
    useState,
} from 'react';

function AdminHeader() {
    const [isUserMenuOpen, setIsUserMenuOpen] =
        useState(false);

    const userMenuRef =
        useRef<HTMLDivElement>(null);

    /*
     * Get the authenticated administrator
     * information saved during login.
     */
    const adminName =
        localStorage.getItem('adminName') ||
        'Administrator';

    const adminEmail =
        localStorage.getItem('adminEmail') ||
        '';

    /*
     * Automatically generate initials
     * from the administrator's name.
     *
     * Examples:
     * Admin User       -> AU
     * Enobong Adahada  -> EA
     * John             -> J
     */
    const adminInitials = adminName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) =>
            part.charAt(0).toUpperCase()
        )
        .join('');


    /* =========================================
       CLOSE USER MENU WHEN CLICKING OUTSIDE
       ========================================= */

    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent
        ) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(
                    event.target as Node
                )
            ) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, []);


    /* =========================================
       LOGOUT
       ========================================= */

    const handleLogout = () => {
        /*
         * Remove authentication tokens.
         */
        localStorage.removeItem(
            'adminAccessToken'
        );

        localStorage.removeItem(
            'adminRefreshToken'
        );

        /*
         * Remove administrator information.
         */
        localStorage.removeItem(
            'adminRole'
        );

        localStorage.removeItem(
            'adminName'
        );

        localStorage.removeItem(
            'adminEmail'
        );

        /*
         * Return to the public website.
         */
        window.location.replace('/');
    };


    return (
        <header className="admin-header">

            {/* SEARCH */}

            <div className="admin-search">
                <span>⌕</span>

                <input
                    type="search"
                    placeholder="Search..."
                    aria-label="Search administration"
                />
            </div>


            {/* HEADER ACTIONS */}

            <div className="admin-header-actions">

                {/* NOTIFICATIONS */}

                <button
                    type="button"
                    className="admin-notification"
                    aria-label="Notifications"
                >
                    ♧
                    <span>3</span>
                </button>


                {/* ADMIN USER MENU */}

                <div
                    className="admin-user-menu-wrapper"
                    ref={userMenuRef}
                >
                    <button
                        type="button"
                        className="admin-user"
                        onClick={() =>
                            setIsUserMenuOpen(
                                (previous) =>
                                    !previous
                            )
                        }
                        aria-expanded={
                            isUserMenuOpen
                        }
                        aria-haspopup="menu"
                    >
                        <div className="admin-avatar">
                            {adminInitials}
                        </div>

                        <div className="admin-user-details">
                            <strong>
                                {adminName}
                            </strong>

                            <span>
                                {adminEmail}
                            </span>
                        </div>

                        <span
                            className={`admin-user-chevron ${isUserMenuOpen
                                    ? 'open'
                                    : ''
                                }`}
                        >
                            ⌄
                        </span>
                    </button>


                    {/* USER DROPDOWN */}

                    {isUserMenuOpen && (
                        <div
                            className="admin-user-dropdown"
                            role="menu"
                        >
                            <div className="admin-user-dropdown-header">
                                <div className="admin-avatar">
                                    {adminInitials}
                                </div>

                                <div>
                                    <strong>
                                        {adminName}
                                    </strong>

                                    <span>
                                        {adminEmail}
                                    </span>
                                </div>
                            </div>

                            <div className="admin-user-dropdown-divider" />

                            <button
                                type="button"
                                className="admin-user-dropdown-item"
                                role="menuitem"
                            >
                                <span>⚙</span>
                                Account Settings
                            </button>

                            <div className="admin-user-dropdown-divider" />

                            <button
                                type="button"
                                className="admin-user-dropdown-item admin-logout-item"
                                onClick={handleLogout}
                                role="menuitem"
                            >
                                <span>↪</span>
                                Logout
                            </button>
                        </div>
                    )}

                </div>

            </div>
        </header>
    );
}

export default AdminHeader;