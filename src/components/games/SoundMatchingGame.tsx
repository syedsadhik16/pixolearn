import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundMatchingGameProps {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

export function SoundMatchingGame({ words, onComplete }: SoundMatchingGameProps) {
  const [pairs, setPairs] = useState<{ id: number; text: string; type: 'word' | 'sound'; matched: boolean; selected: boolean; pairId: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [wrongPair, setWrongPair] = useState<number[]>([]);

  useEffect(() => {
    const gameWords = words.slice(0, Math.min(4, words.length));
    const items: typeof pairs = [];
    gameWords.forEach((w, i) => {
      items.push({ id: i * 2, text: w.word, type: 'word', matched: false, selected: false, pairId: i });
      items.push({ id: i * 2 + 1, text: w.phonetic || `/${w.word[0]}/`, type: 'sound', matched: false, selected: false, pairId: i });
    });
    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setPairs(items);
  }, [words]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  // Auto-speak instruction when game loads
  useEffect(() => {
    if (pairs.length > 0) {
      setTimeout(() => speak('Tap the letter that makes the matching sound! Match each word with its sound.'), 400);
    }
  }, [pairs.length > 0]);

  const handleSelect = (id: number) => {
    const item = pairs.find(p => p.id === id);
    if (!item || item.matched) return;

    if (selected === null) {
      setSelected(id);
      setPairs(prev => prev.map(p => p.id === id ? { ...p, selected: true } : p));
      speak(item.text);
    } else {
      const first = pairs.find(p => p.id === selected)!;
      setAttempts(a => a + 1);

      if (first.pairId === item.pairId && first.id !== item.id) {
        // Match!
        setPairs(prev => prev.map(p =>
          p.pairId === item.pairId ? { ...p, matched: true, selected: false } : { ...p, selected: false }
        ));
        const newMatches = matches + 1;
        setMatches(newMatches);
        speak(item.text);

        if (newMatches === Math.min(4, words.length)) {
          setShowSuccess(true);
          setTimeout(() => {
            const score = Math.max(60, Math.round(100 - (attempts * 5)));
            onComplete(score);
          }, 2000);
        }
      } else {
        // No match
        setWrongPair([selected, id]);
        setPairs(prev => prev.map(p => ({ ...p, selected: false })));
        setTimeout(() => setWrongPair([]), 600);
      }
      setSelected(null);
    }
  };

  const totalPairs = Math.min(4, words.length);

  return (
    <div className="flex flex-col items-center p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="h-5 w-5 text-pixo-purple" />
        <h3 className="font-display font-bold text-lg">Sound Matching 🎵</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Match each word with its sound!</p>

      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: totalPairs }).map((_, i) => (
          <Star key={i} className={cn("h-5 w-5 transition-all", i < matches ? "text-pixo-yellow fill-pixo-yellow scale-110" : "text-muted")} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {pairs.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            disabled={item.matched}
            className={cn(
              "p-4 rounded-2xl border-2 text-center font-semibold text-sm transition-all min-h-[56px]",
              item.matched && "bg-secondary/20 border-secondary text-secondary scale-95 opacity-70",
              item.selected && !item.matched && "bg-primary/15 border-primary scale-105 shadow-lg",
              wrongPair.includes(item.id) && "border-destructive/50 bg-destructive/5 animate-shake",
              !item.matched && !item.selected && !wrongPair.includes(item.id) && "bg-card border-border hover:border-primary/40 hover:shadow-md active:scale-95"
            )}
          >
            {item.matched ? '✅' : item.type === 'sound' ? `🔊 ${item.text}` : item.text}
          </button>
        ))}
      </div>

      {showSuccess && (
        <div className="mt-6 text-center animate-scale-in">
          <Sparkles className="h-8 w-8 text-pixo-yellow mx-auto mb-2" />
          <p className="font-display font-bold text-lg text-pixo-green">All Matched! 🎉</p>
          <p className="text-sm text-muted-foreground">Great listening skills!</p>
        </div>
      )}
    </div>
  );
}
