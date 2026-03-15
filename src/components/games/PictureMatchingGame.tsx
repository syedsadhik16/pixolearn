import { useState, useEffect } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PictureMatchingGameProps {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

// Emoji mappings for common phonics words
const WORD_EMOJIS: Record<string, string> = {
  apple: '🍎', ball: '🏀', cat: '🐱', dog: '🐕', egg: '🥚', fish: '🐟', goat: '🐐',
  hat: '🎩', ice: '🧊', jam: '🫙', kite: '🪁', lion: '🦁', moon: '🌙', nest: '🪺',
  orange: '🍊', pen: '🖊️', queen: '👑', rain: '🌧️', sun: '☀️', tree: '🌳',
  umbrella: '☂️', van: '🚐', water: '💧', box: '📦', yarn: '🧶', zoo: '🦓',
  star: '⭐', book: '📚', car: '🚗', door: '🚪', eye: '👁️', flower: '🌸',
  grass: '🌿', house: '🏠', key: '🔑', lamp: '💡', map: '🗺️', nose: '👃',
  pig: '🐷', ring: '💍', shoe: '👟', toy: '🧸', cup: '☕', duck: '🦆',
  cake: '🎂', bed: '🛏️', bus: '🚌', cow: '🐄', fan: '🌬️', hand: '✋',
  jet: '✈️', nut: '🥜', pot: '🍯', red: '🔴', six: '6️⃣', ten: '🔟',
  bug: '🐛', hen: '🐔', log: '🪵', mud: '🟤', run: '🏃', sit: '🪑',
  hop: '🐰', big: '🔵', hot: '🔥', wet: '💦', bat: '🦇', mat: '🟫',
};

const getEmoji = (word: string): string => {
  const lower = word.toLowerCase();
  return WORD_EMOJIS[lower] || '🔤';
};

export function PictureMatchingGame({ words, onComplete }: PictureMatchingGameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalRounds] = useState(Math.min(5, words.length));
  const [options, setOptions] = useState<{ word: string; emoji: string }[]>([]);
  const [targetWord, setTargetWord] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (round < totalRounds) setupRound();
    else {
      setShowComplete(true);
      setTimeout(() => onComplete(Math.round((score / totalRounds) * 100)), 2500);
    }
  }, [round]);

  const setupRound = () => {
    setSelected(null);
    setCorrect(null);
    const target = words[round];
    setTargetWord(target.word);

    const others = words
      .filter((_, i) => i !== round)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => ({ word: w.word, emoji: getEmoji(w.word) }));

    const allOptions = [...others, { word: target.word, emoji: getEmoji(target.word) }]
      .sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    setTimeout(() => speak(`Which picture shows: ${target.word}?`), 300);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const isCorrect = options[index].word === targetWord;
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 1);
      speak('Wonderful!');
    } else {
      speak(`Good try! That was ${options[index].word}. The answer is ${targetWord}.`);
    }
    setTimeout(() => setRound(r => r + 1), 2000);
  };

  if (showComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-scale-in">
        <Sparkles className="h-10 w-10 text-pixo-yellow mb-3" />
        <h3 className="font-display font-bold text-xl text-pixo-green mb-1">Picture Match Done! 🖼️</h3>
        <p className="text-sm text-muted-foreground">You got {score} out of {totalRounds} right!</p>
        <div className="flex gap-1 mt-3">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <span key={i} className={cn("text-2xl", i < score ? "animate-bounce-gentle" : "opacity-30")}>
              {i < score ? '⭐' : '☆'}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🖼️</span>
        <h3 className="font-display font-bold text-lg">Picture Match</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Round {round + 1} of {totalRounds}</p>

      <button
        onClick={() => speak(`Which picture shows: ${targetWord}?`)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5 hover:bg-primary/20 transition-colors"
      >
        <Volume2 className="h-4 w-4" />
        Find: <strong>{targetWord}</strong>
      </button>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {options.map((opt, i) => (
          <button
            key={`${round}-${i}`}
            onClick={() => handleSelect(i)}
            disabled={selected !== null}
            className={cn(
              "flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all min-h-[100px]",
              selected === i && correct && "bg-secondary/20 border-secondary scale-105 shadow-lg",
              selected === i && !correct && "bg-destructive/5 border-destructive/30 scale-95",
              selected !== null && selected !== i && options[i].word === targetWord && "bg-secondary/10 border-secondary/50",
              selected !== null && selected !== i && options[i].word !== targetWord && "opacity-40",
              selected === null && "bg-card border-border hover:border-primary/40 hover:shadow-md active:scale-95"
            )}
          >
            <span className="text-4xl mb-2">{opt.emoji}</span>
            {selected !== null && (
              <span className="text-xs font-medium text-muted-foreground">{opt.word}</span>
            )}
          </button>
        ))}
      </div>

      {selected !== null && correct && (
        <p className="text-sm font-medium text-pixo-green mt-4 animate-scale-in">
          Correct! Well done! 🌟
        </p>
      )}
      {selected !== null && !correct && (
        <p className="text-sm text-muted-foreground mt-4 animate-fade-in">
          Nice try! It was <strong className="text-foreground">{targetWord}</strong> {getEmoji(targetWord)} 💪
        </p>
      )}
    </div>
  );
}
