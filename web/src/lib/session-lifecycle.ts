import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameSession } from "@/lib/types";

export function isSessionExpired(
  session: Pick<GameSession, "auto_close_at">
): boolean {
  return !!session.auto_close_at && new Date(session.auto_close_at) <= new Date();
}

// This app has no background job runner, so an auto-close deadline can't
// flip is_open on a timer — it's enforced lazily instead: the first
// request that touches the session after its deadline is what actually
// closes it.
export async function resolveSessionOpen(
  supabase: SupabaseClient,
  session: GameSession
): Promise<boolean> {
  if (!session.is_open) return false;
  if (!isSessionExpired(session)) return true;
  await supabase.from("sessions").update({ is_open: false }).eq("id", session.id);
  return false;
}
