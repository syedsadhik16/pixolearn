import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Map, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/student', label: 'Home', icon: Home },
  { path: '/journey', label: 'Journey', icon: Map },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-6 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] rounded-2xl transition-all duration-200",
                isActive
                  ? "text-pixo-orange"
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[11px] leading-tight",
                  isActive ? "font-bold" : "font-medium"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1.5 w-6 h-[3px] rounded-full bg-pixo-orange" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
