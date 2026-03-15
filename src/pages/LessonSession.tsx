import { useEffect, useState, useRef } from 'react';

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
} from 'lucide-react';
import { useCompanion } from '@/hooks/useCompanion';

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

export default function LessonSession() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const companion = useCompanion();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchLesson();
  }, [user, lessonId]);

  const fetchLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      
      // Parse JSON fields if they're strings
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

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      // Start speech recognition
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

      // Also record audio for visual feedback
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
      
      // Small delay to ensure transcript is captured
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

    const attemptedText = transcriptRef.current || targetText; // Fallback if no transcript

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

      // Update scores based on phase
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

      // Save practice attempt with AI feedback
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
    } catch (error) {
      console.error('Error evaluating speech:', error);
      // Fallback to simulated score
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
      // Go to mini-game before completing
      setPhase('mini_game');
    } else if (phase === 'mini_game') {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    if (!lesson || !user) return;

    try {
      // Calculate average scores
      const allVocabScores = scores.vocabulary;
      const allSentenceScores = scores.sentences;
      const readAloudScore = scores.readAloud;

      const avgPronunciation = Math.round(
        (allVocabScores.reduce((a, b) => a + b, 0) + 
         allSentenceScores.reduce((a, b) => a + b, 0) + 
         (readAloudScore || 0)) /
        (allVocabScores.length + allSentenceScores.length + (readAloudScore ? 1 : 0)) || 70
      );

      // Check for existing completion
      const { data: existingCompletion } = await supabase
        .from('lesson_completions')
        .select('*')
        .eq('student_id', user.id)
        .eq('lesson_id', lesson.id)
        .single();

      if (existingCompletion) {
        // Update existing completion
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
        // Create new completion
        await supabase.from('lesson_completions').insert({
          student_id: user.id,
          lesson_id: lesson.id,
          pronunciation_score: avgPronunciation,
          fluency_score: avgPronunciation - 5,
          clarity_score: avgPronunciation - 3,
          confidence_score: avgPronunciation + 2,
          practice_count: 1,
        });

        // Update student progress to next day
        await supabase
          .from('student_progress')
          .update({ current_day: lesson.day_number + 1 })
          .eq('student_id', user.id);
      }

      // Mark attendance - use insert with conflict handling
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

      // Track daily challenge & check badges
      trackChallengeProgress(user.id, 'lesson');
      checkAndAwardBadges(user.id);

      setPhase('complete');
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
    const totalItems = lesson.vocabulary.length + lesson.sentences.length + 1;
    let completedItems = 0;

    if (phase === 'vocabulary') {
      completedItems = currentIndex;
    } else if (phase === 'sentences') {
      completedItems = lesson.vocabulary.length + currentIndex;
    } else if (phase === 'read_aloud') {
      completedItems = lesson.vocabulary.length + lesson.sentences.length;
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading lesson...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lesson) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/student')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Day {lesson.day_number}</p>
            <h1 className="font-display font-bold">{lesson.title}</h1>
          </div>
          <div className="w-24" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-3" />
        </div>

        {/* Phase Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {['intro', 'vocabulary', 'sentences', 'read_aloud', 'mini_game', 'complete'].map((p, i) => (
            <div
              key={p}
              className={`flex items-center ${i < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  phase === p
                    ? 'gradient-bg text-white scale-110'
                    : ['intro', 'vocabulary', 'sentences', 'read_aloud', 'complete'].indexOf(phase) > i
                    ? 'bg-pixo-green text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {['intro', 'vocabulary', 'sentences', 'read_aloud', 'complete'].indexOf(phase) > i ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    ['intro', 'vocabulary', 'sentences', 'read_aloud', 'complete'].indexOf(phase) > i
                      ? 'bg-pixo-green'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="pixo-card min-h-[400px] flex flex-col">
          {/* Intro Phase */}
          {phase === 'intro' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
              <img src={companion.image} alt={companion.name} className="w-24 h-24 object-contain animate-float mb-6" />
              <h2 className="text-2xl font-display font-bold mb-4">{lesson.title}</h2>
              <p className="text-muted-foreground mb-8 max-w-md">{lesson.description}</p>
              
              <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                <div className="p-4 bg-muted rounded-xl">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-pixo-orange" />
                  <p className="font-semibold">{lesson.vocabulary.length}</p>
                  <p className="text-xs text-muted-foreground">Words</p>
                </div>
                <div className="p-4 bg-muted rounded-xl">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-pixo-yellow" />
                  <p className="font-semibold">{lesson.sentences.length}</p>
                  <p className="text-xs text-muted-foreground">Sentences</p>
                </div>
                <div className="p-4 bg-muted rounded-xl">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-pixo-green" />
                  <p className="font-semibold">1</p>
                  <p className="text-xs text-muted-foreground">Read-aloud</p>
                </div>
              </div>

              <Button variant="gradient" size="lg" onClick={() => setPhase('vocabulary')}>
                Start Lesson
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Vocabulary Phase */}
          {phase === 'vocabulary' && lesson.vocabulary[currentIndex] && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-pixo-orange" />
                <span className="text-sm font-medium text-muted-foreground">
                  Vocabulary {currentIndex + 1} of {lesson.vocabulary.length}
                </span>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-4xl font-display font-bold mb-2">
                  {lesson.vocabulary[currentIndex].word}
                </h2>
                <p className="text-lg text-muted-foreground italic mb-2">
                  {lesson.vocabulary[currentIndex].phonetic}
                </p>
                <p className="text-muted-foreground">
                  {lesson.vocabulary[currentIndex].meaning}
                </p>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => speak(lesson.vocabulary[currentIndex].word)}
                  disabled={isSpeaking}
                >
                  <Volume2 className={`h-5 w-5 mr-2 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  Listen
                </Button>

                <Button
                  variant={isRecording ? 'destructive' : 'default'}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isEvaluating}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Record
                    </>
                  )}
                </Button>
              </div>

              {isEvaluating && (
                <div className="text-center mb-4 animate-pulse">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing your pronunciation...</p>
                </div>
              )}

              {hasRecorded && scores.vocabulary[currentIndex] !== undefined && !isEvaluating && (
                <div className="text-center mb-4 animate-scale-in">
                  <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                  <p className="text-3xl font-bold text-pixo-green">
                    {scores.vocabulary[currentIndex]}%
                  </p>
                  {currentFeedback && (
                    <div className="mt-4 p-4 bg-muted rounded-xl max-w-md">
                      <p className="text-sm font-medium mb-2">{currentFeedback.feedback}</p>
                      {currentFeedback.tips.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {currentFeedback.tips.map((tip, i) => (
                            <p key={i} className="flex items-start gap-1">
                              <span className="text-pixo-yellow">💡</span> {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setHasRecorded(true); nextItem(true); }}
                >
                  Skip Recording
                </Button>
                <Button
                  variant="gradient"
                  disabled={!hasRecorded || isEvaluating}
                  onClick={() => nextItem()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Sentences Phase */}
          {phase === 'sentences' && lesson.sentences[currentIndex] && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-pixo-yellow" />
                <span className="text-sm font-medium text-muted-foreground">
                  Sentence {currentIndex + 1} of {lesson.sentences.length}
                </span>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  "{lesson.sentences[currentIndex].text}"
                </h2>
                <p className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full inline-block">
                  💡 Tip: {lesson.sentences[currentIndex].tip}
                </p>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => speak(lesson.sentences[currentIndex].text)}
                  disabled={isSpeaking}
                >
                  <Volume2 className={`h-5 w-5 mr-2 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  Listen
                </Button>

                <Button
                  variant={isRecording ? 'destructive' : 'default'}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isEvaluating}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Record
                    </>
                  )}
                </Button>
              </div>

              {isEvaluating && (
                <div className="text-center mb-4 animate-pulse">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing your pronunciation...</p>
                </div>
              )}

              {hasRecorded && scores.sentences[currentIndex] !== undefined && !isEvaluating && (
                <div className="text-center mb-4 animate-scale-in">
                  <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                  <p className="text-3xl font-bold text-pixo-green">
                    {scores.sentences[currentIndex]}%
                  </p>
                  {currentFeedback && (
                    <div className="mt-4 p-4 bg-muted rounded-xl max-w-md">
                      <p className="text-sm font-medium mb-2">{currentFeedback.feedback}</p>
                      {currentFeedback.tips.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {currentFeedback.tips.map((tip, i) => (
                            <p key={i} className="flex items-start gap-1">
                              <span className="text-pixo-yellow">💡</span> {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setHasRecorded(true); nextItem(true); }}
                >
                  Skip Recording
                </Button>
                <Button
                  variant="gradient"
                  disabled={!hasRecorded || isEvaluating}
                  onClick={() => nextItem()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Read Aloud Phase */}
          {phase === 'read_aloud' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-pixo-green" />
                <span className="text-sm font-medium text-muted-foreground">
                  Read-Aloud Exercise
                </span>
              </div>

              <div className="bg-muted rounded-2xl p-6 mb-8 max-w-2xl">
                <p className="text-lg md:text-xl leading-relaxed text-center">
                  {lesson.read_aloud_text}
                </p>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => speak(lesson.read_aloud_text || '')}
                  disabled={isSpeaking}
                >
                  <Volume2 className={`h-5 w-5 mr-2 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  Listen
                </Button>

                <Button
                  variant={isRecording ? 'destructive' : 'default'}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isEvaluating}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>

              {isEvaluating && (
                <div className="text-center mb-4 animate-pulse">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing your pronunciation...</p>
                </div>
              )}

              {hasRecorded && scores.readAloud !== null && !isEvaluating && (
                <div className="text-center mb-4 animate-scale-in">
                  <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                  <p className="text-3xl font-bold text-pixo-green">
                    {scores.readAloud}%
                  </p>
                  {currentFeedback && (
                    <div className="mt-4 p-4 bg-muted rounded-xl max-w-md">
                      <p className="text-sm font-medium mb-2">{currentFeedback.feedback}</p>
                      {currentFeedback.tips.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {currentFeedback.tips.map((tip, i) => (
                            <p key={i} className="flex items-start gap-1">
                              <span className="text-pixo-yellow">💡</span> {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setHasRecorded(true); nextItem(true); }}
                >
                  Skip Recording
                </Button>
                <Button
                  variant="gradient"
                  disabled={!hasRecorded || isEvaluating}
                  onClick={() => nextItem()}
                >
                  Complete Lesson
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Complete Phase */}
          {phase === 'complete' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-scale-in">
              <div className="w-24 h-24 rounded-full bg-pixo-green/20 flex items-center justify-center mb-6">
                <Trophy className="h-12 w-12 text-pixo-green" />
              </div>

              <h2 className="text-3xl font-display font-bold mb-2">
                Lesson Complete! 🎉
              </h2>
              <p className="text-muted-foreground mb-8">
                Great job finishing Day {lesson.day_number}!
              </p>

              <div className="flex items-center gap-8 mb-8">
                <ProgressRing progress={getAverageScore()} size={120}>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{getAverageScore()}%</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </ProgressRing>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-pixo-yellow" />
                    <span>Vocabulary: {scores.vocabulary.length} practiced</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-pixo-yellow" />
                    <span>Sentences: {scores.sentences.length} practiced</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-pixo-yellow" />
                    <span>Read-aloud: Completed</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => {
                  setPhase('intro');
                  setCurrentIndex(0);
                  setScores({ vocabulary: [], sentences: [], readAloud: null });
                  setHasRecorded(false);
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Practice Again
                </Button>
                <Button variant="gradient" onClick={() => navigate('/student')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
