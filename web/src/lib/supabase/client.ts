import { createBrowserClient } from "@supabase/ssr";

// Browser client — uses the public URL + anon key only. Safe to import in
// client components. RLS means this client can only do anything useful once
// signed in as the admin (see lib/supabase/server.ts for the server-side
// auth-aware client) — students never use this client directly.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
