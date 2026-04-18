import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CRON_SECRET = Deno.env.get('CRON_SECRET');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    if (!CRON_SECRET) {
      console.error('CRON_SECRET is not configured; refusing to run.');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate the call. Accept either:
    //   - x-cron-secret header equal to CRON_SECRET, OR
    //   - Authorization: Bearer <CRON_SECRET>  (compat with some schedulers)
    const headerSecret = req.headers.get('x-cron-secret') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';
    const bearerSecret = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '').trim()
      : '';

    const provided = headerSecret || bearerSecret;
    // Constant-time-ish compare
    const ok =
      provided.length === CRON_SECRET.length &&
      provided.length > 0 &&
      provided === CRON_SECRET;

    if (!ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find all profiles with expired trials that are still premium
    const now = new Date().toISOString();
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .not('trial_expires_at', 'is', null)
      .lt('trial_expires_at', now)
      .eq('subscription_type', 'premium');

    if (fetchError) {
      throw new Error(`Failed to fetch expired trials: ${fetchError.message}`);
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return new Response(JSON.stringify({ expired_count: 0, message: 'No expired trials found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expiredIds = expiredTrials.map((p) => p.id);

    // Revert subscription_type to 'free' for expired trials
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_type: 'free' })
      .in('id', expiredIds);

    if (updateError) {
      throw new Error(`Failed to expire trials: ${updateError.message}`);
    }

    console.log(`Expired ${expiredIds.length} trial(s)`);

    return new Response(JSON.stringify({
      expired_count: expiredIds.length,
      message: `Reverted ${expiredIds.length} expired trial(s) to free`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Expire trials error:', error);
    // Return generic message to client; details stay in logs
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
