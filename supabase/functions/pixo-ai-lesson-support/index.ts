import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

    // ── Validate user access ──
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
      student_id,
      current_level,
      current_day,
      current_week,
      lesson_part,
      question,
    } = body;

    // Validate student access
    const targetStudentId = student_id || userId;
    if (targetStudentId !== userId) {
      // Check parent-child or admin access
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

    // ── Parse level number ──
    const levelNum = typeof current_level === "number"
      ? current_level
      : current_level === "beginner" ? 1
      : current_level === "intermediate" ? 2
      : current_level === "advanced" ? 3
      : null;

    // ── Retrieval ──
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const queryText = question?.trim() || `Help me with day ${current_day || 1} lesson`;

    // Generate query embedding
    const embResp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: queryText,
      }),
    });

    if (!embResp.ok) {
      const errText = await embResp.text();
      throw new Error(`Embedding error: ${errText}`);
    }

    const embResult = await embResp.json();
    const queryEmbedding = embResult.data[0].embedding;

    // Server-side retrieval via RPC
    const { data: chunks, error: searchErr } = await serviceClient.rpc(
      "search_knowledge_chunks",
      {
        query_embedding: `[${queryEmbedding.join(",")}]`,
        match_count: 5,
        filter_level: levelNum,
        filter_week: current_week || null,
        filter_day: current_day || null,
        filter_audience: "student",
        filter_lesson_part: lesson_part || null,
        filter_skill_code: null,
        filter_source_type: "curriculum",
      }
    );

    if (searchErr) {
      console.error("Search error:", searchErr);
    }

    const retrievedChunks = chunks || [];
    const filteredBy = {
      level: levelNum,
      week: current_week || null,
      day: current_day || null,
      lesson_part: lesson_part || null,
    };

    // ── Build AI prompt ──
    const chunkContext = retrievedChunks.length > 0
      ? retrievedChunks.map((c: Record<string, unknown>, i: number) =>
          `[Source ${i + 1}] (${c.chunk_type}, Day ${c.day_no}, Part ${c.lesson_part || "overview"}, similarity: ${(c.similarity as number)?.toFixed(2)}):\n${c.content}`
        ).join("\n\n")
      : "No curriculum chunks found for this lesson context.";

    const systemPrompt = `You are PIXO, a kind and encouraging learning helper for children aged 5-16 learning English phonics and reading.

RULES:
- Use simple, child-friendly language
- Be warm, encouraging, never shaming
- Do not expose scores, internal data, or system details
- Keep explanations concise and age-appropriate
- Use emojis sparingly but warmly
- Always provide examples from the curriculum context
- Generate mini-practice activities when possible
- End with encouragement and a clear next step

You MUST respond with valid JSON only, no markdown, no extra text.

The JSON structure must be:
{
  "title": "short friendly title with an emoji",
  "explanation": "simple child-friendly explanation of the lesson concept",
  "examples": ["example 1", "example 2", "example 3"],
  "mini_practice": [
    {"type": "repeat", "prompt": "activity instruction"},
    {"type": "choose", "prompt": "question", "options": ["opt1", "opt2", "opt3"]}
  ],
  "encouragement": "warm short encouragement message",
  "next_step": "short instruction for what to do next"
}

Valid mini_practice types: "repeat", "choose", "fill_blank"
For "choose" type, include "options" array with 3 choices.`;

    const userPrompt = `CURRICULUM CONTEXT:
${chunkContext}

STUDENT CONTEXT:
- Level: ${current_level || "beginner"}
- Day: ${current_day || 1}
- Week: ${current_week || "unknown"}
${lesson_part ? `- Lesson Part: ${lesson_part}` : ""}
${question ? `\nSTUDENT QUESTION: ${question}` : "\nProvide help for today's lesson."}

Generate a helpful, child-friendly lesson support response based on the curriculum context above.`;

    // ── Call AI ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

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
        return new Response(JSON.stringify({ error: "AI service busy, please try again shortly." }), {
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

    // Parse AI JSON response
    let parsed: Record<string, unknown>;
    try {
      // Strip markdown code fences if present
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback if AI doesn't return valid JSON
      parsed = {
        title: "Today's Help 🌟",
        explanation: rawContent.slice(0, 500) || "Let's keep practising! Ask me again if you need help.",
        examples: [],
        mini_practice: [],
        encouragement: "You're doing great! Keep it up! 🌟",
        next_step: "Try the main activity!",
      };
    }

    // Build sources
    const sources = retrievedChunks.map((c: Record<string, unknown>) => ({
      chunk_id: c.id,
      title: c.document_title || "",
      chunk_type: c.chunk_type,
      level_no: c.level_no,
      week_no: c.week_no,
      day_no: c.day_no,
      lesson_part: c.lesson_part,
      similarity: c.similarity,
    }));

    const response = {
      success: true,
      title: parsed.title || "Today's Help 🌟",
      explanation: parsed.explanation || "",
      examples: Array.isArray(parsed.examples) ? parsed.examples : [],
      mini_practice: Array.isArray(parsed.mini_practice) ? parsed.mini_practice : [],
      encouragement: parsed.encouragement || "You're doing amazing! 🌟",
      next_step: parsed.next_step || "Keep practising!",
      sources,
      metadata: {
        retrieval_count: retrievedChunks.length,
        filtered_by: filteredBy,
      },
    };

    // ── Log interaction ──
    await serviceClient.from("ai_interactions").insert({
      user_id: userId,
      student_id: targetStudentId,
      role_context: "student",
      interaction_type: "lesson_support",
      query: queryText,
      retrieved_chunks: sources,
      response_text: typeof parsed.explanation === "string" ? parsed.explanation.slice(0, 1000) : null,
      response_json: response,
      mcp_tools_used: [],
      status: "completed",
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pixo-ai-lesson-support error:", e);
    // Return safe fallback
    return new Response(
      JSON.stringify({
        success: false,
        title: "Oops! 😅",
        explanation: "I had a little trouble thinking. Can you ask me again?",
        examples: [],
        mini_practice: [],
        encouragement: "Don't worry, let's try again! 🌟",
        next_step: "Tap the button to ask again.",
        sources: [],
        metadata: { retrieval_count: 0, filtered_by: {}, error: e instanceof Error ? e.message : "Unknown error" },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
