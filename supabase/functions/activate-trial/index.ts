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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('Missing user_id');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user already had a trial
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('trial_started_at, trial_expires_at, subscription_type')
      .eq('id', user_id)
      .single();

    if (fetchError) {
      throw new Error('Failed to fetch user profile');
    }

    // If already premium, no need for trial
    if (profile.subscription_type === 'premium') {
      return new Response(JSON.stringify({
        success: false,
        error: 'You already have a premium subscription!',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If trial already used
    if (profile.trial_started_at) {
      const expiresAt = new Date(profile.trial_expires_at);
      const now = new Date();

      if (now < expiresAt) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Trial is already active',
          trial_expires_at: profile.trial_expires_at,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Your free trial has already been used. Please choose a plan to continue.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Activate trial: set start and expiry (24 hours from now)
    const trialStart = new Date();
    const trialExpiry = new Date(trialStart.getTime() + 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_started_at: trialStart.toISOString(),
        trial_expires_at: trialExpiry.toISOString(),
        subscription_type: 'premium',
      })
      .eq('id', user_id);

    if (updateError) {
      throw new Error('Failed to activate trial');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Free trial activated! Enjoy 24 hours of premium access.',
      trial_started_at: trialStart.toISOString(),
      trial_expires_at: trialExpiry.toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Trial activation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
