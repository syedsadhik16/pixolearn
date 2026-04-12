import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { useCompanion } from '@/hooks/useCompanion';
import { Check, X, Clock, ArrowRight, ArrowLeft, Loader2, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
interface AIQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  skill_area: string;
}

interface LearnerDetails {
  ageGroup: string;
  classLevel: string;
  board: string;
  currentLevel: string;
  improvementGoals: string[];
}

// ─── Constants ───────────────────────────────────────────────
const TOTAL_TIME = 600;
const AGE_GROUPS = ['5-6', '7-8', '9-10', '11-12', '13-14', '15-16'];

const CLASS_OPTIONS: Record<string, string[]> = {
  '5-6': ['Preschool / Kindergarten', 'Grade 1-2'],
  '7-8': ['Grade 1-2', 'Grade 3-4'],
  '9-10': ['Grade 3-4', 'Grade 5-6'],
  '11-12': ['Grade 5-6', 'Grade 7-8'],
  '13-14': ['Grade 7-8', 'Grade 9-10'],
  '15-16': ['Grade 9-10'],
};

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'International / Cambridge', 'Other / Not Sure'];

const ENGLISH_LEVELS = [
  { id: 'beginner', label: 'Beginner', emoji: '🔤', desc: 'Understands letters and basic words' },
  { id: 'early_reader', label: 'Early Reader', emoji: '📖', desc: 'Reads small words and short sentences' },
  { id: 'confident_speaker', label: 'Confident Speaker', emoji: '🗣️', desc: 'Speaks in sentences, basic grammar' },
  { id: 'fluent', label: 'Fluent', emoji: '⭐', desc: 'Speaks clearly, understands stories' },
];

const IMPROVEMENT_GOALS = [
  { id: 'speaking_confidence', label: 'Speaking Confidence', emoji: '🎤' },
  { id: 'reading_phonics', label: 'Reading & Phonics', emoji: '📚' },
  { id: 'vocabulary', label: 'Vocabulary Building', emoji: '📝' },
  { id: 'grammar_sentences', label: 'Grammar & Sentences', emoji: '✍️' },
  { id: 'school_performance', label: 'School Performance', emoji: '🏫' },
  { id: 'overall_communication', label: 'Overall Communication', emoji: '💬' },
];

type Phase = 'details' | 'generating' | 'intro' | 'quiz' | 'submitting' | 'results';

