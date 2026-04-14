import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  delay: number;
  duration: number;
}

interface CelebrationOverlayProps {
  show: boolean;
  type: 'level_up' | 'badge';
  title: string;
  subtitle?: string;
  icon?: string;
  onComplete?: () => void;
}

const EMOJIS_LEVEL = ['🎉', '⭐', '🔥', '✨', '💫', '🚀', '🎊', '⚡'];
const EMOJIS_BADGE = ['🏆', '🎖️', '🥇', '🏅', '👑', '💎', '✨', '🌟'];

export function CelebrationOverlay({ show, type, title, subtitle, icon, onComplete }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const emojis = type === 'level_up' ? EMOJIS_LEVEL : EMOJIS_BADGE;
      const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: 16 + Math.random() * 24,
        delay: Math.random() * 0.8,
        duration: 1.5 + Math.random() * 2,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, type, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Backdrop with warm blur */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-md pointer-events-auto"
        style={{ animation: 'celebFadeIn 0.4s ease-out' }}
        onClick={() => { setVisible(false); onComplete?.(); }}
      />

      {/* Glow pulse behind badge */}
      <div
        className="absolute w-64 h-64 rounded-full opacity-30"
        style={{
          background: type === 'badge'
            ? 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)'
            : 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)',
          animation: 'celebGlow 2s ease-in-out infinite',
        }}
      />

      {/* Confetti particles */}
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animation: `celebParticle ${p.duration}s ease-out ${p.delay}s both`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Center card — Stitch style */}
      <div
        className="relative z-10 text-center pointer-events-auto"
        style={{ animation: 'celebBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className={cn(
          "px-10 py-8 rounded-3xl border-2 border-card max-w-xs mx-auto shadow-pixo-lg",
          type === 'level_up'
            ? "bg-gradient-to-br from-primary/95 to-accent/95 text-primary-foreground"
            : "bg-card text-foreground"
        )}>
          {/* Badge circle */}
          <div
            className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-4",
              type === 'badge'
                ? 'bg-gradient-to-b from-accent to-accent/70'
                : 'bg-gradient-to-b from-primary to-primary/70'
            )}
            style={{ animation: 'celebSpin 0.8s ease-out 0.3s both' }}
          >
            <span className="text-5xl">{icon || (type === 'level_up' ? '🚀' : '🏆')}</span>
          </div>

          <h2 className="text-xl font-display font-extrabold mb-1 tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
        </div>

        {/* XP floating badge */}
        <div
          className="absolute -top-5 -right-5 bg-secondary text-secondary-foreground w-16 h-16 rounded-full flex flex-col items-center justify-center font-display font-bold shadow-pixo-md border-2 border-card rotate-12"
          style={{ animation: 'celebBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both' }}
        >
          <span className="text-[10px]">XP</span>
          <span className="text-lg leading-none">+50</span>
        </div>
      </div>

      <style>{`
        @keyframes celebFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes celebBounceIn {
          0% { opacity: 0; transform: scale(0.3) translateY(40px); }
          60% { transform: scale(1.08) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes celebSpin {
          0% { transform: rotateY(0deg) scale(0.5); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        @keyframes celebParticle {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-140px) scale(0.2) rotate(240deg); }
        }
        @keyframes celebGlow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.3); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
