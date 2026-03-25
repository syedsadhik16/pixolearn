import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Upload, FileCheck, Loader2, AlertTriangle, CheckCircle2, Search, RefreshCw, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/shared/BackButton";
import { RetrievalDebugPanel } from "@/components/admin/RetrievalDebugPanel";

interface ChunkPreview {
  chunk_index: number;
  chunk_type: string;
  content: string;
  level_no: number | null;
  week_no: number | null;
  day_no: number | null;
  lesson_part: number | null;
  skill_code: string | null;
  tags: string[];
}

interface IndexJob {
  id: string;
  document_id: string | null;
  job_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  payload: Record<string, unknown>;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  source_type: string;
  audience: string;
  level_no: number | null;
  status: string;
  created_at: string;
}

const SAMPLE_JSON = `{
  "source_type": "curriculum",
  "audience": "student",
  "level_no": 1,
  "topic": "Phonics Foundation",
  "days": [
    {
      "level_no": 1,
      "week_no": 1,
      "day_no": 1,
      "title": "Hello Sounds",
      "theme": "Introduction to letter sounds",
      "day_objective": "Learn the sounds of A, B, C",
      "target_skills": ["phonemic_awareness", "letter_sound_recognition"],
      "target_content": {
        "letters": ["A", "B", "C"],
        "words": ["apple", "ball", "cat"]
      },
      "success_criteria": ["Can identify sounds of A, B, C", "Can match sound to letter"],
      "main_game": "Sound Safari",
      "reward_badge": "Sound Explorer",
      "parent_todays_target": "Your child will learn the sounds of A, B, and C today.",
      "parent_words_learned": "apple, ball, cat",
      "parent_confidence_note": "Early days - encourage any attempts!",
      "parent_home_practice": "Point to objects starting with A, B, or C around the house.",
      "parent_praise_line": "Great start on the sound journey!",
      "parts": [
        {
          "part_number": 1,
          "part_name": "Sound Introduction",
          "interaction_type": "listen",
          "xp_value": 5,
          "duration_minutes": 3,
          "prompt_logic": { "play_audio": ["a_sound", "b_sound", "c_sound"] }
        },
        {
          "part_number": 2,
          "part_name": "Sound Matching",
          "interaction_type": "tap_match",
          "xp_value": 10,
          "duration_minutes": 5,
          "prompt_logic": { "match_sound_to_letter": true }
        }
      ]
    }
  ]
}`;

