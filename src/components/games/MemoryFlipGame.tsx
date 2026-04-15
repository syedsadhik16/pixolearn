import { useState, useEffect, useRef } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

interface Card {
  id: number;
  content: string;
  type: 'word' | 'meaning';
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

export function MemoryFlipGame({ words, onComplete }: Props) {
  const pairs = words.slice(0, 4);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [recentMatch, setRecentMatch] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const locked = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const deck: Card[] = [];
    pairs.forEach((w, i) => {
      deck.push({ id: i * 2, content: w.word, type: 'word', pairId: i, flipped: false, matched: false });
      deck.push({ id: i * 2 + 1, content: w.meaning || w.phonetic || `/${w.word[0]}/`, type: 'meaning', pairId: i, flipped: false, matched: false });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);

    // Start timer
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

    // Brief peek at start
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, flipped: true })));
      setTimeout(() => {
        setCards(prev => prev.map(c => ({ ...c, flipped: false })));
      }, 1500);
    }, 300);

    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Memory Flip! Match each word with its meaning.');
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const flipCard = (id: number) => {
    if (locked.current) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      locked.current = true;
      setAttempts(a => a + 1);
      const [a, b] = newSelected.map(sid => newCards.find(c => c.id === sid)!);

      if (a.pairId === b.pairId) {
        // Match!
        setRecentMatch(a.pairId);
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === a.pairId ? { ...c, matched: true } : c));
          setMatches(m => {
            const newM = m + 1;
            if (newM === pairs.length) {
              if (timerRef.current) clearInterval(timerRef.current);
              setShowComplete(true);
              const timeBonus = Math.max(0, 30 - timer);
              const accuracyBonus = Math.max(0, 50 - (attempts * 5));
              const sc = Math.min(100, Math.max(50, 50 + accuracyBonus + timeBonus));
              setTimeout(() => onComplete(sc), 2500);
            }
            return newM;
          });
          setSelected([]);
          locked.current = false;
          setTimeout(() => setRecentMatch(null), 600);
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]);
          locked.current = false;
        }, 1200);
      }
    }
  };

  if (showComplete) {
    const stars = attempts <= pairs.length + 1 ? 3 : attempts <= pairs.length * 2 ? 2 : 1;
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-scale-in">
        <Sparkles className="h-12 w-12 text-accent mb-3 animate-glow-pulse" />
        <h3 className="font-display font-bold text-xl text-secondary mb-1">Memory Master! 🧠</h3>
        <p className="text-sm text-muted-foreground">{attempts} tries • {timer}s</p>
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
        <span className="text-2xl">🧠</span>
        <h3 className="font-display font-bold text-lg">Memory Flip</h3>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-xs text-muted-foreground">
          {matches}/{pairs.length} matched
        </p>
        <p className="text-xs font-mono bg-muted px-2 py-0.5 rounded-full">{timer}s</p>
        <p className="text-xs text-muted-foreground">{attempts} tries</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
        {cards.map(card => (
          <div
            key={card.id}
            className="perspective-500"
            style={{ perspective: '600px' }}
          >
            <button
              onClick={() => flipCard(card.id)}
              className={cn(
                "relative w-full aspect-square rounded-2xl transition-all duration-500 tap-scale",
                "transform-gpu",
                card.flipped || card.matched ? "[transform:rotateY(180deg)]" : ""
              )}
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              disabled={card.matched || card.flipped}
            >
              {/* Card front (face down) */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl border-2 flex items-center justify-center backface-hidden",
                  "bg-gradient-to-br from-primary/80 to-primary border-primary/60 shadow-pixo-md",
                  !card.flipped && !card.matched && "hover:scale-105 hover:shadow-pixo-lg cursor-pointer"
                )}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="text-3xl text-primary-foreground">✦</span>
              </div>

              {/* Card back (face up) */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl border-2 flex items-center justify-center p-2",
                  card.matched
                    ? "bg-secondary/10 border-secondary/40"
                    : "bg-card border-border shadow-pixo-md",
                  recentMatch === card.pairId && "animate-scale-in ring-2 ring-accent"
                )}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className={cn(
                  "text-sm font-bold text-center break-words leading-tight",
                  card.matched ? "text-secondary" : "text-foreground",
                  card.type === 'meaning' ? "text-xs" : "text-base"
                )}>
                  {card.content}
                </span>
              </div>
            </button>

            {/* Match confetti */}
            {card.matched && recentMatch === card.pairId && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-scale-in">
                <span className="text-lg">✨</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
