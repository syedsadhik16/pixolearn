import { useState, useEffect } from 'react';
import { Clock, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TrialCountdownProps {
  trialExpiresAt: string;
}

export function TrialCountdown({ trialExpiresAt }: TrialCountdownProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const expiresAt = new Date(trialExpiresAt).getTime();
    const totalDuration = 24 * 60 * 60 * 1000;

    const update = () => {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
        setProgress(0);
        return;
      }

      setProgress(Math.max(0, (remaining / totalDuration) * 100));

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [trialExpiresAt]);

  if (expired) {
    return (
      <div className="pixo-card p-4 border-destructive/30 bg-destructive/5 animate-fade-in">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <Clock className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-sm text-destructive">Freemium Access Ended</p>
              <p className="text-xs text-muted-foreground">Upgrade to Premium to continue your learning journey!</p>
            </div>
          </div>
          <Button size="sm" variant="gradient" onClick={() => navigate('/pricing')}>
            Upgrade Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pixo-card p-4 border-primary/20 bg-primary/5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full gradient-bg">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              Freemium Access Active <span className="text-primary">✨</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Premium access expires in <span className="font-mono font-bold text-primary">{timeLeft}</span>
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
          Upgrade <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full gradient-bg transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
