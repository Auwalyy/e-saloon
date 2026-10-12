import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services';
import { SESSION_EXPIRED_EVENT } from '../services/api';

/**
 * Holds the signed-in user and exposes login / register / logout.
 * The session survives page reloads through localStorage and is re-validated
 * against the API on startup.
 */
const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const storeSession = ({ token, csrfToken, user }) => {
  if (token) localStorage.setItem('token', token);
  if (csrfToken) localStorage.setItem('csrfToken', csrfToken);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearSession = () => ['token', 'csrfToken', 'user'].forEach((key) => localStorage.removeItem(key));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  // Confirm the stored session is still valid.
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    authService.getMe()
      .then((body) => {
        storeSession(body);
        setUser(body.user);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // The API client fires this when any request comes back 401.
  useEffect(() => {
    const onExpired = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const startSession = useCallback((body) => {
    storeSession(body);
    setUser(body.user);
    return body.user;
  }, []);

  const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession]);
  const register = useCallback(async (data) => startSession(await authService.register(data)), [startSession]);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, logout, updateUser, startSession }),
    [user, loading, login, register, logout, updateUser, startSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
