// Practice engine: generates adaptive MCQ questions for PIXO Learn
// Uses Lovable AI (no API key needed) and caches into question_bank.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateBody {
  action: "generate" | "next_question";
  skill_code: string;
  topic_key: string;
  topic_label?: string;
  level_no?: number;
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
}

const SKILL_PROMPTS: Record<string, string> = {
  phonics:
    "phonics for English learners aged 5-8 (letter sounds, blends, digraphs, simple CVC words)",
  vocabulary: "age-appropriate English vocabulary with everyday words",
  reading: "short-text reading comprehension for early English learners",
  speaking: "spoken English usage and pronunciation choices",
  confidence:
    "encouraging, low-stakes English usage choices to build speaking confidence",
};

async function generateQuestionsWithAI(params: {
  skill_code: string;
  topic_key: string;
  topic_label: string;
  level_no: number;
  difficulty: string;
  count: number;
}) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const skillContext = SKILL_PROMPTS[params.skill_code] ?? params.skill_code;
  const sys = `You are a kind, encouraging children's English tutor for PIXO Learn (ages 5-16). Generate ${params.count} multiple-choice questions about ${params.topic_label} (${skillContext}) at ${params.difficulty} difficulty for Level ${params.level_no}. Keep language simple, friendly, and never scary. Each question must have exactly 4 short options and one correct answer that matches one of the options exactly. Provide a tiny hint and a one-sentence explanation. Return strict JSON only.`;

  const schema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question_text: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4,
            },
            correct_answer: { type: "string" },
            hint: { type: "string" },
            explanation: { type: "string" },
          },
          required: [
            "question_text",
            "options",
            "correct_answer",
            "hint",
            "explanation",
          ],
        },
      },
    },
    required: ["questions"],
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: `Make ${params.count} ${params.difficulty} questions about "${params.topic_label}".`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_questions",
            description: "Return generated practice questions",
            parameters: schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_questions" } },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in AI response");
  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.questions as Array<{
    question_text: string;
    options: string[];
    correct_answer: string;
    hint: string;
    explanation: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body = (await req.json()) as GenerateBody;
    const skill_code = body.skill_code || "phonics";
    const topic_key = body.topic_key || "general";
    const topic_label = body.topic_label || topic_key;
    const level_no = body.level_no ?? 1;
    const difficulty = body.difficulty ?? "easy";
    const count = Math.min(Math.max(body.count ?? 5, 1), 10);

    // 1. Try cache first
    const { data: cached } = await admin
      .from("question_bank")
      .select("*")
      .eq("skill_code", skill_code)
      .eq("topic_key", topic_key)
      .eq("difficulty", difficulty)
      .eq("is_active", true)
      .limit(count * 3);

    let pool = cached ?? [];

    // 2. If cache short, generate via AI and insert
    if (pool.length < count) {
      try {
        const generated = await generateQuestionsWithAI({
          skill_code,
          topic_key,
          topic_label,
          level_no,
          difficulty,
          count,
        });

        const rows = generated.map((q) => ({
          level_no,
          skill_code,
          topic_key,
          difficulty,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          hint: q.hint,
          explanation: q.explanation,
          metadata: { topic_label, generated_at: new Date().toISOString() },
        }));

        const { data: inserted, error: insErr } = await admin
          .from("question_bank")
          .insert(rows)
          .select("*");

        if (!insErr && inserted) pool = pool.concat(inserted);
      } catch (e) {
        console.error("[practice-engine] AI generation failed:", e);
        // Fall through with whatever cache we have
      }
    }

    if (pool.length === 0) {
      return new Response(
        JSON.stringify({ error: "No questions available", questions: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // shuffle + take count
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);

    return new Response(JSON.stringify({ questions: shuffled }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[practice-engine] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
