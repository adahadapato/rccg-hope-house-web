import { useEffect, useState } from 'react';
import AdminLoginModal from './AdminLoginModal';
import GiveOnlineModal from './GiveOnlineModal';

interface MenuItem {
    label: string;
    href: string;
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        label: 'About',
        href: '#about',
        children: [
            { label: 'About Us', href: '#about' },
            { label: 'Our Family', href: '#welcome' },
            { label: 'Gallery', href: '#photo-gallery' },
            { label: 'Beliefs', href: '#beliefs' },
            { label: 'Vision', href: '#vision-mission' },
        ],
    },
    {
        label: 'Ministries',
        href: '#services',
        children: [
            { label: 'Services', href: '#services' },
            { label: 'Devotional', href: '#devotional' },
            { label: 'Pastors Corner', href: '#pastors-corner' },
        ],
    },
    {
        label: 'Events',
        href: '#events',
        children: [
            {
                label: 'Special Services',
                href: '#monthly-services',
            },
            {
                label: 'Theme of the Year',
                href: '#theme-of-year',
            },
            {
                label: 'Prophecy of the Year',
                href: '#prophecy-of-the-year',
            },
            {
                label: 'Prayer for the year',
                href: '#prayer-for-the-year',
            },
        ],
    },
    {
        label: 'Connect',
        href: '#connect',
        children: [
            {
                label: 'Prayer Request',
                href: '#prayer',
            },
            {
                label: 'Contact Us',
                href: '#contact',
            },
        ],
    },
];

