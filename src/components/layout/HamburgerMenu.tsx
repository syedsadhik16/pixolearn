import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageCircle,
  Radio,
  Theater,
  BookOpenText,
  Mic2,
  PenLine,
  Trophy,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/lib/translations';

const menuItemDefs: { path: string; labelKey: TranslationKey; icon: typeof MessageCircle }[] = [
  { path: '/chat', labelKey: 'chat', icon: MessageCircle },
  { path: '/live', labelKey: 'liveClasses', icon: Radio },
  { path: '/roleplay', labelKey: 'roleplayPractice', icon: Theater },
  { path: '/dictionary', labelKey: 'dictionary', icon: BookOpenText },
  { path: '/studio', labelKey: 'studio', icon: Mic2 },
  { path: '/creative-writing', labelKey: 'writing', icon: PenLine },
  { path: '/leaderboard', labelKey: 'rankings', icon: Trophy },
  { path: '/shop', labelKey: 'shop', icon: ShoppingBag },
  { path: '/settings', labelKey: 'settings', icon: Settings },
];

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();

  const handleNav = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-[1.125rem] right-4 z-[60] p-2 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-sm hover:shadow-md transition-shadow"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[80] h-full w-[280px] bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="font-display font-bold text-base text-foreground">
              {profile?.full_name || t('learner')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile?.email || ''}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {menuItemDefs.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-colors mb-0.5",
                  isActive
                    ? "bg-pixo-orange/10 text-pixo-orange font-semibold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
