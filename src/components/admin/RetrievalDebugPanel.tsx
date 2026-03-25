import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  chunk_id: string;
  document_id: string;
  title: string;
  content: string;
  chunk_type: string;
  source_type: string;
  audience: string;
  level_no: number | null;
  week_no: number | null;
  day_no: number | null;
  lesson_part: number | null;
  skill_code: string | null;
  similarity: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export function RetrievalDebugPanel() {
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState("10");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterWeek, setFilterWeek] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [filterAudience, setFilterAudience] = useState("all");
  const [filterSourceType, setFilterSourceType] = useState("all");
  const [filterLessonPart, setFilterLessonPart] = useState("");
  const [filterSkillCode, setFilterSkillCode] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({ title: "Error", description: "Enter a search query", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    setResults([]);
    const startTime = performance.now();

    try {
      const body: Record<string, unknown> = {
        query: query.trim(),
        match_count: parseInt(matchCount) || 10,
      };
      if (filterLevel) body.filter_level = parseInt(filterLevel);
      if (filterWeek) body.filter_week = parseInt(filterWeek);
      if (filterDay) body.filter_day = parseInt(filterDay);
      if (filterAudience !== "all") body.filter_audience = filterAudience;
      if (filterSourceType !== "all") body.filter_source_type = filterSourceType;
      if (filterLessonPart) body.filter_lesson_part = parseInt(filterLessonPart);
      if (filterSkillCode) body.filter_skill_code = filterSkillCode;

      const { data, error } = await supabase.functions.invoke("search-knowledge", { body });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || "Search failed");

      setResults(data.results);
      setSearchTime(performance.now() - startTime);
    } catch (e) {
      toast({ title: "Search Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Retrieval Debug</CardTitle>
          <CardDescription>
            Test semantic search against knowledge chunks. Shows similarity scores and source metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search query */}
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. How to teach the letter A sound"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Level</label>
              <Input value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} placeholder="e.g. 1" type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Week</label>
              <Input value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} placeholder="e.g. 1" type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Day</label>
              <Input value={filterDay} onChange={(e) => setFilterDay(e.target.value)} placeholder="e.g. 1" type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Part</label>
              <Input value={filterLessonPart} onChange={(e) => setFilterLessonPart(e.target.value)} placeholder="e.g. 1" type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Audience</label>
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ai_internal">AI Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Source Type</label>
              <Select value={filterSourceType} onValueChange={setFilterSourceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="curriculum">Curriculum</SelectItem>
                  <SelectItem value="phonics_rule">Phonics Rule</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="assessment_logic">Assessment Logic</SelectItem>
                  <SelectItem value="parent_help">Parent Help</SelectItem>
                  <SelectItem value="ai_policy">AI Policy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Skill Code</label>
              <Input value={filterSkillCode} onChange={(e) => setFilterSkillCode(e.target.value)} placeholder="e.g. phonemic_awareness" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max Results</label>
              <Input value={matchCount} onChange={(e) => setMatchCount(e.target.value)} type="number" min="1" max="50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(results.length > 0 || searchTime !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Results
              <Badge variant="secondary">{results.length}</Badge>
              {searchTime !== null && (
                <span className="text-xs text-muted-foreground font-normal">({Math.round(searchTime)}ms)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching chunks found.</p>
            ) : (
              <div className="overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Score</TableHead>
                      <TableHead className="w-28">Type</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead className="w-24">Source</TableHead>
                      <TableHead className="w-20">L/W/D/P</TableHead>
                      <TableHead className="w-20">Audience</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.chunk_id}>
                        <TableCell>
                          <Badge
                            variant={r.similarity > 0.8 ? "default" : r.similarity > 0.6 ? "secondary" : "outline"}
                            className="font-mono text-xs"
                          >
                            {(r.similarity * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{r.chunk_type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium max-w-[150px] truncate">{r.title}</TableCell>
                        <TableCell className="text-xs max-w-md">
                          <div className="line-clamp-3 whitespace-pre-wrap">{r.content}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{r.source_type}</Badge></TableCell>
                        <TableCell className="text-xs font-mono">
                          {r.level_no ?? "—"}/{r.week_no ?? "—"}/{r.day_no ?? "—"}/{r.lesson_part ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">{r.audience}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
