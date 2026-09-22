import type { ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="admin-app">
            <AdminSidebar />

            <div className="admin-main">
                <AdminHeader />

                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;