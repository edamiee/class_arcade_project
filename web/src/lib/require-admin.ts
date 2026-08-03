import "server-only";
import { createClient } from "@/lib/supabase/server";

// Shared guard for API routes: confirms the request's cookie session belongs
// to a logged-in Supabase Auth user who is also present in public.admins.
// Returns the user on success, or null if either check fails — callers
// should respond 401 in that case.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow) return null;

  return { user, supabase };
}
