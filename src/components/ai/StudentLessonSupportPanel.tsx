import { useState } from 'react';
import { Sparkles, BookOpen, Lightbulb, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LessonSupportResponse, MiniPractice } from '@/lib/pixo-ai-types';

interface StudentLessonSupportPanelProps {
  studentId: string;
  currentDay: number;
  currentLevel: string;
  lessonPart?: number;
  className?: string;
}

export function StudentLessonSupportPanel({
  studentId,
  currentDay,
  currentLevel,
  lessonPart,
  className,
}: StudentLessonSupportPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [support, setSupport] = useState<LessonSupportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSupport = async (question?: string) => {
    setIsLoading(true);
    setError(null);

    // Phase 3 will connect to /api/pixo-ai/lesson-support
    setTimeout(() => {
      setSupport({
        success: true,
        title: "Today's Help 🌟",
        explanation: "This lesson is all about the sound 'sh'. When you see the letters S and H together, they make a special sound — like in 'ship', 'shoe', and 'shell'. Try saying 'shhhh' like you're telling someone to be quiet!",
        examples: ["🚢 ship", "👟 shoe", "🐚 shell", "🐑 sheep"],
        mini_practice: [
          { type: 'say_it', prompt: "Can you say 'shell' three times?", answer: 'shell' },
          { type: 'pick_one', prompt: "Which word starts with 'sh'?", options: ['cat', 'ship', 'dog'], answer: 'ship' },
        ],
        encouragement: "You're doing amazing! Every new sound you learn makes you a stronger reader! 🌟",
        next_step: "Try the Main Game to practise 'sh' words!",
        sources: [],
        metadata: {},
      });
      setIsLoading(false);
      setIsExpanded(true);
    }, 600);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`rounded-full border-primary/30 text-primary hover:bg-primary/10 ${className}`}
        onClick={() => fetchSupport()}
      >
        <Sparkles className="h-4 w-4 mr-1.5" />
        Need help? Ask PIXO
      </Button>
    );
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-card to-primary/5 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          {support?.title || "PIXO Help"}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-xs text-muted-foreground"
            onClick={() => setIsExpanded(false)}
          >
            Close
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            PIXO is thinking...
          </div>
        ) : support ? (
          <>
            {/* Explanation */}
            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-foreground leading-relaxed">{support.explanation}</p>
              </div>
            </div>

            {/* Examples */}
            {support.examples.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {support.examples.map((ex, i) => (
                    <span key={i} className="bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium border border-secondary/20">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mini Practice */}
            {support.mini_practice.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Quick Practice:</p>
                {support.mini_practice.map((mp, i) => (
                  <MiniPracticeCard key={i} practice={mp} />
                ))}
              </div>
            )}

            {/* Encouragement */}
            <div className="bg-accent/10 rounded-lg p-3 text-center">
              <p className="text-foreground font-medium">{support.encouragement}</p>
            </div>

            {/* Next Step */}
            <Button
              size="sm"
              className="w-full rounded-full"
              onClick={() => setIsExpanded(false)}
            >
              {support.next_step}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>

            {/* Ask more */}
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={() => fetchSupport("explain more")}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Explain differently
            </Button>
          </>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-destructive text-xs">{error}</p>
            <Button size="sm" variant="ghost" onClick={() => fetchSupport()} className="mt-2 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" /> Try Again
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MiniPracticeCard({ practice }: { practice: MiniPractice }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg p-2.5">
      <p className="text-foreground font-medium text-xs">{practice.prompt}</p>
      {practice.options && (
        <div className="flex gap-1.5 mt-1.5">
          {practice.options.map((opt, i) => (
            <button
              key={i}
              className="px-2.5 py-1 rounded-full bg-muted text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setRevealed(true)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {revealed && practice.answer && (
        <p className="text-xs text-secondary mt-1.5 font-medium">✅ {practice.answer}</p>
      )}
    </div>
  );
}
