import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
