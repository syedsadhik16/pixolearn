import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import pixoLogo from '@/assets/pixo-logo.png';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'admin': return '/admin';
      case 'parent': return '/parent';
      default: return '/student';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={pixoLogo} alt="PIXO" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user && profile ? (
              <>
                <Link to={getDashboardPath()}>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    {profile.full_name || t('goToDashboard')}
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  {t('signOut')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">{t('signIn')}</Button>
                </Link>
                <Link to="/auth?signup=true">
                  <Button variant="gradient">{t('getStarted')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 animate-slide-up">
            {user && profile ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    {profile.full_name || t('goToDashboard')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t('signOut')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">{t('signIn')}</Button>
                </Link>
                <Link to="/auth?signup=true" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="gradient" className="w-full">{t('getStarted')}</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
