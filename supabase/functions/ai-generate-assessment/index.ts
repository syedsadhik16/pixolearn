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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { ageGroup, classLevel, board, currentLevel, improvementGoals } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build age-specific topic guidance
    const ageTopicMap: Record<string, string> = {
      "5-6": "letter sounds, phonics, picture word match, simple sight words, sentence completion with pictures",
      "7-8": "vocabulary, sentence meaning, simple grammar (articles, verbs, plural forms), word families",
      "9-10": "comprehension, synonyms, antonyms, tenses (past/present/future), paragraph understanding",
      "11-12": "grammar correction, reading comprehension, sentence formation, paragraph sequencing, parts of speech",
      "13-14": "advanced grammar, inference questions, vocabulary in context, reading comprehension passages",
      "15-16": "advanced comprehension, communication usage, grammar application, school exam pattern English",
    };

    const boardFocusMap: Record<string, string> = {
      "CBSE": "Focus on grammar rules and reading comprehension as per NCERT patterns.",
      "ICSE": "Emphasize strong vocabulary, writing logic, and literary comprehension.",
      "State Board": "Use simple school textbook style MCQs with everyday English.",
      "International / Cambridge": "Focus on communication, reading fluency, and real-world application.",
      "Other / Not Sure": "Use balanced general English questions covering grammar, vocabulary, and comprehension.",
    };

    const topics = ageTopicMap[ageGroup] || ageTopicMap["7-8"];
    const boardFocus = boardFocusMap[board] || boardFocusMap["Other / Not Sure"];
    const goalsText = (improvementGoals || []).join(", ") || "general English improvement";

    const systemPrompt = `You are PIXO's English assessment question generator for children.
Generate EXACTLY 10 multiple-choice questions for an English diagnostic assessment.

IMPORTANT RULES:
- Questions must be age-appropriate for ${ageGroup} year olds
- Difficulty progression: questions 1-3 easy, 4-7 medium, 8-10 hard
- ${boardFocus}
- The child's self-reported level is "${currentLevel}" — calibrate accordingly
- Improvement goals: ${goalsText}
- Topics to cover: ${topics}
- Each question must have exactly 4 options
- Questions must be encouraging and child-friendly
- NO offensive, scary, or discouraging content
- Explanations should be simple and educational

You MUST return ONLY a valid JSON array with exactly 10 objects, each having:
{
  "id": number (1-10),
  "question": "the question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 0-3 (index of correct option),
  "difficulty": "easy" | "medium" | "hard",
  "explanation": "simple child-friendly explanation",
  "skill_area": "phonics" | "vocabulary" | "grammar" | "comprehension" | "communication"
}

Return ONLY the JSON array, no markdown, no extra text.`;

    const userPrompt = `Generate 10 English assessment questions for:
- Age Group: ${ageGroup}
- Class/Stage: ${classLevel}
- Board: ${board}
- Current Level: ${currentLevel}
- Goals: ${goalsText}

Return the JSON array now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI service unavailable." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let questions;
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      questions = JSON.parse(jsonStr);
      
      // Validate structure
      if (!Array.isArray(questions) || questions.length === 0) throw new Error("Invalid format");
      
      // Ensure each question has required fields
      questions = questions.slice(0, 10).map((q: any, i: number) => ({
        id: i + 1,
        question: q.question || `Question ${i + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: typeof q.correct_answer === 'number' && q.correct_answer >= 0 && q.correct_answer <= 3 ? q.correct_answer : 0,
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : (i < 3 ? "easy" : i < 7 ? "medium" : "hard"),
        explanation: q.explanation || "Great question to practice!",
        skill_area: q.skill_area || "grammar",
      }));
    } catch {
      // Fallback questions if AI fails
      questions = getFallbackQuestions(ageGroup, currentLevel);
    }

    return new Response(JSON.stringify({ success: true, questions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Assessment generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function getFallbackQuestions(ageGroup: string, _level: string) {
  // Minimal fallback set
  const baseQuestions = [
    { id: 1, question: 'Which letter does "Apple" start with?', options: ['B', 'A', 'C', 'D'], correct_answer: 1, difficulty: 'easy', explanation: '"Apple" starts with the letter A.', skill_area: 'phonics' },
    { id: 2, question: 'What sound does the letter "M" make?', options: ['/s/', '/m/', '/t/', '/b/'], correct_answer: 1, difficulty: 'easy', explanation: 'The letter M makes the /m/ sound.', skill_area: 'phonics' },
    { id: 3, question: 'Which word rhymes with "Cat"?', options: ['Dog', 'Bat', 'Cup', 'Sun'], correct_answer: 1, difficulty: 'easy', explanation: '"Bat" rhymes with "Cat".', skill_area: 'phonics' },
    { id: 4, question: 'What is the opposite of "Hot"?', options: ['Warm', 'Cold', 'Big', 'Fast'], correct_answer: 1, difficulty: 'medium', explanation: 'The opposite of "Hot" is "Cold".', skill_area: 'vocabulary' },
    { id: 5, question: 'Complete: "She _____ to school every day."', options: ['go', 'goes', 'going', 'gone'], correct_answer: 1, difficulty: 'medium', explanation: 'With she/he, we use "goes".', skill_area: 'grammar' },
    { id: 6, question: 'What is the plural of "Child"?', options: ['Childs', 'Childrens', 'Children', 'Childes'], correct_answer: 2, difficulty: 'medium', explanation: '"Children" is the plural of "Child".', skill_area: 'grammar' },
    { id: 7, question: 'Which word means "very large"?', options: ['Tiny', 'Enormous', 'Quick', 'Gentle'], correct_answer: 1, difficulty: 'medium', explanation: '"Enormous" means very large.', skill_area: 'vocabulary' },
    { id: 8, question: 'Choose the correctly punctuated sentence:', options: ['where are you going.', 'Where are you going?', 'Where are you going.', 'where are you going?'], correct_answer: 1, difficulty: 'hard', explanation: 'Questions start with a capital and end with "?".', skill_area: 'grammar' },
    { id: 9, question: '"Although it was raining, she went outside." What does "although" show?', options: ['Because', 'Contrast', 'Result', 'Time'], correct_answer: 1, difficulty: 'hard', explanation: '"Although" shows contrast.', skill_area: 'comprehension' },
    { id: 10, question: 'Which sentence uses the passive voice?', options: ['She wrote the essay.', 'The essay was written by her.', 'She is writing.', 'She will write.'], correct_answer: 1, difficulty: 'hard', explanation: '"The essay was written by her" is passive voice.', skill_area: 'grammar' },
  ];
  return baseQuestions;
}
