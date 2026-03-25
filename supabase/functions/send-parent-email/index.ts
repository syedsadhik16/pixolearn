import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { to, subject, childName, type, metadata } = await req.json();

    if (!to || !subject) {
      throw new Error('Missing required fields: to, subject');
    }

    let htmlBody = '';

    switch (type) {
      case 'lesson_completed': {
        const scores = metadata || {};
        const avgScore = [scores.pronunciation_score, scores.fluency_score, scores.clarity_score, scores.confidence_score]
          .filter((s: number | null) => typeof s === 'number')
          .reduce((acc: number[], s: number) => [...acc, s], [] as number[]);
        const avg = avgScore.length > 0 ? Math.round(avgScore.reduce((a: number, b: number) => a + b, 0) / avgScore.length) : null;

        htmlBody = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Lesson Completed!</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
              <p style="font-size: 16px; color: #334155;"><strong>${childName || 'Your child'}</strong> just completed a lesson on PIXO!</p>
              ${avg !== null ? `<div style="text-align: center; margin: 16px 0;"><span style="font-size: 36px; font-weight: bold; color: #6366f1;">${avg}%</span><br/><span style="color: #64748b;">Average Score</span></div>` : ''}
              ${scores.pronunciation_score ? `<p style="color: #64748b;">🎤 Pronunciation: <strong>${scores.pronunciation_score}%</strong></p>` : ''}
              ${scores.fluency_score ? `<p style="color: #64748b;">💬 Fluency: <strong>${scores.fluency_score}%</strong></p>` : ''}
              ${scores.clarity_score ? `<p style="color: #64748b;">✨ Clarity: <strong>${scores.clarity_score}%</strong></p>` : ''}
              ${scores.confidence_score ? `<p style="color: #64748b;">💪 Confidence: <strong>${scores.confidence_score}%</strong></p>` : ''}
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">PIXO Learning App</p>
            </div>
          </div>`;
        break;
      }
      case 'streak_milestone': {
        const streakCount = metadata?.streak_count || 0;
        htmlBody = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔥 Streak Milestone!</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
              <p style="font-size: 16px; color: #334155;"><strong>${childName || 'Your child'}</strong> has reached a <strong style="color: #ef4444;">${streakCount}-day streak</strong>! 🎉</p>
              <p style="color: #64748b;">Consistent practice is the key to mastering English. Keep encouraging them!</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">PIXO Learning App</p>
            </div>
          </div>`;
        break;
      }
      default:
        htmlBody = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">PIXO Update</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
              <p style="font-size: 16px; color: #334155;">${subject}</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">PIXO Learning App</p>
            </div>
          </div>`;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PIXO <onboarding@resend.dev>',
        to: [to],
        subject,
        html: htmlBody,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
