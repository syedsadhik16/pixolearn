import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/shared/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Check, X, Lightbulb, Network, ArrowRight, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumLessonShell } from '@/components/lesson/PremiumLessonShell';
import {
  STAGES,
  getOrCreateSession,
  fetchQuestions,
  submitAttempt,
  advanceStage,
  saveResumeState,
  type PracticeStage,
  type PracticeQuestion,
  type PracticeSession,
} from '@/lib/practice';
import { SKILL_AREAS, type SkillCode } from '@/lib/performance';

export default function PracticeArena() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const skillParam = (params.get('skill') as SkillCode) || 'phonics';
  const topicKey = params.get('topic') || skillParam;
  const topicLabel =
    SKILL_AREAS.find((s) => s.code === skillParam)?.label || 'Phonics Practice';
  const isPremium = profile?.subscription_type === 'premium';

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const startTime = useRef<number>(Date.now());
  const freeAttemptsLeft = useRef(5);

  const currentStageMeta =
    STAGES.find((s) => s.key === session?.current_stage) ?? STAGES[0];

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getOrCreateSession(user.id, skillParam, topicKey, topicLabel, 1)
      .then(setSession)
      .catch((e) => {
        console.error('[Practice]', e);
        toast.error('Could not load practice session');
      })
      .finally(() => setLoading(false));
  }, [user, skillParam, topicKey, topicLabel]);

  const loadStageQuestions = async () => {
    if (!session) return;
    if (!isPremium && freeAttemptsLeft.current <= 0) {
      toast.error('Free practice limit reached. Upgrade for unlimited!');
      navigate('/pricing');
      return;
    }
    setLoading(true);
    try {
      const stageMeta = STAGES.find((s) => s.key === session.current_stage) ?? STAGES[0];
      const qs = await fetchQuestions(
        session.skill_code as SkillCode,
        session.topic_key,
        session.topic_label || topicLabel,
        session.level_no ?? 1,
        session.difficulty,
        stageMeta.questions
      );
      setQuestions(qs);
      setQIndex(0);
      setSelected(null);
      setShowResult(false);
      setHintShown(false);
      setRunning(true);
      startTime.current = Date.now();
    } catch (e) {
      console.error('[Practice] fetch failed', e);
      toast.error('Could not load questions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (option: string) => {
    if (showResult || !session || !user) return;
    setSelected(option);
    setShowResult(true);
    if (!isPremium) freeAttemptsLeft.current -= 1;
    const q = questions[qIndex];
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    try {
      const { isCorrect } = await submitAttempt({
        sessionId: session.id,
        learnerId: user.id,
        question: q,
        selected: option,
        stage: session.current_stage,
        skill: session.skill_code as SkillCode,
        topicKey: session.topic_key,
        timeSpent,
        hintUsed: hintShown,
      });
      if (isCorrect) toast.success('Nice work!');
    } catch (e) {
      console.error('[Practice] attempt error', e);
    }
  };

  const handleNext = async () => {
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
      setHintShown(false);
      startTime.current = Date.now();
      return;
    }
    // Stage complete -> advance
    if (!session) return;
    const order: PracticeStage[] = ['warmup', 'strides', 'sprint', 'laps', 'complete'];
    const next = order[order.indexOf(session.current_stage) + 1];
    await advanceStage(session.id, next);
    if (next === 'complete') {
      toast.success('Practice complete! 🎉');
      setRunning(false);
      const refreshed = await getOrCreateSession(
        user!.id,
        skillParam,
        topicKey,
        topicLabel,
        1
      );
      setSession(refreshed);
    } else {
      setSession({ ...session, current_stage: next });
      setRunning(false);
      toast.success(`Stage complete! Next up: ${next}`);
    }
  };

  const handlePause = async () => {
    if (!session) return;
    await saveResumeState(session.id, { qIndex, stage: session.current_stage });
    toast.success('Progress saved');
    setRunning(false);
  };

  if (loading && !running) {
    return (
      <Layout>
        <div className="min-h-screen p-4 max-w-2xl mx-auto pb-24">
          <BackButton />
          <Skeleton className="h-32 w-full rounded-3xl mb-4" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </Layout>
    );
  }

  // Practice in progress
  if (running && questions.length > 0) {
    const q = questions[qIndex];
    const isCorrect = selected === q.correct_answer;
    const stageOrder: PracticeStage[] = ['warmup', 'strides', 'sprint', 'laps'];
    const stageIdx = Math.max(0, stageOrder.indexOf(session?.current_stage ?? 'warmup'));
    return (
      <Layout>
        <PremiumLessonShell
          trail={STAGES.filter((s) => s.key !== 'complete').map((s) => ({ icon: s.emoji, label: s.label }))}
          activeIndex={stageIdx}
          xpCurrent={(session?.correct_count ?? 0) * 10}
          xpMax={Math.max(200, (session?.total_questions ?? 20) * 10)}
        >
          <div className="flex items-center justify-between mb-4">
            <BackButton />
            <Button variant="ghost" size="sm" onClick={handlePause} style={{ color: 'var(--lp-text-muted)' }}>
              <PauseCircle className="h-4 w-4 mr-1" /> Pause
            </Button>
          </div>

          <Card className="p-5 rounded-3xl border-0 shadow-pixo-md bg-gradient-to-br from-primary/10 to-card mb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="capitalize">
                {currentStageMeta.emoji} {currentStageMeta.label}
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {qIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-primary to-pixo-orange rounded-full transition-all"
                style={{ width: `${((qIndex + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>
            <h2 className="text-lg font-display font-bold text-foreground leading-snug">
              {q.question_text}
            </h2>
          </Card>

          <div className="space-y-2.5 mb-4">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isRight = opt === q.correct_answer;
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={showResult}
                  className={cn(
                    'w-full p-4 rounded-2xl text-left text-sm font-semibold transition-all border-2',
                    !showResult && 'border-border bg-card hover:border-primary hover:shadow-pixo-sm',
                    showResult && isRight && 'border-secondary bg-secondary/15 text-secondary-foreground',
                    showResult && isSelected && !isRight && 'border-destructive bg-destructive/10',
                    showResult && !isSelected && !isRight && 'border-border bg-card opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{opt}</span>
                    {showResult && isRight && <Check className="h-5 w-5 text-secondary" />}
                    {showResult && isSelected && !isRight && (
                      <X className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {!showResult && q.hint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHintShown(true)}
              disabled={hintShown}
              className="w-full"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {hintShown ? q.hint : 'Show hint'}
            </Button>
          )}

          {showResult && (
            <Card className="p-4 rounded-2xl border-0 shadow-pixo-sm mb-4 bg-gradient-to-br from-card to-muted/40">
              <p className="text-sm font-semibold mb-1">
                {isCorrect ? '✨ Great job!' : '💛 Almost there!'}
              </p>
              {q.explanation && (
                <p className="text-xs text-muted-foreground">{q.explanation}</p>
              )}
            </Card>
          )}

          {showResult && (
            <Button onClick={handleNext} className="w-full" size="lg">
              {qIndex < questions.length - 1 ? 'Next' : 'Finish Stage'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </PremiumLessonShell>
      </Layout>
    );
  }

  // Topic intro / stage flow
  const stageOrder: PracticeStage[] = ['warmup', 'strides', 'sprint', 'laps'];
  const introStageIdx = Math.max(0, stageOrder.indexOf(session?.current_stage ?? 'warmup'));
  return (
    <Layout>
      <PremiumLessonShell
        trail={STAGES.filter((s) => s.key !== 'complete').map((s) => ({ icon: s.emoji, label: s.label }))}
        activeIndex={introStageIdx}
        xpCurrent={(session?.correct_count ?? 0) * 10}
        xpMax={Math.max(200, (session?.total_questions ?? 20) * 10)}
      >
        <BackButton />

        <Card className="rounded-3xl border-0 shadow-pixo-md overflow-hidden mb-5 bg-gradient-to-br from-primary via-pixo-orange to-accent">
          <div className="p-6 text-primary-foreground">
            <p className="text-xs font-semibold opacity-90 mb-1">Practice</p>
            <h1 className="text-2xl font-display font-bold mb-3">{topicLabel}</h1>
            <p className="text-sm opacity-90 mb-4">
              {session && session.total_questions > 0
                ? `You've answered ${session.correct_count} of ${session.total_questions} correctly. Let's keep building!`
                : "Let's kick off this practice session with an easy warmup."}
            </p>

            {/* Stage flow */}
            <div className="flex items-center justify-between gap-1">
              {STAGES.map((s, i) => {
                const stageOrder = ['warmup', 'strides', 'sprint', 'laps'];
                const currentIdx = stageOrder.indexOf(session?.current_stage ?? 'warmup');
                const done = i < currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-full flex items-center justify-center text-lg border-2 transition-all',
                        done && 'bg-primary-foreground/30 border-primary-foreground',
                        active && 'bg-primary-foreground text-primary scale-110 shadow-lg',
                        !done && !active && 'border-primary-foreground/40 opacity-60'
                      )}
                    >
                      {done ? <Check className="h-5 w-5" /> : s.emoji}
                    </div>
                    <span className="text-[10px] font-bold opacity-90">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Button
          size="lg"
          variant="gradient"
          className="w-full mb-3"
          onClick={loadStageQuestions}
        >
          {session && session.total_questions > 0 ? 'Resume Practice' : 'Start Practice'}
        </Button>

        <Button
          variant="outline"
          className="w-full mb-6"
          onClick={() => navigate('/revise')}
        >
          <Network className="h-4 w-4 mr-2" /> View Knowledge Graph
        </Button>

        {!isPremium && (
          <Card className="p-4 rounded-2xl border-0 shadow-pixo-sm bg-gradient-to-br from-pixo-coral/15 to-card text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Free plan: 5 practice questions per day
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
              Unlock unlimited practice
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
}
