import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { awardXP } from '@/lib/gamification';
import {
  PenLine, Sparkles, Loader2, RotateCcw, Send, BookOpen,
  MessageSquareText, Lightbulb, CheckCircle2, Clock, History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PromptCard, difficultyColors, type WritingPrompt } from '@/components/creative-writing/PromptCard';
import { FeedbackDisplay, type Feedback } from '@/components/creative-writing/FeedbackDisplay';
import { SubmissionDetail } from '@/components/creative-writing/SubmissionDetail';

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

interface PastSubmission {
  id: string;
  prompt_title: string;
  score: number | null;
  xp_awarded: number;
  created_at: string;
  writing_text: string;
  grammar_feedback: string | null;
  vocabulary_feedback: string | null;
  creativity_feedback: string | null;
  suggestions: unknown;
  corrected_text: string | null;
}

function calculateXP(score: number): number {
  if (score >= 90) return 30;
  if (score >= 70) return 20;
  if (score >= 50) return 15;
  if (score >= 30) return 10;
  return 5;
}

export default function CreativeWriting() {
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);
  const [writingText, setWritingText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [pastSubmissions, setPastSubmissions] = useState<PastSubmission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<PastSubmission | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadPastSubmissions();
  }, [user]);

  const loadPastSubmissions = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('writing_submissions')
      .select('id, prompt_title, score, xp_awarded, created_at, writing_text, grammar_feedback, vocabulary_feedback, creativity_feedback, suggestions, corrected_text')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setPastSubmissions((data as PastSubmission[]) || []);
    setLoadingHistory(false);
  };

  const wordCount = writingText.trim().split(/\s+/).filter(Boolean).length;
  const categories = ['All', ...Array.from(new Set(prompts.map(p => p.category)))];
  const filtered = filterCategory === 'All' ? prompts : prompts.filter(p => p.category === filterCategory);

  const handleSubmit = async () => {
    if (!selectedPrompt || wordCount < 10 || !user) {
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
      const parsed: Feedback = JSON.parse(data.response);
      setFeedback(parsed);

      // Calculate and award XP
      const xp = calculateXP(parsed.score);
      setXpAwarded(xp);
      await awardXP(user.id, xp, 'creative_writing', selectedPrompt.id);

      // Save submission to database
      await supabase.from('writing_submissions').insert({
        student_id: user.id,
        prompt_id: selectedPrompt.id,
        prompt_title: selectedPrompt.title,
        writing_text: writingText,
        score: parsed.score,
        grammar_feedback: parsed.grammar,
        vocabulary_feedback: parsed.vocabulary,
        creativity_feedback: parsed.creativity,
        suggestions: parsed.suggestions,
        corrected_text: parsed.correctedText,
        xp_awarded: xp,
      });

      // Refresh history
      loadPastSubmissions();

      toast({ title: `+${xp} XP earned! ⚡`, description: `You scored ${parsed.score}/100` });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not get feedback. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWriting = () => { setWritingText(''); setFeedback(null); setXpAwarded(0); };
  const backToPrompts = () => { setSelectedPrompt(null); resetWriting(); };

  if (authLoading) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  // Writing & feedback screen
  if (selectedPrompt) {
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
              <Textarea value={writingText} onChange={(e) => setWritingText(e.target.value)} placeholder="Start writing here..." rows={8} className="resize-none text-sm" disabled={isSubmitting} />
              <div className={cn("absolute bottom-2 right-3 text-xs font-medium", wordCount >= selectedPrompt.wordTarget ? "text-green-600" : "text-muted-foreground")}>
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

          {feedback && <FeedbackDisplay feedback={feedback} xpAwarded={xpAwarded} />}
        </div>
        <BottomNav />
      </Layout>
    );
  }

  // Prompt selection screen with history tab
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

        <Tabs defaultValue="prompts" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="prompts" className="flex-1 gap-1"><PenLine className="h-3.5 w-3.5" />Prompts</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1"><History className="h-3.5 w-3.5" />My Work</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
              {categories.map(cat => (
                <Button key={cat} variant={filterCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory(cat)} className="whitespace-nowrap shrink-0">{cat}</Button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((p) => (
                <PromptCard key={p.id} prompt={p} onClick={() => setSelectedPrompt(p)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            {viewingSubmission ? (
              <SubmissionDetail submission={viewingSubmission} onBack={() => setViewingSubmission(null)} />
            ) : loadingHistory ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : pastSubmissions.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No submissions yet. Pick a prompt and start writing!</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {pastSubmissions.map((sub) => (
                  <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewingSubmission(sub)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{sub.prompt_title}</h3>
                        <div className="flex items-center gap-2">
                          {sub.score !== null && (
                            <Badge variant="outline" className={cn("text-[10px]", sub.score >= 70 ? "text-green-600 border-green-500/20" : sub.score >= 40 ? "text-amber-600 border-amber-500/20" : "text-red-600 border-red-500/20")}>
                              {sub.score}/100
                            </Badge>
                          )}
                          {sub.xp_awarded > 0 && <Badge variant="outline" className="text-[10px] text-primary border-primary/20">+{sub.xp_awarded} XP</Badge>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{sub.writing_text}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </Layout>
  );
}
