import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { Check, X, Clock, ArrowRight, Loader2, Trophy } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Question bank organized by difficulty
const questionBank: Question[] = [
  // Easy (1-5)
  { id: 1, question: 'Which letter does the word "Apple" start with?', options: ['B', 'A', 'C', 'D'], correct: 1, difficulty: 'easy' },
  { id: 2, question: 'What is the opposite of "Hot"?', options: ['Warm', 'Cold', 'Big', 'Fast'], correct: 1, difficulty: 'easy' },
  { id: 3, question: 'Which word rhymes with "Cat"?', options: ['Dog', 'Bat', 'Cup', 'Sun'], correct: 1, difficulty: 'easy' },
  { id: 4, question: 'What color is the sky on a clear day?', options: ['Red', 'Green', 'Blue', 'Yellow'], correct: 2, difficulty: 'easy' },
  { id: 5, question: 'Complete: "The _____ is shining."', options: ['moon', 'sun', 'star', 'cloud'], correct: 1, difficulty: 'easy' },
  // Medium (6-10)
  { id: 6, question: 'Choose the correct sentence:', options: ['She go to school.', 'She goes to school.', 'She going school.', 'She goed to school.'], correct: 1, difficulty: 'medium' },
  { id: 7, question: 'What is the plural of "Child"?', options: ['Childs', 'Childrens', 'Children', 'Childes'], correct: 2, difficulty: 'medium' },
  { id: 8, question: '"He is very _____ because he didn\'t sleep well." Choose the best word:', options: ['happy', 'tired', 'hungry', 'angry'], correct: 1, difficulty: 'medium' },
  { id: 9, question: 'Which word is a verb?', options: ['Beautiful', 'Quickly', 'Running', 'Happy'], correct: 2, difficulty: 'medium' },
  { id: 10, question: 'Choose the correct past tense: "Yesterday, I _____ to the park."', options: ['go', 'goes', 'went', 'going'], correct: 2, difficulty: 'medium' },
  // Hard (11-15)
  { id: 11, question: 'Which sentence uses the correct article?', options: ['I saw an elephant at a zoo.', 'I saw a elephant at an zoo.', 'I saw an elephant at an zoo.', 'I saw a elephant at a zoo.'], correct: 0, difficulty: 'hard' },
  { id: 12, question: 'Read: "Tom was late because the bus broke down." Why was Tom late?', options: ['He forgot his bag.', 'The bus had a problem.', 'He woke up late.', 'It was raining.'], correct: 1, difficulty: 'hard' },
  { id: 13, question: '"If I _____ taller, I would play basketball." Fill in the blank:', options: ['am', 'was', 'were', 'be'], correct: 2, difficulty: 'hard' },
  { id: 14, question: 'Which is a compound sentence?', options: ['The dog barked.', 'I like cats and dogs.', 'She sang, and he danced.', 'Running fast.'], correct: 2, difficulty: 'hard' },
  { id: 15, question: 'Choose the word that best completes: "The scientist made an important _____ in the laboratory."', options: ['invention', 'discovery', 'decision', 'adventure'], correct: 1, difficulty: 'hard' },
];

const TOTAL_TIME = 600; // 10 minutes in seconds

export default function LaunchCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(15).fill(null));
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [assignedLevel, setAssignedLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  // Timer
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

    // Calculate score
    let correct = 0;
    const answerDetails = questionBank.map((q, i) => ({
      questionId: q.id,
      selected: answers[i],
      correct: q.correct,
      isCorrect: answers[i] === q.correct,
    }));
    answerDetails.forEach(a => { if (a.isCorrect) correct++; });

    // Assign level based on score
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
      // Save assessment result
      await supabase.from('assessment_results').upsert({
        student_id: user.id,
        score: correct,
        total_questions: 15,
        assigned_level: level,
        time_taken_seconds: TOTAL_TIME - timeLeft,
        answers: answerDetails,
      }, { onConflict: 'student_id' });

      // Update student progress with assigned level
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

  // Intro screen
  if (!started) {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
            <img src={pixoLogo} alt="PIXO" className="h-16 mx-auto animate-float" />
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 space-y-6">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <Trophy className="h-10 w-10 text-white" />
              </div>
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
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 space-y-6">
              <div className="text-6xl animate-bounce-gentle">{getLevelEmoji(assignedLevel)}</div>
              <h1 className="text-3xl font-display font-bold text-white">
                Mission Confirmed!
              </h1>
              <p className="text-white/80 text-lg">
                You scored <span className="font-bold text-white">{score}/15</span>
              </p>
              <div className="bg-white/20 rounded-2xl p-6">
                <p className="text-sm text-white/70 mb-2">Your starting point:</p>
                <h2 className="text-2xl font-display font-bold text-white">
                  {getLevelName(assignedLevel)}
                </h2>
              </div>
              <p className="text-white/70 text-sm">
                Don't worry — every expert was once a beginner. Your adventure starts now! 🎉
              </p>
              <Button
                className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6"
                disabled={loading}
                onClick={() => navigate('/student')}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Let's Begin!"}
              </Button>
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
