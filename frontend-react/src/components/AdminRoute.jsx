import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Only ROLE_ADMIN users get through. Everyone else is redirected.
// (The backend enforces this too — this just keeps regular users out of the UI.)
export default function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
