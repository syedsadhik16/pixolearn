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
    const { childData, parentQuestion } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are PIXO's parent intelligence engine. You analyze a child's learning data and provide actionable insights for parents.

Your tone must be:
- Warm and supportive
- Data-driven but simple
- Focused on progress, not perfection
- Encouraging next steps

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overview of the child's progress",
  "strengths": ["strength1", "strength2"],
  "areasToWatch": ["area1", "area2"],
  "weeklyTip": "one specific thing the parent can do this week",
  "progressTrend": "improving" | "steady" | "needs_attention",
  "encouragement": "positive message about the child's journey",
  "phonicsInsight": "specific insight about phonics/sound progress",
  "recommendedFocus": "what to focus on next"
}`;

    const userPrompt = `Child learning data:
- Current level: ${childData.currentLevel || 'beginner'}
- Current day: ${childData.currentDay || 1}
- Total XP: ${childData.totalXp || 0}
- Streak: ${childData.streak || 0} days
- Lessons completed: ${childData.lessonsCompleted || 0}
- Average pronunciation: ${childData.avgPronunciation || 0}%
- Average fluency: ${childData.avgFluency || 0}%
- Average clarity: ${childData.avgClarity || 0}%
- Total learning time: ${childData.totalMinutes || 0} minutes
- Writing submissions: ${childData.writingCount || 0}
- Assessment level: ${childData.assessmentLevel || 'not taken'}

${parentQuestion ? `Parent asks: "${parentQuestion}"` : 'Generate a general progress insight.'}`;

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
        temperature: 0.4,
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

    let insights;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      insights = JSON.parse(jsonStr);
    } catch {
      insights = {
        summary: "Your child is making progress on their learning journey.",
        strengths: ["Consistent practice"],
        areasToWatch: ["Continue daily practice"],
        weeklyTip: "Encourage 15 minutes of daily practice.",
        progressTrend: "steady",
        encouragement: "Every step forward counts!",
        phonicsInsight: "Building foundational sound awareness.",
        recommendedFocus: "Continue with current lessons.",
      };
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Insights error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
