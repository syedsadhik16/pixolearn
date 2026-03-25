import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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

    // Check role - admin only for direct search
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
    const {
      query,
      match_count = 10,
      filter_level = null,
      filter_week = null,
      filter_day = null,
      filter_audience = null,
      filter_lesson_part = null,
      filter_skill_code = null,
      filter_source_type = null,
    } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate embedding for query
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embResp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query.trim(),
      }),
    });

    if (!embResp.ok) {
      const errText = await embResp.text();
      throw new Error(`OpenAI embedding error: ${errText}`);
    }

    const embResult = await embResp.json();
    const queryEmbedding = embResult.data[0].embedding;

    // Call search_knowledge_chunks RPC
    const { data: results, error: searchErr } = await serviceClient.rpc(
      "search_knowledge_chunks",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_count: Math.min(match_count, 50),
        filter_level,
        filter_week,
        filter_day,
        filter_audience,
        filter_lesson_part,
        filter_skill_code,
        filter_source_type,
      }
    );

    if (searchErr) {
      throw new Error(`Search error: ${searchErr.message}`);
    }

    // Log the interaction
    await serviceClient.from("ai_interactions").insert({
      user_id: userId,
      role_context: "admin",
      interaction_type: "knowledge_search",
      query: query.trim(),
      retrieved_chunks: results ?? [],
      mcp_tools_used: [],
      response_text: `Found ${results?.length ?? 0} results`,
      response_json: { result_count: results?.length ?? 0 },
      status: "completed",
    });

    return new Response(
      JSON.stringify({
        success: true,
        results: (results ?? []).map((r: Record<string, unknown>) => ({
          chunk_id: r.id,
          document_id: r.document_id,
          title: r.document_title,
          content: r.content,
          chunk_type: r.chunk_type,
          source_type: r.source_type,
          audience: r.audience,
          level_no: r.level_no,
          week_no: r.week_no,
          day_no: r.day_no,
          lesson_part: r.lesson_part,
          skill_code: r.skill_code,
          similarity: r.similarity,
          tags: r.tags,
          metadata: r.metadata,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("search-knowledge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
