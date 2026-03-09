import { Button } from '@/components/ui/button';
import { FeedbackDisplay, type Feedback } from './FeedbackDisplay';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionDetailProps {
  submission: {
    prompt_title: string;
    writing_text: string;
    score: number | null;
    xp_awarded: number;
    created_at: string;
    grammar_feedback: string | null;
    vocabulary_feedback: string | null;
    creativity_feedback: string | null;
    suggestions: unknown;
    corrected_text: string | null;
  };
  onBack: () => void;
}

export function SubmissionDetail({ submission, onBack }: SubmissionDetailProps) {
  const feedback: Feedback | null = submission.score !== null ? {
    score: submission.score,
    grammar: submission.grammar_feedback || '',
    vocabulary: submission.vocabulary_feedback || '',
    creativity: submission.creativity_feedback || '',
    suggestions: Array.isArray(submission.suggestions) ? submission.suggestions as string[] : [],
    correctedText: submission.corrected_text || '',
  } : null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Work
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">{submission.prompt_title}</h2>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(submission.created_at).toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Your Writing</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{submission.writing_text}</p>
        </CardContent>
      </Card>

      {feedback && <FeedbackDisplay feedback={feedback} xpAwarded={submission.xp_awarded} />}
    </div>
  );
}
