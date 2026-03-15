import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import pixoLogo from '@/assets/pixo-logo.png';
import { useCompanion } from '@/hooks/useCompanion';
import { Check, X, Clock, ArrowRight, ArrowLeft, Loader2, Trophy, ChevronDown, ChevronUp, Volume2, Mic } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  ageGroup: string; // which age groups this targets
}

// Preschool / Kindergarten questions — letter recognition, beginning sounds, phonics, image-word matching
const preschoolQuestions: Question[] = [
  { id: 101, question: 'Which letter does "Apple" start with?', options: ['B', 'A', 'C', 'D'], correct: 1, difficulty: 'easy', explanation: '"Apple" starts with the letter A.', ageGroup: 'preschool' },
  { id: 102, question: 'What sound does the letter "M" make?', options: ['/s/', '/m/', '/t/', '/b/'], correct: 1, difficulty: 'easy', explanation: 'The letter M makes the /m/ sound, like in "moon".', ageGroup: 'preschool' },
  { id: 103, question: 'Which picture starts with the "B" sound? 🏀🍎🐱🌻', options: ['Apple', 'Ball', 'Cat', 'Flower'], correct: 1, difficulty: 'easy', explanation: '"Ball" starts with the B sound.', ageGroup: 'preschool' },
  { id: 104, question: 'Which word rhymes with "Cat"?', options: ['Dog', 'Bat', 'Cup', 'Sun'], correct: 1, difficulty: 'easy', explanation: '"Bat" rhymes with "Cat" — they both end with "-at".', ageGroup: 'preschool' },
  { id: 105, question: 'How many letters are in the word "SUN"?', options: ['2', '3', '4', '5'], correct: 1, difficulty: 'easy', explanation: 'S-U-N has 3 letters.', ageGroup: 'preschool' },
  { id: 106, question: 'What color is the sky on a sunny day?', options: ['Red', 'Green', 'Blue', 'Yellow'], correct: 2, difficulty: 'easy', explanation: 'The sky looks blue on a sunny day.', ageGroup: 'preschool' },
  { id: 107, question: 'Which word starts with the same sound as "Dog"?', options: ['Cat', 'Duck', 'Fish', 'Ball'], correct: 1, difficulty: 'medium', explanation: '"Duck" and "Dog" both start with the /d/ sound.', ageGroup: 'preschool' },
  { id: 108, question: 'What is the missing letter? _at (like a cat)', options: ['B', 'C', 'D', 'F'], correct: 1, difficulty: 'medium', explanation: 'C-A-T spells "Cat".', ageGroup: 'preschool' },
  { id: 109, question: 'Which of these is a vowel?', options: ['B', 'E', 'T', 'N'], correct: 1, difficulty: 'medium', explanation: 'E is a vowel. The vowels are A, E, I, O, U.', ageGroup: 'preschool' },
  { id: 110, question: 'Point to the word that means a big animal with a trunk 🐘', options: ['Mouse', 'Elephant', 'Rabbit', 'Bird'], correct: 1, difficulty: 'medium', explanation: 'An elephant is a big animal with a trunk.', ageGroup: 'preschool' },
];

