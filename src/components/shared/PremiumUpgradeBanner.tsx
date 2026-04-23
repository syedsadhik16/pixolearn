import { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumUpgradeDialog } from './PremiumUpgradeDialog';

interface PremiumUpgradeBannerProps {
  /** Compact one-line banner. Defaults to a benefit-focused line. */
  message?: string;
  /** Headline shown inside the modal when CTA is clicked */
  modalTitle?: string;
  /** Sub-headline shown inside the modal */
  modalDescription?: string;
  /** Source tag stored in sessionStorage for analytics on /pricing */
  source?: string;
  /** Visual variant — full card or thin inline strip */
  variant?: 'card' | 'strip';
}

/**
 * Inline premium-upgrade prompt used inside locked features
 * (e.g. Knowledge Graph weeks 3+, Analyse focus areas, Practice limit).
 */
export function PremiumUpgradeBanner({
  message = 'Unlock unlimited practice and the full curriculum with Premium.',
  modalTitle,
  modalDescription,
  source,
  variant = 'card',
}: PremiumUpgradeBannerProps) {
  const [open, setOpen] = useState(false);

  if (variant === 'strip') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/10 via-pixo-orange/10 to-accent/15 border border-primary/20 hover:from-primary/15 hover:to-accent/20 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground flex-1">{message}</span>
          <span className="text-xs font-bold text-primary shrink-0">Upgrade →</span>
        </button>
        <PremiumUpgradeDialog
          open={open}
          onOpenChange={setOpen}
          title={modalTitle}
          description={modalDescription}
          source={source}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-3xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/10 shadow-pixo-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-display font-bold text-foreground mb-1">
          Premium Feature
        </p>
        <p className="text-xs text-muted-foreground mb-3 max-w-xs mx-auto">{message}</p>
        <Button
          size="sm"
          variant="gradient"
          className="rounded-full"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Go Premium
        </Button>
      </div>
      <PremiumUpgradeDialog
        open={open}
        onOpenChange={setOpen}
        title={modalTitle}
        description={modalDescription}
        source={source}
      />
    </>
  );
}
