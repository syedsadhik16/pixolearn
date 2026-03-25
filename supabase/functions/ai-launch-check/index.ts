import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { answers, questions, ageGroup, timeTaken } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are PIXO's assessment intelligence engine for children learning English.
Analyze the student's assessment results and provide a detailed evaluation.

You must return ONLY valid JSON with this exact structure:
{
  "level": "beginner" | "intermediate" | "advanced",
  "confidence": number (0-100),
  "strengths": ["strength1", "strength2"],
  "weakAreas": ["area1", "area2"],
  "recommendation": "short personalized recommendation for the parent",
  "detailedBreakdown": {
    "phonics": number (0-100),
    "vocabulary": number (0-100),
    "grammar": number (0-100),
    "comprehension": number (0-100)
  },
  "parentMessage": "encouraging message for the parent about their child's starting point"
}

Be encouraging and child-positive. Never use negative language.
Focus on what the child CAN do, not what they can't.`;

    const userPrompt = `Student age group: ${ageGroup || 'unknown'}
Time taken: ${timeTaken} seconds
Total questions: ${questions.length}

Results:
${answers.map((a: any, i: number) => {
  const q = questions[i];
  return `Q${i + 1} (${q?.difficulty || 'unknown'}): ${a.isCorrect ? 'CORRECT' : 'INCORRECT'} - "${q?.question || ''}"`;
}).join('\n')}

Provide your assessment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.3 }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI service unavailable. Please try again later." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let evaluation;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      evaluation = JSON.parse(jsonStr);
    } catch {
      const correct = answers.filter((a: any) => a.isCorrect).length;
      const pct = correct / questions.length;
      evaluation = {
        level: pct <= 0.35 ? "beginner" : pct <= 0.7 ? "intermediate" : "advanced",
        confidence: Math.round(pct * 100),
        strengths: ["Willingness to try"],
        weakAreas: ["Needs more practice"],
        recommendation: "Start with foundational lessons to build confidence.",
        detailedBreakdown: { phonics: Math.round(pct * 80), vocabulary: Math.round(pct * 75), grammar: Math.round(pct * 70), comprehension: Math.round(pct * 85) },
        parentMessage: "Your child is ready to begin their English adventure!",
      };
    }

    return new Response(JSON.stringify(evaluation), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Launch check error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
