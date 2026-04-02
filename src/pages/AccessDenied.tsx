import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { activeRole, isMultiRole } = useAuth();

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-6 max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this area.
              {activeRole && (
                <> Your current role is <span className="font-semibold capitalize text-foreground">{activeRole}</span>.</>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {isMultiRole && (
              <Button variant="gradient" onClick={() => navigate('/role-select')}>
                Switch Portal
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" /> Home
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
