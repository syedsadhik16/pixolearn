import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Curriculum JSON Schema Validation ──────────────────────────
interface CurriculumDayInput {
  level_no: number;
  month_no?: number;
  week_no: number;
  day_no: number;
  title: string;
  theme: string;
  day_objective?: string;
  target_skills?: string[];
  target_content?: Record<string, unknown>;
  success_criteria?: string[];
  main_game?: string;
  reward_badge?: string;
  parent_todays_target?: string;
  parent_words_learned?: string;
  parent_confidence_note?: string;
  parent_home_practice?: string;
  parent_praise_line?: string;
  parts?: CurriculumPartInput[];
}

interface CurriculumPartInput {
  part_number: number;
  part_name: string;
  interaction_type?: string;
  xp_value?: number;
  duration_minutes?: number;
  prompt_logic?: Record<string, unknown>;
  support_logic?: Record<string, unknown>;
  celebration_logic?: Record<string, unknown>;
}

interface CurriculumUpload {
  source_type: string;
  audience?: string;
  level_no?: number;
  topic?: string;
  days: CurriculumDayInput[];
}

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

function validateCurriculumUpload(data: unknown): { valid: boolean; errors: string[]; parsed?: CurriculumUpload } {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Input must be a JSON object"] };
  }
  const obj = data as Record<string, unknown>;

  const validSourceTypes = ["curriculum", "phonics_rule", "faq", "assessment_logic", "parent_help", "ai_policy"];
  if (!obj.source_type || !validSourceTypes.includes(obj.source_type as string)) {
    errors.push(`source_type must be one of: ${validSourceTypes.join(", ")}`);
  }

  if (!Array.isArray(obj.days) || obj.days.length === 0) {
    errors.push("days must be a non-empty array");
  } else {
    (obj.days as unknown[]).forEach((day, i) => {
      if (!day || typeof day !== "object") {
        errors.push(`days[${i}] must be an object`);
        return;
      }
      const d = day as Record<string, unknown>;
      if (typeof d.level_no !== "number") errors.push(`days[${i}].level_no is required (number)`);
      if (typeof d.week_no !== "number") errors.push(`days[${i}].week_no is required (number)`);
      if (typeof d.day_no !== "number") errors.push(`days[${i}].day_no is required (number)`);
      if (typeof d.title !== "string" || !d.title) errors.push(`days[${i}].title is required (string)`);
      if (typeof d.theme !== "string" || !d.theme) errors.push(`days[${i}].theme is required (string)`);
    });
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, errors: [], parsed: obj as unknown as CurriculumUpload };
}

