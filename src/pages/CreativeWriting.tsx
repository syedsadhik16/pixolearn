import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  PenLine, Sparkles, Loader2, RotateCcw, Send, BookOpen,
  MessageSquareText, Lightbulb, CheckCircle2, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WritingPrompt {
  id: string;
  title: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  icon: React.ElementType;
  wordTarget: number;
}

interface Feedback {
  score: number;
  grammar: string;
  vocabulary: string;
  creativity: string;
  suggestions: string[];
  correctedText: string;
}

const prompts: WritingPrompt[] = [
  { id: '1', title: 'My Best Day', prompt: 'Write about the best day you ever had. What happened? How did you feel?', difficulty: 'easy', category: 'Personal', icon: BookOpen, wordTarget: 50 },
  { id: '2', title: 'Dream Vacation', prompt: 'Describe your dream vacation. Where would you go? What would you do there?', difficulty: 'easy', category: 'Imagination', icon: Sparkles, wordTarget: 60 },
  { id: '3', title: 'A Letter to Future Me', prompt: 'Write a letter to yourself 10 years from now. What do you hope for?', difficulty: 'medium', category: 'Personal', icon: PenLine, wordTarget: 80 },
  { id: '4', title: 'The Mysterious Door', prompt: 'You find a mysterious door in your school that was never there before. What happens when you open it?', difficulty: 'medium', category: 'Story', icon: BookOpen, wordTarget: 100 },
  { id: '5', title: 'Technology & Life', prompt: 'How has technology changed the way we live? Give examples and share your opinion.', difficulty: 'hard', category: 'Opinion', icon: MessageSquareText, wordTarget: 120 },
  { id: '6', title: 'If I Were Invisible', prompt: 'If you could be invisible for one day, what would you do? Write a short story.', difficulty: 'easy', category: 'Story', icon: Sparkles, wordTarget: 70 },
  { id: '7', title: 'Climate Change', prompt: 'What can young people do to help protect the environment? Write a persuasive paragraph.', difficulty: 'hard', category: 'Opinion', icon: MessageSquareText, wordTarget: 100 },
  { id: '8', title: 'A New Invention', prompt: 'Invent something that would make life better. Describe what it does and how it works.', difficulty: 'medium', category: 'Imagination', icon: Lightbulb, wordTarget: 90 },
];

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function CreativeWriting() {
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);
  const [writingText, setWritingText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);

  const wordCount = writingText.trim().split(/\s+/).filter(Boolean).length;
  const categories = ['All', ...Array.from(new Set(prompts.map(p => p.category)))];
  const filtered = filterCategory === 'All' ? prompts : prompts.filter(p => p.category === filterCategory);

  const handleSubmit = async () => {
    if (!selectedPrompt || wordCount < 10) {
      toast({ title: 'Too short', description: 'Please write at least 10 words.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-practice', {
        body: {
          messages: [{ role: 'user', content: writingText }],
          systemPrompt: `You are an English writing tutor for language learners. The student was given this prompt: "${selectedPrompt.prompt}". 
Evaluate their writing and respond ONLY with valid JSON (no markdown, no code fences):
{
  "score": <number 0-100>,
  "grammar": "<1-2 sentence feedback on grammar>",
  "vocabulary": "<1-2 sentence feedback on vocabulary usage>",
  "creativity": "<1-2 sentence feedback on creativity and content>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "correctedText": "<the student's text with grammar corrections>"
}`,
          scenarioId: 'creative-writing',
        },
      });
      if (error) throw error;
      const parsed = JSON.parse(data.response);
      setFeedback(parsed);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not get feedback. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWriting = () => {
    setWritingText('');
    setFeedback(null);
  };

  const backToPrompts = () => {
    setSelectedPrompt(null);
    resetWriting();
  };

  if (authLoading) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  // Prompt selection screen
  if (!selectedPrompt) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 pb-24">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <PenLine className="h-6 w-6 text-primary" />
              Creative <span className="gradient-text">Writing</span>
            </h1>
            <p className="text-sm text-muted-foreground">Practice writing with AI-powered feedback</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {categories.map(cat => (
              <Button key={cat} variant={filterCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory(cat)} className="whitespace-nowrap shrink-0">{cat}</Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <Card key={p.id} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group" onClick={() => setSelectedPrompt(p)}>
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
            ))}
          </div>
        </div>
        <BottomNav />
      </Layout>
    );
  }

  // Writing & feedback screen
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        <Button variant="ghost" size="sm" onClick={backToPrompts} className="mb-4 -ml-2 text-muted-foreground">← Back to prompts</Button>

        <Card className="mb-4 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <selectedPrompt.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="font-bold text-sm">{selectedPrompt.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selectedPrompt.prompt}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={cn("text-[10px]", difficultyColors[selectedPrompt.difficulty])}>{selectedPrompt.difficulty}</Badge>
                  <Badge variant="outline" className="text-[10px]">🎯 {selectedPrompt.wordTarget} words</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="relative">
            <Textarea
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Start writing here..."
              rows={8}
              className="resize-none text-sm"
              disabled={isSubmitting}
            />
            <div className={cn(
              "absolute bottom-2 right-3 text-xs font-medium",
              wordCount >= selectedPrompt.wordTarget ? "text-green-600" : "text-muted-foreground"
            )}>
              {wordCount}/{selectedPrompt.wordTarget} words
              {wordCount >= selectedPrompt.wordTarget && <CheckCircle2 className="inline h-3 w-3 ml-1" />}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting || wordCount < 10} className="flex-1 gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? 'Getting feedback...' : 'Submit for Feedback'}
            </Button>
            <Button variant="outline" size="icon" onClick={resetWriting} disabled={isSubmitting}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {feedback && (
          <div className="mt-6 space-y-4 animate-slide-up">
            {/* Score */}
            <Card className={cn("border-2", feedback.score >= 70 ? "border-green-500/30" : feedback.score >= 40 ? "border-amber-500/30" : "border-red-500/30")}>
              <CardContent className="p-4 text-center">
                <div className={cn("text-4xl font-bold mb-1", feedback.score >= 70 ? "text-green-600" : feedback.score >= 40 ? "text-amber-600" : "text-red-600")}>
                  {feedback.score}/100
                </div>
                <p className="text-xs text-muted-foreground">Overall Score</p>
              </CardContent>
            </Card>

            {/* Detailed Feedback */}
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

            {/* Suggestions */}
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

            {/* Corrected Text */}
            {feedback.correctedText && (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-semibold text-green-700">✏️ Corrected Version</CardTitle></CardHeader>
                <CardContent className="p-3 pt-1"><p className="text-xs leading-relaxed">{feedback.correctedText}</p></CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </Layout>
  );
}
