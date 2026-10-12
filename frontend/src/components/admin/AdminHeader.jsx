import { Link } from 'react-router-dom';
import { HiMenuAlt2, HiOutlineExternalLink } from 'react-icons/hi';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import NotificationBell from '../common/NotificationBell';

/** Top bar of the admin dashboard: menu toggle, date, notifications and the signed-in admin. */
const AdminHeader = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" onClick={onMenuClick} className="lg:hidden icon-btn" aria-label="Open menu">
          <HiMenuAlt2 className="w-6 h-6" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">Welcome back, {user?.name?.split(' ')[0]}</p>
          <p className="text-xs text-gray-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/" className="btn-outline !text-xs hidden sm:inline-flex" title="Open the customer website">
          <HiOutlineExternalLink className="w-4 h-4" /> View site
        </Link>
        <NotificationBell />
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-100">
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
