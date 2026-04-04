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

function sanitizeString(value: unknown, maxLength = 100): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeSelectedLevels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const allowed = new Set(["level_1", "level_2", "level_3"]);

  const cleaned = value
    .map((item) =>
      sanitizeString(item, 20)
        .toLowerCase()
        .replace(/[\s-]+/g, "_"),
    )
    .filter((item) => allowed.has(item));

  return [...new Set(cleaned)];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")?.trim();
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")?.trim();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim();
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")?.trim();

    const APP_ENV = (Deno.env.get("APP_ENV") || Deno.env.get("ENVIRONMENT") || Deno.env.get("NODE_ENV") || "production")
      .trim()
      .toLowerCase();

    const origin = req.headers.get("origin") || "";
    const isLocalRequest = origin.includes("localhost") || origin.includes("127.0.0.1");
    const isProduction = APP_ENV === "production" && !isLocalRequest;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay secrets");
      return jsonResponse({ error: "Payment gateway is not configured. Please contact support." }, 503);
    }

    const isLiveKey = RAZORPAY_KEY_ID.startsWith("rzp_live_");
    const isTestKey = RAZORPAY_KEY_ID.startsWith("rzp_test_");

    if (!isLiveKey && !isTestKey) {
      console.error("Invalid Razorpay key format");
      return jsonResponse({ error: "Invalid payment key configuration. Please contact support." }, 503);
    }

    if (isProduction && !isLiveKey) {
      console.error("Blocked test key in production");
      return jsonResponse({ error: "Production payment gateway is not configured with live keys." }, 503);
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase configuration");
      return jsonResponse({ error: "Server configuration missing. Please contact support." }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User auth failed:", userError?.message || "No user");
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid request body" }, 400);
    }

    const rawPlanId = sanitizeString(body.plan_id, 50);
    const userName = sanitizeString(body.user_name, 80);
    const selectedLevels = sanitizeSelectedLevels(body.selected_levels);
    const currency = "INR";

    if (!rawPlanId) {
      return jsonResponse({ error: "Missing required field: plan_id" }, 400);
    }

    const normalizedPlanId = normalizePlanId(rawPlanId);
    if (!normalizedPlanId) {
      return jsonResponse({ error: "Invalid plan_id" }, 400);
    }

    const plan = PLAN_CONFIG[normalizedPlanId];

    if (selectedLevels.length !== plan.allowedLevelCount) {
      return jsonResponse(
        {
          error: `${plan.name} requires exactly ${plan.allowedLevelCount} level selection(s).`,
        },
        400,
      );
    }

    const amountInPaise = plan.amountInRupees * 100;
    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const orderPayload = {
      amount: amountInPaise,
      currency,
      receipt: `pixo_${plan.code}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        plan_id: plan.code,
        plan_name: plan.name,
        duration_months: String(plan.durationMonths),
        user_id: user.id,
        user_email: user.email || "",
        user_name: userName,
        selected_levels: selectedLevels.join(","),
        source: "pixo_learn_web",
      },
    };

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${razorpayAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const rawResponse = await razorpayResponse.text();

    if (!razorpayResponse.ok) {
      console.error("Razorpay order creation failed:", rawResponse);
      return jsonResponse(
        {
          error: "Failed to create Razorpay order",
          details: rawResponse,
        },
        502,
      );
    }

    let orderData: any;
    try {
      orderData = JSON.parse(rawResponse);
    } catch {
      return jsonResponse({ error: "Invalid response received from Razorpay." }, 502);
    }

    return jsonResponse({
      success: true,
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      key_id: RAZORPAY_KEY_ID,
      plan_id: plan.code,
      plan_name: plan.name,
      amount_in_rupees: plan.amountInRupees,
      duration_months: plan.durationMonths,
      selected_levels: selectedLevels,
      mode: isLiveKey ? "live" : "test",
    });
  } catch (error) {
    console.error("Unexpected error creating Razorpay order:", error);
    return jsonResponse({ error: "Failed to create order. Please try again." }, 500);
  }
});
