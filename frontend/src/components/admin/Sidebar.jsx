import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineViewGrid, HiOutlineCalendar, HiOutlineUsers, HiOutlineUserGroup, HiOutlineScissors,
  HiOutlineTag, HiOutlineCreditCard, HiOutlineArchive, HiOutlineStar, HiOutlineChartBar,
  HiOutlineCog, HiOutlineLogout, HiOutlinePhotograph, HiX,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineViewGrid, end: true },
  { to: '/admin/appointments', label: 'Appointments', icon: HiOutlineCalendar },
  { to: '/admin/customers', label: 'Customers', icon: HiOutlineUsers },
  { to: '/admin/employees', label: 'Employees', icon: HiOutlineUserGroup },
  { to: '/admin/services', label: 'Services', icon: HiOutlineScissors },
  { to: '/admin/categories', label: 'Categories', icon: HiOutlineTag },
  { to: '/admin/payments', label: 'Payments', icon: HiOutlineCreditCard },
  { to: '/admin/inventory', label: 'Inventory', icon: HiOutlineArchive },
  { to: '/admin/reviews', label: 'Reviews', icon: HiOutlineStar },
  { to: '/admin/gallery', label: 'Gallery', icon: HiOutlinePhotograph },
  { to: '/admin/reports', label: 'Reports', icon: HiOutlineChartBar },
  { to: '/admin/settings', label: 'Settings', icon: HiOutlineCog },
];

const SidebarContent = ({ onClose, onLogout }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 shrink-0">
      <Logo to="/admin" subtitle="Admin Panel" />
      <button type="button" onClick={onClose} className="lg:hidden icon-btn" aria-label="Close menu">
        <HiX className="w-5 h-5" />
      </button>
    </div>

    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin">
      {MENU.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive ? 'bg-gold-500 text-salon-dark shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          <Icon className="w-5 h-5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>

    <div className="p-3 border-t border-gray-100 shrink-0">
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
      >
        <HiOutlineLogout className="w-5 h-5" />
        Logout
      </button>
    </div>
  </div>
);

/** Admin navigation: fixed on desktop, slide-in drawer on mobile. */
const Sidebar = ({ open, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-100 h-screen shrink-0">
        <SidebarContent onClose={() => {}} onLogout={handleLogout} />
      </aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent onClose={onClose} onLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
