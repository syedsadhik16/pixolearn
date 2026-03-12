import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { useCompanion } from '@/hooks/useCompanion';
import { Check, X, Clock, ArrowRight, ArrowLeft, Loader2, Trophy, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

const questionBank: Question[] = [
  // Easy (1-5)
  { id: 1, question: 'Which letter does the word "Apple" start with?', options: ['B', 'A', 'C', 'D'], correct: 1, difficulty: 'easy', explanation: '"Apple" starts with the letter A.' },
  { id: 2, question: 'What is the opposite of "Hot"?', options: ['Warm', 'Cold', 'Big', 'Fast'], correct: 1, difficulty: 'easy', explanation: 'The opposite of "Hot" is "Cold".' },
  { id: 3, question: 'Which word rhymes with "Cat"?', options: ['Dog', 'Bat', 'Cup', 'Sun'], correct: 1, difficulty: 'easy', explanation: '"Bat" rhymes with "Cat" — they both end with "-at".' },
  { id: 4, question: 'What color is the sky on a clear day?', options: ['Red', 'Green', 'Blue', 'Yellow'], correct: 2, difficulty: 'easy', explanation: 'The sky appears blue on a clear day due to how sunlight scatters.' },
  { id: 5, question: 'Complete: "The _____ is shining."', options: ['moon', 'sun', 'star', 'cloud'], correct: 1, difficulty: 'easy', explanation: '"The sun is shining" is the most natural expression.' },
  // Medium (6-10)
  { id: 6, question: 'Choose the correct sentence:', options: ['She go to school.', 'She goes to school.', 'She going school.', 'She goed to school.'], correct: 1, difficulty: 'medium', explanation: 'With third person singular (she/he), we use "goes" in simple present tense.' },
  { id: 7, question: 'What is the plural of "Child"?', options: ['Childs', 'Childrens', 'Children', 'Childes'], correct: 2, difficulty: 'medium', explanation: '"Children" is the irregular plural of "Child".' },
  { id: 8, question: '"He is very _____ because he didn\'t sleep well." Choose the best word:', options: ['happy', 'tired', 'hungry', 'angry'], correct: 1, difficulty: 'medium', explanation: 'Not sleeping well makes someone "tired".' },
  { id: 9, question: 'Which word is a verb?', options: ['Beautiful', 'Quickly', 'Running', 'Happy'], correct: 2, difficulty: 'medium', explanation: '"Running" is a verb (action word). Beautiful and Happy are adjectives, Quickly is an adverb.' },
  { id: 10, question: 'Choose the correct past tense: "Yesterday, I _____ to the park."', options: ['go', 'goes', 'went', 'going'], correct: 2, difficulty: 'medium', explanation: '"Went" is the past tense of "go".' },
  // Hard (11-15)
  { id: 11, question: 'Which sentence uses the correct article?', options: ['I saw an elephant at a zoo.', 'I saw a elephant at an zoo.', 'I saw an elephant at an zoo.', 'I saw a elephant at a zoo.'], correct: 0, difficulty: 'hard', explanation: 'Use "an" before vowel sounds (elephant) and "a" before consonant sounds (zoo).' },
  { id: 12, question: 'Read: "Tom was late because the bus broke down." Why was Tom late?', options: ['He forgot his bag.', 'The bus had a problem.', 'He woke up late.', 'It was raining.'], correct: 1, difficulty: 'hard', explanation: '"The bus broke down" means the bus had a mechanical problem.' },
  { id: 13, question: '"If I _____ taller, I would play basketball." Fill in the blank:', options: ['am', 'was', 'were', 'be'], correct: 2, difficulty: 'hard', explanation: 'In the subjunctive mood (hypothetical situations), we use "were" regardless of the subject.' },
  { id: 14, question: 'Which is a compound sentence?', options: ['The dog barked.', 'I like cats and dogs.', 'She sang, and he danced.', 'Running fast.'], correct: 2, difficulty: 'hard', explanation: 'A compound sentence joins two independent clauses with a conjunction: "She sang" + "he danced".' },
  { id: 15, question: 'Choose the word that best completes: "The scientist made an important _____ in the laboratory."', options: ['invention', 'discovery', 'decision', 'adventure'], correct: 1, difficulty: 'hard', explanation: 'A "discovery" is finding something new, which is what scientists do in laboratories.' },
];

const TOTAL_TIME = 600;

export default function LaunchCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companion = useCompanion();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(15).fill(null));
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [assignedLevel, setAssignedLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const fromPricing = new URLSearchParams(window.location.search).get('from') === 'pricing';
  const selectedPlan = (() => {
    try { return JSON.parse(sessionStorage.getItem('selectedPlan') || 'null'); } catch { return null; }
  })();

  const getLevelRecommendation = (level: string, levelCount: number) => {
    const levelMap: Record<string, string[]> = {
      beginner: ['Level 1', 'Level 2', 'Level 3'],
      intermediate: ['Level 2', 'Level 3', 'Level 1'],
      advanced: ['Level 3', 'Level 1', 'Level 2'],
    };
    const ordered = levelMap[level] || levelMap.beginner;
    return ordered.slice(0, levelCount);
  };

  useEffect(() => {
    if (!started || isFinished) return;
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
  }, [started, isFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (isFinished) return;
    setIsFinished(true);
    setLoading(true);

    let correct = 0;
    const answerDetails = questionBank.map((q, i) => ({
      questionId: q.id,
      selected: answers[i],
      correct: q.correct,
      isCorrect: answers[i] === q.correct,
    }));
    answerDetails.forEach(a => { if (a.isCorrect) correct++; });

    let level: string;
    if (correct <= 5) {
      level = 'beginner';
    } else if (correct <= 10) {
      level = 'intermediate';
    } else {
      level = 'advanced';
    }

    setScore(correct);
    setAssignedLevel(level);

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      await supabase.from('assessment_results').upsert({
        student_id: user.id,
        score: correct,
        total_questions: 15,
        assigned_level: level,
        time_taken_seconds: TOTAL_TIME - timeLeft,
        answers: answerDetails,
      }, { onConflict: 'student_id' });

      await supabase.from('student_progress').update({
        current_level: level as 'beginner' | 'intermediate' | 'advanced',
        current_day: 1,
      }).eq('student_id', user.id);
    } catch (error) {
      console.error('Error saving assessment:', error);
    } finally {
      setLoading(false);
    }
  }, [answers, isFinished, timeLeft, user]);

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getLevelEmoji = (level: string) => {
    if (level === 'beginner') return '🌱';
    if (level === 'intermediate') return '🚀';
    return '⭐';
  };

  const getLevelName = (level: string) => {
    if (level === 'beginner') return 'Level 1: Sounds to Words';
    if (level === 'intermediate') return 'Level 2: Words to Sentences';
    return 'Level 3: Sentences to Conversation';
  };

  const getScoreComment = () => {
    if (score <= 3) return { emoji: '💪', title: 'Great start!', message: "Don't worry, everyone starts somewhere. PIXO will build your skills step by step with fun lessons tailored just for you!" };
    if (score <= 5) return { emoji: '🌱', title: 'Good foundation!', message: "You know the basics! Let's strengthen your vocabulary and grammar with daily practice." };
    if (score <= 8) return { emoji: '📚', title: 'Nice work!', message: "You have solid basics. Time to level up with more challenging sentences and conversations!" };
    if (score <= 10) return { emoji: '🚀', title: 'Impressive!', message: "You're doing great! Let's polish your grammar and build advanced communication skills." };
    if (score <= 13) return { emoji: '🌟', title: 'Excellent!', message: "Your English is strong! Time to master complex structures and boost your confidence." };
    return { emoji: '🏆', title: 'Outstanding!', message: "You're a language star! Let's take you to the next level with advanced conversations and creative expression." };
  };

  const getDifficultyBreakdown = () => {
    const easy = questionBank.filter(q => q.difficulty === 'easy');
    const medium = questionBank.filter(q => q.difficulty === 'medium');
    const hard = questionBank.filter(q => q.difficulty === 'hard');

    const easyScore = easy.filter((q, i) => answers[questionBank.indexOf(q)] === q.correct).length;
    const mediumScore = medium.filter(q => answers[questionBank.indexOf(q)] === q.correct).length;
    const hardScore = hard.filter(q => answers[questionBank.indexOf(q)] === q.correct).length;

    return { easy: easyScore, easyTotal: easy.length, medium: mediumScore, mediumTotal: medium.length, hard: hardScore, hardTotal: hard.length };
  };

  // Intro screen
  if (!started) {
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
              <p className="text-white/80">
                Answer 15 English questions to find your perfect starting level. You have <strong>10 minutes</strong>.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-white">15</p>
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
                className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6"
                onClick={() => setStarted(true)}
              >
                Start Assessment
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Results screen
  if (isFinished) {
    const comment = getScoreComment();
    const breakdown = getDifficultyBreakdown();

    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Score Summary */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center space-y-5 animate-fade-in">
              <div className="text-6xl">{comment.emoji}</div>
              <h1 className="text-3xl font-display font-bold text-white">{comment.title}</h1>
              <p className="text-white/80 text-lg">
                You scored <span className="font-bold text-white text-2xl">{score}/15</span>
              </p>
              <p className="text-white/70 text-sm max-w-md mx-auto">{comment.message}</p>

              {/* Level Assignment */}
              <div className="bg-white/20 rounded-2xl p-5">
                <p className="text-sm text-white/70 mb-2">Your assigned level:</p>
                <h2 className="text-2xl font-display font-bold text-white flex items-center justify-center gap-2">
                  {getLevelEmoji(assignedLevel)} {getLevelName(assignedLevel)}
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

            {/* Review Answers Toggle */}
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex items-center justify-between text-white hover:bg-white/15 transition-colors"
            >
              <span className="font-display font-bold">📝 Review All Answers</span>
              {showReview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {/* Answer Review */}
            {showReview && (
              <div className="space-y-3 animate-fade-in">
                {questionBank.map((q, i) => {
                  const userAnswer = answers[i];
                  const isCorrect = userAnswer === q.correct;
                  const isExpanded = expandedQ === i;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border-2 overflow-hidden transition-all ${
                        isCorrect
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedQ(isExpanded ? null : i)}
                        className="w-full p-4 flex items-start gap-3 text-left"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {isCorrect ? <Check className="h-4 w-4 text-white" /> : <X className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">Q{i + 1}. {q.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              q.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                              q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-orange-500/20 text-orange-300'
                            }`}>
                              {q.difficulty}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-white/60 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/60 flex-shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 animate-fade-in">
                          <div className="space-y-2">
                            {q.options.map((opt, idx) => (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-lg text-sm flex items-center gap-2 ${
                                  idx === q.correct
                                    ? 'bg-green-500/20 text-green-200 font-semibold'
                                    : idx === userAnswer && !isCorrect
                                    ? 'bg-red-500/20 text-red-200 line-through'
                                    : 'bg-white/5 text-white/60'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                                {idx === q.correct && <Check className="h-3.5 w-3.5 ml-auto text-green-400" />}
                                {idx === userAnswer && !isCorrect && <X className="h-3.5 w-3.5 ml-auto text-red-400" />}
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

            {/* CTA */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 text-center space-y-4">
              <img src={companion.image} alt={companion.name} className="w-16 h-16 mx-auto object-contain animate-float" />
              {fromPricing && selectedPlan ? (
                <>
                  <h3 className="text-xl font-display font-bold text-white">
                    Your recommended levels 🎯
                  </h3>
                  <div className="bg-white/10 rounded-xl p-4 space-y-2">
                    <p className="text-sm text-white/70">
                      Based on your score, we recommend starting with:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {getLevelRecommendation(assignedLevel, selectedPlan.levelCount).map((lvl: string) => (
                        <span key={lvl} className="bg-white/20 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                          {lvl}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      {selectedPlan.name} Plan • {selectedPlan.levelCount} level{selectedPlan.levelCount > 1 ? 's' : ''} included
                    </p>
                  </div>
                  <Button
                    className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6"
                    disabled={loading}
                    onClick={() => {
                      // Store the recommended levels alongside the plan
                      const levels = getLevelRecommendation(assignedLevel, selectedPlan.levelCount);
                      sessionStorage.setItem('selectedPlan', JSON.stringify({
                        ...selectedPlan,
                        recommendedLevels: levels,
                        assessedLevel: assignedLevel,
                      }));
                      navigate('/pricing?proceed=payment');
                    }}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        Continue to Payment
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-display font-bold text-white">
                    Ready to start your journey? 🚀
                  </h3>
                  <p className="text-white/70 text-sm">
                    Choose a plan to unlock all lessons and features tailored to your level.
                  </p>
                  <Button
                    className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6"
                    disabled={loading}
                    onClick={() => navigate('/pricing')}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        Choose Your Plan
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              )}
              <button
                onClick={() => navigate('/student')}
                className="text-white/50 text-sm hover:text-white/80 transition-colors underline"
              >
                Skip for now (Free plan)
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Quiz screen
  const q = questionBank[currentQ];
  const progress = ((currentQ + 1) / 15) * 100;

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">
                {currentQ + 1} / 15
              </span>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-bg rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              timeLeft < 60 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-8 animate-fade-in" key={currentQ}>
            <div className="space-y-2">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                q.difficulty === 'easy' ? 'bg-pixo-green/10 text-pixo-green' :
                q.difficulty === 'medium' ? 'bg-pixo-yellow/10 text-pixo-yellow' :
                'bg-pixo-orange/10 text-pixo-orange'
              }`}>
                {q.difficulty === 'easy' ? '⭐ Easy' : q.difficulty === 'medium' ? '⭐⭐ Medium' : '⭐⭐⭐ Hard'}
              </span>
              <h2 className="text-xl md:text-2xl font-display font-bold">
                {q.question}
              </h2>
            </div>

            <div className="space-y-3">
              {q.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                    answers[currentQ] === idx
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    answers[currentQ] === idx
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(currentQ - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentQ < 14 ? (
                <Button
                  variant="gradient"
                  disabled={answers[currentQ] === null}
                  onClick={() => setCurrentQ(currentQ + 1)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  disabled={answers.some(a => a === null)}
                  onClick={handleSubmit}
                >
                  Submit Assessment
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Question dots */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {answers.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    i === currentQ
                      ? 'gradient-bg text-white scale-110'
                      : a !== null
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
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
