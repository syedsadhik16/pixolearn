import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Volume2 } from 'lucide-react';

interface Props {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

const SHADOW_SHAPES = ['🔵', '🔶', '🟣', '🟢', '🔴', '⬟'];

export function ShadowMatchGame({ words, onComplete }: Props) {
  const items = words.slice(0, 4);
  const [shuffledRight, setShuffledRight] = useState<number[]>([]);
  const [connections, setConnections] = useState<Map<number, number>>(new Map());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [correct, setCorrect] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);

  useEffect(() => {
    const indices = items.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledRight(indices);

    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Shadow Match! Connect each word to its meaning.');
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }, []);

  const handleLeftClick = (idx: number) => {
    if (correct.has(idx)) return;
    setSelectedLeft(idx);
    setWrong(null);
  };

  const handleRightClick = (originalIdx: number) => {
    if (selectedLeft === null || correct.has(selectedLeft)) return;

    if (selectedLeft === originalIdx) {
      // Correct match
      const newCorrect = new Set(correct);
      newCorrect.add(selectedLeft);
      setCorrect(newCorrect);
      setSelectedLeft(null);

      if (newCorrect.size === items.length) {
        const score = Math.round((items.length / Math.max(items.length, connections.size + 1)) * 100);
        setTimeout(() => onComplete(Math.max(60, score)), 800);
      }
    } else {
      // Wrong
      setWrong(originalIdx);
      const newConns = new Map(connections);
      newConns.set(selectedLeft, originalIdx);
      setConnections(newConns);
      setTimeout(() => {
        setWrong(null);
        setSelectedLeft(null);
      }, 800);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🌗</span>
        <h3 className="font-display font-bold text-lg">Shadow Match</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Connect each word on the left to its meaning on the right!</p>
      <p className="text-sm font-semibold mb-4">{correct.size}/{items.length} matched</p>

      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        {/* Left column - words */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <button
              key={`l-${idx}`}
              onClick={() => handleLeftClick(idx)}
              className={`w-full p-3 rounded-xl border-2 text-sm font-bold text-center transition-all ${
                correct.has(idx)
                  ? 'bg-pixo-green/20 border-pixo-green/40 text-pixo-green'
                  : selectedLeft === idx
                  ? 'bg-primary/10 border-primary scale-105 shadow-md'
                  : 'bg-card border-border hover:border-primary/40'
              }`}
              disabled={correct.has(idx)}
            >
              {SHADOW_SHAPES[idx % SHADOW_SHAPES.length]} {item.word}
            </button>
          ))}
        </div>

        {/* Right column - meanings (shuffled) */}
        <div className="space-y-3">
          {shuffledRight.map((originalIdx, displayIdx) => (
            <button
              key={`r-${displayIdx}`}
              onClick={() => handleRightClick(originalIdx)}
              className={`w-full p-3 rounded-xl border-2 text-xs text-center transition-all ${
                correct.has(originalIdx)
                  ? 'bg-pixo-green/20 border-pixo-green/40 text-pixo-green'
                  : wrong === originalIdx
                  ? 'bg-destructive/10 border-destructive/40 animate-shake'
                  : selectedLeft !== null
                  ? 'bg-card border-border hover:border-primary/40 hover:scale-105 cursor-pointer'
                  : 'bg-card border-border opacity-70'
              }`}
              disabled={correct.has(originalIdx) || selectedLeft === null}
            >
              {items[originalIdx].meaning}
            </button>
          ))}
        </div>
      </div>

      {correct.size === items.length && (
        <div className="mt-4 text-center animate-scale-in">
          <CheckCircle2 className="h-8 w-8 text-pixo-green mx-auto mb-1" />
          <p className="text-sm font-bold text-pixo-green">All matched! ⭐</p>
        </div>
      )}
    </div>
  );
}
