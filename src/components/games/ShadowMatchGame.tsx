import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Star, Sparkles, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

const SHAPE_COLORS = [
  'bg-[hsl(var(--pixo-blue))]/15 border-[hsl(var(--pixo-blue))]/30',
  'bg-[hsl(var(--pixo-orange))]/15 border-[hsl(var(--pixo-orange))]/30',
  'bg-[hsl(var(--pixo-green))]/15 border-[hsl(var(--pixo-green))]/30',
  'bg-[hsl(var(--pixo-purple))]/15 border-[hsl(var(--pixo-purple))]/30',
  'bg-[hsl(var(--pixo-red))]/15 border-[hsl(var(--pixo-red))]/30',
];

export function ShadowMatchGame({ words, onComplete }: Props) {
  const items = words.slice(0, Math.min(5, words.length));
  const [shuffledRight, setShuffledRight] = useState<number[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [correct, setCorrect] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }, []);

  useEffect(() => {
    const indices = items.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledRight(indices);
    setTimeout(() => speak('Connect each word to its meaning! Tap a word, then tap the meaning.'), 400);
  }, []);

  const handleLeftClick = (idx: number) => {
    if (correct.has(idx)) return;
    setSelectedLeft(idx);
    setWrong(null);
    speak(items[idx].word);
  };

  const handleRightClick = (originalIdx: number) => {
    if (selectedLeft === null || correct.has(selectedLeft)) return;
    setAttempts(a => a + 1);

    if (selectedLeft === originalIdx) {
      const newCorrect = new Set(correct);
      newCorrect.add(selectedLeft);
      setCorrect(newCorrect);
      setSelectedLeft(null);
      speak('Correct!');

      if (newCorrect.size === items.length) {
        setShowComplete(true);
        const sc = Math.max(60, Math.round(100 - ((attempts - items.length) * 8)));
        setTimeout(() => onComplete(sc), 2000);
      }
    } else {
      setWrong(originalIdx);
      setTimeout(() => {
        setWrong(null);
        setSelectedLeft(null);
      }, 800);
    }
  };

  if (showComplete) {
    const stars = attempts <= items.length + 1 ? 3 : attempts <= items.length * 2 ? 2 : 1;
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-scale-in">
        <Sparkles className="h-12 w-12 text-accent mb-3 animate-glow-pulse" />
        <h3 className="font-display font-bold text-xl text-secondary mb-1">All Connected! 🌗</h3>
        <p className="text-sm text-muted-foreground">Great matching skills!</p>
        <div className="flex gap-2 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-8 w-8 transition-all duration-500",
                i < stars ? "text-accent fill-accent animate-bounce-gentle" : "text-muted"
              )}
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🌗</span>
        <h3 className="font-display font-bold text-lg">Shadow Match</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Connect each word to its meaning!</p>

      {/* Progress stars */}
      <div className="flex items-center gap-1 mb-4">
        {items.map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-5 w-5 transition-all duration-300",
              correct.has(i) ? "text-accent fill-accent scale-110" : "text-muted"
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {/* Left column — words */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-wider">Words</p>
          {items.map((item, idx) => (
            <button
              key={`l-${idx}`}
              onClick={() => handleLeftClick(idx)}
              disabled={correct.has(idx)}
              className={cn(
                "w-full p-3.5 rounded-2xl border-2 text-sm font-bold text-center transition-all duration-300 tap-scale min-h-[48px]",
                correct.has(idx) && "bg-secondary/15 border-secondary/40 text-secondary scale-95",
                selectedLeft === idx && !correct.has(idx) && `scale-105 shadow-pixo-md ${SHAPE_COLORS[idx % SHAPE_COLORS.length]}`,
                !correct.has(idx) && selectedLeft !== idx && "bg-card border-border hover:border-primary/40"
              )}
            >
              {correct.has(idx) ? (
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> {item.word}
                </span>
              ) : (
                item.word
              )}
            </button>
          ))}
        </div>

        {/* Right column — meanings (shuffled) */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-wider">Meanings</p>
          {shuffledRight.map((originalIdx, displayIdx) => (
            <button
              key={`r-${displayIdx}`}
              onClick={() => handleRightClick(originalIdx)}
              disabled={correct.has(originalIdx) || selectedLeft === null}
              className={cn(
                "w-full p-3.5 rounded-2xl border-2 text-xs text-center transition-all duration-300 tap-scale min-h-[48px]",
                correct.has(originalIdx) && "bg-secondary/15 border-secondary/40 text-secondary scale-95",
                wrong === originalIdx && "bg-destructive/10 border-destructive/40 animate-shake",
                selectedLeft !== null && !correct.has(originalIdx) && wrong !== originalIdx && "bg-card border-border hover:border-primary/40 hover:scale-105 cursor-pointer",
                selectedLeft === null && !correct.has(originalIdx) && "bg-card border-border opacity-60"
              )}
            >
              {correct.has(originalIdx) ? (
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {items[originalIdx].meaning || items[originalIdx].phonetic}
                </span>
              ) : (
                items[originalIdx].meaning || items[originalIdx].phonetic || `Sound: /${items[originalIdx].word[0]}/`
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