// Primary School (Grades 1-3) — word reading, short sentences, basic phonics, listening comprehension
const primaryQuestions: Question[] = [
  { id: 201, question: 'Which word is spelled correctly?', options: ['Frinds', 'Friends', 'Frends', 'Freands'], correct: 1, difficulty: 'easy', explanation: '"Friends" is the correct spelling.', ageGroup: 'primary_lower' },
  { id: 202, question: 'Complete: "The sun _____ in the morning."', options: ['sets', 'rises', 'falls', 'jumps'], correct: 1, difficulty: 'easy', explanation: 'The sun rises in the morning and sets in the evening.', ageGroup: 'primary_lower' },
  { id: 203, question: 'What is the opposite of "Hot"?', options: ['Warm', 'Cold', 'Big', 'Fast'], correct: 1, difficulty: 'easy', explanation: 'The opposite of "Hot" is "Cold".', ageGroup: 'primary_lower' },
  { id: 204, question: 'Read this sentence: "The cat sat on the mat." Where is the cat?', options: ['Under the mat', 'On the mat', 'In the mat', 'Behind the mat'], correct: 1, difficulty: 'easy', explanation: 'The cat is sitting ON the mat.', ageGroup: 'primary_lower' },
  { id: 205, question: 'Which word has the "sh" sound?', options: ['Chat', 'Ship', 'Chip', 'Think'], correct: 1, difficulty: 'medium', explanation: '"Ship" contains the "sh" sound.', ageGroup: 'primary_lower' },
  { id: 206, question: 'Choose the correct sentence:', options: ['She go to school.', 'She goes to school.', 'She going school.', 'She goed to school.'], correct: 1, difficulty: 'medium', explanation: 'With she/he, we use "goes" in simple present tense.', ageGroup: 'primary_lower' },
  { id: 207, question: 'What is the plural of "Child"?', options: ['Childs', 'Childrens', 'Children', 'Childes'], correct: 2, difficulty: 'medium', explanation: '"Children" is the irregular plural of "Child".', ageGroup: 'primary_lower' },
  { id: 208, question: '"He is very _____ because he didn\'t sleep well."', options: ['happy', 'tired', 'hungry', 'angry'], correct: 1, difficulty: 'medium', explanation: 'Not sleeping well makes someone "tired".', ageGroup: 'primary_lower' },
  { id: 209, question: 'Which word is a verb?', options: ['Beautiful', 'Quickly', 'Running', 'Happy'], correct: 2, difficulty: 'hard', explanation: '"Running" is a verb (action word).', ageGroup: 'primary_lower' },
  { id: 210, question: 'Choose the correct past tense: "Yesterday, I _____ to the park."', options: ['go', 'goes', 'went', 'going'], correct: 2, difficulty: 'hard', explanation: '"Went" is the past tense of "go".', ageGroup: 'primary_lower' },
];

// Upper Primary (Grades 4-6) — sentence correction, reading comprehension, vocabulary, pronunciation
const upperPrimaryQuestions: Question[] = [
  { id: 301, question: 'Which sentence is grammatically correct?', options: ['Me and him went.', 'He and I went.', 'Him and me went.', 'I and he went.'], correct: 1, difficulty: 'easy', explanation: '"He and I went" is correct. Use "I" as subject, not "me".', ageGroup: 'primary_upper' },
  { id: 302, question: 'What does "enormous" mean?', options: ['Very small', 'Very large', 'Very fast', 'Very old'], correct: 1, difficulty: 'easy', explanation: '"Enormous" means very large or huge.', ageGroup: 'primary_upper' },
  { id: 303, question: 'Which word is an antonym of "generous"?', options: ['Kind', 'Stingy', 'Brave', 'Gentle'], correct: 1, difficulty: 'medium', explanation: '"Stingy" means not willing to give, the opposite of generous.', ageGroup: 'primary_upper' },
  { id: 304, question: 'Read: "The forest was dense and dark." What does "dense" describe here?', options: ['The forest is empty', 'Trees are close together', 'It was morning', 'Animals were hiding'], correct: 1, difficulty: 'medium', explanation: '"Dense" means thick, with trees close together.', ageGroup: 'primary_upper' },
  { id: 305, question: 'Choose the correctly punctuated sentence:', options: ['where are you going.', 'Where are you going?', 'Where are you going.', 'where are you going?'], correct: 1, difficulty: 'medium', explanation: 'Questions start with a capital letter and end with "?".', ageGroup: 'primary_upper' },
  { id: 306, question: 'Which sentence uses the correct article?', options: ['I saw an elephant at a zoo.', 'I saw a elephant at an zoo.', 'I saw an elephant at an zoo.', 'I saw a elephant at a zoo.'], correct: 0, difficulty: 'medium', explanation: 'Use "an" before vowel sounds and "a" before consonant sounds.', ageGroup: 'primary_upper' },
  { id: 307, question: '"Although it was raining, she went outside." What does "although" show?', options: ['Because', 'Contrast', 'Result', 'Time'], correct: 1, difficulty: 'hard', explanation: '"Although" shows contrast — something unexpected.', ageGroup: 'primary_upper' },
  { id: 308, question: 'Which word has a silent letter?', options: ['Cat', 'Knight', 'Dog', 'Sun'], correct: 1, difficulty: 'hard', explanation: '"Knight" has a silent K — it\'s pronounced "nite".', ageGroup: 'primary_upper' },
  { id: 309, question: 'Complete: "Neither the teacher _____ the students were late."', options: ['or', 'and', 'nor', 'but'], correct: 2, difficulty: 'hard', explanation: '"Neither...nor" is the correct pair.', ageGroup: 'primary_upper' },
  { id: 310, question: '"The quick brown fox jumps over the lazy dog." How many adjectives are there?', options: ['1', '2', '3', '4'], correct: 2, difficulty: 'hard', explanation: 'Quick, brown, and lazy are all adjectives (3 total).', ageGroup: 'primary_upper' },
];

