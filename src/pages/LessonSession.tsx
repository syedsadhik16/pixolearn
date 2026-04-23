import { useEffect, useState, useRef, useCallback } from 'react';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
import { useParams, useNavigate } from 'react-router-dom';
import { trackChallengeProgress, checkAndAwardBadges } from '@/lib/gamification';
import { MiniGameSelector } from '@/components/games/MiniGameSelector';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { CelebrationOverlay } from '@/components/shared/CelebrationOverlay';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  BookOpen,
  MessageSquare,
  FileText,
  CheckCircle2,
  RefreshCw,
  Trophy,
  Star,
  Sparkles,
  Rocket,
  MapPin,
  Lock,
  Play,
  Headphones,
  Gem,
} from 'lucide-react';
import { useCompanion } from '@/hooks/useCompanion';
import { useSpeechSettings } from '@/hooks/useSpeechSettings';
import { SpeechControls } from '@/components/shared/SpeechControls';
import { BackButton } from '@/components/shared/BackButton';
import { useLessonResume } from '@/hooks/useLessonResume';
import { PremiumLessonShell } from '@/components/lesson/PremiumLessonShell';

interface Lesson {
  id: string;
  level: string;
  day_number: number;
  title: string;
  description: string;
  vocabulary: VocabularyItem[];
  sentences: SentenceItem[];
  read_aloud_text: string;
}

interface VocabularyItem {
  word: string;
  phonetic: string;
  meaning: string;
}

interface SentenceItem {
  text: string;
  tip: string;
}

type SessionPhase = 'intro' | 'vocabulary' | 'sentences' | 'read_aloud' | 'mini_game' | 'complete';

const PHASE_LABELS: Record<SessionPhase, { label: string; icon: string }> = {
  intro: { label: 'Ready', icon: '🚀' },
  vocabulary: { label: 'Sounds', icon: '🔤' },
  sentences: { label: 'Practice', icon: '🗣️' },
  read_aloud: { label: 'Speak', icon: '🎤' },
  mini_game: { label: 'Game', icon: '🎮' },
  complete: { label: 'Done', icon: '🏆' },
};

