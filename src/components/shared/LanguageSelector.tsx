import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LANGUAGE_KEY = 'pixo-app-language';
const FIRST_LAUNCH_KEY = 'pixo-language-selected';

export interface AppLanguage {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

export function getSelectedLanguage(): string {
  return localStorage.getItem(LANGUAGE_KEY) || 'en';
}

export function setSelectedLanguage(code: string) {
  localStorage.setItem(LANGUAGE_KEY, code);
  localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
}

export function hasSelectedLanguage(): boolean {
  return localStorage.getItem(FIRST_LAUNCH_KEY) === 'true';
}

/**
 * First-launch language overlay. Shows only once on first app open.
 * After selection, never interrupts the flow again.
 * Language can be changed only inside Settings.
 */
export function LanguageOverlay() {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState('en');

  useEffect(() => {
    if (!hasSelectedLanguage()) {
      setShow(true);
    }
  }, []);

  const handleConfirm = () => {
    setSelectedLanguage(selected);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Choose Your Language</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You can change this anytime in Settings
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                selected === lang.code
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40 bg-card'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-semibold">{lang.label}</span>
            </button>
          ))}
        </div>

        <Button variant="gradient" size="lg" className="w-full" onClick={handleConfirm}>
          Continue
        </Button>
      </div>
    </div>
  );
}
