import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { PageTransition } from '../components/ui/Motion';

/** Shell for the admin dashboard: fixed sidebar, top bar and scrolling content. */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-salon-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PageTransition key={pathname} className="max-w-7xl mx-auto">
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
