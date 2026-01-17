import { ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const context = useContext(AuthContext);
  const location = useLocation();
  
  // Safety check for context availability
  if (context === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const { isAuthenticated, isLoading, user } = context;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (user && !canAccessRoute(user.role, location.pathname)) {
    // Redirect to appropriate home page based on role
    const roleHomePage = user.role === 'kitchen' ? '/kitchen' : '/';
    if (location.pathname !== roleHomePage) {
      return <Navigate to={roleHomePage} replace />;
    }
  }

  return <>{children}</>;
}
