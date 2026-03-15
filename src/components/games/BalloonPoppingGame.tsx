import { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalloonPoppingGameProps {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
}

const BALLOON_COLORS = [
  'from-pixo-red to-pixo-orange',
  'from-pixo-blue to-pixo-purple',
  'from-pixo-green to-pixo-blue',
  'from-pixo-yellow to-pixo-orange',
  'from-pixo-purple to-pixo-red',
  'from-pixo-orange to-pixo-yellow',
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
  const [positions, setPositions] = useState<{ x: number; y: number; delay: number }[]>([]);

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
    const target = words[round];
    setTargetWord(target.word);

    // Pick 3 wrong options + 1 correct
    const others = words.filter((_, i) => i !== round).map(w => w.word);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...shuffled, target.word].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    // Random balloon positions
    setPositions(allOptions.map((_, i) => ({
      x: 10 + (i * 22) + Math.random() * 5,
      y: 60 + Math.random() * 20,
      delay: i * 0.2,
    })));

    // Speak the prompt
    setTimeout(() => speak(`Pop the balloon with the word: ${target.word}`), 300);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handlePop = (index: number) => {
    if (popped !== null) return;
    setPopped(index);
    const isCorrect = options[index] === targetWord;
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 1);
      speak('Great job!');
    } else {
      speak(`That was ${options[index]}. The correct answer is ${targetWord}.`);
    }
    setTimeout(() => setRound(r => r + 1), 1800);
  };

  if (showComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-scale-in">
        <Sparkles className="h-10 w-10 text-pixo-yellow mb-3" />
        <h3 className="font-display font-bold text-xl text-pixo-green mb-1">Balloon Fun Complete! 🎈</h3>
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
        <span className="text-xl">🎈</span>
        <h3 className="font-display font-bold text-lg">Balloon Pop!</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Round {round + 1} of {totalRounds}</p>

      <button
        onClick={() => speak(`Pop the balloon with the word: ${targetWord}`)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 hover:bg-primary/20 transition-colors"
      >
        <Volume2 className="h-4 w-4" />
        Find: <strong>{targetWord}</strong>
      </button>

      <div className="relative w-full h-64 overflow-hidden">
        {options.map((word, i) => (
          <button
            key={`${round}-${i}`}
            onClick={() => handlePop(i)}
            disabled={popped !== null}
            className={cn(
              "absolute flex items-center justify-center rounded-full w-20 h-24 text-white font-bold text-xs shadow-lg transition-all",
              `bg-gradient-to-b ${BALLOON_COLORS[i % BALLOON_COLORS.length]}`,
              popped === i && correct && "scale-150 opacity-0",
              popped === i && !correct && "scale-75 opacity-50",
              popped !== null && popped !== i && "opacity-40",
              popped === null && "hover:scale-110 active:scale-95 animate-float cursor-pointer"
            )}
            style={{
              left: `${positions[i]?.x || 20}%`,
              bottom: `${positions[i]?.y || 60}%`,
              animationDelay: `${positions[i]?.delay || 0}s`,
              transition: 'all 0.5s ease',
            }}
          >
            <span className="px-1 text-center leading-tight">{word}</span>
            {/* Balloon string */}
            <div className="absolute -bottom-3 w-0.5 h-6 bg-foreground/20" />
          </button>
        ))}

        {popped !== null && correct && (
          <div className="absolute inset-0 flex items-center justify-center animate-scale-in">
            <span className="text-4xl">🎉</span>
          </div>
        )}
      </div>

      {popped !== null && !correct && (
        <p className="text-sm text-muted-foreground mt-2 animate-fade-in">
          Nice try! The answer was <strong className="text-foreground">{targetWord}</strong> 💪
        </p>
      )}
    </div>
  );
}
