import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiMenu, HiBell, HiSearch } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../../services/index';
import { formatDate } from '../../utils/helpers';

const AdminHeader = ({ onMenuClick }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationService.getAll().then(({ data }) => {
      setNotifications(data.data || []);
      setUnread(data.unread || 0);
    }).catch(() => {});
  }, []);

  const markRead = async (id) => {
    await notificationService.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAll = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <HiMenu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 w-64">
          <HiSearch className="w-4 h-4 text-gray-400" />
          <input placeholder="Search..." className="bg-transparent text-sm outline-none w-full text-gray-600 placeholder-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <HiBell className="w-5 h-5 text-gray-600" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 text-sm">Notifications</h4>
                  {unread > 0 && (
                    <button onClick={markAll} className="text-xs text-gold-600 hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-gold-50' : ''}`}
                      >
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at, 'MMM dd, h:mm a')}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to="/" className="text-xs text-gold-600 hover:underline hidden sm:block">View Site</Link>
      </div>
    </header>
  );
};

export default AdminHeader;
