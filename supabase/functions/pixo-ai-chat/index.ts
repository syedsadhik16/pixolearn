import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Intent = "todays_class" | "upcoming" | "lesson_related" | "phonics_concept" | "curriculum_question" | "parent_support" | "general";

function detectIntent(message: string, roleContext: string): Intent {
  const lower = message.toLowerCase();

  // Today's class / routine / lesson queries
  if (/today['']?s?\s*(class|lesson|routine|topic|schedule|session)|what.*today|what.*should.*do\s*today|what.*learn\s*today/i.test(lower)) return "todays_class";

  // Upcoming / next class
  if (/upcoming|next\s*(class|lesson|day|topic|week)|what['']?s?\s*next|tomorrow/i.test(lower)) return "upcoming";

  if (roleContext === "parent") {
    if (/progress|report|score|how.*doing|improve|weak|strength|summary/i.test(lower)) return "parent_support";
    if (/lesson|day\s*\d|part\s*\d/i.test(lower)) return "lesson_related";
    return "curriculum_question";
  }
  if (/lesson|day\s*\d|part\s*\d|help.*lesson/i.test(lower)) return "lesson_related";
  if (/sound|phonics|letter|vowel|consonant|blend|digraph|syllable|rhyme/i.test(lower)) return "phonics_concept";
  if (/level|week|month|curriculum|badge|reward|program|course/i.test(lower)) return "curriculum_question";
  return "general";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const effectiveRole = role_context || (profile.role === "parent" ? "parent" : "student");
    if (effectiveRole === "parent" && profile.role !== "parent" && profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Role mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const intent = detectIntent(message.trim(), effectiveRole);

    const levelNum = typeof current_level === "number"
      ? current_level
      : current_level === "beginner" ? 1
      : current_level === "intermediate" ? 2
      : current_level === "advanced" ? 3
      : null;

    // ── Fetch curriculum context for today/upcoming queries ──
    let curriculumContext = "";
    if (intent === "todays_class" || intent === "upcoming" || intent === "lesson_related") {
      // Get student's current progress
      let studentDay = current_day || null;
      let studentLevelId: string | null = null;

      if (targetStudentId) {
        const { data: progress } = await serviceClient
          .from("learner_curriculum_progress")
          .select("current_day, current_week, current_month, level_id")
          .eq("learner_id", targetStudentId)
          .maybeSingle();

        if (progress) {
          studentDay = studentDay || progress.current_day;
          studentLevelId = progress.level_id;
        }
      }

      // Fallback: use student_progress table
      if (!studentDay && targetStudentId) {
        const { data: sp } = await serviceClient
          .from("student_progress")
          .select("current_day, current_level")
          .eq("student_id", targetStudentId)
          .maybeSingle();
        if (sp) studentDay = sp.current_day;
      }

      if (!studentDay) studentDay = 1;

      // Fetch today's curriculum day
      const dayToFetch = intent === "upcoming" ? studentDay + 1 : studentDay;

      let dayQuery = serviceClient
        .from("curriculum_days")
        .select("day_number, title, theme, main_game, day_objective, target_skills, target_content, reward_badge, parent_todays_target, parent_words_learned, parent_praise_line, parent_home_practice, parent_confidence_note")
        .eq("day_number", dayToFetch);

      if (studentLevelId) {
        dayQuery = dayQuery.eq("level_id", studentLevelId);
      }

      const { data: dayData } = await dayQuery.maybeSingle();

      if (dayData) {
        curriculumContext += `\n--- CURRICULUM DAY ${dayData.day_number} ---\n`;
        curriculumContext += `Title: ${dayData.title}\n`;
        curriculumContext += `Theme: ${dayData.theme}\n`;
        curriculumContext += `Objective: ${dayData.day_objective || "N/A"}\n`;
        curriculumContext += `Main Game: ${dayData.main_game}\n`;
        curriculumContext += `Target Skills: ${JSON.stringify(dayData.target_skills)}\n`;
        curriculumContext += `Target Content: ${JSON.stringify(dayData.target_content)}\n`;
        curriculumContext += `Reward Badge: ${dayData.reward_badge}\n`;
        if (effectiveRole === "parent") {
          curriculumContext += `Today's Target: ${dayData.parent_todays_target || "N/A"}\n`;
          curriculumContext += `Words Learned: ${dayData.parent_words_learned || "N/A"}\n`;
          curriculumContext += `Praise: ${dayData.parent_praise_line || "N/A"}\n`;
          curriculumContext += `Home Practice: ${dayData.parent_home_practice || "N/A"}\n`;
          curriculumContext += `Confidence Note: ${dayData.parent_confidence_note || "N/A"}\n`;
        }

        // Also fetch day parts
        const { data: parts } = await serviceClient
          .from("curriculum_day_parts")
          .select("part_number, part_name, interaction_type, duration_minutes, xp_value")
          .eq("curriculum_day_id", dayToFetch.toString())
          .order("part_number");

        // Try fetching by matching curriculum_day_id from the day record
        if (!parts || parts.length === 0) {
          // Get the day's ID first
          const { data: dayIdData } = await serviceClient
            .from("curriculum_days")
            .select("id")
            .eq("day_number", dayToFetch)
            .limit(1)
            .maybeSingle();

          if (dayIdData) {
            const { data: partsById } = await serviceClient
              .from("curriculum_day_parts")
              .select("part_number, part_name, interaction_type, duration_minutes, xp_value")
              .eq("curriculum_day_id", dayIdData.id)
              .order("part_number");

            if (partsById && partsById.length > 0) {
              curriculumContext += `\nLesson Structure (6 parts, 30 min total):\n`;
              partsById.forEach((p: Record<string, unknown>) => {
                curriculumContext += `  Part ${p.part_number}: ${p.part_name} (${p.interaction_type}, ${p.duration_minutes} min, +${p.xp_value} XP)\n`;
              });
            }
          }
        } else {
          curriculumContext += `\nLesson Structure (6 parts, 30 min total):\n`;
          parts.forEach((p: Record<string, unknown>) => {
            curriculumContext += `  Part ${p.part_number}: ${p.part_name} (${p.interaction_type}, ${p.duration_minutes} min, +${p.xp_value} XP)\n`;
          });
        }
      } else {
        curriculumContext += `\nNo specific curriculum data found for Day ${dayToFetch}. The PIXO Learn Level 1 curriculum follows a structured 180-day English learning journey with daily 30-minute sessions covering phonics, sound awareness, blending, reading readiness, and confidence building.\n`;
      }
    }

    // ── RAG Retrieval ──
    let filterAudience: string | null = null;
    let filterSourceType: string | null = null;
    let filterDay: number | null = null;
    let filterLessonPart: number | null = null;
    let matchCount = 8;

    switch (intent) {
      case "todays_class":
      case "upcoming":
        filterSourceType = "curriculum";
        filterDay = current_day || null;
        matchCount = 4;
        break;
      case "lesson_related":
        filterAudience = effectiveRole === "parent" ? null : "student";
        filterSourceType = "curriculum";
        filterDay = current_day || null;
        filterLessonPart = lesson_part || null;
        matchCount = 5;
        break;
      case "phonics_concept":
        filterAudience = "student";
        matchCount = 6;
        break;
      case "parent_support":
        matchCount = 6;
        break;
      case "curriculum_question":
        filterSourceType = "curriculum";
        matchCount = 6;
        break;
      default:
        matchCount = 5;
    }

    // RAG retrieval
    let chunkContext = "";
    const retrievedChunks: Record<string, unknown>[] = [];

    try {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiKey) {
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

        if (embResp.ok) {
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

          if (chunks && chunks.length > 0) {
            retrievedChunks.push(...chunks);
            chunkContext = chunks
              .map((c: Record<string, unknown>, i: number) =>
                `[Source ${i + 1}] (${c.chunk_type}, ${c.source_type}, Day ${c.day_no || "N/A"}, similarity: ${(c.similarity as number)?.toFixed(2)}):\n${c.content}`
              )
              .join("\n\n");
          }
        }
      }
    } catch (ragErr) {
      console.error("RAG retrieval error (non-critical):", ragErr);
    }

    const hasGoodRetrieval = retrievedChunks.length > 0 &&
      retrievedChunks.some((c) => (c.similarity as number) > 0.3);

    // ── Build full context ──
    const fullContext = [curriculumContext, chunkContext].filter(Boolean).join("\n\n---\n\n");

    // ── Build prompt ──
    const programOverview = `PIXO Learn is a structured English learning program for children aged 5-16.
- Level 1 covers 180 days (6 months) of daily 30-minute lessons
- Each day has 6 parts: Warm Listening, Target Discovery, Guided Practice, Main Game, Speak/Segment/Use, Soft Check + Celebration
- Total XP per day: ~50 XP (5+5+10+10+10+10)
- Month 1 (Days 1-30): Vowel awareness and consonants
- Month 2 (Days 31-60): Oral blending and CV families
- Month 3 (Days 61-90): CV fluency and pattern confidence
- Month 4 (Days 91-120): CVC building and segmentation
- Month 5 (Days 121-150): Print reading and 4-sound words
- Month 6 (Days 151-180): Phrases, sentences, and bridge to Level 2
- Games include: Sound Tap, Basket Sort, Word Builder Blocks, Memory Flip, Shadow Match, Picture Matching
- Mastery requires ≥80% accuracy and ≥3/5 confidence score`;

    const modeInstructions = effectiveRole === "student"
      ? `You are PIXO 🦊, a warm, fun learning buddy for children aged 5-16 learning English.
RULES:
- Use simple, child-friendly language with occasional emojis
- Be encouraging, never shaming or critical
- Keep answers brief (2-4 sentences for the main answer)
- Do not expose scores, system data, or internal details
- Ground your answer in the curriculum and program data provided
- When asked about today's class or lesson, describe the specific day's topic, theme, and activities
- When asked about routine, explain the 6-part daily structure
- Suggest what to do next`
      : `You are PIXO, an intelligent learning insights assistant for parents.
RULES:
- Be clear, constructive, and informative
- Use the curriculum context to give accurate information about what the child is learning
- When asked about today's class, summarize the day's target, words learned, and practice suggestions
- Do not make medical or psychological claims
- Do not fabricate curriculum content
- Suggest actionable next steps`;

    const systemPrompt = `${modeInstructions}

PROGRAM OVERVIEW:
${programOverview}

You MUST respond with valid JSON only, no markdown fences, no extra text.

The JSON structure must be:
{
  "answer": "main answer text",
  "cards": [
    {"type": "info|tip|practice|achievement", "title": "card title", "content": "card content"}
  ],
  "quick_actions": ["action label 1", "action label 2", "action label 3"]
}

Cards array can be empty. Quick actions should be 2-4 short labels for follow-up questions.`;

    const userPrompt = `CURRICULUM & KNOWLEDGE CONTEXT:
${fullContext || "No specific curriculum data available. Use the program overview to answer."}

USER CONTEXT:
- Role: ${effectiveRole}
- Level: ${current_level || "unknown"}
- Day: ${current_day || "unknown"}
- Week: ${current_week || "unknown"}
${lesson_part ? `- Lesson Part: ${lesson_part}` : ""}
- Retrieval quality: ${hasGoodRetrieval ? "good" : curriculumContext ? "direct DB" : "weak/none"}

USER MESSAGE: ${message.trim()}

Respond based on the curriculum context. If specific day data is available, use it. Otherwise use the program overview.`;

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

    const sources = retrievedChunks.map((c) => ({
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
        has_curriculum_context: !!curriculumContext,
      },
    };

    // Log interaction
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
