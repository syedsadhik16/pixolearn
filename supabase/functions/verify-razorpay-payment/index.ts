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
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_SECRET not configured');
    }

    // Block test-mode keys
    if (RAZORPAY_KEY_ID && !RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
      console.warn('WARNING: Razorpay key does not start with rzp_live_. Test mode is blocked.');
      throw new Error('Payment verification is not available in test mode.');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use verified user ID from JWT, NOT from request body
    const user_id = claimsData.claims.sub;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_id) {
      throw new Error('Missing required payment verification fields');
    }

    // Verify signature using HMAC SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Payment signature verification failed');
    }

    // Payment verified — save payment history and update subscription
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Save payment record
    await supabase.from('payment_history').insert({
      user_id,
      razorpay_order_id,
      razorpay_payment_id,
      plan_id,
      amount: 0,
      currency: 'INR',
      status: 'success',
    });

    // Fetch order to get actual amount
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    if (RAZORPAY_KEY_ID) {
      const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: { 'Authorization': `Basic ${razorpayAuth}` },
      });
      if (orderRes.ok) {
        const order = await orderRes.json();
        await supabase.from('payment_history')
          .update({ amount: order.amount / 100 })
          .eq('razorpay_order_id', razorpay_order_id);
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_type: 'premium' })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to update subscription');
    }

    // Write entitlement record server-side
    const planDurationMap: Record<string, number> = {
      '6-months': 6,
      '12-months': 12,
      '18-months': 18,
    };
    const durationMonths = planDurationMap[plan_id] || 6;
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    await supabase.from('user_entitlements').upsert({
      user_id,
      payment_status: 'success',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      selected_plan: plan_id,
      plan_duration_months: durationMonths,
      is_paid: true,
      entitlement_status: 'active',
      entitlement_start_date: now.toISOString(),
      entitlement_expiry_date: expiryDate.toISOString(),
      paid_at: now.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified and subscription activated',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Payment verification failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