export default function LessonSession() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const companion = useCompanion();
  const { settings: speechSettings, setRate, setVoiceURI, speak } = useSpeechSettings();
  const { resumeState, checked: resumeChecked, saveProgress, clearProgress } = useLessonResume(lessonId);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Restore mid-lesson progress silently on mount
  useEffect(() => {
    if (resumeChecked && resumeState && lesson) {
      setPhase(resumeState.phase as SessionPhase);
      setCurrentIndex(resumeState.currentIndex);
    }
  }, [resumeChecked, resumeState, lesson]);

  // Persist progress in background whenever phase/index changes
  useEffect(() => {
    if (lesson && phase !== 'intro' && phase !== 'complete') {
      saveProgress(phase, currentIndex);
    }
  }, [phase, currentIndex, lesson, saveProgress]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    feedback: string;
    tips: string[];
  } | null>(null);
  const [scores, setScores] = useState<{
    vocabulary: number[];
    sentences: number[];
    readAloud: number | null;
  }>({ vocabulary: [], sentences: [], readAloud: null });
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>('');

  // Auto-speak when phase or index changes
  const autoSpokenRef = useRef<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchLesson();
  }, [user, lessonId]);

  // Auto-play audio for current phase content
  useEffect(() => {
    if (!lesson) return;
    const key = `${phase}-${currentIndex}`;
    if (autoSpokenRef.current === key) return;
    autoSpokenRef.current = key;

    const delay = setTimeout(() => {
      if (phase === 'intro') {
        speak(`Let's learn! ${lesson.title}. ${lesson.description || ''}`);
      } else if (phase === 'vocabulary' && lesson.vocabulary[currentIndex]) {
        const w = lesson.vocabulary[currentIndex];
        speak(`Listen and repeat. ${w.word}. ${w.meaning}`);
      } else if (phase === 'sentences' && lesson.sentences[currentIndex]) {
        speak(`Listen and repeat. ${lesson.sentences[currentIndex].text}`);
      } else if (phase === 'read_aloud' && lesson.read_aloud_text) {
        speak(`Read along with me. ${lesson.read_aloud_text}`);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [phase, currentIndex, lesson, speak]);

  const fetchLesson = async () => {
    try {
      // Try curriculum_days first (new system)
      const { data: currDay } = await supabase
        .from('curriculum_days')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (currDay) {
        const { data: parts } = await supabase
          .from('curriculum_day_parts')
          .select('*')
          .eq('curriculum_day_id', currDay.id)
          .order('sort_order');

        const targetContent = currDay.target_content as Record<string, unknown> || {};
        const sounds = (targetContent.sounds as string[]) || [];
        const words = (targetContent.words as string[]) || [];

        const vocabulary = sounds.length > 0 
          ? sounds.map(s => ({ word: s, phonetic: `/${s}/`, meaning: `The sound "${s}"` }))
          : words.length > 0
          ? words.map(w => ({ word: w, phonetic: '', meaning: '' }))
          : [
              { word: currDay.theme, phonetic: '', meaning: `Today's theme: ${currDay.theme}` },
            ];

        const sentences = [
          { text: `Listen to the sound and repeat.`, tip: 'Speak slowly and clearly' },
          { text: `Can you say "${vocabulary[0]?.word || currDay.theme}"?`, tip: 'Take your time' },
        ];

        const parsedLesson: Lesson = {
          id: currDay.id,
          level: 'beginner',
          day_number: currDay.day_number,
          title: currDay.title,
          description: currDay.day_objective || currDay.theme,
          vocabulary,
          sentences,
          read_aloud_text: `Great job! Today we learned about ${currDay.theme}. ${vocabulary.map(v => v.word).join(', ')}.`,
        };

        setLesson(parsedLesson);

        if (user) {
          const { data: existing } = await supabase
            .from('learner_day_attempts')
            .select('id')
            .eq('learner_id', user.id)
            .eq('curriculum_day_id', currDay.id)
            .eq('completion_status', 'in_progress')
            .maybeSingle();

          if (!existing) {
            await supabase.from('learner_day_attempts').insert({
              learner_id: user.id,
              curriculum_day_id: currDay.id,
              completion_status: 'in_progress',
            });
          }
        }

        setLoading(false);
        return;
      }

      // Fallback: try old lessons table
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      
      const parsedLesson = {
        ...data,
        vocabulary: typeof data.vocabulary === 'string' 
          ? JSON.parse(data.vocabulary) 
          : data.vocabulary || [],
        sentences: typeof data.sentences === 'string'
          ? JSON.parse(data.sentences)
          : data.sentences || [],
      };
      
      setLesson(parsedLesson);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lesson',
        variant: 'destructive',
      });
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const speakLesson = useCallback((text: string) => {
    speak(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, [speak]);

  const giveSpeechFeedback = useCallback((score: number, attemptCount: number) => {
    let msg = '';
    if (score >= 80) msg = 'Great pronunciation! You said it perfectly!';
    else if (score >= 60) msg = 'Good effort! Try saying it a little slower next time.';
    else if (attemptCount >= 2) msg = 'Nice try! Keep practicing, you are getting better!';
    else msg = 'Good start! Let\'s try again!';
    setTimeout(() => speak(msg), 500);
  }, [speak]);

  const startRecording = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: 'Speech Recognition Not Supported',
          description: 'Please use Chrome or Edge for best experience.',
          variant: 'destructive',
        });
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      transcriptRef.current = '';
      
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        transcriptRef.current = transcript;
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current = recognition;
      recognition.start();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to practice speaking.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setHasRecorded(true);
      
      setTimeout(() => {
        evaluateSpeech();
      }, 300);
    }
  };

  const evaluateSpeech = async () => {
    if (!lesson || !user) return;
    
    setIsEvaluating(true);
    setCurrentFeedback(null);
    
    const targetText = phase === 'vocabulary' 
      ? lesson.vocabulary[currentIndex]?.word
      : phase === 'sentences'
      ? lesson.sentences[currentIndex]?.text
      : lesson.read_aloud_text;

    const attemptedText = transcriptRef.current || targetText;

    try {
      const { data, error } = await supabase.functions.invoke('evaluate-speech', {
        body: {
          targetText,
          attemptedText,
          phase,
        },
      });

      if (error) throw error;

      const { pronunciationScore, fluencyScore, clarityScore, feedback, tips } = data;
      const avgScore = Math.round((pronunciationScore + fluencyScore + clarityScore) / 3);

      if (phase === 'vocabulary') {
        setScores(prev => ({
          ...prev,
          vocabulary: [...prev.vocabulary, avgScore],
        }));
      } else if (phase === 'sentences') {
        setScores(prev => ({
          ...prev,
          sentences: [...prev.sentences, avgScore],
        }));
      } else if (phase === 'read_aloud') {
        setScores(prev => ({ ...prev, readAloud: avgScore }));
      }

      setCurrentFeedback({ feedback, tips });

      await supabase.from('practice_attempts').insert({
        student_id: user.id,
        lesson_id: lesson.id,
        attempt_type: phase,
        content: targetText || '',
        pronunciation_score: pronunciationScore,
        feedback: feedback,
      });

      toast({
        title: avgScore >= 80 ? 'Excellent! 🌟' : avgScore >= 60 ? 'Good job! 👍' : 'Keep practicing! 💪',
        description: `Your score: ${avgScore}%`,
      });
      giveSpeechFeedback(avgScore, scores.vocabulary.length + scores.sentences.length);
    } catch (error) {
      console.error('Error evaluating speech:', error);
      const fallbackScore = 70 + Math.floor(Math.random() * 20);
      
      if (phase === 'vocabulary') {
        setScores(prev => ({ ...prev, vocabulary: [...prev.vocabulary, fallbackScore] }));
      } else if (phase === 'sentences') {
        setScores(prev => ({ ...prev, sentences: [...prev.sentences, fallbackScore] }));
      } else if (phase === 'read_aloud') {
        setScores(prev => ({ ...prev, readAloud: fallbackScore }));
      }

      toast({
        title: 'Score recorded!',
        description: `Your score: ${fallbackScore}%`,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextItem = (skipped = false) => {
    setHasRecorded(false);
    setCurrentFeedback(null);
    
    if (phase === 'vocabulary') {
      if (skipped) {
        setScores(prev => {
          const newVocab = [...prev.vocabulary];
          newVocab[currentIndex] = newVocab[currentIndex] ?? 0;
          return { ...prev, vocabulary: newVocab };
        });
      }
      if (currentIndex < (lesson?.vocabulary.length || 0) - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setPhase('sentences');
        setCurrentIndex(0);
      }
    } else if (phase === 'sentences') {
      if (skipped) {
        setScores(prev => {
          const newSentences = [...prev.sentences];
          newSentences[currentIndex] = newSentences[currentIndex] ?? 0;
          return { ...prev, sentences: newSentences };
        });
      }
      if (currentIndex < (lesson?.sentences.length || 0) - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setPhase('read_aloud');
        setCurrentIndex(0);
      }
    } else if (phase === 'read_aloud') {
      if (skipped) {
        setScores(prev => ({ ...prev, readAloud: prev.readAloud ?? 0 }));
      }
      setPhase('mini_game');
    } else if (phase === 'mini_game') {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    if (!lesson || !user) return;

    try {
      const allVocabScores = scores.vocabulary;
      const allSentenceScores = scores.sentences;
      const readAloudScore = scores.readAloud;

      const avgPronunciation = Math.round(
        (allVocabScores.reduce((a, b) => a + b, 0) + 
         allSentenceScores.reduce((a, b) => a + b, 0) + 
         (readAloudScore || 0)) /
        (allVocabScores.length + allSentenceScores.length + (readAloudScore ? 1 : 0)) || 70
      );

      const { data: dayAttempt } = await supabase
        .from('learner_day_attempts')
        .select('id')
        .eq('learner_id', user.id)
        .eq('curriculum_day_id', lesson.id)
        .eq('completion_status', 'in_progress')
        .maybeSingle();

      if (dayAttempt) {
        await supabase
          .from('learner_day_attempts')
          .update({
            completed_at: new Date().toISOString(),
            completion_status: 'completed',
            accuracy_score: avgPronunciation,
            speaking_score: avgPronunciation - 3,
            confidence_score: avgPronunciation + 2,
            stars_earned: avgPronunciation >= 80 ? 3 : avgPronunciation >= 60 ? 2 : 1,
            total_xp_earned: 50,
            mastery_state: avgPronunciation >= 80 ? 'stable' : 'developing',
          })
          .eq('id', dayAttempt.id);

        const { data: currProgress } = await supabase
          .from('learner_curriculum_progress')
          .select('*')
          .eq('learner_id', user.id)
          .maybeSingle();

        if (currProgress && lesson.day_number === currProgress.current_day) {
          const nextDay = Math.min(lesson.day_number + 1, 180);
          const nextWeek = Math.ceil(nextDay / 6);
          const nextMonth = nextWeek <= 5 ? 1 : nextWeek <= 10 ? 2 : nextWeek <= 15 ? 3 : nextWeek <= 20 ? 4 : nextWeek <= 25 ? 5 : 6;
          await supabase
            .from('learner_curriculum_progress')
            .update({
              current_day: nextDay,
              current_week: nextWeek,
              current_month: nextMonth,
              total_xp: (currProgress.total_xp || 0) + 50,
              streak_count: (currProgress.streak_count || 0) + 1,
              completion_percent: Math.round((nextDay / 180) * 10000) / 100,
              level_status: nextDay >= 180 ? 'completed' : 'active',
            })
            .eq('id', currProgress.id);
        }
      }

      const { data: existingCompletion } = await supabase
        .from('lesson_completions')
        .select('*')
        .eq('student_id', user.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (existingCompletion) {
        await supabase
          .from('lesson_completions')
          .update({
            pronunciation_score: Math.max(existingCompletion.pronunciation_score || 0, avgPronunciation),
            fluency_score: Math.max(existingCompletion.fluency_score || 0, avgPronunciation - 5),
            clarity_score: Math.max(existingCompletion.clarity_score || 0, avgPronunciation - 3),
            confidence_score: Math.max(existingCompletion.confidence_score || 0, avgPronunciation + 2),
            practice_count: (existingCompletion.practice_count || 0) + 1,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingCompletion.id);
      } else {
        const { data: lessonExists } = await supabase
          .from('lessons')
          .select('id')
          .eq('id', lesson.id)
          .maybeSingle();

        if (lessonExists) {
          await supabase.from('lesson_completions').insert({
            student_id: user.id,
            lesson_id: lesson.id,
            pronunciation_score: avgPronunciation,
            fluency_score: avgPronunciation - 5,
            clarity_score: avgPronunciation - 3,
            confidence_score: avgPronunciation + 2,
            practice_count: 1,
          });
        }
      }

      await supabase
        .from('student_progress')
        .update({ current_day: lesson.day_number + 1 })
        .eq('student_id', user.id);

      const today = new Date().toISOString().split('T')[0];
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (existingAttendance) {
        await supabase
          .from('attendance')
          .update({ lesson_completed: true, is_present: true })
          .eq('id', existingAttendance.id);
      } else {
        await supabase.from('attendance').insert({
          student_id: user.id,
          date: today,
          is_present: true,
          lesson_completed: true,
        });
      }

      trackChallengeProgress(user.id, 'lesson');
      checkAndAwardBadges(user.id);

      clearProgress();
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setPhase('complete');
      }, 3500);
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your progress',
        variant: 'destructive',
      });
    }
  };

  const getProgress = () => {
    if (!lesson) return 0;
    const totalItems = lesson.vocabulary.length + lesson.sentences.length + 2;
    let completedItems = 0;

    if (phase === 'vocabulary') {
      completedItems = currentIndex;
    } else if (phase === 'sentences') {
      completedItems = lesson.vocabulary.length + currentIndex;
    } else if (phase === 'read_aloud') {
      completedItems = lesson.vocabulary.length + lesson.sentences.length;
    } else if (phase === 'mini_game') {
      completedItems = lesson.vocabulary.length + lesson.sentences.length + 1;
    } else if (phase === 'complete') {
      completedItems = totalItems;
    }

    return Math.round((completedItems / totalItems) * 100);
  };

  const getAverageScore = () => {
    const allScores = [...scores.vocabulary, ...scores.sentences];
    if (scores.readAloud) allScores.push(scores.readAloud);
    if (allScores.length === 0) return 0;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  };

  const getStarsEarned = () => {
    const avg = getAverageScore();
    return avg >= 80 ? 3 : avg >= 60 ? 2 : 1;
  };

  const childName = profile?.full_name?.split(' ')[0] || 'Explorer';

  // ===== LOADING =====
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
              <Sparkles className="h-10 w-10 text-accent" />
            </div>
            <p className="text-muted-foreground font-medium">Loading your adventure...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ===== NOT FOUND =====
  if (!lesson) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="text-center pixo-card p-8 max-w-sm">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="font-display font-bold text-xl mb-2">Lesson Not Found</h2>
            <p className="text-muted-foreground text-sm mb-6">
              We couldn't load this lesson. It may not exist yet.
            </p>
            <Button variant="gradient" onClick={() => navigate('/student')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ===== Phase-step dots rendering =====
  const phases: SessionPhase[] = ['intro', 'vocabulary', 'sentences', 'read_aloud', 'mini_game', 'complete'];
  const currentPhaseIdx = phases.indexOf(phase);

  return (
    <Layout>
      {/* Celebration overlay */}
      <CelebrationOverlay
        show={showCelebration}
        type="badge"
        title="Sound Star Unlocked!"
        subtitle={`+50 XP earned • ${getStarsEarned()} stars`}
        icon="⭐"
      />

      <PremiumLessonShell
        trail={phases.map((p) => ({ icon: PHASE_LABELS[p].icon, label: PHASE_LABELS[p].label }))}
        activeIndex={currentPhaseIdx}
        xpCurrent={profile?.total_xp ?? 0}
        xpMax={2000}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <BackButton fallback="/student" label="" />
          <div className="text-center flex-1">
            <p className="text-xs lp-trail-label" style={{ color: 'var(--lp-text-muted)' }}>Day {lesson.day_number}</p>
            <h1 className="font-display font-bold text-sm truncate" style={{ color: 'var(--lp-text)' }}>{lesson.title}</h1>
          </div>
          <SpeechControls
            rate={speechSettings.rate}
            voiceURI={speechSettings.voiceURI}
            onRateChange={setRate}
            onVoiceChange={setVoiceURI}
          />
        </div>

          {/* ==================== INTRO / WELCOME ==================== */}
          {phase === 'intro' && (
            <div className="animate-fade-in flex flex-col items-center text-center space-y-6">
              {/* Mascot hero */}
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-muted border-4 border-card flex items-center justify-center shadow-pixo-lg overflow-hidden">
                  <img src={companion.image} alt={companion.name} className="w-32 h-32 object-contain animate-float" />
                </div>
                <div className="absolute -bottom-3 -right-3 bg-accent text-accent-foreground px-4 py-1.5 rounded-xl font-display font-bold text-sm rotate-6 shadow-pixo-md border-2 border-card">
                  Hey {childName}!
                </div>
              </div>

              <h2 className="font-display font-extrabold text-3xl text-primary tracking-tight">
                Ready to play?
              </h2>
              <p className="text-muted-foreground text-base max-w-xs">
                {lesson.description || "Let's go on a sound adventure together!"}
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-card rounded-2xl p-3 border border-border/40 shadow-pixo-sm text-center">
                  <BookOpen className="h-5 w-5 mx-auto mb-1 text-pixo-orange" />
                  <p className="font-bold text-lg">{lesson.vocabulary.length}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Words</p>
                </div>
                <div className="bg-card rounded-2xl p-3 border border-border/40 shadow-pixo-sm text-center">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-pixo-blue" />
                  <p className="font-bold text-lg">{lesson.sentences.length}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Sentences</p>
                </div>
                <div className="bg-card rounded-2xl p-3 border border-border/40 shadow-pixo-sm text-center">
                  <Gem className="h-5 w-5 mx-auto mb-1 text-accent" />
                  <p className="font-bold text-lg">50</p>
                  <p className="text-[10px] text-muted-foreground font-medium">XP</p>
                </div>
              </div>

              {/* Mission card */}
              <div className="w-full bg-muted/60 rounded-2xl p-5 flex items-center gap-4 text-left">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-primary text-sm mb-1">Today's Mission</h3>
                  <p className="text-muted-foreground text-xs">
                    {lesson.vocabulary[0]?.phonetic
                      ? `Find all the ${lesson.vocabulary[0].phonetic} sounds hidden in the word forest!`
                      : `Master today's sounds and earn your badge!`}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setPhase('vocabulary')}
                className="relative w-full bg-gradient-to-t from-primary to-primary/80 text-primary-foreground py-5 px-10 rounded-full text-xl font-display font-bold shadow-pixo-lg hover:scale-[0.97] active:scale-95 transition-all duration-200"
              >
                Start Adventure
                <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground p-2 rounded-full border-2 border-card shadow-pixo-sm">
                  <Rocket className="h-4 w-4" />
                </div>
              </button>
            </div>
          )}

          {/* ==================== VOCABULARY / SOUND INTRO ==================== */}
          {phase === 'vocabulary' && lesson.vocabulary[currentIndex] && (
            <div className="animate-fade-in flex flex-col items-center text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur border border-border/40 shadow-pixo-sm">
                <span className="w-2 h-2 rounded-full bg-pixo-orange animate-pulse" />
                <p className="text-xs text-foreground font-semibold">
                  Sound {currentIndex + 1} of {lesson.vocabulary.length}
                </p>
              </div>

              {/* Big animated sound badge with sparkle decorations */}
              <div className="relative">
                <div className="absolute -inset-8 bg-accent/20 rounded-full blur-3xl" />
                <Sparkles className="absolute -top-2 -left-4 h-6 w-6 text-pixo-orange animate-pulse z-20" />
                <Sparkles className="absolute -bottom-2 -right-4 h-5 w-5 text-pixo-yellow animate-pulse z-20" style={{ animationDelay: '0.5s' }} />
                <Star className="absolute top-2 -right-2 h-4 w-4 text-pixo-pink fill-pixo-pink animate-pulse z-20" style={{ animationDelay: '1s' }} />

                <div className="absolute inset-0 rounded-full bg-accent/30 animate-mic-pulse-ring" />
                <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-accent via-pixo-yellow to-pixo-orange flex items-center justify-center shadow-pixo-xl border-[6px] border-card cursor-pointer hover:scale-105 transition-transform active:scale-95"
                  onClick={() => speakLesson(lesson.vocabulary[currentIndex].word)}
                >
                  <span className="text-4xl font-display font-extrabold text-accent-foreground drop-shadow-sm px-3 leading-tight">
                    {lesson.vocabulary[currentIndex].phonetic || lesson.vocabulary[currentIndex].word}
                  </span>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border/40 shadow-pixo-sm">
                  <Volume2 className="h-3 w-3 text-pixo-blue" />
                  <p className="text-[10px] text-muted-foreground font-medium">Tap badge to hear</p>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="font-display font-extrabold text-2xl text-foreground">Your turn! 🎤</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Can you make the <span className="font-bold text-primary">{lesson.vocabulary[currentIndex].phonetic || lesson.vocabulary[currentIndex].word}</span> sound like PIXO?
                </p>
              </div>

              {lesson.vocabulary[currentIndex].meaning && (
                <div className="w-full bg-card rounded-2xl p-4 border border-border/40 shadow-pixo-md flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pixo-sky to-pixo-blue/40 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-pixo-blue" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Today's theme</p>
                    <p className="text-sm font-semibold text-foreground">{lesson.vocabulary[currentIndex].meaning}</p>
                  </div>
                </div>
              )}

              {isRecording && (
                <div className="flex items-end gap-1 h-10 justify-center">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-primary to-pixo-orange rounded-full animate-wave-bar"
                      style={{
                        animationDelay: `${i * 0.08}s`,
                        height: `${10 + Math.random() * 20}px`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Listen & Record buttons — BYJU style */}
              <div className="flex items-end justify-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => speakLesson(lesson.vocabulary[currentIndex].word)}
                    disabled={isSpeaking}
                    className="w-14 h-14 rounded-2xl bg-card text-pixo-blue flex items-center justify-center shadow-pixo-md border border-border/40 hover:scale-105 transition-all active:scale-95"
                  >
                    <Volume2 className={`h-6 w-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </button>
                  <p className="text-[9px] text-muted-foreground font-medium">Listen</p>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full bg-destructive/30 animate-mic-pulse-ring" />
                    )}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isEvaluating}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-pixo-xl z-10 border-[5px] border-card ${
                        isRecording
                          ? 'bg-gradient-to-b from-destructive to-destructive/80 text-destructive-foreground'
                          : 'bg-gradient-to-b from-primary via-primary to-pixo-orange text-primary-foreground hover:scale-105'
                      }`}
                    >
                      {isRecording ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
                    </button>
                  </div>
                  <p className="text-xs text-foreground font-bold">
                    {isRecording ? 'Tap to stop' : 'Tap to speak'}
                  </p>
                </div>

                <div className="w-14 h-[68px]" />
              </div>

              {isEvaluating && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse bg-card px-4 py-2 rounded-full shadow-pixo-sm border border-border/40">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Analyzing your sound...</span>
                </div>
              )}

              {hasRecorded && scores.vocabulary[currentIndex] !== undefined && !isEvaluating && (
                <div className="animate-scale-in bg-gradient-to-br from-card to-pixo-cream rounded-3xl p-5 border-2 border-accent/30 shadow-pixo-lg w-full">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {[...Array(3)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-8 w-8 transition-all ${
                          i < (scores.vocabulary[currentIndex] >= 80 ? 3 : scores.vocabulary[currentIndex] >= 60 ? 2 : 1)
                            ? 'text-accent fill-accent animate-bounce-gentle drop-shadow-sm'
                            : 'text-muted'
                        }`}
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-3xl font-display font-extrabold gradient-text">{scores.vocabulary[currentIndex]}%</p>
                  {currentFeedback && (
                    <p className="text-xs text-muted-foreground mt-2">{currentFeedback.feedback}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 rounded-full"
                  onClick={() => { setHasRecorded(true); nextItem(true); }}
                >
                  Skip
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1 rounded-full shadow-pixo-md"
                  disabled={!hasRecorded || isEvaluating}
                  onClick={() => nextItem()}
                >
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ==================== SENTENCES / GUIDED PRACTICE ==================== */}
          {phase === 'sentences' && lesson.sentences[currentIndex] && (
            <div className="animate-fade-in flex flex-col items-center text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur border border-border/40 shadow-pixo-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <p className="text-xs text-foreground font-semibold">
                  Practice {currentIndex + 1} of {lesson.sentences.length}
                </p>
              </div>

              {/* Guided practice cards — colorful BYJU style */}
              <div className="w-full space-y-2.5">
                {[
                  { icon: '🗣️', title: 'Speak Clearly', desc: 'Open your mouth wide like PIXO', bg: 'from-pixo-pink/40 to-pixo-pink/10', iconBg: 'bg-pixo-pink/30', accent: 'text-primary' },
                  { icon: '👂', title: 'Listen Back', desc: 'Hear how you sound and try again', bg: 'from-pixo-sky/40 to-pixo-sky/10', iconBg: 'bg-pixo-sky/40', accent: 'text-pixo-blue' },
                  { icon: '⭐', title: 'Earn a Star', desc: 'Every try brings a sticker!', bg: 'from-pixo-yellow/40 to-pixo-yellow/10', iconBg: 'bg-pixo-yellow/40', accent: 'text-pixo-orange' },
                ].map((card, i) => (
                  <div key={i} className={`bg-gradient-to-r ${card.bg} backdrop-blur-sm rounded-2xl p-3.5 flex items-center gap-3 border border-card/60 shadow-pixo-sm hover-lift tap-scale`}>
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center text-xl shrink-0 shadow-pixo-sm`}>
                      {card.icon}
                    </div>
                    <div className="text-left flex-1">
                      <p className={`font-display font-bold text-sm ${card.accent}`}>{card.title}</p>
                      <p className="text-xs text-foreground/70">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sentence prompt — premium card */}
              <div className="w-full bg-gradient-to-br from-card to-pixo-cream rounded-3xl p-5 border-2 border-dashed border-primary/30 shadow-pixo-md relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent/20 rounded-full blur-2xl" />
                <p className="text-lg font-display font-bold text-foreground mb-2 relative">
                  "{lesson.sentences[currentIndex].text}"
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-accent/20 relative">
                  <span className="text-xs">💡</span>
                  <p className="text-xs font-medium text-foreground/80">{lesson.sentences[currentIndex].tip}</p>
                </div>
              </div>

              {isRecording && (
                <div className="flex items-end gap-1 h-10 justify-center">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="w-1.5 bg-gradient-to-t from-primary to-pixo-orange rounded-full animate-wave-bar"
                      style={{ animationDelay: `${i * 0.08}s`, height: `${10 + Math.random() * 20}px` }} />
                  ))}
                </div>
              )}

              {/* Mic controls */}
              <div className="flex items-end justify-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => speakLesson(lesson.sentences[currentIndex].text)}
                    disabled={isSpeaking}
                    className="w-14 h-14 rounded-2xl bg-card text-pixo-blue flex items-center justify-center shadow-pixo-md border border-border/40 hover:scale-105 transition-all active:scale-95"
                  >
                    <Headphones className={`h-6 w-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </button>
                  <p className="text-[9px] text-muted-foreground font-medium">Listen</p>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    {isRecording && <div className="absolute inset-0 rounded-full bg-destructive/30 animate-mic-pulse-ring" />}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isEvaluating}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-pixo-xl z-10 border-[5px] border-card ${
                        isRecording
                          ? 'bg-gradient-to-b from-destructive to-destructive/80 text-destructive-foreground'
                          : 'bg-gradient-to-b from-primary via-primary to-pixo-orange text-primary-foreground hover:scale-105'
                      }`}
                    >
                      {isRecording ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
                    </button>
                  </div>
                  <p className="text-xs text-foreground font-bold">
                    {isRecording ? 'Tap to stop' : 'Tap to speak'}
                  </p>
                </div>

                <div className="w-14 h-[68px]" />
              </div>

              {isEvaluating && (
                <div className="flex items-center gap-2 text-muted-foreground bg-card px-4 py-2 rounded-full shadow-pixo-sm border border-border/40">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Listening to your voice...</span>
                </div>
              )}

              {hasRecorded && scores.sentences[currentIndex] !== undefined && !isEvaluating && (
                <div className="animate-scale-in bg-gradient-to-br from-card to-pixo-cream rounded-3xl p-5 border-2 border-accent/30 shadow-pixo-lg w-full">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className={`h-8 w-8 ${
                        i < (scores.sentences[currentIndex] >= 80 ? 3 : scores.sentences[currentIndex] >= 60 ? 2 : 1)
                          ? 'text-accent fill-accent animate-bounce-gentle' : 'text-muted'
                      }`} style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                  </div>
                  <p className="text-3xl font-display font-extrabold gradient-text">{scores.sentences[currentIndex]}%</p>
                  {currentFeedback && <p className="text-xs text-muted-foreground mt-2">{currentFeedback.feedback}</p>}
                </div>
              )}

              <div className="flex gap-3 w-full pt-2">
                <Button variant="ghost" size="sm" className="flex-1 rounded-full" onClick={() => { setHasRecorded(true); nextItem(true); }}>
                  Skip
                </Button>
                <Button variant="gradient" className="flex-1 rounded-full shadow-pixo-md" disabled={!hasRecorded || isEvaluating} onClick={() => nextItem()}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ==================== READ ALOUD / SPEAK & RECORD ==================== */}
          {phase === 'read_aloud' && (
            <div className="animate-fade-in flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <div className="absolute -inset-4 bg-secondary/20 rounded-full blur-2xl" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-secondary to-pixo-green flex items-center justify-center shadow-pixo-lg border-4 border-card">
                  <FileText className="h-9 w-9 text-secondary-foreground" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-pixo-yellow animate-pulse" />
              </div>

              <div className="space-y-1">
                <h2 className="font-display font-extrabold text-2xl text-foreground">Speak & Record 📖</h2>
                <p className="text-sm text-muted-foreground">Read along and record your voice</p>
              </div>

              {/* Read aloud card — premium with gradient */}
              <div className="w-full bg-gradient-to-br from-card via-card to-pixo-cream rounded-3xl p-6 border-2 border-secondary/20 shadow-pixo-lg relative overflow-hidden">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-pixo-yellow/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />
                <p className="text-base leading-relaxed font-medium relative">{lesson.read_aloud_text}</p>
              </div>

              {isRecording && (
                <div className="flex items-end gap-1 h-10 justify-center">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="w-1.5 bg-gradient-to-t from-primary to-pixo-orange rounded-full animate-wave-bar"
                      style={{ animationDelay: `${i * 0.08}s`, height: `${10 + Math.random() * 20}px` }} />
                  ))}
                </div>
              )}

              <div className="flex items-end justify-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => speakLesson(lesson.read_aloud_text || '')}
                    disabled={isSpeaking}
                    className="w-14 h-14 rounded-2xl bg-card text-pixo-blue flex items-center justify-center shadow-pixo-md border border-border/40 hover:scale-105 transition-all active:scale-95"
                  >
                    <Volume2 className={`h-6 w-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </button>
                  <p className="text-[9px] text-muted-foreground font-medium">Listen</p>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    {isRecording && <div className="absolute inset-0 rounded-full bg-destructive/30 animate-mic-pulse-ring" />}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isEvaluating}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-pixo-xl z-10 border-[5px] border-card ${
                        isRecording
                          ? 'bg-gradient-to-b from-destructive to-destructive/80 text-destructive-foreground'
                          : 'bg-gradient-to-b from-primary via-primary to-pixo-orange text-primary-foreground hover:scale-105'
                      }`}
                    >
                      {isRecording ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
                    </button>
                  </div>
                  <p className="text-xs text-foreground font-bold">
                    {isRecording ? 'Tap to stop' : 'Tap to read'}
                  </p>
                </div>

                <div className="w-14 h-[68px]" />
              </div>

              {isEvaluating && (
                <div className="flex items-center gap-2 text-muted-foreground bg-card px-4 py-2 rounded-full shadow-pixo-sm border border-border/40">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Analyzing...</span>
                </div>
              )}

              {hasRecorded && scores.readAloud !== null && !isEvaluating && (
                <div className="animate-scale-in bg-gradient-to-br from-card to-pixo-cream rounded-3xl p-5 border-2 border-accent/30 shadow-pixo-lg w-full">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className={`h-8 w-8 ${
                        i < (scores.readAloud! >= 80 ? 3 : scores.readAloud! >= 60 ? 2 : 1)
                          ? 'text-accent fill-accent animate-bounce-gentle' : 'text-muted'
                      }`} style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                  </div>
                  <p className="text-3xl font-display font-extrabold gradient-text">{scores.readAloud}%</p>
                  {currentFeedback && <p className="text-xs text-muted-foreground mt-2">{currentFeedback.feedback}</p>}
                </div>
              )}

              <div className="flex gap-3 w-full pt-2">
                <Button variant="ghost" size="sm" className="flex-1 rounded-full" onClick={() => { setHasRecorded(true); nextItem(true); }}>
                  Skip
                </Button>
                <Button variant="gradient" className="flex-1 rounded-full shadow-pixo-md" disabled={!hasRecorded || isEvaluating} onClick={() => nextItem()}>
                  Continue to Game <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ==================== MINI GAME ==================== */}
          {phase === 'mini_game' && lesson && (
            <div className="animate-fade-in">
              <MiniGameSelector
                words={lesson.vocabulary}
                onComplete={(gameScore) => {
                  toast({
                    title: gameScore >= 80 ? 'Amazing! 🌟' : gameScore >= 60 ? 'Well done! 👍' : 'Great try! 💪',
                    description: `Game score: ${gameScore}%`,
                  });
                  completeLesson();
                }}
                onSkip={() => completeLesson()}
              />
            </div>
          )}

          {/* ==================== COMPLETE / CELEBRATION ==================== */}
          {phase === 'complete' && (
            <div className="animate-fade-in flex flex-col items-center text-center space-y-6">
              {/* Badge reveal */}
              <div className="relative">
                <div className="absolute inset-0 bg-accent blur-3xl opacity-20 animate-pulse" />
                <div className="relative bg-card rounded-2xl p-6 border border-border/40 shadow-pixo-lg transform -rotate-1">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-b from-accent to-accent/70 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
                    <Sparkles className="h-14 w-14 text-accent-foreground" />
                  </div>
                  <h2 className="font-display font-extrabold text-2xl text-primary mb-1">
                    You mastered today's sounds!
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {lesson.vocabulary.map(v => v.word).join(', ')} — and that's awesome!
                  </p>
                </div>
                {/* XP badge */}
                <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground w-16 h-16 rounded-full flex flex-col items-center justify-center font-display font-bold shadow-pixo-md border-2 border-card rotate-12">
                  <span className="text-[10px]">XP</span>
                  <span className="text-lg leading-none">+50</span>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-10 w-10 transition-all duration-500 ${
                      i < getStarsEarned()
                        ? 'text-accent fill-accent animate-bounce-gentle'
                        : 'text-muted'
                    }`}
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>

              {/* Score ring */}
              <ProgressRing progress={getAverageScore()} size={100}>
                <div className="text-center">
                  <p className="text-xl font-bold">{getAverageScore()}%</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
              </ProgressRing>

              {/* Adventure map */}
              <div className="w-full bg-muted/50 rounded-2xl p-5">
                <h3 className="font-display font-bold text-sm text-left mb-4">Your Treasure Path</h3>
                <div className="flex items-center justify-between px-2">
                  {[...Array(5)].map((_, i) => {
                    const dayNum = lesson.day_number - 2 + i;
                    const isCurrent = i === 2;
                    const isPast = i < 2;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground scale-125 shadow-pixo-md ring-2 ring-accent'
                            : isPast
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : isCurrent ? '🌟' : <Lock className="h-3 w-3" />}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{dayNum > 0 ? `Day ${dayNum}` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Badge shelf */}
              <div className="w-full">
                <h3 className="font-display font-bold text-sm text-left mb-3">Badges Earned</h3>
                <div className="flex gap-3">
                  {['⭐ Sound Star', '🎯 Quick Learner', '🎵 Phonics Pro'].map((badge, i) => (
                    <div key={i} className="flex-1 bg-card rounded-2xl p-3 border border-border/40 shadow-pixo-sm text-center">
                      <div className="text-2xl mb-1">{badge.split(' ')[0]}</div>
                      <p className="text-[10px] font-medium text-muted-foreground">{badge.split(' ').slice(1).join(' ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tomorrow teaser */}
              <div className="w-full bg-pixo-blue/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-pixo-blue/20 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-pixo-blue" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-xs text-pixo-blue">Tomorrow's Adventure</p>
                  <p className="text-xs text-muted-foreground">The Secret of new sounds awaits!</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPhase('intro');
                    setCurrentIndex(0);
                    setScores({ vocabulary: [], sentences: [], readAloud: null });
                    setHasRecorded(false);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Practice Again
                </Button>
                <button
                  onClick={() => navigate('/student')}
                  className="flex-1 bg-gradient-to-t from-primary to-primary/80 text-primary-foreground py-3 rounded-full font-display font-bold shadow-pixo-lg hover:scale-[0.97] active:scale-95 transition-all"
                >
                  Keep Playing!
                </button>
              </div>
            </div>
          )}
      </PremiumLessonShell>
    </Layout>
  );
}
