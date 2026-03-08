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

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_SECRET not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, plan_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id || !plan_id) {
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
      amount: 0, // Will be fetched from order
      currency: 'INR',
      status: 'success',
    });

    // Fetch order to get actual amount
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    if (RAZORPAY_KEY_ID) {
      const authHeader = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: { 'Authorization': `Basic ${authHeader}` },
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

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified and subscription activated',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
