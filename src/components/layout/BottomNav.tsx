import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Map, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { path: '/student', label: t('home'), icon: Home },
    { path: '/journey', label: t('journey'), icon: Map },
    { path: '/trophy-room', label: t('trophies'), icon: Trophy },
    { path: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 safe-area-bottom">
      <div className="mx-auto max-w-md bg-card/95 backdrop-blur-xl rounded-full border border-border/40 shadow-pixo-lg px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-12 rounded-full transition-all duration-300 tap-scale",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-bold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
