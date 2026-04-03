import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, RotateCcw, Sparkles, BookOpen, RefreshCw, HelpCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage, AIMode, AICard } from "@/lib/pixo-ai-types";
import chatbotMascot from "@/assets/pixo-chatbot-superhero.png";

const QUICK_ACTIONS_STUDENT = [
  { label: "Today's Lesson", icon: BookOpen, key: "todays_lesson" },
  { label: "Explain My Mistake", icon: HelpCircle, key: "explain_mistake" },
  { label: "Practice Again", icon: RefreshCw, key: "practice_again" },
  { label: "Ask PIXO", icon: Sparkles, key: "ask_pixo" },
];

const QUICK_ACTIONS_PARENT = [
  { label: "Parent Insight", icon: BarChart3, key: "parent_insight" },
  { label: "Weekly Summary", icon: BookOpen, key: "weekly_summary" },
  { label: "Ask PIXO", icon: Sparkles, key: "ask_pixo" },
];

interface PIXOChatPanelProps {
  mode?: AIMode;
  isFullPage?: boolean;
  studentId?: string;
  currentDay?: number;
  currentLevel?: string;
}

export function PIXOChatPanel({
  mode: propMode,
  isFullPage = false,
  studentId,
  currentDay,
  currentLevel,
}: PIXOChatPanelProps) {
  const { user, session, profile } = useAuth();
  const mode: AIMode = propMode || (profile?.role === "parent" ? "parent" : "student");
  const quickActions = mode === "parent" ? QUICK_ACTIONS_PARENT : QUICK_ACTIONS_STUDENT;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();
      const accessToken = activeSession?.access_token || session?.access_token;

      if (!user || !accessToken) {
        setError("Please sign in to chat with PIXO.");
        const loginMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "You need to sign in first before we can chat! 😊",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, loginMsg]);
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("pixo-ai-chat", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: {
            message: text.trim(),
            role_context: mode,
            student_id: studentId || user.id,
            parent_id: mode === "parent" ? user.id : undefined,
            current_level: currentLevel,
            current_day: currentDay,
          },
        });

        if (fnError) throw fnError;

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data?.answer || "I'm here to help! Could you try asking again?",
          cards: data?.cards,
          quick_actions: data?.quick_actions,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        console.error("PIXO chat error:", err);

        const isUnauthorized =
          typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message?: string }).message === "string" &&
          (err as { message: string }).message.includes("401");

        setError(isUnauthorized ? "Please sign in to chat with PIXO." : "Something went wrong. Tap retry.");

        const fallbackMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: isUnauthorized
            ? "Please sign in again to continue chatting with PIXO. 😊"
            : "Oops! I had a little hiccup. Can you try again? 😊",
          quick_actions: isUnauthorized ? ["Sign in"] : ["Try again"],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, mode, studentId, user, session?.access_token, currentLevel, currentDay],
  );

  const handleQuickAction = (actionKey: string) => {
    const action = quickActions.find((a) => a.key === actionKey);
    if (action) sendMessage(action.label);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setMessages((prev) => prev.filter((m) => m.id !== lastUserMsg.id));
      sendMessage(lastUserMsg.content);
    }
  };

  return (
    <Card
      className={cn(
        "flex flex-col border-border bg-card",
        isFullPage ? "h-full rounded-none border-0" : "h-[500px] w-[380px] shadow-lg",
      )}
    >
      <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm overflow-hidden">
            <img src={chatbotMascot} alt="PIXO Chat Assistant" className="h-9 w-9 object-contain" />
          </div>
          <span className="text-foreground">{mode === "student" ? "Ask PIXO 🦊" : "PIXO Insights"}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="space-y-3 py-8 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white/80 p-2 shadow-sm overflow-hidden">
              <img src={chatbotMascot} alt="PIXO Chat Assistant" className="h-20 w-20 object-contain" />
            </div>

            <p className="text-sm text-muted-foreground">
              {mode === "student"
                ? "Hi! I'm PIXO 🦊 Ask me anything about your lesson!"
                : "Get AI-powered insights about your child's learning journey."}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.key}
                  size="sm"
                  variant="outline"
                  className="rounded-full border-primary/30 text-xs text-primary hover:bg-primary/10"
                  onClick={() => handleQuickAction(action.key)}
                >
                  <action.icon className="mr-1 h-3 w-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted text-foreground",
              )}
            >
              {msg.content}

              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.cards.map((card, i) => (
                    <AIResponseCard key={i} card={card} />
                  ))}
                </div>
              )}

              {msg.quick_actions && msg.quick_actions.length > 0 && msg.role === "assistant" && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.quick_actions.map((qa, i) => (
                    <button
                      key={i}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary transition-colors hover:bg-primary/20"
                      onClick={() => sendMessage(qa)}
                    >
                      {qa}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <Button size="sm" variant="ghost" onClick={handleRetry} className="text-xs text-destructive">
              <RotateCcw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "student" ? "Ask PIXO anything..." : "Ask about your child's progress..."}
            className="flex-1 rounded-full bg-muted px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="h-9 w-9 rounded-full" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

function AIResponseCard({ card }: { card: AICard }) {
  const iconMap = { info: "💡", tip: "✨", practice: "🎯", achievement: "🏆" };

  return (
    <div className="rounded-lg border border-border bg-card p-2 text-xs">
      <p className="font-semibold">
        {iconMap[card.type] || "📌"} {card.title}
      </p>
      <p className="mt-0.5 text-muted-foreground">{card.content}</p>
    </div>
  );
}

export function PIXOChatBubble(props: Omit<PIXOChatPanelProps, "isFullPage">) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {isOpen && (
        <div className="mb-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute -right-2 -top-2 z-10 h-6 w-6 rounded-full bg-muted hover:bg-destructive/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
            <PIXOChatPanel {...props} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open PIXO Chat"
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-all overflow-hidden",
          isOpen ? "bg-muted text-muted-foreground hover:bg-destructive/10" : "bg-white/95 hover:scale-105",
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <img src={chatbotMascot} alt="PIXO Chat Assistant" className="h-14 w-14 object-contain" />
        )}
      </button>
    </div>
  );
}
