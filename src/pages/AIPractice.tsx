import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  Loader2,
  MessageCircle,
  Send,
  Bot,
  User,
  ShoppingCart,
  Utensils,
  Plane,
  GraduationCap,
  Briefcase,
  Phone
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

// Use built-in SpeechRecognition types or define minimal interface
type SpeechRecognitionAPI = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  systemPrompt: string;
  greeting: string;
  color: string;
}

const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    title: 'Restaurant Order',
    description: 'Practice ordering food at a restaurant',
    icon: Utensils,
    color: 'from-orange-500 to-red-500',
    systemPrompt: 'You are a friendly waiter at a restaurant. Greet the customer, take their order, and help them with menu questions. Keep responses short and natural. Use simple English for beginners.',
    greeting: "Welcome to The Golden Spoon! I'll be your server today. Would you like to start with some drinks, or are you ready to order?",
  },
  {
    id: 'shopping',
    title: 'Shopping Assistant',
    description: 'Buy clothes or electronics at a store',
    icon: ShoppingCart,
    color: 'from-blue-500 to-purple-500',
    systemPrompt: 'You are a helpful shop assistant. Help the customer find what they need, suggest products, and answer questions about sizes, colors, and prices. Keep responses short and friendly.',
    greeting: "Hello! Welcome to our store. I'm here to help you find what you're looking for. Are you shopping for anything specific today?",
  },
  {
    id: 'travel',
    title: 'Travel & Directions',
    description: 'Ask for directions or book travel',
    icon: Plane,
    color: 'from-cyan-500 to-blue-500',
    systemPrompt: 'You are a helpful local who knows the city well. Help tourists with directions, recommend places to visit, and give travel tips. Keep responses clear and simple.',
    greeting: "Hi there! You look a bit lost. I'm a local and I'd be happy to help you find your way. Where are you trying to go?",
  },
  {
    id: 'school',
    title: 'School Conversation',
    description: 'Talk with a teacher or classmate',
    icon: GraduationCap,
    color: 'from-green-500 to-emerald-500',
    systemPrompt: 'You are a friendly teacher helping a student with questions about school, homework, or class schedules. Be encouraging and patient. Use simple language.',
    greeting: "Good morning! How can I help you today? Do you have any questions about your classes or homework?",
  },
  {
    id: 'interview',
    title: 'Job Interview',
    description: 'Practice common interview questions',
    icon: Briefcase,
    color: 'from-indigo-500 to-purple-500',
    systemPrompt: 'You are a friendly interviewer conducting a job interview. Ask common interview questions one at a time and provide encouraging feedback. Keep it supportive and educational.',
    greeting: "Hello, thank you for coming in today. Please have a seat. Let's start with a simple question: Can you tell me a little bit about yourself?",
  },
  {
    id: 'phone',
    title: 'Phone Call',
    description: 'Practice phone conversations',
    icon: Phone,
    color: 'from-pink-500 to-rose-500',
    systemPrompt: 'You are someone receiving a phone call. You could be a receptionist, friend, or customer service agent. Respond naturally to phone conversations. Keep responses brief.',
    greeting: "Hello? Yes, speaking. How can I help you?",
  },
];

export default function AIPractice() {
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setMessages([{ role: 'assistant', content: scenario.greeting }]);
    speak(scenario.greeting);
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

  const startRecording = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast({
        title: 'Recording Error',
        description: 'Could not capture speech. Please try again.',
        variant: 'destructive',
      });
    };

    (recognition as any).onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || !selectedScenario) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-practice', {
        body: {
          messages: [...messages, userMessage],
          systemPrompt: selectedScenario.systemPrompt,
          scenarioId: selectedScenario.id,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      speak(data.response);
    } catch (error) {
      console.error('AI Practice error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const exitScenario = () => {
    window.speechSynthesis.cancel();
    setSelectedScenario(null);
    setMessages([]);
    setInputText('');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Scenario selection view
  if (!selectedScenario) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/student')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold">
                  AI Practice Simulations
                </h1>
                <p className="text-muted-foreground">
                  Practice real conversations with AI in different scenarios
                </p>
              </div>
            </div>

            {/* Scenarios Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:shadow-pixo-md transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
                  onClick={() => startScenario(scenario)}
                >
                  <CardContent className="p-0">
                    <div className={`h-24 bg-gradient-to-br ${scenario.color} flex items-center justify-center`}>
                      <scenario.icon className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{scenario.title}</h3>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Tips for Practice
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Speak clearly and at a natural pace</li>
                  <li>• Use the microphone button to speak or type your responses</li>
                  <li>• Don't worry about making mistakes - that's how you learn!</li>
                  <li>• Try to respond in complete sentences</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Conversation view
  return (
    <Layout showNavbar={false}>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedScenario.color} p-4 text-white`}>
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={exitScenario}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <selectedScenario.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">{selectedScenario.title}</h2>
                <p className="text-sm text-white/80">{selectedScenario.description}</p>
              </div>
            </div>
            {isSpeaking && (
              <div className="flex items-center gap-2 text-sm">
                <Volume2 className="h-4 w-4 animate-pulse" />
                Speaking...
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted rounded-tl-none'
                }`}>
                  <p className="text-sm">{message.content}</p>
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
        <div className="border-t p-4 bg-background">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className="shrink-0"
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type or speak your response..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
