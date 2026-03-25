import { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Home, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ParentInsightResponse } from '@/lib/pixo-ai-types';

interface ParentAIInsightsCardProps {
  parentId: string;
  studentId: string;
  studentName?: string;
  className?: string;
}

export function ParentAIInsightsCard({
  parentId,
  studentId,
  studentName = 'your child',
  className,
}: ParentAIInsightsCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<ParentInsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async () => {
    setIsLoading(true);
    setError(null);

    // Phase 4 will connect to /api/pixo-ai/parent-insight
    setTimeout(() => {
      setInsight({
        success: true,
        title: 'Weekly Learning Insight',
        summary: `${studentName} has been practising consistently this week, showing strong improvement in sound recognition. The 'sh' digraph is becoming more natural, though 'th' still needs gentle reinforcement.`,
        strengths: [
          'Consistent daily practice habit',
          'Strong sound recognition for short vowels',
          'Growing confidence in speaking exercises',
        ],
        weak_areas: [
          "'th' digraph needs more practice",
          'Hesitation with blending longer words',
        ],
        home_support_steps: [
          'Read a short story together and point out "th" words',
          'Play the "I Spy" game with sounds at home',
          'Praise effort over accuracy — confidence matters most right now',
        ],
        recommended_focus: [
          'Continue with digraph lessons this week',
          'Try the "Sound Safari" game for extra practice',
        ],
        sources: [],
        metadata: {},
      });
      setIsLoading(false);
    }, 800);
  };

  return (
    <Card className={`border-border overflow-hidden ${className}`}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <Brain className="h-5 w-5 text-primary" />
          AI Learning Insights
          {insight && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 text-xs text-muted-foreground"
              onClick={fetchInsight}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-3">
        {!insight && !isLoading && !error && (
          <div className="text-center py-6 space-y-3">
            <Sparkles className="h-8 w-8 text-primary mx-auto opacity-50" />
            <p className="text-sm text-muted-foreground">
              Get AI-powered insights about {studentName}'s learning progress
            </p>
            <Button
              size="sm"
              className="rounded-full"
              onClick={fetchInsight}
            >
              <Brain className="h-4 w-4 mr-1.5" />
              Generate Insight
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analysing {studentName}'s progress...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button size="sm" variant="ghost" onClick={fetchInsight} className="mt-2 text-xs">
              Try Again
            </Button>
          </div>
        )}

        {insight && !isLoading && (
          <div className="space-y-4">
            {/* Summary */}
            <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>

            {/* Strengths */}
            <div>
              <h4 className="text-xs font-semibold text-secondary flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {insight.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-secondary mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Watch */}
            {insight.weak_areas.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-destructive/80 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Areas to Watch
                </h4>
                <ul className="space-y-1">
                  {insight.weak_areas.map((w, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-destructive/60 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Home Support */}
            <div>
              <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2">
                <Home className="h-3.5 w-3.5" />
                How You Can Help at Home
              </h4>
              <ul className="space-y-1.5">
                {insight.home_support_steps.map((step, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="bg-primary/10 text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Focus */}
            {insight.recommended_focus.length > 0 && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">📌 Recommended Focus</p>
                {insight.recommended_focus.map((f, i) => (
                  <p key={i} className="text-sm text-foreground">{f}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
