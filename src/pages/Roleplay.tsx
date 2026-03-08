import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { 
  ArrowLeft, Mic, MicOff, Volume2, Loader2, Send, Bot, User,
  ShoppingCart, Utensils, Plane, GraduationCap, Briefcase, Phone,
  Hotel, Stethoscope, Theater
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message { role: 'user' | 'assistant'; content: string; }

interface Scenario {
  id: string; title: string; description: string; icon: React.ElementType;
  systemPrompt: string; greeting: string; color: string;
}

const scenarios: Scenario[] = [
  { id: 'restaurant', title: 'Restaurant', description: 'Order food & drinks', icon: Utensils, color: 'from-orange-500 to-red-500',
    systemPrompt: 'You are a friendly waiter. Greet the customer, take their order. Keep responses short, use simple English.',
    greeting: "Welcome to The Golden Spoon! I'll be your server. Would you like to see the menu?" },
  { id: 'shopping', title: 'Shopping', description: 'Buy clothes or gadgets', icon: ShoppingCart, color: 'from-blue-500 to-purple-500',
    systemPrompt: 'You are a shop assistant. Help find products, suggest items, discuss prices. Keep it short and friendly.',
    greeting: "Hello! Welcome to our store. What are you looking for today?" },
  { id: 'travel', title: 'Travel', description: 'Ask for directions', icon: Plane, color: 'from-cyan-500 to-blue-500',
    systemPrompt: 'You are a helpful local. Give directions, recommend places. Keep responses clear and simple.',
    greeting: "Hi there! Need help finding your way? Where would you like to go?" },
  { id: 'school', title: 'School', description: 'Talk to a teacher', icon: GraduationCap, color: 'from-green-500 to-emerald-500',
    systemPrompt: 'You are a friendly teacher. Help with homework and class questions. Be encouraging.',
    greeting: "Good morning! How can I help you today?" },
  { id: 'interview', title: 'Job Interview', description: 'Practice interviews', icon: Briefcase, color: 'from-indigo-500 to-purple-500',
    systemPrompt: 'You are a friendly interviewer. Ask common questions one at a time. Be supportive.',
    greeting: "Thank you for coming in. Can you tell me a little about yourself?" },
  { id: 'phone', title: 'Phone Call', description: 'Phone conversations', icon: Phone, color: 'from-pink-500 to-rose-500',
    systemPrompt: 'You are someone receiving a phone call. Respond naturally. Keep responses brief.',
    greeting: "Hello? Yes, speaking. How can I help you?" },
  { id: 'hotel', title: 'Hotel', description: 'Check in & requests', icon: Hotel, color: 'from-amber-500 to-orange-500',
    systemPrompt: 'You are a hotel receptionist. Help with check-in, room requests, and amenities.',
    greeting: "Welcome to Grand Hotel! Do you have a reservation?" },
  { id: 'doctor', title: 'Doctor Visit', description: 'Describe symptoms', icon: Stethoscope, color: 'from-teal-500 to-green-500',
    systemPrompt: 'You are a friendly doctor. Ask about symptoms and give simple advice. Use easy language.',
    greeting: "Hello! Please have a seat. What brings you in today?" },
];

export default function Roleplay() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  };

  const startRecording = () => {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) { toast({ title: 'Not Supported', variant: 'destructive' }); return; }
    const r = new API(); r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setInputText(t); handleSend(t); };
    r.onerror = () => setIsRecording(false);
    (r as any).onend = () => setIsRecording(false);
    recognitionRef.current = r; r.start(); setIsRecording(true);
  };

  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const startScenario = (s: Scenario) => {
    setSelectedScenario(s);
    setMessages([{ role: 'assistant', content: s.greeting }]);
    speak(s.greeting);
  };

  const handleSend = async (text?: string) => {
    const msg = text || inputText.trim();
    if (!msg || !selectedScenario) return;
    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]); setInputText(''); setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-practice', {
        body: { messages: [...messages, userMsg], systemPrompt: selectedScenario.systemPrompt, scenarioId: selectedScenario.id },
      });
      if (error) throw error;
      const assistantMsg: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMsg]);
      speak(data.response);
    } catch { toast({ title: 'Error', description: 'Failed to get response.', variant: 'destructive' }); }
    finally { setIsLoading(false); }
  };

  const exitScenario = () => { window.speechSynthesis.cancel(); setSelectedScenario(null); setMessages([]); setInputText(''); };

  if (authLoading) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  if (!selectedScenario) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 pb-24">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Theater className="h-6 w-6 text-primary" />
              <span className="gradient-text">Roleplay</span> Scenarios
            </h1>
            <p className="text-sm text-muted-foreground">Practice real-life conversations with AI</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {scenarios.map((s) => (
              <Card key={s.id} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group" onClick={() => startScenario(s)}>
                <CardContent className="p-0">
                  <div className={`h-20 bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <s.icon className="h-10 w-10 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNav />
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false}>
      <div className="h-screen flex flex-col bg-background">
        <div className={`bg-gradient-to-r ${selectedScenario.color} p-3 text-white`}>
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={exitScenario} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <selectedScenario.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm">{selectedScenario.title}</h2>
              <p className="text-xs text-white/80">{selectedScenario.description}</p>
            </div>
            {isSpeaking && <Volume2 className="h-4 w-4 animate-pulse" />}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                  <p className="text-sm">{m.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Bot className="h-4 w-4" /></div>
                <div className="bg-muted p-3 rounded-2xl rounded-tl-none"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-3 bg-background pb-20">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Button variant={isRecording ? 'destructive' : 'outline'} size="icon" onClick={isRecording ? stopRecording : startRecording} disabled={isLoading} className="shrink-0">
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); }}} placeholder="Type or speak..." disabled={isLoading} className="flex-1" />
            <Button onClick={() => handleSend()} disabled={!inputText.trim() || isLoading} size="icon" className="shrink-0"><Send className="h-5 w-5" /></Button>
          </div>
        </div>
        <BottomNav />
      </div>
    </Layout>
  );
}
