import { useState, useEffect } from 'react';
import { Volume2, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNamedVoices } from '@/hooks/useSpeechSettings';

interface SpeechControlsProps {
  rate: number;
  voiceURI: string | null;
  onRateChange: (rate: number) => void;
  onVoiceChange: (voiceURI: string | null) => void;
  compact?: boolean;
}

const RATES = [
  { value: 0.75, label: '0.75×' },
  { value: 1, label: '1×' },
  { value: 1.25, label: '1.25×' },
];

export function SpeechControls({ rate, voiceURI, onRateChange, onVoiceChange, compact }: SpeechControlsProps) {
  const [voices, setVoices] = useState<{ name: string; emoji: string; voiceURI: string | null }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = () => setVoices(getNamedVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const currentVoiceName = voices.find(v => v.voiceURI === voiceURI)?.name || 'Default';
  const currentEmoji = voices.find(v => v.voiceURI === voiceURI)?.emoji || '🔊';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs h-8 px-2"
        onClick={() => setOpen(!open)}
        title="Speech settings"
      >
        <Gauge className="h-3.5 w-3.5" />
        {RATES.find(r => r.value === rate)?.label || '1×'}
        <span className="hidden sm:inline">· {currentEmoji}</span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-56 animate-fade-in">
            {/* Speed */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Speed</p>
            <div className="flex gap-1 mb-3">
              {RATES.map(r => (
                <button
                  key={r.value}
                  onClick={() => onRateChange(r.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    rate === r.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Voice */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Voice</p>
            <div className="space-y-1">
              {voices.map(v => (
                <button
                  key={v.voiceURI ?? 'default'}
                  onClick={() => {
                    onVoiceChange(v.voiceURI);
                    // Preview
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance('Hello!');
                    u.rate = rate;
                    if (v.voiceURI) {
                      const found = window.speechSynthesis.getVoices().find(sv => sv.voiceURI === v.voiceURI);
                      if (found) u.voice = found;
                    }
                    window.speechSynthesis.speak(u);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    voiceURI === v.voiceURI
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span>{v.emoji}</span>
                  <span>{v.name}</span>
                  {voiceURI === v.voiceURI && <span className="ml-auto text-primary">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
