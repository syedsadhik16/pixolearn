import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ── Intent detection ──
type Intent = "lesson_related" | "phonics_concept" | "curriculum_question" | "parent_support" | "general";

function detectIntent(message: string, roleContext: string): Intent {
  const lower = message.toLowerCase();
  if (roleContext === "parent") {
    if (/progress|report|score|how.*doing|improve|weak|strength|summary/i.test(lower)) return "parent_support";
    if (/lesson|day\s*\d|part\s*\d|today/i.test(lower)) return "lesson_related";
    return "curriculum_question";
  }
  if (/lesson|day\s*\d|today|part\s*\d|help.*lesson|what.*learn/i.test(lower)) return "lesson_related";
  if (/sound|phonics|letter|vowel|consonant|blend|digraph|syllable|rhyme/i.test(lower)) return "phonics_concept";
  if (/level|week|month|curriculum|what.*next|badge|reward/i.test(lower)) return "curriculum_question";
  return "general";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──
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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Validate user ──
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      message,
      role_context,
      student_id,
      parent_id,
      current_level,
      current_day,
      current_week,
      lesson_part,
    } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine and validate role_context
    const effectiveRole = role_context || (profile.role === "parent" ? "parent" : "student");
    if (effectiveRole === "parent" && profile.role !== "parent" && profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Role mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate student access if student_id provided
    const targetStudentId = student_id || (effectiveRole === "student" ? userId : null);
    if (targetStudentId && targetStudentId !== userId) {
      if (profile.role === "admin") {
        // allowed
      } else if (profile.role === "parent") {
        const { data: link } = await serviceClient
          .from("parent_children")
          .select("id")
          .eq("parent_id", userId)
          .eq("child_id", targetStudentId)
          .single();
        if (!link) {
          return new Response(JSON.stringify({ error: "Access denied to this student" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Intent detection ──
    const intent = detectIntent(message.trim(), effectiveRole);

    // ── Parse level ──
    const levelNum = typeof current_level === "number"
      ? current_level
      : current_level === "beginner" ? 1
      : current_level === "intermediate" ? 2
      : current_level === "advanced" ? 3
      : null;

    // ── Build retrieval filters based on intent ──
    let filterAudience: string | null = null;
    let filterSourceType: string | null = null;
    let filterDay: number | null = null;
    let filterLessonPart: number | null = null;
    let matchCount = 8;

    switch (intent) {
      case "lesson_related":
        filterAudience = effectiveRole === "parent" ? null : "student";
        filterSourceType = "curriculum";
        filterDay = current_day || null;
        filterLessonPart = lesson_part || null;
        matchCount = 5;
        break;
      case "phonics_concept":
        filterAudience = "student";
        filterSourceType = null; // search curriculum + phonics_rule
        matchCount = 6;
        break;
      case "parent_support":
        filterAudience = null; // search parent_help + curriculum
        filterSourceType = null;
        matchCount = 6;
        break;
      case "curriculum_question":
        filterSourceType = "curriculum";
        matchCount = 6;
        break;
      default:
        matchCount = 5;
    }

    // ── Retrieval ──
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

    const embResp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: message.trim(),
      }),
    });

    if (!embResp.ok) {
      const errText = await embResp.text();
      throw new Error(`Embedding error: ${errText}`);
    }

    const embResult = await embResp.json();
    const queryEmbedding = embResult.data[0].embedding;

    const { data: chunks, error: searchErr } = await serviceClient.rpc(
      "search_knowledge_chunks",
      {
        query_embedding: `[${queryEmbedding.join(",")}]`,
        match_count: matchCount,
        filter_level: levelNum,
        filter_week: current_week || null,
        filter_day: filterDay,
        filter_audience: filterAudience,
        filter_lesson_part: filterLessonPart,
        filter_skill_code: null,
        filter_source_type: filterSourceType,
      }
    );

    if (searchErr) console.error("Search error:", searchErr);

    const retrievedChunks = chunks || [];
    const hasGoodRetrieval = retrievedChunks.length > 0 &&
      retrievedChunks.some((c: Record<string, unknown>) => (c.similarity as number) > 0.3);

    // ── Build prompt ──
    const chunkContext = retrievedChunks.length > 0
      ? retrievedChunks.map((c: Record<string, unknown>, i: number) =>
          `[Source ${i + 1}] (${c.chunk_type}, ${c.source_type}, Day ${c.day_no || "N/A"}, similarity: ${(c.similarity as number)?.toFixed(2)}):\n${c.content}`
        ).join("\n\n")
      : "No relevant curriculum content found.";

    const modeInstructions = effectiveRole === "student"
      ? `You are PIXO 🦊, a warm, fun learning buddy for children aged 5-16 learning English.
RULES:
- Use simple, child-friendly language with occasional emojis
- Be encouraging, never shaming or critical
- Keep answers brief (2-4 sentences for the main answer)
- Do not expose scores, system data, or internal details
- Ground your answer in the curriculum sources provided
- If sources are weak, say "I'm not sure about that, but let's keep learning!"
- Suggest what to do next`
      : `You are PIXO, an intelligent learning insights assistant for parents.
RULES:
- Be clear, constructive, and informative
- Use the curriculum context to give accurate information
- Do not make medical or psychological claims
- Do not fabricate curriculum content not in the sources
- If sources are weak, acknowledge the limitation clearly
- Suggest actionable next steps`;

    const systemPrompt = `${modeInstructions}

You MUST respond with valid JSON only, no markdown fences, no extra text.

The JSON structure must be:
{
  "answer": "main answer text",
  "cards": [
    {"type": "info|tip|practice|achievement", "title": "card title", "content": "card content"}
  ],
  "quick_actions": ["action label 1", "action label 2", "action label 3"]
}

Cards array can be empty. Quick actions should be 2-4 short labels for follow-up questions.
Card types: "info" for facts, "tip" for suggestions, "practice" for activities, "achievement" for progress.`;

    const userPrompt = `RETRIEVED CURRICULUM CONTEXT:
${chunkContext}

USER CONTEXT:
- Role: ${effectiveRole}
- Level: ${current_level || "unknown"}
- Day: ${current_day || "unknown"}
- Week: ${current_week || "unknown"}
${lesson_part ? `- Lesson Part: ${lesson_part}` : ""}
- Retrieval quality: ${hasGoodRetrieval ? "good" : "weak/none"}

USER MESSAGE: ${message.trim()}

Respond based on the curriculum context. If retrieval is weak, acknowledge it.`;

    // ── Call AI ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI service busy, please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      throw new Error(`AI error ${aiResp.status}: ${errText}`);
    }

    const aiResult = await aiResp.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";

    let parsed: Record<string, unknown>;
    try {
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        answer: rawContent.slice(0, 800) || "I'm here to help! Could you ask that again?",
        cards: [],
        quick_actions: ["Ask again", "Today's lesson", "Practice"],
      };
    }

    const sources = retrievedChunks.map((c: Record<string, unknown>) => ({
      chunk_id: c.id,
      title: c.document_title || "",
      source_type: c.source_type,
      audience: c.audience,
      level_no: c.level_no,
      week_no: c.week_no,
      day_no: c.day_no,
      lesson_part: c.lesson_part,
      similarity: c.similarity,
    }));

    const response = {
      success: true,
      mode: effectiveRole,
      answer: parsed.answer || "",
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      quick_actions: Array.isArray(parsed.quick_actions) ? parsed.quick_actions : [],
      sources,
      metadata: {
        intent,
        retrieval_count: retrievedChunks.length,
      },
    };

    // ── Log interaction ──
    await serviceClient.from("ai_interactions").insert({
      user_id: userId,
      student_id: targetStudentId,
      parent_id: effectiveRole === "parent" ? userId : (parent_id || null),
      role_context: effectiveRole,
      interaction_type: "chat",
      query: message.trim(),
      retrieved_chunks: sources,
      response_text: typeof parsed.answer === "string" ? parsed.answer.slice(0, 1000) : null,
      response_json: response,
      mcp_tools_used: [],
      status: "completed",
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pixo-ai-chat error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        mode: "student",
        answer: "Oops! I had a little hiccup. Can you try again? 😊",
        cards: [],
        quick_actions: ["Try again"],
        sources: [],
        metadata: { intent: "error", retrieval_count: 0, error: e instanceof Error ? e.message : "Unknown" },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
