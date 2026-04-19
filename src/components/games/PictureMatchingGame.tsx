import { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PictureMatchingGameProps {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

// Rich SVG illustration data for common phonics words
const WORD_ILLUSTRATIONS: Record<string, { emoji: string; bgColor: string; illustration: string }> = {
  apple:     { emoji: '🍎', bgColor: 'bg-red-50',    illustration: '🍎' },
  ball:      { emoji: '🏀', bgColor: 'bg-orange-50', illustration: '🏀' },
  cat:       { emoji: '🐱', bgColor: 'bg-amber-50',  illustration: '🐱' },
  dog:       { emoji: '🐕', bgColor: 'bg-yellow-50', illustration: '🐕' },
  egg:       { emoji: '🥚', bgColor: 'bg-lime-50',   illustration: '🥚' },
  fish:      { emoji: '🐟', bgColor: 'bg-cyan-50',   illustration: '🐟' },
  goat:      { emoji: '🐐', bgColor: 'bg-green-50',  illustration: '🐐' },
  hat:       { emoji: '🎩', bgColor: 'bg-violet-50', illustration: '🎩' },
  ice:       { emoji: '🧊', bgColor: 'bg-sky-50',    illustration: '🧊' },
  jam:       { emoji: '🫙', bgColor: 'bg-rose-50',   illustration: '🫙' },
  kite:      { emoji: '🪁', bgColor: 'bg-blue-50',   illustration: '🪁' },
  lion:      { emoji: '🦁', bgColor: 'bg-amber-50',  illustration: '🦁' },
  moon:      { emoji: '🌙', bgColor: 'bg-indigo-50', illustration: '🌙' },
  nest:      { emoji: '🪺', bgColor: 'bg-emerald-50',illustration: '🪺' },
  orange:    { emoji: '🍊', bgColor: 'bg-orange-50', illustration: '🍊' },
  pen:       { emoji: '🖊️', bgColor: 'bg-slate-50',  illustration: '🖊️' },
  queen:     { emoji: '👑', bgColor: 'bg-yellow-50', illustration: '👑' },
  rain:      { emoji: '🌧️', bgColor: 'bg-blue-50',   illustration: '🌧️' },
  sun:       { emoji: '☀️', bgColor: 'bg-amber-50',  illustration: '☀️' },
  tree:      { emoji: '🌳', bgColor: 'bg-green-50',  illustration: '🌳' },
  umbrella:  { emoji: '☂️', bgColor: 'bg-purple-50', illustration: '☂️' },
  van:       { emoji: '🚐', bgColor: 'bg-teal-50',   illustration: '🚐' },
  water:     { emoji: '💧', bgColor: 'bg-cyan-50',   illustration: '💧' },
  box:       { emoji: '📦', bgColor: 'bg-amber-50',  illustration: '📦' },
  yarn:      { emoji: '🧶', bgColor: 'bg-pink-50',   illustration: '🧶' },
  zoo:       { emoji: '🦓', bgColor: 'bg-emerald-50',illustration: '🦓' },
  star:      { emoji: '⭐', bgColor: 'bg-yellow-50', illustration: '⭐' },
  book:      { emoji: '📚', bgColor: 'bg-blue-50',   illustration: '📚' },
  car:       { emoji: '🚗', bgColor: 'bg-red-50',    illustration: '🚗' },
  door:      { emoji: '🚪', bgColor: 'bg-amber-50',  illustration: '🚪' },
  eye:       { emoji: '👁️', bgColor: 'bg-sky-50',    illustration: '👁️' },
  flower:    { emoji: '🌸', bgColor: 'bg-pink-50',   illustration: '🌸' },
  grass:     { emoji: '🌿', bgColor: 'bg-green-50',  illustration: '🌿' },
  house:     { emoji: '🏠', bgColor: 'bg-orange-50', illustration: '🏠' },
  key:       { emoji: '🔑', bgColor: 'bg-yellow-50', illustration: '🔑' },
  lamp:      { emoji: '💡', bgColor: 'bg-amber-50',  illustration: '💡' },
  map:       { emoji: '🗺️', bgColor: 'bg-emerald-50',illustration: '🗺️' },
  nose:      { emoji: '👃', bgColor: 'bg-rose-50',   illustration: '👃' },
  pig:       { emoji: '🐷', bgColor: 'bg-pink-50',   illustration: '🐷' },
  ring:      { emoji: '💍', bgColor: 'bg-violet-50', illustration: '💍' },
  shoe:      { emoji: '👟', bgColor: 'bg-blue-50',   illustration: '👟' },
  toy:       { emoji: '🧸', bgColor: 'bg-amber-50',  illustration: '🧸' },
  cup:       { emoji: '☕', bgColor: 'bg-orange-50', illustration: '☕' },
  duck:      { emoji: '🦆', bgColor: 'bg-yellow-50', illustration: '🦆' },
  cake:      { emoji: '🎂', bgColor: 'bg-pink-50',   illustration: '🎂' },
  bed:       { emoji: '🛏️', bgColor: 'bg-indigo-50', illustration: '🛏️' },
  bus:       { emoji: '🚌', bgColor: 'bg-yellow-50', illustration: '🚌' },
  cow:       { emoji: '🐄', bgColor: 'bg-emerald-50',illustration: '🐄' },
  fan:       { emoji: '🌬️', bgColor: 'bg-sky-50',    illustration: '🌬️' },
  hand:      { emoji: '✋', bgColor: 'bg-amber-50',  illustration: '✋' },
  jet:       { emoji: '✈️', bgColor: 'bg-blue-50',   illustration: '✈️' },
  nut:       { emoji: '🥜', bgColor: 'bg-amber-50',  illustration: '🥜' },
  pot:       { emoji: '🍯', bgColor: 'bg-yellow-50', illustration: '🍯' },
  red:       { emoji: '🔴', bgColor: 'bg-red-50',    illustration: '🔴' },
  bug:       { emoji: '🐛', bgColor: 'bg-lime-50',   illustration: '🐛' },
  hen:       { emoji: '🐔', bgColor: 'bg-orange-50', illustration: '🐔' },
  log:       { emoji: '🪵', bgColor: 'bg-amber-50',  illustration: '🪵' },
  run:       { emoji: '🏃', bgColor: 'bg-green-50',  illustration: '🏃' },
  sit:       { emoji: '🪑', bgColor: 'bg-amber-50',  illustration: '🪑' },
  hop:       { emoji: '🐰', bgColor: 'bg-pink-50',   illustration: '🐰' },
  hot:       { emoji: '🔥', bgColor: 'bg-red-50',    illustration: '🔥' },
  wet:       { emoji: '💦', bgColor: 'bg-blue-50',   illustration: '💦' },
  bat:       { emoji: '🦇', bgColor: 'bg-violet-50', illustration: '🦇' },
  mat:       { emoji: '🟫', bgColor: 'bg-amber-50',  illustration: '🟫' },
  ant:       { emoji: '🐜', bgColor: 'bg-red-50',    illustration: '🐜' },
  axe:       { emoji: '🪓', bgColor: 'bg-slate-50',  illustration: '🪓' },
  ink:       { emoji: '🖋️', bgColor: 'bg-indigo-50', illustration: '🖋️' },
  owl:       { emoji: '🦉', bgColor: 'bg-amber-50',  illustration: '🦉' },
};

const FALLBACK_COLORS = ['bg-blue-50', 'bg-pink-50', 'bg-green-50', 'bg-amber-50', 'bg-violet-50', 'bg-cyan-50'];

const getIllustration = (word: string) => {
  const lower = word.toLowerCase();
  if (WORD_ILLUSTRATIONS[lower]) return WORD_ILLUSTRATIONS[lower];
  // Generate a consistent fallback with the first letter
  const colorIdx = lower.charCodeAt(0) % FALLBACK_COLORS.length;
  return {
    emoji: lower.charAt(0).toUpperCase(),
    bgColor: FALLBACK_COLORS[colorIdx],
    illustration: lower.charAt(0).toUpperCase(),
  };
};

export function PictureMatchingGame({ words, onComplete }: PictureMatchingGameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalRounds] = useState(Math.min(5, words.length));
  const [options, setOptions] = useState<{ word: string; illust: ReturnType<typeof getIllustration> }[]>([]);
  const [targetWord, setTargetWord] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
    setShowConfetti(false);
    const target = words[round];
    setTargetWord(target.word);

    const others = words
      .filter((_, i) => i !== round)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => ({ word: w.word, illust: getIllustration(w.word) }));

    const allOptions = [...others, { word: target.word, illust: getIllustration(target.word) }]
      .sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    setTimeout(() => speak(`Which picture shows: ${target.word}?`), 300);
  };

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }, []);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const isCorrect = options[index].word === targetWord;
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 1);
      setShowConfetti(true);
      speak('Wonderful!');
    } else {
      speak(`Good try! That was ${options[index].word}. The answer is ${targetWord}.`);
    }
    setTimeout(() => setRound(r => r + 1), 2200);
  };

  if (showComplete) {
    const stars = score >= totalRounds ? 3 : score >= totalRounds * 0.6 ? 2 : 1;
    return (
      <div className="flex flex-col items-center justify-center p-6 animate-scale-in">
        <div className="relative w-full max-w-sm bg-gradient-to-br from-card via-card to-pixo-cream rounded-3xl p-8 border-2 border-accent/30 shadow-pixo-xl text-center overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pixo-orange/30 rounded-full blur-3xl" />

          {/* Trophy badge */}
          <div className="relative mb-4 inline-block">
            <div className="absolute inset-0 bg-accent/40 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-accent via-pixo-yellow to-pixo-orange flex items-center justify-center shadow-pixo-lg border-4 border-card animate-bounce-gentle">
              <Sparkles className="h-12 w-12 text-accent-foreground" />
            </div>
            <Star className="absolute -top-1 -right-1 h-6 w-6 text-pixo-pink fill-pixo-pink animate-pulse" />
          </div>

          <h3 className="font-display font-extrabold text-2xl gradient-text mb-2 relative">Picture Match Done! 🖼️</h3>
          <p className="text-sm text-muted-foreground mb-4 relative">
            You got <span className="font-bold text-secondary">{score}</span> out of <span className="font-bold text-secondary">{totalRounds}</span> right!
          </p>

          <div className="flex justify-center gap-3 mb-4 relative">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-10 w-10 transition-all duration-500 drop-shadow-sm",
                  i < stars ? "text-accent fill-accent animate-bounce-gentle" : "text-muted"
                )}
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 relative">
            <span className="text-base">🎉</span>
            <span className="text-xs font-bold text-secondary">Loading next adventure...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🖼️</span>
        <h3 className="font-display font-bold text-lg">Picture Match</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Round {round + 1} of {totalRounds}</p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              i < round ? "bg-secondary" : i === round ? "bg-primary scale-125" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Audio prompt */}
      <button
        onClick={() => speak(`Which picture shows: ${targetWord}?`)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5 hover:bg-primary/20 transition-all active:scale-95 tap-scale"
      >
        <Volume2 className="h-4 w-4" />
        Find: <strong className="text-base">{targetWord}</strong>
      </button>

      {/* Picture grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOption = opt.word === targetWord;
          const isWrong = isSelected && !correct;
          const showAsCorrect = selected !== null && isCorrectOption;

          return (
            <button
              key={`${round}-${i}`}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-3xl border-3 transition-all duration-300 min-h-[120px] p-4 tap-scale",
                isSelected && correct && "border-secondary bg-secondary/10 scale-105 shadow-pixo-lg",
                isWrong && "border-destructive/40 bg-destructive/5 scale-95",
                showAsCorrect && !isSelected && "border-secondary/60 bg-secondary/5",
                selected !== null && !isCorrectOption && !isSelected && "opacity-30",
                selected === null && `${opt.illust.bgColor} border-border/60 hover:border-primary/40 hover:shadow-pixo-md hover:scale-105 active:scale-95`
              )}
            >
              {/* Large illustration */}
              <span className="text-5xl mb-2 transition-transform duration-300" style={{
                transform: isSelected && correct ? 'scale(1.2)' : undefined
              }}>
                {opt.illust.illustration}
              </span>
              
              {/* Word label (shown after selection) */}
              {selected !== null && (
                <span className={cn(
                  "text-xs font-bold mt-1 animate-fade-in",
                  isCorrectOption ? "text-secondary" : "text-muted-foreground"
                )}>
                  {opt.word}
                </span>
              )}

              {/* Correct checkmark */}
              {showAsCorrect && (
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center animate-scale-in shadow-pixo-sm">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confetti burst on correct */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-fall"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: '-5%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`,
                fontSize: `${14 + Math.random() * 10}px`,
              }}
            >
              {['⭐', '🎉', '✨', '🌟', '💫'][i % 5]}
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {selected !== null && correct && (
        <p className="text-sm font-bold text-secondary mt-4 animate-scale-in">
          Correct! Well done! 🌟
        </p>
      )}
      {selected !== null && !correct && (
        <p className="text-sm text-muted-foreground mt-4 animate-fade-in">
          Nice try! It was <strong className="text-foreground">{targetWord}</strong> {getIllustration(targetWord).emoji} 💪
        </p>
      )}
    </div>
  );
}
