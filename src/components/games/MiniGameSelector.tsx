import { useState, useEffect } from 'react';
import { SoundMatchingGame } from './SoundMatchingGame';
import { BalloonPoppingGame } from './BalloonPoppingGame';
import { PictureMatchingGame } from './PictureMatchingGame';
import { Button } from '@/components/ui/button';
import { Gamepad2, ArrowRight } from 'lucide-react';

interface MiniGameSelectorProps {
  words: { word: string; phonetic: string; meaning: string }[];
  onComplete: (score: number) => void;
  onSkip: () => void;
}

type GameType = 'sound' | 'balloon' | 'picture';

const GAME_META: Record<GameType, { name: string; emoji: string; desc: string }> = {
  sound: { name: 'Sound Matching', emoji: '🎵', desc: 'Match words with their sounds' },
  balloon: { name: 'Balloon Pop', emoji: '🎈', desc: 'Pop the right balloon!' },
  picture: { name: 'Picture Match', emoji: '🖼️', desc: 'Match words to pictures' },
};

export function MiniGameSelector({ words, onComplete, onSkip }: MiniGameSelectorProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Auto-select a random game if there are fewer than 4 words
  useEffect(() => {
    if (words.length < 4) {
      setSelectedGame('picture');
    }
  }, [words]);

  if (gameStarted && selectedGame) {
    switch (selectedGame) {
      case 'sound':
        return <SoundMatchingGame words={words} onComplete={onComplete} />;
      case 'balloon':
        return <BalloonPoppingGame words={words} onComplete={onComplete} />;
      case 'picture':
        return <PictureMatchingGame words={words} onComplete={onComplete} />;
    }
  }

  return (
    <div className="flex flex-col items-center p-6 animate-fade-in">
      <Gamepad2 className="h-10 w-10 text-primary mb-3" />
      <h3 className="font-display font-bold text-xl mb-1">Fun Activity Time! 🎮</h3>
      <p className="text-sm text-muted-foreground mb-6">Choose a game to play with today's words</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mb-6">
        {(Object.keys(GAME_META) as GameType[]).map((type) => {
          const meta = GAME_META[type];
          return (
            <button
              key={type}
              onClick={() => setSelectedGame(type)}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                selectedGame === type
                  ? 'border-primary bg-primary/10 scale-105 shadow-md'
                  : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              <span className="text-3xl block mb-2">{meta.emoji}</span>
              <p className="font-bold text-sm">{meta.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{meta.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={onSkip}>
          Skip Activity
        </Button>
        <Button
          variant="gradient"
          disabled={!selectedGame}
          onClick={() => setGameStarted(true)}
        >
          Let's Play! <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
