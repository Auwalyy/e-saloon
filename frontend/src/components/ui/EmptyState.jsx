import { HiOutlineInbox } from 'react-icons/hi';

/** Friendly placeholder shown when a list has nothing in it. */
const EmptyState = ({ icon: Icon = HiOutlineInbox, title = 'Nothing here yet', message, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-4">
    <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gold-500" aria-hidden="true" />
    </div>
    <p className="font-semibold text-gray-900">{title}</p>
    {message && <p className="text-sm text-gray-500 mt-1 max-w-sm">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
