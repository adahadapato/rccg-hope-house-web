import {
    useEffect,
    useState,
} from 'react';

import AdminDashboard from './admin/pages/AdminDashboard';
import GalleryCategory from './admin/pages/GalleryCategory';
import GalleryImage from './admin/pages/GalleryImage';
import HomePage from './pages/HomePage';

import {
    clearAdminSession,
    validateAdminSession,
} from '@/api/api';

type AdminAuthState =
    | 'checking'
    | 'authorised'
    | 'unauthorised';

function App() {
    const currentPath =
        window.location.pathname.replace(/\/+$/, '') || '/';

    const isAdminRoute =
        currentPath === '/admin' ||
        currentPath.startsWith('/admin/');

    const [adminAuthState, setAdminAuthState] =
        useState<AdminAuthState>(
            isAdminRoute ? 'checking' : 'unauthorised'
        );

    useEffect(() => {
        if (!isAdminRoute) {
            return;
        }

        let cancelled = false;

        const verifyAdministrator = async () => {
            const valid = await validateAdminSession();

            if (cancelled) {
                return;
            }

            if (valid) {
                setAdminAuthState('authorised');
                return;
            }

            clearAdminSession();
            setAdminAuthState('unauthorised');
            window.location.replace('/');
        };

        void verifyAdministrator();

        return () => {
            cancelled = true;
        };
    }, [isAdminRoute]);

    if (!isAdminRoute) {
        return <HomePage />;
    }

    if (adminAuthState !== 'authorised') {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                }}
            >
                <div>
                    <strong>
                        Verifying administrator access...
                    </strong>
                    <p>Please wait.</p>
                </div>
            </div>
        );
    }

    switch (currentPath) {
        case '/admin':
            return <AdminDashboard />;
        case '/admin/gallery':
            return <GalleryImage />;
        case '/admin/gallery/categories':
            return <GalleryCategory />;
        default:
            return <AdminDashboard />;
    }
}

export default App;
