import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiOutlineUser, HiOutlineLogout, HiOutlineCalendar, HiOutlineCog, HiOutlineViewGrid } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/stylists', label: 'Stylists' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
];

const ACCOUNT_LINKS = [
  { to: '/my-bookings', label: 'My Bookings', icon: HiOutlineCalendar },
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
  { to: '/settings', label: 'Settings', icon: HiOutlineCog },
];

/** Top navigation for the customer website (responsive, with account menu). */
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={`fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="container-page">
        <div className="flex items-center justify-between h-16 gap-4">
          <Logo />

          <nav className="hidden xl:flex items-center gap-0.5" aria-label="Main">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-gold-700 bg-gold-50' : 'text-gray-700 hover:text-gold-700 hover:bg-gold-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/book" className="btn-primary !text-sm !py-2 !px-4 hidden sm:inline-flex">Book Now</Link>

            {user ? (
              <>
                <NotificationBell />
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((value) => !value)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Account menu"
                  >
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        role="menu"
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {isAdmin && (
                          <Link to="/admin" role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-gold-700 font-medium hover:bg-gold-50">
                            <HiOutlineViewGrid className="w-4 h-4" /> Admin Dashboard
                          </Link>
                        )}
                        {ACCOUNT_LINKS.map(({ to, label, icon: Icon }) => (
                          <Link key={to} to={to} role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Icon className="w-4 h-4" /> {label}
                          </Link>
                        ))}
                        <hr className="my-1 border-gray-100" />
                        <button type="button" onClick={handleLogout} role="menuitem" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                          <HiOutlineLogout className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link to="/login" className="btn-outline !text-sm hidden sm:inline-flex">Login</Link>
            )}

            <button
              type="button"
              className="xl:hidden icon-btn"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white border-t border-gray-100 shadow-lg overflow-hidden"
            aria-label="Mobile"
          >
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'text-gold-700 bg-gold-50' : 'text-gray-700'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="pt-3 mt-2 border-t border-gray-100 grid gap-2">
                <Link to="/book" className="btn-primary w-full">Book Now</Link>
                {!user && <Link to="/login" className="btn-outline w-full !py-3">Login</Link>}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
