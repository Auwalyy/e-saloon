import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { HiOutlineBell } from 'react-icons/hi';
import { notificationService } from '../../services';

const POLL_INTERVAL = 60000;

/** Bell icon with an unread badge and a dropdown of recent notifications. */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    notificationService.getAll({ limit: 10 })
      .then((body) => {
        setItems(body.data);
        setUnread(body.unreadCount);
      })
      .catch(() => {});
  }, []);

  // Poll in the background so new bookings show up without a refresh.
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const onClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openItem = async (item) => {
    setOpen(false);
    if (!item.isRead) {
      setItems((list) => list.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnread((count) => Math.max(0, count - 1));
      notificationService.markRead(item.id).catch(() => {});
    }
    if (item.link) navigate(item.link);
  };

  const markAllRead = async () => {
    setItems((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    notificationService.markAllRead().catch(() => {});
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => { setOpen((value) => !value); if (!open) load(); }}
        className="icon-btn relative"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <HiOutlineBell className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">Notifications</p>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs text-gold-700 font-medium hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-gray-400">You're all caught up</li>}
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 ${item.isRead ? '' : 'bg-gold-50/60'}`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.isRead ? 'bg-transparent' : 'bg-gold-500'}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{item.title}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{item.message}</span>
                      <span className="block text-[11px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
