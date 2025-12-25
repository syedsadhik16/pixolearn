import { Flame } from 'lucide-react';

interface StreakDisplayProps {
  streak: number;
  className?: string;
}

export function StreakDisplay({ streak, className = '' }: StreakDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Flame
          className={`h-8 w-8 ${
            streak > 0 ? 'text-pixo-orange animate-pulse-slow' : 'text-muted-foreground'
          }`}
        />
        {streak > 0 && (
          <div className="absolute -top-1 -right-1 bg-pixo-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {streak > 99 ? '99+' : streak}
          </div>
        )}
      </div>
      <div>
        <p className="font-bold text-lg">{streak} Day{streak !== 1 ? 's' : ''}</p>
        <p className="text-xs text-muted-foreground">Streak</p>
      </div>
    </div>
  );
}
