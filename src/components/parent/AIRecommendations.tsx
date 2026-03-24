import { useState } from 'react';
import { ChildData } from '@/pages/ParentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, BookOpen, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props { child: ChildData | null; }

interface AIInsight {
  weakAreas: string[];
  strengths: string[];
  practiceGoals: string[];
  focusAreas: string[];
  summary: string;
}

export function AIRecommendations({ child }: Props) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!child) return <p className="text-muted-foreground">Select a child to view AI recommendations.</p>;

  const getAvg = (scores: (number | null)[]) => {
    const valid = scores.filter((s): s is number => s !== null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  };

  // Generate local insight without AI call
  const generateLocalInsight = (): AIInsight => {
    const recent = child.completions.slice(0, 10);
    const pronunciation = getAvg(recent.map(c => c.pronunciation_score));
    const fluency = getAvg(recent.map(c => c.fluency_score));
    const clarity = getAvg(recent.map(c => c.clarity_score));
    const confidence = getAvg(recent.map(c => c.confidence_score));

    const skillMap = { Pronunciation: pronunciation, Fluency: fluency, Clarity: clarity, Confidence: confidence };
    const sorted = Object.entries(skillMap).sort((a, b) => a[1] - b[1]);

    const weakAreas = sorted.filter(([, s]) => s < 60).map(([name, score]) => `${name} (${score}%)`);
    const strengths = sorted.filter(([, s]) => s >= 70).reverse().map(([name, score]) => `${name} (${score}%)`);

    const practiceGoals: string[] = [];
    if (child.completions.length < 5) practiceGoals.push('Complete at least 1 lesson per day');
    if (child.streak < 3) practiceGoals.push('Build a 3-day learning streak');
    if (child.writingSubmissions.length < 3) practiceGoals.push('Write 1 creative piece this week');
    if (weakAreas.length > 0) practiceGoals.push(`Focus 10 extra minutes on ${sorted[0][0]}`);
    if (practiceGoals.length === 0) practiceGoals.push('Maintain current pace — excellent work!');

    const focusAreas: string[] = [];
    if (pronunciation < 60) focusAreas.push('Practice reading aloud slowly and clearly');
    if (fluency < 60) focusAreas.push('Use the AI Chat for conversational practice');
    if (clarity < 60) focusAreas.push('Focus on enunciation in lesson recordings');
    if (confidence < 60) focusAreas.push('Try roleplay scenarios for confidence building');
    if (focusAreas.length === 0) focusAreas.push('Continue balanced practice across all skills');

    const overallAvg = Math.round((pronunciation + fluency + clarity + confidence) / 4);
    const summary = overallAvg >= 80
      ? `${child.profile.full_name || 'Your child'} is excelling! Keep encouraging consistent practice to maintain this momentum.`
      : overallAvg >= 60
        ? `${child.profile.full_name || 'Your child'} is making good progress. Focus on weaker areas to push scores higher.`
        : `${child.profile.full_name || 'Your child'} needs more consistent practice. Aim for daily sessions and extra focus on ${sorted[0][0]}.`;

    return { weakAreas, strengths, practiceGoals, focusAreas, summary };
  };

  const generateAIInsight = async () => {
    setLoading(true);
    try {
      const recent = child.completions.slice(0, 10);
      const totalMinutes = Math.round(
        child.learningSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60
      );

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          childData: {
            currentLevel: child.progress?.current_level || 'beginner',
            currentDay: child.progress?.current_day || 1,
            totalXp: child.xp?.total_xp || 0,
            streak: child.streak,
            lessonsCompleted: child.completions.length,
            avgPronunciation: getAvg(recent.map(c => c.pronunciation_score)),
            avgFluency: getAvg(recent.map(c => c.fluency_score)),
            avgClarity: getAvg(recent.map(c => c.clarity_score)),
            totalMinutes,
            writingCount: child.writingSubmissions.length,
            assessmentLevel: child.assessmentResult?.assigned_level || 'not taken',
          },
        },
      });

      if (error) throw error;
      if (data && !data.error) {
        setInsight({
          weakAreas: data.areasToWatch || [],
          strengths: data.strengths || [],
          practiceGoals: [data.weeklyTip, data.recommendedFocus].filter(Boolean),
          focusAreas: [data.phonicsInsight].filter(Boolean),
          summary: data.summary || data.encouragement || '',
        });
      } else {
        setInsight(generateLocalInsight());
      }
    } catch {
      setInsight(generateLocalInsight());
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate local insight on mount if none
  if (!insight && !loading) {
    setInsight(generateLocalInsight());
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">AI Insights ✨</h2>
          <p className="text-sm text-muted-foreground">Personalized recommendations for {child.profile.full_name || child.profile.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={generateAIInsight} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {insight && (
        <>
          {/* Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">AI Summary</p>
                  <p className="text-sm text-muted-foreground">{insight.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-pixo-green" />Strengths</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insight.strengths.length > 0 ? insight.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-pixo-green" />
                    {s}
                  </div>
                )) : <p className="text-sm text-muted-foreground">Building skills — keep practicing!</p>}
              </CardContent>
            </Card>

            {/* Weak Areas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-pixo-orange" />Needs Improvement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insight.weakAreas.length > 0 ? insight.weakAreas.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-pixo-orange" />
                    {s}
                  </div>
                )) : <p className="text-sm text-muted-foreground">No weak areas — great job!</p>}
              </CardContent>
            </Card>

            {/* Practice Goals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Practice Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insight.practiceGoals.map((g, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    {g}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Focus Areas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-pixo-blue" />Skill Focus Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insight.focusAreas.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-pixo-blue mt-1.5 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
