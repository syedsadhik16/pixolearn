import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Volume2 } from 'lucide-react';

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  label: string;
  category: 'male' | 'female' | 'other';
  accent: string;
}

interface VoicePickerProps {
  onVoiceChange: (voice: SpeechSynthesisVoice | null) => void;
  selectedVoiceURI?: string;
  compact?: boolean;
}

const categorizeVoice = (voice: SpeechSynthesisVoice): VoiceOption => {
  const name = voice.name.toLowerCase();
  const lang = voice.lang;

  let category: 'male' | 'female' | 'other' = 'other';
  if (name.includes('female') || name.includes('woman') || /\b(zira|hazel|susan|linda|samantha|karen|moira|fiona|alice|anna|helena)\b/.test(name)) {
    category = 'female';
  } else if (name.includes('male') || name.includes('man') || /\b(david|mark|james|daniel|george|alex|tom|rishi|aaron)\b/.test(name)) {
    category = 'male';
  }

  let accent = 'Standard';
  if (lang.startsWith('en-US')) accent = '🇺🇸 US';
  else if (lang.startsWith('en-GB')) accent = '🇬🇧 British';
  else if (lang.startsWith('en-AU')) accent = '🇦🇺 Australian';
  else if (lang.startsWith('en-IN')) accent = '🇮🇳 Indian';
  else if (lang.startsWith('en')) accent = '🌐 English';

  return { voice, label: voice.name.replace(/Microsoft |Google |Apple /, ''), category, accent };
};

export function VoicePicker({ onVoiceChange, selectedVoiceURI, compact = false }: VoicePickerProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const englishVoices = allVoices
        .filter(v => v.lang.startsWith('en'))
        .map(categorizeVoice)
        .sort((a, b) => a.label.localeCompare(b.label));
      setVoices(englishVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const previewVoice = (voiceURI: string) => {
    const voice = voices.find(v => v.voice.voiceURI === voiceURI)?.voice;
    if (!voice) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance('Hello! This is how I sound.');
    u.voice = voice;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const handleChange = (uri: string) => {
    if (uri === 'default') {
      onVoiceChange(null);
    } else {
      const found = voices.find(v => v.voice.voiceURI === uri);
      onVoiceChange(found?.voice ?? null);
    }
  };

  if (voices.length === 0) return null;

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      {!compact && <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Voice</label>}
      <div className="flex items-center gap-2">
        <Select value={selectedVoiceURI || 'default'} onValueChange={handleChange}>
          <SelectTrigger className={compact ? "w-[160px] h-8 text-xs" : "w-full"}>
            <SelectValue placeholder="Default voice" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="default">Default Voice</SelectItem>
            {voices.map((v) => (
              <SelectItem key={v.voice.voiceURI} value={v.voice.voiceURI}>
                <span className="flex items-center gap-1.5 text-xs">
                  <span>{v.category === 'female' ? '♀' : v.category === 'male' ? '♂' : '◉'}</span>
                  <span className="truncate max-w-[120px]">{v.label}</span>
                  <span className="text-muted-foreground">{v.accent}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={() => previewVoice(selectedVoiceURI || voices[0]?.voice.voiceURI || '')}
          title="Preview voice"
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
