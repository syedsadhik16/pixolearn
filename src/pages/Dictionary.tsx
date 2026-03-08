import { useState, useEffect } from 'react';
import { trackChallengeProgress } from '@/lib/gamification';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Volume2, BookOpenText, Bookmark, BookmarkCheck, Loader2, Star
} from 'lucide-react';

interface WordResult {
  word: string;
  phonetic: string;
  meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[];
  phonetics: { audio?: string }[];
}

interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  phonetic: string;
}

export default function Dictionary() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WordResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [savedWordSet, setSavedWordSet] = useState<Set<string>>(new Set());
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) loadSavedWords(); }, [user]);

  const loadSavedWords = async () => {
    const { data } = await supabase
      .from('saved_words' as any)
      .select('*')
      .eq('student_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) {
      setSavedWords(data as any);
      setSavedWordSet(new Set((data as any).map((w: any) => w.word.toLowerCase())));
    }
  };

  const searchWord = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Word not found');
      const data = await res.json();
      setResult(data[0]);
    } catch {
      toast({ title: 'Not Found', description: `"${query}" was not found in the dictionary.`, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const speak = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const saveWord = async () => {
    if (!result || !user) return;
    const meaning = result.meanings[0]?.definitions[0]?.definition || '';
    const phonetic = result.phonetic || '';
    
    const { error } = await supabase.from('saved_words' as any).insert({
      student_id: user.id,
      word: result.word,
      meaning,
      phonetic,
    } as any);

    if (error) {
      toast({ title: 'Error', description: 'Could not save word.', variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: `"${result.word}" added to your word bank.` });
      loadSavedWords();
    }
  };

  const removeWord = async (id: string) => {
    await supabase.from('saved_words' as any).delete().eq('id', id);
    loadSavedWords();
  };

  const isWordSaved = result ? savedWordSet.has(result.word.toLowerCase()) : false;

  if (authLoading) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BookOpenText className="h-6 w-6 text-primary" />
            <span className="gradient-text">Dictionary</span>
          </h1>
        </div>

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1">
              <Search className="h-4 w-4 mr-1" />Search
            </TabsTrigger>
            <TabsTrigger value="wordbank" className="flex-1">
              <Bookmark className="h-4 w-4 mr-1" />Word Bank ({savedWords.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchWord()}
                placeholder="Search a word..."
                className="flex-1"
              />
              <Button onClick={searchWord} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* Result */}
            {result && (
              <Card className="animate-slide-up">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-2xl font-display font-bold">{result.word}</h2>
                      {result.phonetic && (
                        <p className="text-sm text-muted-foreground">{result.phonetic}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => {
                        const audioUrl = result.phonetics?.find(p => p.audio)?.audio;
                        if (audioUrl) playAudio(audioUrl);
                        else speak(result.word);
                      }}>
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={isWordSaved ? 'secondary' : 'outline'}
                        size="icon"
                        onClick={saveWord}
                        disabled={isWordSaved}
                      >
                        {isWordSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {result.meanings.map((meaning, i) => (
                    <div key={i} className="mb-4">
                      <Badge variant="outline" className="mb-2">{meaning.partOfSpeech}</Badge>
                      <ol className="list-decimal list-inside space-y-2">
                        {meaning.definitions.slice(0, 3).map((def, j) => (
                          <li key={j} className="text-sm">
                            {def.definition}
                            {def.example && (
                              <p className="text-xs text-muted-foreground ml-5 mt-1 italic">
                                "{def.example}"
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="wordbank" className="space-y-3">
            {savedWords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No saved words yet</p>
                <p className="text-xs">Search and save words to build your vocabulary!</p>
              </div>
            ) : (
              savedWords.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => speak(w.word)}>
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{w.word}</span>
                        {w.phonetic && <span className="text-xs text-muted-foreground">{w.phonetic}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{w.meaning}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeWord(w.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <BookmarkCheck className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </Layout>
  );
}
