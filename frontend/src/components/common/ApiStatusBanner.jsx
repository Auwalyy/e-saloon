import { HiOutlineExclamation } from 'react-icons/hi';
import { useSettings } from '../../context/SettingsContext';

/**
 * Shown across the top of the app when the backend cannot be reached, so an
 * offline API is obvious instead of looking like empty pages.
 */
const ApiStatusBanner = () => {
  const { apiOffline } = useSettings();
  if (!apiOffline) return null;

  return (
    <div role="alert" className="bg-red-600 text-white text-sm">
      <div className="container-page py-2.5 flex items-start sm:items-center gap-3">
        <HiOutlineExclamation className="w-5 h-5 shrink-0" aria-hidden="true" />
        <p className="flex-1">
          <strong>We cannot reach the server right now.</strong> Services, prices and bookings will appear as soon as the connection is back.
          {import.meta.env.DEV && (
            <span className="block text-white/85 mt-0.5">
              Developer note: the backend is not answering. Start it with <code className="font-mono bg-black/20 px-1 rounded">npm run dev</code> in
              the <code className="font-mono bg-black/20 px-1 rounded">backend</code> folder (default port 5050). This page reconnects automatically.
            </span>
          )}
        </p>
        <button type="button" onClick={() => window.location.reload()} className="shrink-0 underline font-medium">Retry</button>
      </div>
    </div>
  );
};

export default ApiStatusBanner;
