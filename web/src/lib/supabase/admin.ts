import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Only ever import this from
// server routes (route handlers), never from client components or anything
// that ships to the browser. The `server-only` import above makes accidental
// client-side use a build error rather than a silent leak.
//
// Used for the student /join and /play flows (which have no Supabase Auth
// identity of their own) and for the AI generation routes. Every route that
// uses this client is responsible for its own authorization checks in
// application code (e.g. verifying the signed student session cookie) —
// there's no RLS safety net here.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