export default function AdminKnowledgeIngestion() {
  const { profile } = useAuth();
  const [jsonInput, setJsonInput] = useState("");
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors?: string[]; dayCount?: number } | null>(null);
  const [chunkPreviews, setChunkPreviews] = useState<ChunkPreview[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [indexJobs, setIndexJobs] = useState<IndexJob[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const invokeFunction = useCallback(async (fnName: string, body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke(fnName, { body });
    if (error) throw new Error(error.message);
    return data;
  }, []);

  const handleValidate = async () => {
    if (!jsonInput.trim()) {
      toast({ title: "Error", description: "Please enter JSON data", variant: "destructive" });
      return;
    }
    setIsValidating(true);
    setValidationResult(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const result = await invokeFunction("rag-ingest", { action: "validate", data: parsed });
      setValidationResult(result.success
        ? { valid: true, dayCount: result.day_count }
        : { valid: false, errors: result.errors }
      );
    } catch (e) {
      const msg = e instanceof SyntaxError ? "Invalid JSON syntax" : (e as Error).message;
      setValidationResult({ valid: false, errors: [msg] });
    } finally {
      setIsValidating(false);
    }
  };

  const handlePreviewChunks = async () => {
    setIsPreviewing(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const result = await invokeFunction("rag-ingest", { action: "preview_chunks", data: parsed });
      if (result.success) {
        setChunkPreviews(result.chunks);
        toast({ title: "Preview Ready", description: `${result.total_chunks} chunks generated` });
      } else {
        toast({ title: "Error", description: result.errors?.join(", "), variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const result = await invokeFunction("rag-ingest", { action: "ingest", data: parsed });
      if (result.success) {
        toast({
          title: "Ingestion Complete ✅",
          description: `${result.chunks_created} chunks created with ${result.embeddings_generated} embeddings`,
        });
        setJsonInput("");
        setValidationResult(null);
        setChunkPreviews([]);
        fetchIndexJobs();
        fetchDocuments();
      } else {
        toast({ title: "Error", description: result.errors?.join(", "), variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Ingestion Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsIngesting(false);
    }
  };

  const fetchIndexJobs = async () => {
    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from("rag_index_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) setIndexJobs(data as unknown as IndexJob[]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("id, title, source_type, audience, level_no, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setDocuments(data as unknown as KnowledgeDoc[]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleReindex = async (documentId: string) => {
    try {
      const result = await invokeFunction("rag-ingest", { action: "reindex", document_id: documentId });
      if (result.success) {
        toast({ title: "Re-index Complete", description: `${result.reindexed} chunks re-indexed` });
        fetchIndexJobs();
      }
    } catch (e) {
      toast({ title: "Re-index Failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive font-semibold">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Ingestion</h1>
          <p className="text-muted-foreground text-sm">Upload, chunk, and embed curriculum content for RAG retrieval</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        if (v === "status") { fetchIndexJobs(); fetchDocuments(); }
      }}>
        <TabsList className="mb-4">
          <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-1" /> Upload & Chunk</TabsTrigger>
          <TabsTrigger value="status"><Database className="w-4 h-4 mr-1" /> Status</TabsTrigger>
          <TabsTrigger value="debug"><Search className="w-4 h-4 mr-1" /> Retrieval Debug</TabsTrigger>
        </TabsList>

        {/* ── Upload Tab ── */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Curriculum JSON Upload</CardTitle>
              <CardDescription>
                Paste structured curriculum JSON. Use the sample below as a template.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste curriculum JSON here..."
                className="min-h-[300px] font-mono text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setJsonInput(SAMPLE_JSON)}>
                  Load Sample
                </Button>
                <Button onClick={handleValidate} disabled={isValidating || !jsonInput.trim()} size="sm">
                  {isValidating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileCheck className="w-4 h-4 mr-1" />}
                  Validate
                </Button>
                <Button
                  onClick={handlePreviewChunks}
                  disabled={isPreviewing || !validationResult?.valid}
                  variant="secondary"
                  size="sm"
                >
                  {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Search className="w-4 h-4 mr-1" />}
                  Preview Chunks
                </Button>
                <Button
                  onClick={handleIngest}
                  disabled={isIngesting || !validationResult?.valid}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isIngesting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                  Ingest & Embed
                </Button>
              </div>

              {/* Validation result */}
              {validationResult && (
                <div className={`p-3 rounded-lg border ${validationResult.valid ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
                  {validationResult.valid ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Valid — {validationResult.dayCount} day(s) found</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Validation errors:</span>
                      </div>
                      {validationResult.errors?.map((err, i) => (
                        <p key={i} className="text-xs text-destructive ml-6">• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chunk Preview */}
          {chunkPreviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chunk Preview ({chunkPreviews.length})</CardTitle>
                <CardDescription>Review chunks before ingesting. Each chunk will get an embedding.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="w-28">Type</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead className="w-20">Level</TableHead>
                        <TableHead className="w-20">W/D/P</TableHead>
                        <TableHead className="w-32">Tags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chunkPreviews.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{c.chunk_index}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{c.chunk_type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-md">
                            <div className="line-clamp-3 whitespace-pre-wrap">{c.content}</div>
                          </TableCell>
                          <TableCell className="text-xs">{c.level_no ?? "—"}</TableCell>
                          <TableCell className="text-xs">
                            {c.week_no ?? "—"}/{c.day_no ?? "—"}/{c.lesson_part ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.tags.slice(0, 3).map((t, j) => (
                                <Badge key={j} variant="secondary" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Status Tab ── */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Knowledge Documents</CardTitle>
                <CardDescription>All ingested documents</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loadingDocs}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingDocs ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents yet. Upload curriculum JSON to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="text-sm font-medium">{doc.title}</TableCell>
                        <TableCell><Badge variant="outline">{doc.source_type}</Badge></TableCell>
                        <TableCell className="text-xs">{doc.audience}</TableCell>
                        <TableCell className="text-xs">{doc.level_no ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={doc.status === "active" ? "default" : "secondary"}>{doc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleReindex(doc.id)}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Re-index
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Index Jobs</CardTitle>
                <CardDescription>Embedding and indexing job history</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchIndexJobs} disabled={loadingJobs}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingJobs ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {indexJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indexJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell><Badge variant="outline">{job.job_type}</Badge></TableCell>
                        <TableCell>
                          <Badge
                            variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {JSON.stringify(job.payload)}
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                          {job.error_message ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">{new Date(job.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Debug Tab ── */}
        <TabsContent value="debug">
          <RetrievalDebugPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