export default function Navigation() {
    const [isMenuOpen, setIsMenuOpen] =
        useState(false);

    const [activeDropdown, setActiveDropdown] =
        useState<string | null>(null);

    const [
        mobileOpenDropdown,
        setMobileOpenDropdown,
    ] = useState<string | null>(null);

    const [
        isAdminLoginOpen,
        setIsAdminLoginOpen,
    ] = useState(false);

    const [
        isGiveOnlineOpen,
        setIsGiveOnlineOpen,
    ] = useState(false);

    /*
     * Authentication state.
     *
     * If adminAccessToken exists in localStorage,
     * the navigation displays Logout.
     */
    const [isLoggedIn, setIsLoggedIn] =
        useState(() => {
            return Boolean(
                localStorage.getItem(
                    'adminAccessToken'
                )
            );
        });


    /* =========================================
       PREVENT BACKGROUND SCROLL
       ========================================= */

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow =
                'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);


    /* =========================================
       ESCAPE KEY
       ========================================= */

    useEffect(() => {
        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                setActiveDropdown(null);
                setMobileOpenDropdown(null);
            }
        };

        window.addEventListener(
            'keydown',
            handleEscape
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleEscape
            );
        };
    }, []);


    /* =========================================
       CLOSE MOBILE MENU WHEN RETURNING
       TO DESKTOP
       ========================================= */

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1100) {
                setIsMenuOpen(false);
                setMobileOpenDropdown(null);
            }
        };

        window.addEventListener(
            'resize',
            handleResize
        );

        return () => {
            window.removeEventListener(
                'resize',
                handleResize
            );
        };
    }, []);


    /* =========================================
       CHECK LOGIN STATE
       ========================================= */

    const checkLoginState = () => {
        setIsLoggedIn(
            Boolean(
                localStorage.getItem(
                    'adminAccessToken'
                )
            )
        );
    };


    /* =========================================
       OPEN LOGIN
       ========================================= */

    const handleLogin = () => {
        setIsMenuOpen(false);
        setMobileOpenDropdown(null);
        setIsAdminLoginOpen(true);
    };


    /* =========================================
       CLOSE LOGIN
       ========================================= */

    const handleLoginModalClose = () => {
        setIsAdminLoginOpen(false);

        /*
         * AdminLoginModal stores the access token
         * after a successful login.
         *
         * Check localStorage again when the modal
         * closes so Login immediately becomes Logout.
         */
        checkLoginState();
    };


    /* =========================================
       LOGOUT
       ========================================= */

    const handleLogout = () => {
        localStorage.removeItem(
            'adminAccessToken'
        );

        localStorage.removeItem(
            'adminRefreshToken'
        );

        localStorage.removeItem(
            'adminRole'
        );

        setIsLoggedIn(false);

        setIsMenuOpen(false);
        setMobileOpenDropdown(null);
        setActiveDropdown(null);
    };


    /* =========================================
       OPEN GIVE ONLINE
       ========================================= */

    const handleGiveOnline = () => {
        setIsMenuOpen(false);
        setMobileOpenDropdown(null);
        setActiveDropdown(null);

        setIsGiveOnlineOpen(true);
    };


    /* =========================================
       CLOSE GIVE ONLINE
       ========================================= */

    const handleGiveOnlineClose = () => {
        setIsGiveOnlineOpen(false);
    };


    return (
        <nav
            className="nav-modern"
            aria-label="Main Navigation"
        >
            <div className="nav-content">

                {/* =================================
                    LEFT: LOGO
                    ================================= */}

                <a
                    href="#home"
                    className="logo"
                    aria-label="RCCG Hope House home"
                >
                    <img
                        src="/rccg-logo.png"
                        alt="RCCG Logo"
                        className="logo-img"
                    />

                    <div className="logo-text">
                        <h1>
                            RCCG Hope House
                        </h1>

                        <p>
                            Redeemed Christian
                            Church of God
                        </p>
                    </div>
                </a>


                {/* =================================
                    DESKTOP NAVIGATION
                    ================================= */}

                <div className="nav-links">

                    {menuItems.map((item) =>
                        item.children ? (

                            <div
                                key={item.label}
                                className="dropdown"
                                onMouseEnter={() =>
                                    setActiveDropdown(
                                        item.label
                                    )
                                }
                                onMouseLeave={() =>
                                    setActiveDropdown(
                                        null
                                    )
                                }
                            >

                                <a
                                    href={item.href}
                                    className="dropdown-trigger"
                                    aria-haspopup="true"
                                    aria-expanded={
                                        activeDropdown ===
                                        item.label
                                    }
                                >
                                    {item.label}

                                    <svg
                                        className={`dropdown-arrow ${activeDropdown ===
                                                item.label
                                                ? 'rotated'
                                                : ''
                                            }`}
                                        width="10"
                                        height="10"
                                        viewBox="0 0 10 10"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M2 3.5L5 6.5L8 3.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                    </svg>
                                </a>


                                <div className="dropdown-content">

                                    {item.children.map(
                                        (child) => (

                                            <a
                                                key={
                                                    child.label
                                                }
                                                href={
                                                    child.href
                                                }
                                                className="dropdown-item"
                                                onClick={() =>
                                                    setActiveDropdown(
                                                        null
                                                    )
                                                }
                                            >
                                                {
                                                    child.label
                                                }
                                            </a>

                                        )
                                    )}

                                </div>

                            </div>

                        ) : (

                            <a
                                key={item.label}
                                href={item.href}
                                className="nav-link"
                            >
                                {item.label}
                            </a>

                        )
                    )}

                </div>


                {/* =================================
                    GIVE ONLINE
                    ================================= */}

                <button
                    type="button"
                    className="btn-primary desktop-give-btn"
                    onClick={handleGiveOnline}
                >
                    Give Online
                </button>


                {/* =================================
                    LOGIN / LOGOUT
                    ================================= */}

                <button
                    type="button"
                    className={`desktop-auth-btn ${isLoggedIn
                            ? 'logged-in'
                            : ''
                        }`}
                    onClick={
                        isLoggedIn
                            ? handleLogout
                            : handleLogin
                    }
                >
                    {isLoggedIn
                        ? 'Logout'
                        : 'Login'}
                </button>


                {/* =================================
                    MOBILE HAMBURGER
                    ================================= */}

                <button
                    type="button"
                    className={`mobile-menu-btn ${isMenuOpen
                            ? 'open'
                            : ''
                        }`}
                    onClick={() =>
                        setIsMenuOpen(
                            (previous) =>
                                !previous
                        )
                    }
                    aria-label={
                        isMenuOpen
                            ? 'Close navigation menu'
                            : 'Open navigation menu'
                    }
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-menu"
                >
                    <span className="hamburger-line" />
                    <span className="hamburger-line" />
                    <span className="hamburger-line" />
                </button>

            </div>


            {/* =====================================
                MOBILE NAVIGATION
                ===================================== */}

            {isMenuOpen && (

                <div
                    className="mobile-menu"
                    id="mobile-menu"
                >

                    {menuItems.map((item) =>
                        item.children ? (

                            <div
                                key={item.label}
                                className="mobile-dropdown"
                            >

                                <button
                                    type="button"
                                    className="mobile-dropdown-toggle"
                                    onClick={() =>
                                        setMobileOpenDropdown(
                                            mobileOpenDropdown ===
                                                item.label
                                                ? null
                                                : item.label
                                        )
                                    }
                                    aria-expanded={
                                        mobileOpenDropdown ===
                                        item.label
                                    }
                                    aria-controls={`mobile-dropdown-${item.label}`}
                                >
                                    <span>
                                        {
                                            item.label
                                        }
                                    </span>

                                    <svg
                                        className={`mobile-arrow ${mobileOpenDropdown ===
                                                item.label
                                                ? 'rotated'
                                                : ''
                                            }`}
                                        width="12"
                                        height="12"
                                        viewBox="0 0 10 10"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M2 3.5L5 6.5L8 3.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                    </svg>
                                </button>


                                <div
                                    id={`mobile-dropdown-${item.label}`}
                                    className={`mobile-dropdown-content ${mobileOpenDropdown ===
                                            item.label
                                            ? 'open'
                                            : ''
                                        }`}
                                >

                                    {item.children.map(
                                        (child) => (

                                            <a
                                                key={
                                                    child.label
                                                }
                                                href={
                                                    child.href
                                                }
                                                className="mobile-dropdown-item"
                                                onClick={() => {
                                                    setIsMenuOpen(
                                                        false
                                                    );

                                                    setMobileOpenDropdown(
                                                        null
                                                    );
                                                }}
                                            >
                                                {
                                                    child.label
                                                }
                                            </a>

                                        )
                                    )}

                                </div>

                            </div>

                        ) : (

                            <a
                                key={item.label}
                                href={item.href}
                                className="mobile-link"
                                onClick={() => {
                                    setIsMenuOpen(
                                        false
                                    );

                                    setMobileOpenDropdown(
                                        null
                                    );
                                }}
                            >
                                {item.label}
                            </a>

                        )
                    )}


                    {/* MOBILE GIVE */}

                    <button
                        type="button"
                        className="mobile-give-btn"
                        onClick={
                            handleGiveOnline
                        }
                    >
                        Give Online
                    </button>


                    {/* MOBILE LOGIN / LOGOUT */}

                    <button
                        type="button"
                        className="mobile-auth-btn"
                        onClick={
                            isLoggedIn
                                ? handleLogout
                                : handleLogin
                        }
                    >
                        {isLoggedIn
                            ? 'Logout'
                            : 'Login'}
                    </button>

                </div>

            )}


            {/* =====================================
                ADMIN LOGIN MODAL
                ===================================== */}

            <AdminLoginModal
                isOpen={
                    isAdminLoginOpen
                }
                onClose={
                    handleLoginModalClose
                }
            />


            {/* =====================================
                GIVE ONLINE MODAL
                ===================================== */}

            <GiveOnlineModal
                isOpen={
                    isGiveOnlineOpen
                }
                onClose={
                    handleGiveOnlineClose
                }
            />

        </nav>
    );
}