// ── Chunking Logic ─────────────────────────────────────────────
function chunkCurriculumDay(day: CurriculumDayInput, sourceType: string): ChunkPreview[] {
  const chunks: ChunkPreview[] = [];
  let idx = 0;

  // 1. Day overview chunk
  const overviewParts = [
    `Day ${day.day_no}: ${day.title}`,
    `Theme: ${day.theme}`,
    day.day_objective ? `Objective: ${day.day_objective}` : null,
    day.target_skills?.length ? `Target Skills: ${day.target_skills.join(", ")}` : null,
    day.success_criteria?.length ? `Success Criteria: ${day.success_criteria.join("; ")}` : null,
    day.main_game ? `Main Game: ${day.main_game}` : null,
  ].filter(Boolean);

  chunks.push({
    chunk_index: idx++,
    chunk_type: "day_overview",
    content: overviewParts.join("\n"),
    level_no: day.level_no,
    week_no: day.week_no,
    day_no: day.day_no,
    lesson_part: null,
    skill_code: day.target_skills?.[0] ?? null,
    tags: [sourceType, "overview", `L${day.level_no}W${day.week_no}D${day.day_no}`],
  });

  // 2. Target content chunk (if present)
  if (day.target_content && Object.keys(day.target_content).length > 0) {
    chunks.push({
      chunk_index: idx++,
      chunk_type: "target_content",
      content: `Day ${day.day_no} Target Content:\n${JSON.stringify(day.target_content, null, 2)}`,
      level_no: day.level_no,
      week_no: day.week_no,
      day_no: day.day_no,
      lesson_part: null,
      skill_code: null,
      tags: [sourceType, "target_content"],
    });
  }

  // 3. Parent guidance chunk
  const parentParts = [
    day.parent_todays_target ? `Today's Target: ${day.parent_todays_target}` : null,
    day.parent_words_learned ? `Words Learned: ${day.parent_words_learned}` : null,
    day.parent_confidence_note ? `Confidence Note: ${day.parent_confidence_note}` : null,
    day.parent_home_practice ? `Home Practice: ${day.parent_home_practice}` : null,
    day.parent_praise_line ? `Praise: ${day.parent_praise_line}` : null,
  ].filter(Boolean);

  if (parentParts.length > 0) {
    chunks.push({
      chunk_index: idx++,
      chunk_type: "parent_guidance",
      content: `Day ${day.day_no} Parent Guidance:\n${parentParts.join("\n")}`,
      level_no: day.level_no,
      week_no: day.week_no,
      day_no: day.day_no,
      lesson_part: null,
      skill_code: null,
      tags: [sourceType, "parent_guidance"],
    });
  }

  // 4. Per-part chunks
  if (day.parts && day.parts.length > 0) {
    for (const part of day.parts) {
      const partContent = [
        `Part ${part.part_number}: ${part.part_name}`,
        part.interaction_type ? `Interaction: ${part.interaction_type}` : null,
        part.xp_value ? `XP: ${part.xp_value}` : null,
        part.duration_minutes ? `Duration: ${part.duration_minutes} min` : null,
        part.prompt_logic && Object.keys(part.prompt_logic).length > 0
          ? `Prompt Logic: ${JSON.stringify(part.prompt_logic)}`
          : null,
        part.support_logic && Object.keys(part.support_logic).length > 0
          ? `Support Logic: ${JSON.stringify(part.support_logic)}`
          : null,
      ].filter(Boolean);

      chunks.push({
        chunk_index: idx++,
        chunk_type: "lesson_part",
        content: `Day ${day.day_no} ${partContent.join("\n")}`,
        level_no: day.level_no,
        week_no: day.week_no,
        day_no: day.day_no,
        lesson_part: part.part_number,
        skill_code: null,
        tags: [sourceType, "lesson_part", part.interaction_type ?? "unknown"],
      });
    }
  }

  return chunks;
}

