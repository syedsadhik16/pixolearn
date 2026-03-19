import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Volume2 } from 'lucide-react';

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
  const locked = useRef(false);

  useEffect(() => {
    const deck: Card[] = [];
    pairs.forEach((w, i) => {
      deck.push({ id: i * 2, content: w.word, type: 'word', pairId: i, flipped: false, matched: false });
      deck.push({ id: i * 2 + 1, content: w.meaning, type: 'meaning', pairId: i, flipped: false, matched: false });
    });
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);

    // Speak instructions
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Memory Flip! Match each word with its meaning.');
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
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
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === a.pairId ? { ...c, matched: true } : c));
          setMatches(m => {
            const newM = m + 1;
            if (newM === pairs.length) {
              const score = Math.max(50, Math.round(100 - (attempts * 5)));
              setTimeout(() => onComplete(score), 800);
            }
            return newM;
          });
          setSelected([]);
          locked.current = false;
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]);
          locked.current = false;
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🧠</span>
        <h3 className="font-display font-bold text-lg">Memory Flip</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Match each word with its meaning!</p>
      <p className="text-sm font-semibold mb-4">
        {matches}/{pairs.length} matched · {attempts} attempts
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => flipCard(card.id)}
            className={`aspect-square rounded-xl border-2 p-2 text-center flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              card.matched
                ? 'bg-pixo-green/20 border-pixo-green/40 text-pixo-green scale-95'
                : card.flipped
                ? 'bg-primary/10 border-primary text-primary scale-105'
                : 'bg-muted border-border hover:border-primary/40 hover:scale-105 cursor-pointer'
            }`}
            disabled={card.matched || card.flipped}
          >
            {card.flipped || card.matched ? (
              <span className="break-words leading-tight">{card.content}</span>
            ) : (
              <Star className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
