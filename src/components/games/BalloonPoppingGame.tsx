import { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalloonPoppingGameProps {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

const BALLOON_STYLES = [
  { bg: 'from-[hsl(10,65%,55%)] to-[hsl(10,65%,42%)]', highlight: 'bg-white/30' },
  { bg: 'from-[hsl(195,85%,45%)] to-[hsl(195,85%,29%)]', highlight: 'bg-white/25' },
  { bg: 'from-[hsl(150,50%,50%)] to-[hsl(150,50%,36%)]', highlight: 'bg-white/25' },
  { bg: 'from-[hsl(48,87%,70%)] to-[hsl(48,87%,55%)]', highlight: 'bg-white/30' },
  { bg: 'from-[hsl(280,70%,65%)] to-[hsl(280,70%,50%)]', highlight: 'bg-white/25' },
  { bg: 'from-[hsl(25,80%,60%)] to-[hsl(25,80%,45%)]', highlight: 'bg-white/30' },
];

export function BalloonPoppingGame({ words, onComplete }: BalloonPoppingGameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalRounds] = useState(Math.min(5, words.length));
  const [options, setOptions] = useState<string[]>([]);
  const [targetWord, setTargetWord] = useState('');
  const [popped, setPopped] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [wobbling, setWobbling] = useState<number | null>(null);
  const [positions, setPositions] = useState<{ x: number; y: number; drift: number; delay: number }[]>([]);

  useEffect(() => {
    if (round < totalRounds) setupRound();
    else {
      setShowComplete(true);
      setTimeout(() => onComplete(Math.round((score / totalRounds) * 100)), 2500);
    }
  }, [round]);

  const setupRound = () => {
    setPopped(null);
    setCorrect(null);
    setWobbling(null);
    const target = words[round];
    setTargetWord(target.word);

    const others = words.filter((_, i) => i !== round).map(w => w.word);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...shuffled, target.word].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    setPositions(allOptions.map((_, i) => ({
      x: 5 + (i * 23) + Math.random() * 5,
      y: 10 + Math.random() * 30,
      drift: -3 + Math.random() * 6,
      delay: i * 0.3,
    })));

    setTimeout(() => speak(`Pop the balloon with: ${target.word}`), 300);
  };

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }, []);

  const handlePop = (index: number) => {
    if (popped !== null) return;
    const isCorrect = options[index] === targetWord;
    
    if (isCorrect) {
      setPopped(index);
      setCorrect(true);
      setScore(s => s + 1);
      speak('Pop! Great job!');
      setTimeout(() => setRound(r => r + 1), 1800);
    } else {
      // Wobble the wrong balloon, no penalty
      setWobbling(index);
      speak(`That says ${options[index]}. Try again!`);
      setTimeout(() => setWobbling(null), 800);
    }
  };

  if (showComplete) {
    const stars = score >= totalRounds ? 3 : score >= totalRounds * 0.6 ? 2 : 1;
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-scale-in">
        <Sparkles className="h-12 w-12 text-accent mb-3 animate-glow-pulse" />
        <h3 className="font-display font-bold text-xl text-secondary mb-1">Balloon Fun Complete! 🎈</h3>
        <p className="text-sm text-muted-foreground">You popped {score} out of {totalRounds}!</p>
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
        <span className="text-xl">🎈</span>
        <h3 className="font-display font-bold text-lg">Balloon Pop!</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Round {round + 1} of {totalRounds}</p>

      {/* Progress */}
      <div className="flex gap-1.5 mb-3">
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
        onClick={() => speak(`Pop the balloon with: ${targetWord}`)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 hover:bg-primary/20 transition-all active:scale-95 tap-scale"
      >
        <Volume2 className="h-4 w-4" />
        Pop: <strong className="text-base">{targetWord}</strong>
      </button>

      {/* Balloon field */}
      <div className="relative w-full h-72 overflow-hidden rounded-3xl bg-gradient-to-b from-[hsl(var(--pixo-sky))]/20 to-transparent">
        {options.map((word, i) => {
          const style = BALLOON_STYLES[i % BALLOON_STYLES.length];
          const isPopped = popped === i;
          const isWobbling = wobbling === i;

          return (
            <button
              key={`${round}-${i}`}
              onClick={() => handlePop(i)}
              disabled={popped !== null && popped === i}
              className={cn(
                "absolute flex flex-col items-center justify-center transition-all duration-500",
                isPopped && correct && "scale-0 opacity-0",
                isWobbling && "animate-shake",
                !isPopped && !isWobbling && "cursor-pointer hover:scale-110 active:scale-95"
              )}
              style={{
                left: `${positions[i]?.x || 20}%`,
                bottom: `${positions[i]?.y || 30}%`,
                animation: !isPopped ? `float ${3 + i * 0.5}s ease-in-out infinite` : undefined,
                animationDelay: `${positions[i]?.delay || 0}s`,
              }}
            >
              {/* Balloon body */}
              <div className={cn(
                "relative w-20 h-24 rounded-full bg-gradient-to-b flex items-center justify-center shadow-lg",
                style.bg
              )}>
                {/* Highlight/shine */}
                <div className={cn("absolute top-2 left-3 w-4 h-6 rounded-full rotate-[-20deg] opacity-60", style.highlight)} />
                {/* Word */}
                <span className="text-white font-bold text-xs text-center px-2 leading-tight drop-shadow-sm z-10">
                  {word}
                </span>
              </div>
              {/* Balloon knot */}
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[hsl(var(--muted-foreground))]/30" />
              {/* String */}
              <div className="w-px h-8 bg-muted-foreground/20" style={{
                transform: `rotate(${positions[i]?.drift || 0}deg)`
              }} />
            </button>
          );
        })}

        {/* Pop effect */}
        {popped !== null && correct && (
          <div
            className="absolute animate-scale-in"
            style={{
              left: `${(positions[popped]?.x || 20) + 5}%`,
              bottom: `${(positions[popped]?.y || 30) + 10}%`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl">💥</span>
              <span className="text-lg font-bold text-secondary animate-bounce-gentle">+1</span>
            </div>
          </div>
        )}
      </div>

      {popped !== null && correct && (
        <p className="text-sm font-bold text-secondary mt-3 animate-scale-in">
          POP! 🎉 You got it!
        </p>
      )}
    </div>
  );
}
