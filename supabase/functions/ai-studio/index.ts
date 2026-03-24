import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, level } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;

    switch (action) {
      case "evaluate_recording":
        systemPrompt = `You are a child-friendly speech evaluation coach for PIXO Learn.
Evaluate the child's recorded speech and provide encouraging feedback.
Return ONLY valid JSON:
{
  "pronunciationScore": number (0-100),
  "fluencyScore": number (0-100),
  "clarityScore": number (0-100),
  "overallScore": number (0-100),
  "feedback": "short encouraging feedback for the child",
  "tips": ["improvement tip 1", "improvement tip 2"],
  "starRating": number (1-5)
}`;
        userPrompt = `Target text: "${text}"
Student level: ${level || 'beginner'}
Evaluate this speaking practice attempt.`;
        break;

      case "generate_story":
        systemPrompt = `You are a creative story generator for children learning English.
Generate a short, engaging story appropriate for the child's level.
Return ONLY valid JSON:
{
  "title": "story title",
  "story": "the story text (3-5 short paragraphs)",
  "vocabularyWords": ["word1", "word2", "word3"],
  "readingLevel": "easy" | "medium" | "hard"
}`;
        userPrompt = `Generate a short story for a ${level || 'beginner'} level English learner. Topic hint: ${text || 'adventure'}`;
        break;

      default:
        systemPrompt = `You are PIXO's creative assistant for children. Help with pronunciation and speaking practice.
Return ONLY valid JSON with your response.`;
        userPrompt = text || "Help me practice English.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch {
      result = { feedback: "Great effort! Keep practicing.", overallScore: 75 };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Studio AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
