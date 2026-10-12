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

const SettingsContext = createContext({ settings: FALLBACK, loading: true, setSettings: () => {}, refresh: () => {} });

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () => settingsService.get()
      .then(({ data }) => setSettings({ ...FALLBACK, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false)),
    []
  );

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => { document.title = settings.businessName; }, [settings.businessName]);

  const value = useMemo(() => ({ settings, loading, setSettings, refresh }), [settings, loading, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
