import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services';

/**
 * Salon-wide settings (name, logo, contact details, opening hours, social links)
 * loaded once and shared by the navbar, footer, contact page and admin panel.
 */
const FALLBACK = {
  businessName: "Aisha's Salon",
  tagline: 'Where beauty meets luxury',
  about: '',
  logo: '',
  address: '',
  email: '',
  phone: '',
  openingHours: [],
  socialLinks: {},
  slotIntervalMinutes: 30,
  cancellationWindowHours: 2,
};

const RETRY_INTERVAL = 8000;

const SettingsContext = createContext({ settings: FALLBACK, loading: true, apiOffline: false, setSettings: () => {}, refresh: () => {} });

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  // True when the backend cannot be reached, or something else is answering on its address.
  const [apiOffline, setApiOffline] = useState(false);

  const refresh = useCallback(
    () => settingsService.get()
      .then((body) => {
        if (!body?.data?.businessName) throw new Error('Unexpected response from the API');
        setSettings({ ...FALLBACK, ...body.data });
        setApiOffline(false);
      })
      .catch(() => setApiOffline(true))
      .finally(() => setLoading(false)),
    []
  );

  useEffect(() => { refresh(); }, [refresh]);

  // Keep trying in the background, and reload once the API is back so every page refetches.
  useEffect(() => {
    if (!apiOffline) return undefined;
    const timer = setInterval(() => {
      settingsService.get()
        .then((body) => { if (body?.data?.businessName) window.location.reload(); })
        .catch(() => {});
    }, RETRY_INTERVAL);
    return () => clearInterval(timer);
  }, [apiOffline]);

  useEffect(() => { document.title = settings.businessName; }, [settings.businessName]);

  const value = useMemo(() => ({ settings, loading, apiOffline, setSettings, refresh }), [settings, loading, apiOffline, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