// ─── Component ───────────────────────────────────────────────
export default function LaunchCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companion = useCompanion();

  // Phase management
  const [phase, setPhase] = useState<Phase>('details');
  const [detailsStep, setDetailsStep] = useState(1); // 1-5 for learner details

  // Learner details
  const [learnerDetails, setLearnerDetails] = useState<LearnerDetails>({
    ageGroup: '',
    classLevel: '',
    board: '',
    currentLevel: '',
    improvementGoals: [],
  });

  // Quiz state
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  // Results state
  const [score, setScore] = useState(0);
  const [recommendedLevel, setRecommendedLevel] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState<string | null>(null);
  const [savingLevel, setSavingLevel] = useState(false);

  // Skip modal
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  // AI evaluation
  const [aiEvaluation, setAiEvaluation] = useState<{
    confidence: number;
    strengths: string[];
    weakAreas: string[];
    recommendation: string;
    detailedBreakdown: { phonics: number; vocabulary: number; grammar: number; comprehension: number };
    parentMessage: string;
  } | null>(null);

  const fromPricing = new URLSearchParams(window.location.search).get('from') === 'pricing';

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Learner Details Handlers ──────────────────────────────
  const toggleGoal = (goalId: string) => {
    setLearnerDetails(prev => {
      const goals = prev.improvementGoals.includes(goalId)
        ? prev.improvementGoals.filter(g => g !== goalId)
        : prev.improvementGoals.length < 2
        ? [...prev.improvementGoals, goalId]
        : prev.improvementGoals;
      return { ...prev, improvementGoals: goals };
    });
  };

  const canProceedStep = () => {
    switch (detailsStep) {
      case 1: return !!learnerDetails.ageGroup;
      case 2: return !!learnerDetails.classLevel;
      case 3: return !!learnerDetails.board;
      case 4: return !!learnerDetails.currentLevel;
      case 5: return learnerDetails.improvementGoals.length > 0;
      default: return false;
    }
  };

  // ─── Generate Questions ────────────────────────────────────
  const generateQuestions = async () => {
    if (!user) return;
    setPhase('generating');

    try {
      // Save learner profile first
      await supabase.from('learner_profiles').upsert({
        student_id: user.id,
        age_group: learnerDetails.ageGroup,
        school_stage: learnerDetails.classLevel,
        board: learnerDetails.board,
        english_level: learnerDetails.currentLevel,
        learning_goals: learnerDetails.improvementGoals,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });

      const { data, error } = await supabase.functions.invoke('ai-generate-assessment', {
        body: {
          ageGroup: learnerDetails.ageGroup,
          classLevel: learnerDetails.classLevel,
          board: learnerDetails.board,
          currentLevel: learnerDetails.currentLevel,
          improvementGoals: learnerDetails.improvementGoals,
        },
      });

      if (error) throw error;

      if (data?.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        setAnswers(Array(data.questions.length).fill(null));
        setPhase('intro');
      } else {
        throw new Error(data?.error || 'Failed to generate questions');
      }
    } catch (err) {
      console.error('Question generation error:', err);
      toast({ title: 'Using standard questions', description: 'We prepared a standard assessment for you.' });
      // Use fallback
      const fallback = getFallbackQuestions();
      setQuestions(fallback);
      setAnswers(Array(fallback.length).fill(null));
      setPhase('intro');
    }
  };

  // ─── Quiz Handlers ─────────────────────────────────────────
  const selectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (phase === 'results' || phase === 'submitting') return;
    setPhase('submitting');

    let correct = 0;
    const answerDetails = questions.map((q, i) => ({
      questionId: q.id,
      selected: answers[i],
      correct: q.correct_answer,
      isCorrect: answers[i] === q.correct_answer,
      difficulty: q.difficulty,
      skill_area: q.skill_area,
    }));
    answerDetails.forEach(a => { if (a.isCorrect) correct++; });

    // Scoring: 0-3=Beginner, 4-6=Early Reader, 7-8=Confident Speaker, 9-10=Fluent
    let level: string;
    if (correct <= 3) level = 'beginner';
    else if (correct <= 6) level = 'intermediate';
    else if (correct <= 8) level = 'advanced';
    else level = 'fluent';

    setScore(correct);
    setRecommendedLevel(level);

    if (!user) { setPhase('results'); return; }

    try {
      await supabase.from('assessment_results').upsert({
        student_id: user.id,
        score: correct,
        total_questions: questions.length,
        assigned_level: level,
        time_taken_seconds: TOTAL_TIME - timeLeft,
        answers: answerDetails,
      }, { onConflict: 'student_id' });

      await supabase.from('student_progress').update({
        current_level: (level === 'fluent' ? 'advanced' : level) as 'beginner' | 'intermediate' | 'advanced',
        current_day: 1,
      }).eq('student_id', user.id);

      await supabase.from('user_entitlements').upsert({
        user_id: user.id,
        email: user.email || '',
        launch_check_completed: true,
        recommended_level: level,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // AI evaluation (non-blocking)
      try {
        const { data: aiData } = await supabase.functions.invoke('ai-launch-check', {
          body: {
            answers: answerDetails,
            questions: questions.map(q => ({ question: q.question, difficulty: q.difficulty })),
            ageGroup: learnerDetails.ageGroup,
            timeTaken: TOTAL_TIME - timeLeft,
          },
        });
        if (aiData && !aiData.error) setAiEvaluation(aiData);
      } catch {}
    } catch (error) {
      console.error('Error saving assessment:', error);
    } finally {
      setPhase('results');
    }
  }, [answers, phase, timeLeft, user, questions, learnerDetails.ageGroup]);

  // ─── Save Level & Continue ─────────────────────────────────
  const saveAndContinue = async (selectedLevel: string) => {
    if (!user) return;
    setSavingLevel(true);

    try {
      const dbLevel = selectedLevel === 'fluent' ? 'advanced' : selectedLevel;
      await supabase.from('student_progress').update({
        current_level: dbLevel as 'beginner' | 'intermediate' | 'advanced',
        current_day: 1,
      }).eq('student_id', user.id);

      await supabase.from('user_entitlements').upsert({
        user_id: user.id,
        email: user.email || '',
        selected_level: selectedLevel,
        launch_check_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      toast({ title: 'Level selected! 🎉', description: `Starting with ${getLevelName(selectedLevel)}` });

      // Check if user has active paid entitlement
      const { data: ent } = await supabase.from('user_entitlements')
        .select('is_paid, entitlement_status, entitlement_expiry_date')
        .eq('user_id', user.id).single();

      if (ent?.is_paid && ent.entitlement_status === 'active' && ent.entitlement_expiry_date && new Date(ent.entitlement_expiry_date) > new Date()) {
        navigate('/student');
      } else {
        navigate('/pricing');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save level. Please try again.', variant: 'destructive' });
    } finally {
      setSavingLevel(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getLevelEmoji = (level: string) => {
    if (level === 'beginner') return '🌱';
    if (level === 'intermediate') return '📖';
    if (level === 'advanced') return '🗣️';
    return '⭐';
  };

  const getLevelName = (level: string) => {
    if (level === 'beginner') return 'Level 1: Sounds to Words';
    if (level === 'intermediate') return 'Level 2: Words to Sentences';
    if (level === 'advanced') return 'Level 3: Sentences to Conversation';
    return 'Level 3: Advanced Mastery';
  };

  const getLevelLabel = (level: string) => {
    if (level === 'beginner') return 'Beginner';
    if (level === 'intermediate') return 'Early Reader';
    if (level === 'advanced') return 'Confident Speaker';
    return 'Fluent';
  };

  const getLevelExplanation = (level: string) => {
    if (level === 'beginner') return 'Based on the Launch Check, we recommend starting with Level 1 to strengthen phonics, word recognition, and speaking confidence.';
    if (level === 'intermediate') return 'Your child shows solid basics! Level 2 will build reading fluency, word families, and sentence-level reading.';
    if (level === 'advanced') return 'Great skills! Level 3 will advance conversation, comprehension, story logic, and guided writing.';
    return 'Excellent performance! Level 3 will challenge with advanced comprehension and creative expression.';
  };

  const getScoreComment = () => {
    if (score <= 2) return { emoji: '💪', title: 'Great start!' };
    if (score <= 4) return { emoji: '🌱', title: 'Good foundation!' };
    if (score <= 6) return { emoji: '📚', title: 'Nice work!' };
    if (score <= 8) return { emoji: '🚀', title: 'Impressive!' };
    return { emoji: '🏆', title: 'Outstanding!' };
  };

  const getDifficultyBreakdown = () => {
    const easy = questions.filter(q => q.difficulty === 'easy');
    const medium = questions.filter(q => q.difficulty === 'medium');
    const hard = questions.filter(q => q.difficulty === 'hard');
    return {
      easy: easy.filter(q => answers[questions.indexOf(q)] === q.correct_answer).length, easyTotal: easy.length,
      medium: medium.filter(q => answers[questions.indexOf(q)] === q.correct_answer).length, mediumTotal: medium.length,
      hard: hard.filter(q => answers[questions.indexOf(q)] === q.correct_answer).length, hardTotal: hard.length,
    };
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: Learner Details Collection (Steps 1-5)
  // ═══════════════════════════════════════════════════════════
  if (phase === 'details') {
    const classOptions = learnerDetails.ageGroup ? (CLASS_OPTIONS[learnerDetails.ageGroup] || ['Preschool / Kindergarten', 'Grade 1-2', 'Grade 3-4', 'Grade 5-6', 'Grade 7-8', 'Grade 9-10']) : [];

    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
                📋 Step {detailsStep} of 5 • Learner Details
              </div>
              <div className="flex items-center justify-center gap-3">
                <img src={companion.image} alt={companion.name} className="w-16 h-16 object-contain animate-float" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                    Learning Launch Check ✨
                  </h1>
                  <p className="text-white/70 text-sm">
                    Let's personalize your child's English journey in under 60 seconds
                  </p>
                </div>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === detailsStep ? 'w-8 bg-white' : s < detailsStep ? 'w-4 bg-white/60' : 'w-4 bg-white/20'}`} />
              ))}
            </div>

            {/* Step Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl space-y-5 animate-fade-in" key={detailsStep}>
              {/* Step 1: Age Group */}
              {detailsStep === 1 && (
                <>
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                      👶 LEARNER PROFILE
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">How old is your child?</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Age Group</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {AGE_GROUPS.map(ag => (
                        <button
                          key={ag}
                          onClick={() => setLearnerDetails(prev => ({ ...prev, ageGroup: ag, classLevel: '' }))}
                          className={`p-3 rounded-xl border-2 text-center transition-all text-sm font-semibold ${
                            learnerDetails.ageGroup === ag
                              ? 'border-primary bg-primary/5 text-primary shadow-md'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          {ag}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Class/Stage */}
              {detailsStep === 2 && (
                <>
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                      🏫 CURRENT LEARNING STAGE
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">What class/stage is your child in?</p>
                  </div>
                  <div className="space-y-2">
                    {classOptions.map(cl => (
                      <button
                        key={cl}
                        onClick={() => setLearnerDetails(prev => ({ ...prev, classLevel: cl }))}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium ${
                          learnerDetails.classLevel === cl
                            ? 'border-primary bg-primary/5 text-primary shadow-md'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {cl}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3: Board */}
              {detailsStep === 3 && (
                <>
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                      📋 SCHOOL BOARD <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Which board does your child follow?</p>
                  </div>
                  <div className="space-y-2">
                    {BOARDS.map(b => (
                      <button
                        key={b}
                        onClick={() => setLearnerDetails(prev => ({ ...prev, board: b }))}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium ${
                          learnerDetails.board === b
                            ? 'border-primary bg-primary/5 text-primary shadow-md'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 4: Current English Level */}
              {detailsStep === 4 && (
                <>
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                      🎯 USE OF ENGLISH
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">How does your child currently use English?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ENGLISH_LEVELS.map(lvl => (
                      <button
                        key={lvl.id}
                        onClick={() => setLearnerDetails(prev => ({ ...prev, currentLevel: lvl.id }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all space-y-1 ${
                          learnerDetails.currentLevel === lvl.id
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="text-2xl">{lvl.emoji}</div>
                        <p className="font-bold text-sm">{lvl.label}</p>
                        <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 5: Improvement Goals */}
              {detailsStep === 5 && (
                <>
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                      🎯 IMPROVEMENT GOALS
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">What should we improve most? (Pick up to 2)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {IMPROVEMENT_GOALS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all text-sm font-medium flex items-center gap-2 ${
                          learnerDetails.improvementGoals.includes(g.id)
                            ? 'border-primary bg-primary/5 text-primary shadow-md'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <span>{g.emoji}</span>
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                {detailsStep > 1 ? (
                  <Button variant="ghost" onClick={() => setDetailsStep(detailsStep - 1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                ) : <div />}

                {detailsStep < 5 ? (
                  <Button
                    variant="gradient"
                    disabled={!canProceedStep()}
                    onClick={() => setDetailsStep(detailsStep + 1)}
                  >
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    className="bg-pixo-green hover:bg-pixo-green/90 text-white font-bold px-6 py-5 rounded-2xl text-base"
                    disabled={!canProceedStep()}
                    onClick={generateQuestions}
                  >
                    🚀 Build My Child's Learning Path
                  </Button>
                )}
              </div>
            </div>

            {/* Skip link */}
            <div className="text-center">
              <button
                className="text-white/50 text-xs hover:text-white/70 underline"
                onClick={() => setShowSkipModal(true)}
              >
                EXIT ASSESSMENT
              </button>
            </div>

            {/* Skip Modal */}
            {showSkipModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/20 max-w-sm w-full space-y-5 text-center animate-scale-in">
                  <div className="text-5xl">🤔</div>
                  <h3 className="text-xl font-display font-bold text-white">Skip the Assessment?</h3>
                  <p className="text-white/80 text-sm">
                    No worries! You can choose your level manually. The assessment helps us recommend the best starting point.
                  </p>
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-white text-primary hover:bg-white/90 font-bold py-5 rounded-2xl"
                      disabled={skipLoading}
                      onClick={async () => {
                        if (!user) return;
                        setSkipLoading(true);
                        try {
                          await supabase.from('user_entitlements').upsert({
                            user_id: user.id,
                            email: user.email || '',
                            launch_check_completed: true,
                            updated_at: new Date().toISOString(),
                          }, { onConflict: 'user_id' });
                          await supabase.from('assessment_results').upsert({
                            student_id: user.id, score: 0, total_questions: 0,
                            assigned_level: 'beginner', time_taken_seconds: 0,
                            answers: [{ status: 'skipped' }],
                          }, { onConflict: 'student_id' });
                          toast({ title: 'Assessment skipped ✓', description: 'Choose your level on the next screen.' });
                          navigate('/level-selection');
                        } catch {
                          toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
                        } finally { setSkipLoading(false); }
                      }}
                    >
                      {skipLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Yes, Choose Level Manually'}
                    </Button>
                    <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10" onClick={() => setShowSkipModal(false)}>
                      No, I'll Take the Assessment
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: Generating Questions
  // ═══════════════════════════════════════════════════════════
  if (phase === 'generating') {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
            <img src={companion.image} alt={companion.name} className="w-24 h-24 mx-auto object-contain animate-float" />
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
            <h2 className="text-2xl font-display font-bold text-white">Building Your Assessment...</h2>
            <p className="text-white/70">PIXO AI is creating personalized questions for your child based on their profile.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">Age: {learnerDetails.ageGroup}</span>
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{learnerDetails.classLevel}</span>
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{learnerDetails.board}</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: Intro / Start Screen
  // ═══════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
            <img src={pixoLogo} alt="PIXO" className="h-16 mx-auto animate-float" />
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 space-y-6">
              <img src={companion.image} alt={companion.name} className="w-24 h-24 mx-auto object-contain animate-float" />
              <h1 className="text-3xl font-display font-bold text-white">
                Learning Launch Check 🚀
              </h1>
              <p className="text-white/80 text-lg">
                Your personalized assessment is ready!
              </p>
              <p className="text-white/60 text-sm">
                Answer {questions.length} English questions tailored for your child. You have <strong>10 minutes</strong>.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-white">{questions.length}</p>
                  <p className="text-xs text-white/60">Questions</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-white">10</p>
                  <p className="text-xs text-white/60">Minutes</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-xs text-white/60">Levels</p>
                </div>
              </div>
              <Button
                className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-2xl"
                onClick={() => setPhase('quiz')}
              >
                Start Assessment <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: Submitting
  // ═══════════════════════════════════════════════════════════
  if (phase === 'submitting') {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="text-center space-y-4 animate-fade-in">
            <img src={companion.image} alt={companion.name} className="w-20 h-20 mx-auto object-contain animate-float" />
            <Loader2 className="h-10 w-10 animate-spin text-white mx-auto" />
            <p className="text-white/80 text-lg font-display font-bold">Analyzing your results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: Results — Mission Confirmed!
  // ═══════════════════════════════════════════════════════════
  if (phase === 'results') {
    const comment = getScoreComment();
    const breakdown = getDifficultyBreakdown();
    const finalLevel = overrideLevel || recommendedLevel;

    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Mission Confirmed Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center space-y-5 animate-fade-in">
              <img src={companion.image} alt={companion.name} className="w-24 h-24 mx-auto object-contain animate-float" />
              <h1 className="text-3xl font-display font-bold text-white tracking-wide uppercase">
                Mission Confirmed! 🎯
              </h1>

              {/* Assessed Starting Point */}
              <div className="bg-white/20 rounded-2xl p-6 space-y-2">
                <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Assessed Starting Point</p>
                <h2 className="text-3xl font-display font-bold text-white">
                  {getLevelLabel(recommendedLevel)}
                </h2>
                <p className="text-sm text-white/70">
                  Score: {score}/{questions.length} · {comment.emoji} {comment.title}
                </p>
              </div>

              <p className="text-white/80 text-sm italic max-w-md mx-auto">
                "{getLevelExplanation(recommendedLevel)}"
              </p>

              {/* Recommended Level */}
              <div className="bg-white/10 rounded-2xl p-5 space-y-3">
                <p className="text-sm text-white/70 mb-2">Recommended Level:</p>
                <h2 className="text-xl font-display font-bold text-white flex items-center justify-center gap-2">
                  {getLevelEmoji(recommendedLevel)} {getLevelName(recommendedLevel)}
                </h2>
              </div>

              {/* Difficulty Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/60 mb-1">Easy</p>
                  <p className="text-lg font-bold text-pixo-green">{breakdown.easy}/{breakdown.easyTotal}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/60 mb-1">Medium</p>
                  <p className="text-lg font-bold text-pixo-yellow">{breakdown.medium}/{breakdown.mediumTotal}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/60 mb-1">Hard</p>
                  <p className="text-lg font-bold text-pixo-orange">{breakdown.hard}/{breakdown.hardTotal}</p>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {aiEvaluation && (
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 space-y-4">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">🧠 AI Learning Insights</h3>
                <p className="text-sm text-white/80">{aiEvaluation.parentMessage}</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(aiEvaluation.detailedBreakdown).map(([key, value]) => (
                    <div key={key} className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-white/60 capitalize">{key}</p>
                      <p className="text-2xl font-bold text-white">{value}%</p>
                    </div>
                  ))}
                </div>
                {aiEvaluation.strengths.length > 0 && (
                  <div>
                    <p className="text-xs text-white/60 mb-1">Strengths</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiEvaluation.strengths.map((s, i) => (
                        <span key={i} className="bg-green-500/20 text-green-200 text-xs px-2 py-1 rounded-full">⭐ {s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {aiEvaluation.weakAreas.length > 0 && (
                  <div>
                    <p className="text-xs text-white/60 mb-1">Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiEvaluation.weakAreas.map((w, i) => (
                        <span key={i} className="bg-yellow-500/20 text-yellow-200 text-xs px-2 py-1 rounded-full">💡 {w}</span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-sm text-white/90 bg-white/5 rounded-xl p-3 italic">"{aiEvaluation.recommendation}"</p>
              </div>
            )}

            {/* Review Answers */}
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex items-center justify-between text-white hover:bg-white/15 transition-colors"
            >
              <span className="font-display font-bold">📝 Review All Answers</span>
              {showReview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {showReview && (
              <div className="space-y-3 animate-fade-in">
                {questions.map((q, i) => {
                  const userAnswer = answers[i];
                  const isCorrect = userAnswer === q.correct_answer;
                  const isExpanded = expandedQ === i;
                  return (
                    <div key={q.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <button onClick={() => setExpandedQ(isExpanded ? null : i)} className="w-full p-4 flex items-start gap-3 text-left">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                          {isCorrect ? <Check className="h-4 w-4 text-white" /> : <X className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">Q{i + 1}. {q.question}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' : q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-orange-500/20 text-orange-300'}`}>
                            {q.difficulty}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-white/60" /> : <ChevronDown className="h-4 w-4 text-white/60" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 animate-fade-in">
                          <div className="space-y-2">
                            {q.options.map((opt, idx) => (
                              <div key={idx} className={`p-2.5 rounded-lg text-sm flex items-center gap-2 ${idx === q.correct_answer ? 'bg-green-500/20 text-green-200 font-semibold' : idx === userAnswer && !isCorrect ? 'bg-red-500/20 text-red-200 line-through' : 'bg-white/5 text-white/60'}`}>
                                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">{String.fromCharCode(65 + idx)}</span>
                                {opt}
                              </div>
                            ))}
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-xs text-white/90">💡 {q.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA: Accept Recommended or Override */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 text-center space-y-4">
              <img src={companion.image} alt={companion.name} className="w-16 h-16 mx-auto object-contain animate-float" />

              {!showOverride ? (
                <>
                  <Button
                    className="w-full bg-pixo-green hover:bg-pixo-green/90 text-white font-bold text-lg py-6 rounded-2xl"
                    disabled={savingLevel}
                    onClick={() => saveAndContinue(recommendedLevel)}
                  >
                    {savingLevel ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>Let's Begin! 🚀</>
                    )}
                  </Button>
                  <p className="text-white/50 text-xs">Suggested by PIXO (recommended)</p>
                  <Button
                    variant="ghost"
                    className="w-full text-white/70 hover:text-white hover:bg-white/10 font-semibold"
                    onClick={() => setShowOverride(true)}
                  >
                    Choose Level Manually
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-display font-bold text-white">Choose Your Level</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'beginner', label: 'Level 1: Sounds to Words', emoji: '🌱', rec: recommendedLevel === 'beginner' },
                      { id: 'intermediate', label: 'Level 2: Words to Sentences', emoji: '📖', rec: recommendedLevel === 'intermediate' },
                      { id: 'advanced', label: 'Level 3: Sentences to Conversation', emoji: '🗣️', rec: recommendedLevel === 'advanced' || recommendedLevel === 'fluent' },
                    ].map(lvl => (
                      <button
                        key={lvl.id}
                        onClick={() => setOverrideLevel(lvl.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                          overrideLevel === lvl.id
                            ? 'border-white bg-white/20 shadow-lg'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <span className="text-2xl">{lvl.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-white text-sm">{lvl.label}</p>
                          {lvl.rec && <span className="text-xs text-pixo-green">✨ Recommended</span>}
                        </div>
                        {overrideLevel === lvl.id && <Check className="h-5 w-5 text-white" />}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-pixo-green hover:bg-pixo-green/90 text-white font-bold text-lg py-6 rounded-2xl"
                    disabled={!overrideLevel || savingLevel}
                    onClick={() => overrideLevel && saveAndContinue(overrideLevel)}
                  >
                    {savingLevel ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Continue'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-white/60 hover:text-white"
                    onClick={() => { setShowOverride(false); setOverrideLevel(null); }}
                  >
                    ← Back to Recommendation
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: Quiz Screen
  // ═══════════════════════════════════════════════════════════
  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={companion.image} alt={companion.name} className="w-8 h-8 object-contain" />
              <span className="text-sm font-semibold text-muted-foreground">{currentQ + 1} / {questions.length}</span>
              <div className="w-32 h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-bg rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${timeLeft < 60 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-8 animate-fade-in" key={currentQ}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                  q.difficulty === 'easy' ? 'bg-pixo-green/10 text-pixo-green' :
                  q.difficulty === 'medium' ? 'bg-pixo-yellow/10 text-pixo-yellow' :
                  'bg-pixo-orange/10 text-pixo-orange'
                }`}>
                  {q.difficulty === 'easy' ? '⭐ Easy' : q.difficulty === 'medium' ? '⭐⭐ Medium' : '⭐⭐⭐ Hard'}
                </span>
                <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
              </div>
              <div className="flex items-start gap-3">
                <h2 className="text-xl md:text-2xl font-display font-bold flex-1 leading-relaxed">{q.question}</h2>
                <button
                  onClick={(e) => { e.stopPropagation(); speakText(q.question); }}
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors mt-1"
                >
                  <Volume2 className="h-5 w-5 text-primary" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">🔊 Tap the speaker to listen</p>
            </div>

            <div className="space-y-3">
              {q.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    onClick={() => selectAnswer(idx)}
                    className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                      answers[currentQ] === idx
                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      answers[currentQ] === idx ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium text-base">{option}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakText(option); }}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  >
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" size="lg" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button variant="gradient" size="lg" disabled={answers[currentQ] === null} onClick={() => setCurrentQ(currentQ + 1)}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button variant="gradient" size="lg" disabled={answers.some(a => a === null)} onClick={handleSubmit}>
                  Submit Assessment <Check className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Question dots */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {answers.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                    i === currentQ ? 'gradient-bg text-white scale-110' : a !== null ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ─── Fallback questions if AI fails ──────────────────────────
function getFallbackQuestions(): AIQuestion[] {
  return [
    { id: 1, question: 'Which letter does "Apple" start with?', options: ['B', 'A', 'C', 'D'], correct_answer: 1, difficulty: 'easy', explanation: '"Apple" starts with the letter A.', skill_area: 'phonics' },
    { id: 2, question: 'What sound does the letter "M" make?', options: ['/s/', '/m/', '/t/', '/b/'], correct_answer: 1, difficulty: 'easy', explanation: 'The letter M makes the /m/ sound.', skill_area: 'phonics' },
    { id: 3, question: 'Which word rhymes with "Cat"?', options: ['Dog', 'Bat', 'Cup', 'Sun'], correct_answer: 1, difficulty: 'easy', explanation: '"Bat" rhymes with "Cat".', skill_area: 'phonics' },
    { id: 4, question: 'What is the opposite of "Hot"?', options: ['Warm', 'Cold', 'Big', 'Fast'], correct_answer: 1, difficulty: 'medium', explanation: 'The opposite of "Hot" is "Cold".', skill_area: 'vocabulary' },
    { id: 5, question: 'Complete: "She _____ to school every day."', options: ['go', 'goes', 'going', 'gone'], correct_answer: 1, difficulty: 'medium', explanation: 'With she/he, we use "goes".', skill_area: 'grammar' },
    { id: 6, question: 'What is the plural of "Child"?', options: ['Childs', 'Childrens', 'Children', 'Childes'], correct_answer: 2, difficulty: 'medium', explanation: '"Children" is the plural of "Child".', skill_area: 'grammar' },
    { id: 7, question: 'Which word means "very large"?', options: ['Tiny', 'Enormous', 'Quick', 'Gentle'], correct_answer: 1, difficulty: 'medium', explanation: '"Enormous" means very large.', skill_area: 'vocabulary' },
    { id: 8, question: 'Choose the correctly punctuated sentence:', options: ['where are you going.', 'Where are you going?', 'Where are you going.', 'where are you going?'], correct_answer: 1, difficulty: 'hard', explanation: 'Questions start with a capital letter and end with "?".', skill_area: 'grammar' },
    { id: 9, question: '"Although it was raining, she went outside." What does "although" show?', options: ['Because', 'Contrast', 'Result', 'Time'], correct_answer: 1, difficulty: 'hard', explanation: '"Although" shows contrast.', skill_area: 'comprehension' },
    { id: 10, question: 'Which sentence uses the passive voice?', options: ['She wrote the essay.', 'The essay was written by her.', 'She is writing.', 'She will write.'], correct_answer: 1, difficulty: 'hard', explanation: '"The essay was written by her" is passive voice.', skill_area: 'grammar' },
  ];
}
