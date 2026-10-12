import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Skeleton';

/** Requires a signed-in user (optionally with one of `roles`). */
export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  // Remember where the visitor was heading so login can send them back.
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

/** For login / register: signed-in users are sent on to where they belong. */
export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (user) {
    const from = location.state?.from;
    const fallback = user.role === 'admin' ? '/admin' : '/';
    return <Navigate to={from ? `${from.pathname}${from.search || ''}` : fallback} replace />;
  }
  return children;
};
