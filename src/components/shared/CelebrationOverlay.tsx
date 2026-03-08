import { useEffect, useState } from 'react';
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
      const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: 16 + Math.random() * 20,
        delay: Math.random() * 0.6,
        duration: 1.5 + Math.random() * 1.5,
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
        style={{ animation: 'celebFadeIn 0.3s ease-out' }}
        onClick={() => { setVisible(false); onComplete?.(); }}
      />

      {/* Particles */}
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

      {/* Center card */}
      <div
        className="relative z-10 text-center pointer-events-auto"
        style={{ animation: 'celebBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className={cn(
          "px-8 py-6 rounded-3xl border shadow-2xl max-w-xs mx-auto",
          type === 'level_up'
            ? "bg-gradient-to-br from-primary/90 to-accent/90 border-primary/40 text-primary-foreground"
            : "bg-gradient-to-br from-accent/90 to-secondary/90 border-accent/40 text-accent-foreground"
        )}>
          <span className="text-5xl block mb-3" style={{ animation: 'celebSpin 0.8s ease-out 0.3s both' }}>
            {icon || (type === 'level_up' ? '🚀' : '🏆')}
          </span>
          <h2 className="text-xl font-display font-bold mb-1">{title}</h2>
          {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
        </div>
      </div>

      <style>{`
        @keyframes celebFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes celebBounceIn {
          0% { opacity: 0; transform: scale(0.3) translateY(40px); }
          60% { transform: scale(1.1) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes celebSpin {
          0% { transform: rotateY(0deg) scale(0.5); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        @keyframes celebParticle {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(0.3) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}
