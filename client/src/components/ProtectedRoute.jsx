// client/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children, requireProfile = false, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Email not verified
  if (!user.emailVerified) return <Navigate to="/verify" replace />;

  // Profile incomplete (required for join/create)
  if (requireProfile && (!user.contactNo || !user.hostelNo || !user.collegeId)) {
    return <Navigate to="/profile?incomplete=true" replace />;
  }

  // Admin only pages
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
