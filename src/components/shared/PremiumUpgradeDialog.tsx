import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, Zap, Brain, Trophy, Heart, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PremiumUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Headline tailored to the trigger context (e.g. "Daily practice limit reached") */
  title?: string;
  /** Sub-headline describing why upgrading helps right now */
  description?: string;
  /** Optional source tag for analytics / tracking the trigger location */
  source?: string;
}

const PERKS: { icon: typeof Zap; text: string }[] = [
  { icon: Zap, text: 'Unlimited daily practice questions' },
  { icon: Brain, text: 'Full Knowledge Graph & weak-area insights' },
  { icon: Trophy, text: 'All 180 daily lessons unlocked' },
  { icon: Heart, text: 'Parent Mastery Hub with AI reports' },
];

/**
 * Premium upgrade modal used across student & parent flows.
 * Routes to the existing /pricing page where the Razorpay flow lives.
 */
export function PremiumUpgradeDialog({
  open,
  onOpenChange,
  title = 'Unlock Premium',
  description = "You've reached today's free limit. Go premium for unlimited learning.",
  source,
}: PremiumUpgradeDialogProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (source) sessionStorage.setItem('upgrade_source', source);
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 rounded-3xl">
        {/* Hero gradient header */}
        <div className="relative bg-gradient-to-br from-primary via-pixo-orange to-accent p-6 pb-12 text-primary-foreground">
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
              PIXO Premium
            </span>
          </div>

          <DialogTitle className="font-display font-extrabold text-2xl leading-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-primary-foreground/90 mt-1.5">
            {description}
          </DialogDescription>
        </div>

        {/* Perks list — overlapping card */}
        <div className="-mt-6 mx-4 bg-card rounded-2xl p-5 border border-border/40 shadow-pixo-md relative z-10">
          <ul className="space-y-3">
            {PERKS.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-sm text-foreground font-medium flex-1">
                    {perk.text}
                  </span>
                  <Check className="h-4 w-4 text-secondary shrink-0" />
                </li>
              );
            })}
          </ul>
        </div>

        {/* CTA & footer */}
        <div className="p-5 pt-4 space-y-2.5">
          <Button
            variant="gradient"
            size="lg"
            className="w-full rounded-full shadow-pixo-md font-display"
            onClick={handleUpgrade}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            See Premium Plans
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Maybe later
          </button>
          <p className="text-[10px] text-center text-muted-foreground pt-1">
            Plans from ₹4,999 • Cancel anytime • Secure Razorpay checkout
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
