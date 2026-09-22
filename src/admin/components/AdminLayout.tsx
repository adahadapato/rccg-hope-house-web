import {
    useEffect,
    useState,
    type ReactNode,
} from 'react';

import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

function AdminLayout({
    children,
}: AdminLayoutProps) {
    const [
        mobileSidebarOpen,
        setMobileSidebarOpen,
    ] = useState(false);

    useEffect(() => {
        if (!mobileSidebarOpen) {
            return;
        }

        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (event.key === 'Escape') {
                setMobileSidebarOpen(false);
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
    }, [mobileSidebarOpen]);

    return (
        <div className="admin-app">
            <AdminSidebar
                mobileOpen={
                    mobileSidebarOpen
                }
                onMobileClose={() =>
                    setMobileSidebarOpen(
                        false
                    )
                }
            />

            {mobileSidebarOpen && (
                <button
                    type="button"
                    className="admin-mobile-sidebar-backdrop"
                    onClick={() =>
                        setMobileSidebarOpen(
                            false
                        )
                    }
                    aria-label="Close navigation menu"
                />
            )}

            <div className="admin-main">
                <div className="admin-mobile-toolbar">
                    <button
                        type="button"
                        className="admin-mobile-menu-button"
                        onClick={() =>
                            setMobileSidebarOpen(
                                true
                            )
                        }
                        aria-label="Open navigation menu"
                        aria-expanded={
                            mobileSidebarOpen
                        }
                    >
                        <span
                            aria-hidden="true"
                        >
                            ☰
                        </span>

                        <span>
                            Menu
                        </span>
                    </button>

                    <div className="admin-mobile-brand">
                        <img
                            src="/rccg-logo.png"
                            alt="RCCG logo"
                        />

                        <span>
                            RCCG Hope House
                        </span>
                    </div>
                </div>

                <AdminHeader />

                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;