import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { syncEntitlementFromDatabase, isEntitlementActive, UserEntitlement } from '@/lib/entitlement';

interface PremiumRouteProps {
  children: React.ReactNode;
}

export function PremiumRoute({ children }: PremiumRouteProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setHasAccess(false);
      setChecking(false);
      return;
    }

    // Check profile-level premium (trial or subscription)
    if (profile?.subscription_type === 'premium') {
      setHasAccess(true);
      setChecking(false);
      return;
    }

    // Check sessionStorage for immediate post-payment unlock
    if (sessionStorage.getItem('isPaid') === 'true') {
      const expiryStr = sessionStorage.getItem('expiryDate');
      if (expiryStr && new Date(expiryStr) > new Date()) {
        setHasAccess(true);
        setChecking(false);
        return;
      }
      // Expired session data — clear it
      sessionStorage.removeItem('isPaid');
      sessionStorage.removeItem('expiryDate');
    }

    // Check database entitlement
    syncEntitlementFromDatabase(user.id).then((entitlement) => {
      if (entitlement && isEntitlementActive(entitlement)) {
        setHasAccess(true);
        // Restore sessionStorage from DB
        sessionStorage.setItem('isPaid', 'true');
        if (entitlement.entitlement_expiry_date) {
          sessionStorage.setItem('expiryDate', entitlement.entitlement_expiry_date);
        }
        if (entitlement.selected_level) {
          sessionStorage.setItem('selectedLevel', entitlement.selected_level);
        }
        if (entitlement.selected_plan) {
          sessionStorage.setItem('selectedPlan', entitlement.selected_plan);
        }
      } else {
        setHasAccess(false);
      }
      setChecking(false);
    });
  }, [user, profile, authLoading]);

  if (authLoading || checking) {
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

  if (!hasAccess) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
