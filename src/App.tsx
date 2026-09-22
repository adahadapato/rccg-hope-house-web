import AdminDashboard from './admin/pages/AdminDashboard';
import GalleryCategory from './admin/pages/GalleryCategory';
import GalleryImage from './admin/pages/GalleryImage';
import HomePage from './pages/HomePage';

function App() {
    const currentPath =
        window.location.pathname.replace(
            /\/+$/,
            ''
        ) || '/';

    const isAdminRoute =
        currentPath === '/admin' ||
        currentPath.startsWith(
            '/admin/'
        );

    const isAuthenticated =
        Boolean(
            localStorage.getItem(
                'adminAccessToken'
            )
        );

    const adminRole =
        localStorage.getItem(
            'adminRole'
        );

    const isAdmin =
        isAuthenticated &&
        adminRole?.toLowerCase() ===
        'admin';

    if (isAdminRoute) {
        if (!isAdmin) {
            window.location.replace(
                '/'
            );

            return null;
        }

        switch (currentPath) {
            case '/admin':
                return (
                    <AdminDashboard />
                );

            case '/admin/gallery':
                return (
                    <GalleryImage />
                );

            case '/admin/gallery/categories':
                return (
                    <GalleryCategory />
                );

            default:
                return (
                    <AdminDashboard />
                );
        }
    }

    return <HomePage />;
}

export default App;