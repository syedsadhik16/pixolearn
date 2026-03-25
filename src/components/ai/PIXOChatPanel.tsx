import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, RotateCcw, Sparkles, BookOpen, RefreshCw, HelpCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, AIMode, AICard } from '@/lib/pixo-ai-types';

const QUICK_ACTIONS_STUDENT = [
  { label: "Today's Lesson", icon: BookOpen, key: 'todays_lesson' },
  { label: "Explain My Mistake", icon: HelpCircle, key: 'explain_mistake' },
  { label: "Practice Again", icon: RefreshCw, key: 'practice_again' },
  { label: "Ask PIXO", icon: Sparkles, key: 'ask_pixo' },
];

const QUICK_ACTIONS_PARENT = [
  { label: "Parent Insight", icon: BarChart3, key: 'parent_insight' },
  { label: "Weekly Summary", icon: BookOpen, key: 'weekly_summary' },
  { label: "Ask PIXO", icon: Sparkles, key: 'ask_pixo' },
];

interface PIXOChatPanelProps {
  mode?: AIMode;
  isFullPage?: boolean;
  studentId?: string;
  currentDay?: number;
  currentLevel?: string;
}

export function PIXOChatPanel({ mode: propMode, isFullPage = false, studentId, currentDay, currentLevel }: PIXOChatPanelProps) {
  const { profile } = useAuth();
  const mode: AIMode = propMode || (profile?.role === 'parent' ? 'parent' : 'student');
  const quickActions = mode === 'parent' ? QUICK_ACTIONS_PARENT : QUICK_ACTIONS_STUDENT;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Phase 3 will wire this to /api/pixo-ai/chat
    // For now, show a placeholder that the AI backend is not yet connected
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: mode === 'student'
          ? "Hi there! 🌟 I'm PIXO, your learning buddy! The AI chat will be fully connected soon. Keep practising!"
          : "Hello! 📊 PIXO AI insights will be connected in the next update. Your child's progress data will power personalised recommendations here.",
        timestamp: new Date(),
        quick_actions: quickActions.map(a => a.label),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 800);
  }, [isLoading, mode, quickActions]);

  const handleQuickAction = (actionKey: string) => {
    const action = quickActions.find(a => a.key === actionKey);
    if (action) sendMessage(action.label);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.filter(m => m.id !== lastUserMsg.id));
      sendMessage(lastUserMsg.content);
    }
  };

  return (
    <Card className={cn(
      'flex flex-col border-border bg-card',
      isFullPage ? 'h-full rounded-none border-0' : 'h-[500px] w-[380px] shadow-lg'
    )}>
      {/* Header */}
      <CardHeader className="py-3 px-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-foreground">
            {mode === 'student' ? 'Ask PIXO 🦊' : 'PIXO Insights'}
          </span>
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="h-10 w-10 text-primary mx-auto opacity-60" />
            <p className="text-sm text-muted-foreground">
              {mode === 'student'
                ? "Hi! I'm PIXO 🦊 Ask me anything about your lesson!"
                : "Get AI-powered insights about your child's learning journey."}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {quickActions.map(action => (
                <Button
                  key={action.key}
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-full border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => handleQuickAction(action.key)}
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted text-foreground rounded-bl-md'
            )}>
              {msg.content}
              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.cards.map((card, i) => (
                    <AIResponseCard key={i} card={card} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <Button size="sm" variant="ghost" onClick={handleRetry} className="text-destructive text-xs">
              <RotateCcw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'student' ? "Ask PIXO anything..." : "Ask about your child's progress..."}
            className="flex-1 rounded-full bg-muted px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-9 w-9"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

function AIResponseCard({ card }: { card: AICard }) {
  const iconMap = { info: '💡', tip: '✨', practice: '🎯', achievement: '🏆' };
  return (
    <div className="bg-card border border-border rounded-lg p-2 text-xs">
      <p className="font-semibold">{iconMap[card.type] || '📌'} {card.title}</p>
      <p className="text-muted-foreground mt-0.5">{card.content}</p>
    </div>
  );
}

// Floating chat bubble wrapper
export function PIXOChatBubble(props: Omit<PIXOChatPanelProps, 'isFullPage'>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {isOpen && (
        <div className="mb-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-muted hover:bg-destructive/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
            <PIXOChatPanel {...props} />
          </div>
        </div>
      )}
      <Button
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all',
          isOpen ? 'bg-muted text-muted-foreground hover:bg-destructive/10' : 'bg-primary text-primary-foreground hover:scale-105'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
