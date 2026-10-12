import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { PageTransition } from '../components/ui/Motion';

/** Shell for the public website: navbar, animated page area and footer. */
const CustomerLayout = () => {
  const { pathname } = useLocation();

  // Start every page at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
