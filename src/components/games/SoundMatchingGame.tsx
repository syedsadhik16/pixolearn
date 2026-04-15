import { useState, useEffect, useCallback } from 'react';
import { Volume2, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundMatchingGameProps {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

export function SoundMatchingGame({ words, onComplete }: SoundMatchingGameProps) {
  const gameWords = words.slice(0, Math.min(5, words.length));
  const [leftItems] = useState(() => gameWords.map((w, i) => ({ id: i, text: w.word, matched: false })));
  const [rightItems] = useState(() => {
    const items = gameWords.map((w, i) => ({
      id: i,
      text: w.phonetic || `/${w.word[0]}/`,
      matched: false,
    }));
    // Shuffle right side
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  });

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [connections, setConnections] = useState<{ from: number; to: number; correct: boolean }[]>([]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => speak('Match each word with its sound! Tap a word, then tap its matching sound.'), 400);
  }, []);

  const tryMatch = useCallback((leftId: number, rightId: number) => {
    setAttempts(a => a + 1);

    if (leftId === rightId) {
      // Correct match!
      const newMatched = new Set(matchedPairs);
      newMatched.add(leftId);
      setMatchedPairs(newMatched);
      setConnections(prev => [...prev, { from: leftId, to: rightId, correct: true }]);
      speak('Great match!');

      if (newMatched.size === gameWords.length) {
        setShowComplete(true);
        const sc = Math.max(60, Math.round(100 - ((attempts - gameWords.length) * 8)));
        setTimeout(() => onComplete(sc), 2000);
      }
    } else {
      // Wrong
      setWrongFlash({ left: leftId, right: rightId });
      setConnections(prev => [...prev, { from: leftId, to: rightId, correct: false }]);
      setTimeout(() => {
        setWrongFlash(null);
        setConnections(prev => prev.filter(c => c.correct));
      }, 700);
    }

    setSelectedLeft(null);
    setSelectedRight(null);
  }, [matchedPairs, attempts, gameWords.length, speak, onComplete]);

  const handleLeftClick = (id: number) => {
    if (matchedPairs.has(id)) return;
    speak(leftItems[id].text);
    setSelectedLeft(id);
    if (selectedRight !== null) {
      tryMatch(id, rightItems.find(r => r === rightItems[selectedRight])?.id ?? -1);
    }
  };

  const handleRightClick = (item: typeof rightItems[0], displayIndex: number) => {
    if (matchedPairs.has(item.id)) return;
    speak(item.text);
    if (selectedLeft !== null) {
      tryMatch(selectedLeft, item.id);
    } else {
      setSelectedRight(displayIndex);
    }
  };

  if (showComplete) {
    const stars = attempts <= gameWords.length + 1 ? 3 : attempts <= gameWords.length * 2 ? 2 : 1;
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-scale-in">
        <Sparkles className="h-12 w-12 text-accent mb-3 animate-glow-pulse" />
        <h3 className="font-display font-bold text-xl text-secondary mb-1">All Matched! 🎵</h3>
        <p className="text-sm text-muted-foreground">Great listening skills!</p>
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
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Sound Matching 🎵</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-1">Tap a word, then tap its matching sound!</p>

      {/* Star progress */}
      <div className="flex items-center gap-1 mb-4">
        {gameWords.map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-5 w-5 transition-all duration-300",
              matchedPairs.has(i) ? "text-accent fill-accent scale-110" : "text-muted"
            )}
          />
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {/* Left — Words */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-wider">Words</p>
          {leftItems.map((item) => (
            <button
              key={`l-${item.id}`}
              onClick={() => handleLeftClick(item.id)}
              disabled={matchedPairs.has(item.id)}
              className={cn(
                "w-full p-3.5 rounded-2xl border-2 text-sm font-bold text-center transition-all duration-300 tap-scale min-h-[48px]",
                matchedPairs.has(item.id) && "bg-secondary/15 border-secondary/40 text-secondary scale-95",
                selectedLeft === item.id && !matchedPairs.has(item.id) && "bg-primary/10 border-primary scale-105 shadow-pixo-md",
                wrongFlash?.left === item.id && "border-destructive/50 bg-destructive/5 animate-shake",
                !matchedPairs.has(item.id) && selectedLeft !== item.id && !wrongFlash && "bg-card border-border hover:border-primary/40 hover:shadow-pixo-sm active:scale-95"
              )}
            >
              {matchedPairs.has(item.id) ? '✅' : item.text}
            </button>
          ))}
        </div>

        {/* Right — Sounds */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-wider">Sounds</p>
          {rightItems.map((item, displayIdx) => (
            <button
              key={`r-${displayIdx}`}
              onClick={() => handleRightClick(item, displayIdx)}
              disabled={matchedPairs.has(item.id)}
              className={cn(
                "w-full p-3.5 rounded-2xl border-2 text-sm font-semibold text-center transition-all duration-300 tap-scale min-h-[48px]",
                matchedPairs.has(item.id) && "bg-secondary/15 border-secondary/40 text-secondary scale-95",
                selectedRight === displayIdx && !matchedPairs.has(item.id) && "bg-primary/10 border-primary scale-105 shadow-pixo-md",
                wrongFlash && rightItems[wrongFlash.right] === item && "border-destructive/50 bg-destructive/5 animate-shake",
                !matchedPairs.has(item.id) && selectedRight !== displayIdx && "bg-card border-border hover:border-primary/40 hover:shadow-pixo-sm active:scale-95"
              )}
            >
              {matchedPairs.has(item.id) ? '✅' : `🔊 ${item.text}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
