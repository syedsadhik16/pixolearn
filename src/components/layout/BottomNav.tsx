import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map, 
  MessageCircle, 
  Radio, 
  Theater, 
  BookOpenText, 
  Mic2,
  PenLine,
  Trophy,
  ShoppingBag,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/student', label: 'Home', icon: Home },
  { path: '/journey', label: 'Journey', icon: Map },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/live', label: 'Live', icon: Radio },
  { path: '/roleplay', label: 'Roleplay', icon: Theater },
  { path: '/dictionary', label: 'Dictionary', icon: BookOpenText },
  { path: '/studio', label: 'Studio', icon: Mic2 },
  { path: '/creative-writing', label: 'Write', icon: PenLine },
  { path: '/leaderboard', label: 'Ranks', icon: Trophy },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-1 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1.5 rounded-lg transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
              <span className={cn(
                "text-[10px] leading-tight truncate w-full text-center",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