// ── OpenAI Embedding ───────────────────────────────────────────
async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: batch,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI embedding error ${resp.status}: ${errText}`);
    }

    const result = await resp.json();
    for (const item of result.data) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Check admin role using service client
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ── ACTION: validate ──
    if (action === "validate") {
      const result = validateCurriculumUpload(body.data);
      if (!result.valid) {
        return new Response(JSON.stringify({ success: false, errors: result.errors }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, day_count: result.parsed!.days.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: preview_chunks ──
    if (action === "preview_chunks") {
      const validation = validateCurriculumUpload(body.data);
      if (!validation.valid) {
        return new Response(JSON.stringify({ success: false, errors: validation.errors }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const parsed = validation.parsed!;
      const allChunks: ChunkPreview[] = [];
      for (const day of parsed.days) {
        allChunks.push(...chunkCurriculumDay(day, parsed.source_type));
      }
      return new Response(
        JSON.stringify({ success: true, chunks: allChunks, total_chunks: allChunks.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: ingest ──
    if (action === "ingest") {
      const validation = validateCurriculumUpload(body.data);
      if (!validation.valid) {
        return new Response(JSON.stringify({ success: false, errors: validation.errors }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parsed = validation.parsed!;
      const audience = parsed.audience ?? "ai_internal";
      const topic = parsed.topic ?? null;

      // 1. Create knowledge_document
      const { data: doc, error: docErr } = await serviceClient
        .from("knowledge_documents")
        .insert({
          source_type: parsed.source_type,
          title: `${parsed.source_type} - Level ${parsed.level_no ?? "all"} (${parsed.days.length} days)`,
          level_no: parsed.level_no ?? null,
          audience,
          topic,
          metadata: { uploaded_by: userId, day_count: parsed.days.length },
        })
        .select("id")
        .single();

      if (docErr || !doc) {
        throw new Error(`Failed to create document: ${docErr?.message}`);
      }

      // 2. Create rag_index_job
      const { data: job, error: jobErr } = await serviceClient
        .from("rag_index_jobs")
        .insert({
          document_id: doc.id,
          job_type: "insert",
          status: "processing",
          payload: { day_count: parsed.days.length, source_type: parsed.source_type },
        })
        .select("id")
        .single();

      if (jobErr) {
        throw new Error(`Failed to create index job: ${jobErr.message}`);
      }

      try {
        // 3. Generate chunks
        const allChunks: ChunkPreview[] = [];
        for (const day of parsed.days) {
          allChunks.push(...chunkCurriculumDay(day, parsed.source_type));
        }

        // 4. Generate embeddings
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) {
          throw new Error("OPENAI_API_KEY not configured");
        }

        const texts = allChunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(texts, openaiKey);

        // 5. Insert chunks with embeddings
        const chunkRows = allChunks.map((c, i) => ({
          document_id: doc.id,
          chunk_index: c.chunk_index,
          chunk_type: c.chunk_type,
          content: c.content,
          embedding: JSON.stringify(embeddings[i]),
          level_no: c.level_no,
          week_no: c.week_no,
          day_no: c.day_no,
          lesson_part: c.lesson_part,
          skill_code: c.skill_code,
          tags: c.tags,
          visibility: audience === "student" ? "public" : "internal",
          metadata: {},
        }));

        // Insert in batches of 50
        for (let i = 0; i < chunkRows.length; i += 50) {
          const batch = chunkRows.slice(i, i + 50);
          const { error: insertErr } = await serviceClient
            .from("knowledge_chunks")
            .insert(batch);
          if (insertErr) {
            throw new Error(`Chunk insert error at batch ${i}: ${insertErr.message}`);
          }
        }

        // 6. Mark job completed
        await serviceClient
          .from("rag_index_jobs")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", job!.id);

        return new Response(
          JSON.stringify({
            success: true,
            document_id: doc.id,
            job_id: job!.id,
            chunks_created: allChunks.length,
            embeddings_generated: embeddings.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (embedError) {
        // Mark job failed
        await serviceClient
          .from("rag_index_jobs")
          .update({
            status: "failed",
            error_message: embedError instanceof Error ? embedError.message : "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job!.id);

        throw embedError;
      }
    }

    // ── ACTION: reindex ──
    if (action === "reindex") {
      const { document_id } = body;
      if (!document_id) {
        return new Response(JSON.stringify({ error: "document_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get existing chunks without embeddings
      const { data: chunks, error: chunkErr } = await serviceClient
        .from("knowledge_chunks")
        .select("id, content")
        .eq("document_id", document_id)
        .is("embedding", null);

      if (chunkErr) throw new Error(chunkErr.message);
      if (!chunks || chunks.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No chunks need re-indexing", reindexed: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: job } = await serviceClient
        .from("rag_index_jobs")
        .insert({
          document_id,
          job_type: "reindex",
          status: "processing",
          payload: { chunk_count: chunks.length },
        })
        .select("id")
        .single();

      try {
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

        const texts = chunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(texts, openaiKey);

        for (let i = 0; i < chunks.length; i++) {
          await serviceClient
            .from("knowledge_chunks")
            .update({ embedding: JSON.stringify(embeddings[i]), updated_at: new Date().toISOString() })
            .eq("id", chunks[i].id);
        }

        await serviceClient
          .from("rag_index_jobs")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", job!.id);

        return new Response(
          JSON.stringify({ success: true, reindexed: chunks.length, job_id: job!.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        await serviceClient
          .from("rag_index_jobs")
          .update({
            status: "failed",
            error_message: err instanceof Error ? err.message : "Unknown",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job!.id);
        throw err;
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: validate, preview_chunks, ingest, reindex" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rag-ingest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
