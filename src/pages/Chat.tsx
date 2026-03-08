import { useState, useEffect, useRef } from 'react';
import { trackChallengeProgress } from '@/lib/gamification';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { 
  Send, Bot, User, Loader2, Mic, MicOff, Volume2, Sparkles
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanion } from '@/hooks/useCompanion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your English tutor. 🎓 Ask me anything about grammar, vocabulary, pronunciation, or just have a conversation to practice your English!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companion = useCompanion();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: 'Not Supported', description: 'Speech recognition not supported.', variant: 'destructive' });
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSend(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    (recognition as any).onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Track chat challenge
    if (user) trackChallengeProgress(user.id, 'chat');

    try {
      const { data, error } = await supabase.functions.invoke('ai-practice', {
        body: {
          messages: [...messages, userMessage],
          systemPrompt: `You are a friendly and patient English tutor. Help the user improve their English skills. 
You can help with:
- Grammar explanations and corrections
- Vocabulary building and word meanings
- Pronunciation tips
- Conversation practice
- Translation help
Always be encouraging and provide clear, simple explanations.`,
          scenarioId: 'tutor',
        },
      });
      if (error) throw error;
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      speak(data.response);
    } catch (error) {
      console.error('Chat error:', error);
      toast({ title: 'Error', description: 'Failed to get response.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <img src={companion.image} alt={companion.name} className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-display font-bold text-lg">{companion.name} – AI English Tutor</h1>
              <p className="text-xs text-muted-foreground">
                {isSpeaking ? '🔊 Speaking...' : 'Ask me anything about English!'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-2xl mx-auto space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
                }`}>
                  {message.role === 'user' 
                    ? <User className="h-4 w-4" /> 
                    : <img src={companion.image} alt={companion.name} className="w-8 h-8 object-contain" />
                  }
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted rounded-tl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted p-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-3 bg-card">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className="shrink-0"
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => handleSend()} disabled={!inputText.trim() || isLoading} size="icon" className="shrink-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </Layout>
  );
}
