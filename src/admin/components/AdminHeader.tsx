import {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    apiFetch,
    clearAdminSession,
} from '@/api/api';

import {
    BIRTHDAY_WISHES_CHANGED_EVENT,
    type BirthdayWishStats,
} from '@/hooks/useBirthdayWishes';

/** How often the bell re-checks for wishes needing review. */
const PENDING_WISHES_POLL_MS = 2 * 60 * 1000;

interface AccountProfile {
    firstName: string;
    lastName: string;
    email: string;
    profileImagePath: string | null;
}

function resolveProfileImageUrl(
    imagePath: string | null
): string | null {
    if (!imagePath) {
        return null;
    }

    if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://') ||
        imagePath.startsWith('data:')
    ) {
        return imagePath;
    }

    const baseUrl = (
        import.meta.env.VITE_API_BASE_URL ??
        ''
    ).replace(/\/$/, '');

    const normalizedPath =
        imagePath.startsWith('/')
            ? imagePath
            : `/${imagePath}`;

    return `${baseUrl}${normalizedPath}`;
}

function getInitials(
    name: string
): string {
    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part =>
            part
                .charAt(0)
                .toUpperCase()
        )
        .join('');

    return initials || 'A';
}

function AdminHeader() {
    const [
        isUserMenuOpen,
        setIsUserMenuOpen,
    ] = useState(false);

    const [
        adminName,
        setAdminName,
    ] = useState(
        localStorage.getItem(
            'adminName'
        ) || 'Administrator'
    );

    const [
        adminEmail,
        setAdminEmail,
    ] = useState(
        localStorage.getItem(
            'adminEmail'
        ) || ''
    );

    const [
        profileImagePath,
        setProfileImagePath,
    ] =
        useState<string | null>(
            null
        );

    const [
        imageFailed,
        setImageFailed,
    ] = useState(false);

    const [
        pendingWishes,
        setPendingWishes,
    ] = useState(0);

    const userMenuRef =
        useRef<HTMLDivElement>(null);

    const adminInitials =
        getInitials(
            adminName
        );

    const profileImageUrl =
        resolveProfileImageUrl(
            profileImagePath
        );

    const showProfileImage =
        Boolean(
            profileImageUrl
        ) &&
        !imageFailed;

    /* =========================================
       LOAD CURRENT ADMINISTRATOR PROFILE
       ========================================= */

    useEffect(() => {
        const controller =
            new AbortController();

        const loadProfile =
            async () => {
                try {
                    const response =
                        await apiFetch(
                            '/api/account/profile',
                            {
                                signal:
                                    controller
                                        .signal,
                            }
                        );

                    if (!response.ok) {
                        return;
                    }

                    const profile =
                        (await response.json()) as AccountProfile;

                    if (
                        controller
                            .signal
                            .aborted
                    ) {
                        return;
                    }

                    const fullName = [
                        profile.firstName,
                        profile.lastName,
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .trim();

                    const resolvedName =
                        fullName ||
                        profile.email ||
                        'Administrator';

                    setAdminName(
                        resolvedName
                    );

                    setAdminEmail(
                        profile.email
                    );

                    setProfileImagePath(
                        profile.profileImagePath
                    );

                    setImageFailed(
                        false
                    );

                    /*
                     * Keep the existing local-storage
                     * values synchronised with the
                     * authoritative account profile.
                     */
                    localStorage.setItem(
                        'adminName',
                        resolvedName
                    );

                    localStorage.setItem(
                        'adminEmail',
                        profile.email
                    );
                } catch (error) {
                    /*
                     * The header can continue using the
                     * locally stored name/email if the
                     * profile request temporarily fails.
                     */
                    if (
                        error instanceof DOMException &&
                        error.name ===
                        'AbortError'
                    ) {
                        return;
                    }
                }
            };

        void loadProfile();

        return () => {
            controller.abort();
        };
    }, []);

    /* =========================================
       BELL: BIRTHDAY WISHES NEEDING REVIEW
       ========================================= */

    useEffect(() => {
        let controller: AbortController | null = null;

        const loadPendingWishes = async () => {
            controller?.abort();
            controller = new AbortController();

            try {
                const response =
                    await apiFetch(
                        '/api/birthday-wishes/admin/stats',
                        {
                            signal:
                                controller.signal,
                        }
                    );

                // e.g. 403 for admins without content access:
                // leave the bell without a count.
                if (!response.ok) {
                    return;
                }

                const stats =
                    (await response.json()) as BirthdayWishStats;

                setPendingWishes(
                    stats.pendingCount ?? 0
                );
            } catch {
                // Aborted or offline: keep the last count.
            }
        };

        void loadPendingWishes();

        const timer =
            window.setInterval(
                () => void loadPendingWishes(),
                PENDING_WISHES_POLL_MS
            );

        const handleChanged = () =>
            void loadPendingWishes();

        window.addEventListener(
            BIRTHDAY_WISHES_CHANGED_EVENT,
            handleChanged
        );

        return () => {
            controller?.abort();
            window.clearInterval(timer);
            window.removeEventListener(
                BIRTHDAY_WISHES_CHANGED_EVENT,
                handleChanged
            );
        };
    }, []);

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
                setIsUserMenuOpen(
                    false
                );
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
       ACCOUNT SETTINGS
       ========================================= */

    const handleAccountSettings =
        () => {
            setIsUserMenuOpen(
                false
            );

            window.location.assign(
                '/admin/adminsettings'
            );
        };

    /* =========================================
       LOGOUT
       ========================================= */

    const handleLogout = () => {
        clearAdminSession();

        window.location.replace(
            '/'
        );
    };

    /* =========================================
       AVATAR
       ========================================= */

    const renderAvatar = () => (
        <div className="admin-avatar">
            {showProfileImage ? (
                <img
                    src={
                        profileImageUrl ??
                        undefined
                    }
                    alt=""
                    className="admin-avatar-image"
                    onError={() =>
                        setImageFailed(
                            true
                        )
                    }
                />
            ) : (
                adminInitials
            )}
        </div>
    );

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
                    aria-label={
                        pendingWishes > 0
                            ? `${pendingWishes} birthday wish${pendingWishes === 1 ? '' : 'es'} need review`
                            : 'No birthday wishes need review'
                    }
                    title={
                        pendingWishes > 0
                            ? `${pendingWishes} birthday wish${pendingWishes === 1 ? '' : 'es'} need review`
                            : 'Nothing needs review'
                    }
                    onClick={() =>
                        window.location.assign(
                            '/admin/birthday-wishes'
                        )
                    }
                >
                    ♧
                    {pendingWishes > 0 && (
                        <span>
                            {pendingWishes > 99
                                ? '99+'
                                : pendingWishes}
                        </span>
                    )}
                </button>

                {/* ADMIN USER MENU */}

                <div
                    className="admin-user-menu-wrapper"
                    ref={
                        userMenuRef
                    }
                >
                    <button
                        type="button"
                        className="admin-user"
                        onClick={() =>
                            setIsUserMenuOpen(
                                previous =>
                                    !previous
                            )
                        }
                        aria-expanded={
                            isUserMenuOpen
                        }
                        aria-haspopup="menu"
                    >
                        {renderAvatar()}

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
                                {renderAvatar()}

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
                                onClick={
                                    handleAccountSettings
                                }
                                role="menuitem"
                            >
                                <span>
                                    ⚙
                                </span>
                                Account Settings
                            </button>

                            <div className="admin-user-dropdown-divider" />

                            <button
                                type="button"
                                className="admin-user-dropdown-item admin-logout-item"
                                onClick={
                                    handleLogout
                                }
                                role="menuitem"
                            >
                                <span>
                                    ↪
                                </span>
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