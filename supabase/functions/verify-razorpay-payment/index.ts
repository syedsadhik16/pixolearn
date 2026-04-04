import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PlanCode = "6_months" | "12_months" | "18_months";

type PlanConfig = {
  code: PlanCode;
  name: string;
  amountInRupees: number;
  durationMonths: number;
  allowedLevelCount: number;
};

const PLAN_CONFIG: Record<PlanCode, PlanConfig> = {
  "6_months": {
    code: "6_months",
    name: "6 Months",
    amountInRupees: 5999,
    durationMonths: 6,
    allowedLevelCount: 1,
  },
  "12_months": {
    code: "12_months",
    name: "12 Months",
    amountInRupees: 9999,
    durationMonths: 12,
    allowedLevelCount: 2,
  },
  "18_months": {
    code: "18_months",
    name: "18 Months",
    amountInRupees: 14999,
    durationMonths: 18,
    allowedLevelCount: 3,
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function sanitizeString(value: unknown, maxLength = 200): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizePlanId(planId: string): PlanCode | null {
  const normalized = planId
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "6_months" || normalized === "6months" || normalized === "6m") {
    return "6_months";
  }

  if (normalized === "12_months" || normalized === "12months" || normalized === "12m") {
    return "12_months";
  }

  if (normalized === "18_months" || normalized === "18months" || normalized === "18m") {
    return "18_months";
  }

  return null;
}

function parseSelectedLevels(raw: string): string[] {
  if (!raw) return [];

  const allowed = new Set(["level_1", "level_2", "level_3"]);

  return [
    ...new Set(
      raw
        .split(",")
        .map((item) =>
          item
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_"),
        )
        .filter((item) => allowed.has(item)),
    ),
  ];
}

async function createExpectedSignature(secret: string, orderId: string, paymentId: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);

  const message = `${orderId}|${paymentId}`;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")?.trim();
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")?.trim();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim();
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")?.trim();

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid request body" }, 400);
    }

    const razorpayOrderId = sanitizeString(body.razorpay_order_id, 100);
    const razorpayPaymentId = sanitizeString(body.razorpay_payment_id, 100);
    const razorpaySignature = sanitizeString(body.razorpay_signature, 200);

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return jsonResponse({ success: false, error: "Missing payment verification fields" }, 400);
    }

    const expectedSignature = await createExpectedSignature(RAZORPAY_KEY_SECRET, razorpayOrderId, razorpayPaymentId);

    if (expectedSignature !== razorpaySignature) {
      return jsonResponse({ success: false, error: "Payment signature verification failed" }, 400);
    }

    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const [orderRes, paymentRes] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${razorpayAuth}`,
        },
      }),
      fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${razorpayAuth}`,
        },
      }),
    ]);

    if (!orderRes.ok) {
      const orderError = await orderRes.text();
      console.error("Failed to fetch Razorpay order:", orderError);
      return jsonResponse({ success: false, error: "Failed to fetch Razorpay order details" }, 502);
    }

    if (!paymentRes.ok) {
      const paymentError = await paymentRes.text();
      console.error("Failed to fetch Razorpay payment:", paymentError);
      return jsonResponse({ success: false, error: "Failed to fetch Razorpay payment details" }, 502);
    }

    const order = await orderRes.json();
    const payment = await paymentRes.json();

    if (payment.order_id !== razorpayOrderId) {
      return jsonResponse({ success: false, error: "Payment does not belong to this order" }, 400);
    }

    if (order.notes?.user_id !== user.id) {
      return jsonResponse({ success: false, error: "Order user mismatch" }, 403);
    }

    const rawPlanId = sanitizeString(order.notes?.plan_id || "", 50);
    const normalizedPlanId = normalizePlanId(rawPlanId);

    if (!normalizedPlanId) {
      return jsonResponse({ success: false, error: "Invalid or missing plan_id in Razorpay order notes" }, 400);
    }

    const plan = PLAN_CONFIG[normalizedPlanId];
    const selectedLevels = parseSelectedLevels(order.notes?.selected_levels || "");

    if (selectedLevels.length !== plan.allowedLevelCount) {
      return jsonResponse(
        {
          success: false,
          error: `${plan.name} requires exactly ${plan.allowedLevelCount} selected level(s)`,
        },
        400,
      );
    }

    const expectedAmountInPaise = plan.amountInRupees * 100;
    if (Number(order.amount) !== expectedAmountInPaise) {
      return jsonResponse({ success: false, error: "Order amount does not match plan amount" }, 400);
    }

    const paymentStatus = sanitizeString(payment.status, 30).toLowerCase();
    const allowedStatuses = new Set(["authorized", "captured"]);
    if (!allowedStatuses.has(paymentStatus)) {
      return jsonResponse({ success: false, error: `Invalid payment status: ${payment.status}` }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);

    const paymentHistoryPayload = {
      user_id: user.id,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      plan_id: plan.code,
      amount: plan.amountInRupees,
      currency: order.currency || "INR",
      status: "success",
    };

    const { error: paymentHistoryError } = await supabase
      .from("payment_history")
      .upsert(paymentHistoryPayload, { onConflict: "razorpay_payment_id" });

    if (paymentHistoryError) {
      console.error("Failed to write payment_history:", paymentHistoryError);
      return jsonResponse({ success: false, error: "Failed to save payment history" }, 500);
    }

    const entitlementPayload = {
      user_id: user.id,
      payment_status: "success",
      payment_id: razorpayPaymentId,
      order_id: razorpayOrderId,
      selected_plan: plan.code,
      selected_levels: selectedLevels,
      plan_duration_months: plan.durationMonths,
      is_paid: true,
      entitlement_status: "active",
      entitlement_start_date: now.toISOString(),
      entitlement_expiry_date: expiryDate.toISOString(),
      paid_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { error: entitlementError } = await supabase
      .from("user_entitlements")
      .upsert(entitlementPayload, { onConflict: "user_id" });

    if (entitlementError) {
      console.error("Failed to upsert user_entitlements:", entitlementError);
      return jsonResponse({ success: false, error: "Failed to activate entitlement" }, 500);
    }

    const profileUpdatePayload = {
      subscription_type: "premium",
      updated_at: now.toISOString(),
    };

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update(profileUpdatePayload)
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Failed to update profile:", profileUpdateError);
      return jsonResponse({ success: false, error: "Failed to update user profile" }, 500);
    }

    return jsonResponse({
      success: true,
      message: "Payment verified and subscription activated",
      plan_id: plan.code,
      plan_name: plan.name,
      selected_levels: selectedLevels,
      entitlement_expiry_date: expiryDate.toISOString(),
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return jsonResponse({ success: false, error: "Payment verification failed" }, 500);
  }
});
