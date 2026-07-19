import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiViewGrid, HiCalendar, HiUsers, HiUserGroup, HiScissors,
  HiTag, HiCreditCard, HiArchive, HiStar, HiChartBar,
  HiCog, HiLogout, HiX, HiPhotograph,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { to: '/admin', label: 'Dashboard', icon: HiViewGrid, end: true },
  { to: '/admin/appointments', label: 'Appointments', icon: HiCalendar },
  { to: '/admin/customers', label: 'Customers', icon: HiUsers },
  { to: '/admin/employees', label: 'Employees', icon: HiUserGroup },
  { to: '/admin/services', label: 'Services', icon: HiScissors },
  { to: '/admin/categories', label: 'Categories', icon: HiTag },
  { to: '/admin/payments', label: 'Payments', icon: HiCreditCard },
  { to: '/admin/inventory', label: 'Inventory', icon: HiArchive },
  { to: '/admin/reviews', label: 'Reviews', icon: HiStar },
  { to: '/admin/gallery', label: 'Gallery', icon: HiPhotograph },
  { to: '/admin/reports', label: 'Reports', icon: HiChartBar },
  { to: '/admin/settings', label: 'Settings', icon: HiCog },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <p className="font-serif font-bold text-gray-900 text-sm">Aisha's Salon</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
          <HiX className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 p-3 bg-gold-50 rounded-xl">
          <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? 'bg-gold-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <HiLogout className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0">
        <SidebarContent />
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
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
