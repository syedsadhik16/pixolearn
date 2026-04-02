import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading: authLoading, roles, activeRole } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      // Give roles a moment to load
      const timer = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has any of the allowed roles
  const hasAccess = roles.some(r => allowedRoles.includes(r));
  
  // Also check activeRole if set
  const activeRoleAllowed = activeRole ? allowedRoles.includes(activeRole) : true;

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace />;
  }

  // If user has multi-roles but active role doesn't match, still allow if they have the role
  return <>{children}</>;
}