// Middle School (Grades 7-8) — grammar correction, paragraph reading, vocabulary usage, sentence structure
const middleSchoolQuestions: Question[] = [
  { id: 401, question: 'Which sentence has correct subject-verb agreement?', options: ['The team are winning.', 'The team is winning.', 'The team were winning.', 'The team be winning.'], correct: 1, difficulty: 'easy', explanation: '"Team" is a collective noun treated as singular: "is winning".', ageGroup: 'middle' },
  { id: 402, question: 'What is a synonym of "meticulous"?', options: ['Careless', 'Thorough', 'Quick', 'Lazy'], correct: 1, difficulty: 'medium', explanation: '"Meticulous" means very careful and precise, synonym: thorough.', ageGroup: 'middle' },
  { id: 403, question: '"If I _____ taller, I would play basketball."', options: ['am', 'was', 'were', 'be'], correct: 2, difficulty: 'medium', explanation: 'In subjunctive mood (hypothetical), use "were" regardless of subject.', ageGroup: 'middle' },
  { id: 404, question: 'Which is a compound sentence?', options: ['The dog barked.', 'I like cats and dogs.', 'She sang, and he danced.', 'Running fast.'], correct: 2, difficulty: 'medium', explanation: 'A compound sentence joins two independent clauses.', ageGroup: 'middle' },
  { id: 405, question: 'Choose the word that best completes: "The scientist made an important _____ in the laboratory."', options: ['invention', 'discovery', 'decision', 'adventure'], correct: 1, difficulty: 'medium', explanation: 'Scientists make "discoveries" in laboratories.', ageGroup: 'middle' },
  { id: 406, question: 'Read: "Tom was late because the bus broke down." Why was Tom late?', options: ['He forgot his bag.', 'The bus had a problem.', 'He woke up late.', 'It was raining.'], correct: 1, difficulty: 'medium', explanation: '"The bus broke down" means mechanical problem.', ageGroup: 'middle' },
  { id: 407, question: 'Identify the figure of speech: "Time is money."', options: ['Simile', 'Metaphor', 'Alliteration', 'Hyperbole'], correct: 1, difficulty: 'hard', explanation: 'This is a metaphor — comparing time to money directly.', ageGroup: 'middle' },
  { id: 408, question: '"Despite the heavy rain, _____ ." Choose the best ending.', options: ['it stopped.', 'the match was cancelled.', 'the players continued.', 'they slept well.'], correct: 2, difficulty: 'hard', explanation: '"Despite" shows contrast — they continued despite rain.', ageGroup: 'middle' },
  { id: 409, question: 'Which sentence uses the passive voice?', options: ['She wrote the essay.', 'The essay was written by her.', 'She is writing an essay.', 'She will write an essay.'], correct: 1, difficulty: 'hard', explanation: '"The essay was written by her" is passive voice.', ageGroup: 'middle' },
  { id: 410, question: 'What does "ubiquitous" mean?', options: ['Rare', 'Present everywhere', 'Dangerous', 'Beautiful'], correct: 1, difficulty: 'hard', explanation: '"Ubiquitous" means found everywhere.', ageGroup: 'middle' },
];

