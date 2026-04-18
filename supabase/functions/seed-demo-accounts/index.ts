// One-shot helper to seed demo accounts so the dev quick-login buttons work.
// Hits the auth admin API with the service role key. Idempotent.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoAccount {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'parent' | 'admin';
  extra_roles?: ('student' | 'parent' | 'admin')[];
}

// Use a strong password that passes HIBP leaked-password check
const DEMO_PW = 'PixoLearn!Demo2026#Strong';

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'student@pixolearn.test', password: DEMO_PW, full_name: 'Demo Student', role: 'student' },
  { email: 'parent@pixolearn.test', password: DEMO_PW, full_name: 'Demo Parent', role: 'parent' },
  { email: 'admin@pixolearn.test', password: DEMO_PW, full_name: 'Demo Admin', role: 'admin' },
  { email: 'multirole@pixolearn.test', password: DEMO_PW, full_name: 'Demo Multi-Role', role: 'parent', extra_roles: ['student', 'admin'] },
  { email: 'admin@pixo.test', password: DEMO_PW, full_name: 'Admin Legacy', role: 'admin' }, // ensure legacy admin password is reset to known value
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<{ email: string; status: string; user_id?: string; error?: string }> = [];

    for (const acct of DEMO_ACCOUNTS) {
      try {
        // Try to find existing user
        const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = existing.users.find((u) => u.email?.toLowerCase() === acct.email.toLowerCase());

        let userId: string;
        let status: string;

        if (found) {
          userId = found.id;
          // Reset password and confirm to make sure demo button works
          await admin.auth.admin.updateUserById(userId, {
            password: acct.password,
            email_confirm: true,
            user_metadata: { full_name: acct.full_name, role: acct.role },
          });
          status = 'updated';
        } else {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email: acct.email,
            password: acct.password,
            email_confirm: true,
            user_metadata: { full_name: acct.full_name, role: acct.role },
          });
          if (createErr) {
            console.error('createUser error', acct.email, createErr);
            throw createErr;
          }
          userId = created.user.id;
          status = 'created';
        }

        // Ensure profile exists with correct role
        await admin.from('profiles').upsert(
          {
            id: userId,
            email: acct.email,
            full_name: acct.full_name,
            role: acct.role,
          },
          { onConflict: 'id' },
        );

        // Ensure user_roles rows
        const allRoles = [acct.role, ...(acct.extra_roles ?? [])];
        for (const r of allRoles) {
          await admin.from('user_roles').upsert(
            { user_id: userId, role: r, is_active: true },
            { onConflict: 'user_id,role' },
          );
        }

        results.push({ email: acct.email, status, user_id: userId });
      } catch (e) {
        results.push({ email: acct.email, status: 'error', error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
