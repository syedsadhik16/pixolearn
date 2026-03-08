import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface WritingPrompt {
  id: string;
  title: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  icon: React.ElementType;
  wordTarget: number;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-600 border-red-500/20',
};

interface PromptCardProps {
  prompt: WritingPrompt;
  onClick: () => void;
}

export function PromptCard({ prompt: p, onClick }: PromptCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <p.icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{p.title}</h3>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", difficultyColors[p.difficulty])}>{p.difficulty}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{p.prompt}</p>
            <p className="text-[10px] text-muted-foreground mt-1">🎯 Target: {p.wordTarget} words</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { difficultyColors };