const TOTAL_TIME = 600; // 10 minutes

function getQuestionsForAgeGroup(ageGroup: string | null): Question[] {
  switch (ageGroup) {
    case 'preschool': return preschoolQuestions;
    case 'primary_lower': return primaryQuestions;
    case 'primary_upper': return upperPrimaryQuestions;
    case 'middle': return middleSchoolQuestions;
    default: return primaryQuestions; // default fallback
  }
}

export default function LaunchCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companion = useCompanion();

  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
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

  // Load learner profile age group
  useEffect(() => {
    if (!user) return;
    supabase.from('learner_profiles').select('age_group').eq('student_id', user.id).maybeSingle()
      .then(({ data }) => {
        const ag = data?.age_group || null;
        setAgeGroup(ag);
        const qs = getQuestionsForAgeGroup(ag);
        setQuestions(qs);
        setAnswers(Array(qs.length).fill(null));
      });
  }, [user]);

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
    const answerDetails = questions.map((q, i) => ({
      questionId: q.id,
      selected: answers[i],
      correct: q.correct,
      isCorrect: answers[i] === q.correct,
    }));
    answerDetails.forEach(a => { if (a.isCorrect) correct++; });

    const totalQ = questions.length;
    let level: string;
    if (correct <= totalQ * 0.35) {
      level = 'beginner';
    } else if (correct <= totalQ * 0.7) {
      level = 'intermediate';
    } else {
      level = 'advanced';
    }

    setScore(correct);
    setAssignedLevel(level);

    if (!user) { setLoading(false); return; }

    try {
      await supabase.from('assessment_results').upsert({
        student_id: user.id,
        score: correct,
        total_questions: totalQ,
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
  }, [answers, isFinished, timeLeft, user, questions]);

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
    if (level === 'intermediate') return '🚀';
    return '⭐';
  };

  const getLevelName = (level: string) => {
    if (level === 'beginner') return 'Level 1: Sounds to Words';
    if (level === 'intermediate') return 'Level 2: Words to Sentences';
    return 'Level 3: Sentences to Conversation';
  };

  const getScoreComment = () => {
    const pct = questions.length > 0 ? score / questions.length : 0;
    if (pct <= 0.2) return { emoji: '💪', title: 'Great start!', message: "Don't worry, everyone starts somewhere. PIXO will build your skills step by step with fun lessons tailored just for you!" };
    if (pct <= 0.4) return { emoji: '🌱', title: 'Good foundation!', message: "You know the basics! Let's strengthen your vocabulary and grammar with daily practice." };
    if (pct <= 0.6) return { emoji: '📚', title: 'Nice work!', message: "You have solid basics. Time to level up with more challenging sentences and conversations!" };
    if (pct <= 0.7) return { emoji: '🚀', title: 'Impressive!', message: "You're doing great! Let's polish your grammar and build advanced communication skills." };
    if (pct <= 0.9) return { emoji: '🌟', title: 'Excellent!', message: "Your English is strong! Time to master complex structures and boost your confidence." };
    return { emoji: '🏆', title: 'Outstanding!', message: "You're a language star! Let's take you to the next level with advanced conversations and creative expression." };
  };

  const getDifficultyBreakdown = () => {
    const easy = questions.filter(q => q.difficulty === 'easy');
    const medium = questions.filter(q => q.difficulty === 'medium');
    const hard = questions.filter(q => q.difficulty === 'hard');

    const easyScore = easy.filter(q => answers[questions.indexOf(q)] === q.correct).length;
    const mediumScore = medium.filter(q => answers[questions.indexOf(q)] === q.correct).length;
    const hardScore = hard.filter(q => answers[questions.indexOf(q)] === q.correct).length;

    return { easy: easyScore, easyTotal: easy.length, medium: mediumScore, mediumTotal: medium.length, hard: hardScore, hardTotal: hard.length };
  };

  // Wait for questions to load
  if (questions.length === 0) {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="animate-pulse text-center">
            <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-4" />
            <p className="text-white/80">Loading your assessment...</p>
          </div>
        </div>
      </Layout>
    );
  }

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
              <p className="text-white/80 text-lg">
                Let's personalize your child's English learning journey in under 60 seconds.
              </p>
              <p className="text-white/60 text-sm">
                Answer {questions.length} English questions to find the perfect starting level. You have <strong>10 minutes</strong>.
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
              <img src={companion.image} alt={companion.name} className="w-20 h-20 mx-auto object-contain animate-float" />
              <div className="text-6xl">{comment.emoji}</div>
              <h1 className="text-3xl font-display font-bold text-white">{comment.title}</h1>
              <p className="text-white/80 text-lg">
                You scored <span className="font-bold text-white text-2xl">{score}/{questions.length}</span>
              </p>
              <p className="text-white/70 text-sm max-w-md mx-auto">{comment.message}</p>

              {/* Level Recommendation */}
              <div className="bg-white/20 rounded-2xl p-5">
                <p className="text-sm text-white/70 mb-2">Recommended Level:</p>
                <h2 className="text-2xl font-display font-bold text-white flex items-center justify-center gap-2">
                  {getLevelEmoji(assignedLevel)} {getLevelName(assignedLevel)}
                </h2>
                <p className="text-xs text-white/60 mt-2">
                  Based on phonics recognition, listening response, and reading confidence
                </p>
              </div>

              {/* Focus Areas */}
              <div className="bg-white/10 rounded-2xl p-4 text-left">
                <p className="text-sm font-semibold text-white mb-2">📊 Focus Areas:</p>
                <div className="space-y-1">
                  {breakdown.easyTotal > 0 && breakdown.easy < breakdown.easyTotal && (
                    <p className="text-xs text-white/70">• Phonics & basic recognition needs practice</p>
                  )}
                  {breakdown.mediumTotal > 0 && breakdown.medium < breakdown.mediumTotal && (
                    <p className="text-xs text-white/70">• Reading fluency & vocabulary building</p>
                  )}
                  {breakdown.hardTotal > 0 && breakdown.hard < breakdown.hardTotal && (
                    <p className="text-xs text-white/70">• Advanced pronunciation & comprehension</p>
                  )}
                </div>
              </div>

              {/* Estimated Plan */}
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-sm text-white/80">
                  ⏱ <strong>30 minutes/day</strong> · Estimated completion: <strong>6 months</strong>
                </p>
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
                {questions.map((q, i) => {
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
                    className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-2xl"
                    disabled={loading}
                    onClick={() => {
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
                        ✅ Choose Recommended Level
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-white/80 hover:text-white hover:bg-white/10 font-semibold py-5"
                    onClick={() => navigate('/pricing')}
                  >
                    Choose Another Level
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-display font-bold text-white">
                    Start Your Learning Journey 🚀
                  </h3>
                  <p className="text-white/70 text-sm">
                    Your personalized learning path is ready. Let's begin!
                  </p>
                  <Button
                    className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-2xl"
                    disabled={loading}
                    onClick={() => navigate('/journey')}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        Start Learning Journey
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-white/80 hover:text-white hover:bg-white/10 font-semibold"
                    onClick={() => navigate('/pricing')}
                  >
                    View Pricing Plans
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Quiz screen
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
              <span className="text-sm font-semibold text-muted-foreground">
                {currentQ + 1} / {questions.length}
              </span>
              <div className="w-32 h-2.5 bg-muted rounded-full overflow-hidden">
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
                <h2 className="text-xl md:text-2xl font-display font-bold flex-1 leading-relaxed">
                  {q.question}
                </h2>
                <button
                  onClick={(e) => { e.stopPropagation(); speakText(q.question); }}
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors mt-1"
                  title="Tap the speaker to hear the question"
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
                      answers[currentQ] === idx
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium text-base">{option}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakText(option); }}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    title="Listen before you answer"
                  >
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                size="lg"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(currentQ - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentQ < questions.length - 1 ? (
                <Button
                  variant="gradient"
                  size="lg"
                  disabled={answers[currentQ] === null}
                  onClick={() => setCurrentQ(currentQ + 1)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="lg"
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
                  className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
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
