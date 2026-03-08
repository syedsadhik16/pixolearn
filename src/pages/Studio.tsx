import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { VoicePicker } from '@/components/shared/VoicePicker';
import { 
  Mic2, Square, Play, Pause, RotateCcw, Volume2, Loader2, 
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const sampleTexts = [
  { id: '1', title: 'Self Introduction', text: "Hello! My name is Alex. I am a student and I love learning new languages. In my free time, I enjoy reading books and playing sports." },
  { id: '2', title: 'Daily Routine', text: "I wake up at seven o'clock every morning. First, I brush my teeth and take a shower. Then I have breakfast with my family before going to school." },
  { id: '3', title: 'My Favorite Food', text: "My favorite food is pasta. I especially like spaghetti with tomato sauce. My mother makes the best pasta in the world!" },
  { id: '4', title: 'Weather Description', text: "Today the weather is beautiful. The sun is shining brightly in the clear blue sky. It is a perfect day to go for a walk in the park." },
];

export default function Studio() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedText, setSelectedText] = useState(sampleTexts[0]);
  const [customText, setCustomText] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setAudioURL(null);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Microphone Error', description: 'Please allow microphone access.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const playRecording = () => {
    if (!audioURL) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioURL);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const stopPlayback = () => { audioRef.current?.pause(); setIsPlaying(false); };

  const resetRecording = () => {
    setAudioURL(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      if (selectedVoice) u.voice = selectedVoice;
      window.speechSynthesis.speak(u);
    }
  };

  const handleVoiceChange = (voice: SpeechSynthesisVoice | null) => {
    setSelectedVoice(voice);
    setSelectedVoiceURI(voice?.voiceURI);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const activeText = useCustom ? customText : selectedText.text;

  if (authLoading) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Mic2 className="h-6 w-6 text-primary" />
            Recording <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-sm text-muted-foreground">Record, playback, and compare your pronunciation</p>
        </div>

        {/* Voice Selection */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <VoicePicker onVoiceChange={handleVoiceChange} selectedVoiceURI={selectedVoiceURI} />
          </CardContent>
        </Card>

        {/* Text Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Choose a text to practice:</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {sampleTexts.map((t) => (
              <Button key={t.id} variant={!useCustom && selectedText.id === t.id ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedText(t); setUseCustom(false); }} className="whitespace-nowrap shrink-0">{t.title}</Button>
            ))}
            <Button variant={useCustom ? 'default' : 'outline'} size="sm" onClick={() => setUseCustom(true)} className="whitespace-nowrap shrink-0">Custom</Button>
          </div>
          {useCustom ? (
            <Textarea value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Type or paste your own text here..." rows={3} />
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-relaxed">{selectedText.text}</p>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => speakText(selectedText.text)}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex flex-col items-center gap-6">
          <div className={cn("text-4xl font-mono font-bold transition-colors", isRecording ? "text-destructive" : "text-foreground")}>{formatTime(recordingTime)}</div>
          <button onClick={isRecording ? stopRecording : startRecording} disabled={!activeText} className={cn("w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg", isRecording ? "bg-destructive text-white scale-110 animate-pulse shadow-destructive/30" : "gradient-bg text-white hover:scale-105 shadow-primary/30")}>
            {isRecording ? <Square className="h-10 w-10" /> : <Mic2 className="h-10 w-10" />}
          </button>
          <p className="text-sm text-muted-foreground">{isRecording ? 'Tap to stop' : 'Tap to record'}</p>

          {audioURL && (
            <div className="flex items-center gap-3 animate-slide-up">
              <Button variant="outline" size="icon" onClick={isPlaying ? stopPlayback : playRecording}>{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</Button>
              <Button variant="outline" size="icon" onClick={resetRecording}><RotateCcw className="h-5 w-5" /></Button>
              <Button variant="outline" onClick={() => speakText(activeText)} className="gap-2"><Volume2 className="h-4 w-4" />Hear Native</Button>
            </div>
          )}

          {audioURL && (
            <Card className="w-full max-w-md bg-secondary/10 border-secondary/20 animate-scale-in">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="font-semibold text-sm">Recording saved!</p>
                <p className="text-xs text-muted-foreground">Listen to your recording and compare with the native pronunciation above.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <BottomNav />
    </Layout>
  );
}
