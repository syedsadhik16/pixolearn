import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, BookOpen, Sparkles, Lightbulb, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Feedback {
  score: number;
  grammar: string;
  vocabulary: string;
  creativity: string;
  suggestions: string[];
  correctedText: string;
}

interface FeedbackDisplayProps {
  feedback: Feedback;
  xpAwarded?: number;
}

export function FeedbackDisplay({ feedback, xpAwarded }: FeedbackDisplayProps) {
  return (
    <div className="mt-6 space-y-4 animate-slide-up">
      <Card className={cn("border-2", feedback.score >= 70 ? "border-green-500/30" : feedback.score >= 40 ? "border-amber-500/30" : "border-red-500/30")}>
        <CardContent className="p-4 text-center">
          <div className={cn("text-4xl font-bold mb-1", feedback.score >= 70 ? "text-green-600" : feedback.score >= 40 ? "text-amber-600" : "text-red-600")}>
            {feedback.score}/100
          </div>
          <p className="text-xs text-muted-foreground">Overall Score</p>
          {xpAwarded !== undefined && xpAwarded > 0 && (
            <p className="text-xs font-semibold text-primary mt-1">+{xpAwarded} XP earned! ⚡</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />Grammar</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><p className="text-xs text-muted-foreground">{feedback.grammar}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-purple-500" />Vocabulary</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><p className="text-xs text-muted-foreground">{feedback.vocabulary}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-500" />Creativity</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><p className="text-xs text-muted-foreground">{feedback.creativity}</p></CardContent>
        </Card>
      </div>

      {feedback.suggestions?.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-amber-500" />Tips to Improve</CardTitle></CardHeader>
          <CardContent className="p-3 pt-1">
            <ul className="space-y-1.5">
              {feedback.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {feedback.correctedText && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-semibold text-green-700">✏️ Corrected Version</CardTitle></CardHeader>
          <CardContent className="p-3 pt-1"><p className="text-xs leading-relaxed">{feedback.correctedText}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
