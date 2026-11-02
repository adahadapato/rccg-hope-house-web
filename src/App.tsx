import {
    lazy,
    Suspense,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

import HomePage from './pages/HomePage';
import CookieConsent from './components/CookieConsent';

/*
 * Admin pages and rarely used pages load only when someone opens
 * them, so ordinary visitors don't download the whole admin panel.
 */
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AnnualPrayers = lazy(() => import('./admin/pages/AnnualPrayers'));
const GalleryCategory = lazy(() => import('./admin/pages/GalleryCategory'));
const GalleryImage = lazy(() => import('./admin/pages/GalleryImage'));
const Prophecies = lazy(() => import('./admin/pages/Prophecies'));
const ProphecyCategories = lazy(() => import('./admin/pages/ProphecyCategories'));
const Sermons = lazy(() => import('./admin/pages/Sermons'));
const Events = lazy(() => import('./admin/pages/AdminEvents'));
const AdminNews = lazy(() => import('./admin/pages/AdminNews'));
const Services = lazy(() => import('./admin/pages/Services'));
const ThemesOfTheYear = lazy(() => import('./admin/pages/ThemesOfTheYear'));
const Users = lazy(() => import('./admin/pages/Users'));
const Roles = lazy(() => import('./admin/pages/Roles'));
const VerifyEmail = lazy(() => import('./admin/pages/VerifyEmail'));
const AccountSettings = lazy(() => import('./admin/pages/AccountSettings'));
const Devotionals = lazy(() => import('./admin/pages/Devotionals'));
const ContactMessages = lazy(() => import('./admin/pages/ContactMessages'));
const PrayerRequest = lazy(() => import('./admin/pages/PrayerRequest'));
const Members = lazy(() => import('./admin/pages/Members'));
const ChurchSettings = lazy(() => import('./admin/pages/ChurchSettings'));
const SmartSeo = lazy(() => import('./admin/pages/SmartSeo'));
const Celebrations = lazy(() => import('./admin/pages/Celebrations'));
const BirthdayWishes = lazy(() => import('./admin/pages/BirthdayWishes'));
const AiPrompts = lazy(() => import('./admin/pages/AiPrompts'));
const CelebrationInvitationResponse = lazy(() => import('./pages/CelebrationInvitationResponse'));

import { clearAdminSession, validateAdminSession } from '@/api/api';

type AdminAuthState = 'checking' | 'authorised' | 'unauthorised';

function CenteredMessage({ title, text }: { title: string; text: string }) {
    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
            <div>
                <strong>{title}</strong>
                <p>{text}</p>
            </div>
        </div>
    );
}

/** Shown for a moment while a page's code downloads. */
function PageLoader({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<CenteredMessage title="Loading..." text="Please wait." />}>
            {children}
        </Suspense>
    );
}

function adminPage(path: string): ReactNode {
    switch (path) {
        case '/admin': return <AdminDashboard />;
        case '/admin/services': return <Services />;
        case '/admin/gallery': return <GalleryImage />;
        case '/admin/gallery/categories': return <GalleryCategory />;
        case '/admin/birthday-wishes': return <BirthdayWishes />;
        case '/admin/prophecies': return <Prophecies />;
        case '/admin/prophecies/categories': return <ProphecyCategories />;
        case '/admin/sermons': return <Sermons />;
        case '/admin/themes': return <ThemesOfTheYear />;
        case '/admin/annual-prayers': return <AnnualPrayers />;
        case '/admin/users': return <Users />;
        case '/admin/roles': return <Roles />;
        case '/admin/events': return <Events />;
        case '/admin/news': return <AdminNews />;
        case '/admin/members': return <Members />;
        case '/admin/celebrations': return <Celebrations />;
        case '/admin/accountsettings': return <AccountSettings />;
        case '/admin/devotionals': return <Devotionals />;
        case '/admin/contacts': return <ContactMessages />;
        case '/admin/prayer-requests': return <PrayerRequest />;
        case '/admin/churchsettings': return <ChurchSettings />;
        case '/admin/seo': return <SmartSeo />;
        case '/admin/ai-prompts': return <AiPrompts />;
        default: return <AdminDashboard />;
    }
}

function App() {
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const isVerifyEmailRoute = currentPath === '/verify-email';
    const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');

    const [adminAuthState, setAdminAuthState] = useState<AdminAuthState>(
        isAdminRoute ? 'checking' : 'unauthorised'
    );

    useEffect(() => {
        if (!isAdminRoute) return;
        let cancelled = false;

        const verifyAdministrator = async () => {
            const valid = await validateAdminSession();
            if (cancelled) return;
            if (valid) {
                setAdminAuthState('authorised');
                return;
            }
            clearAdminSession();
            setAdminAuthState('unauthorised');
            window.location.replace('/');
        };

        void verifyAdministrator();
        return () => { cancelled = true; };
    }, [isAdminRoute]);

    if (isVerifyEmailRoute) return <PageLoader><VerifyEmail /></PageLoader>;

    if (currentPath === '/celebrations/respond') {
        return <PageLoader><CelebrationInvitationResponse /></PageLoader>;
    }

    if (!isAdminRoute) {
        return (
            <>
                <HomePage />
                <CookieConsent />
            </>
        );
    }

    if (adminAuthState !== 'authorised') {
        return (
            <CenteredMessage
                title="Verifying administrator access..."
                text="Please wait."
            />
        );
    }

    return <PageLoader>{adminPage(currentPath)}</PageLoader>;
}

export default App;
