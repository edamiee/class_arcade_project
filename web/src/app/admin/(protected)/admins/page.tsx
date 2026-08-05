import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminsListClient, { type AdminRow } from "./admins-list-client";

export default async function AdminsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adminRows } = await supabase.from("admins").select("id");
  const adminIds = new Set((adminRows ?? []).map((r) => r.id as string));

  // auth.users isn't queryable via the regular RLS-bound client — the
  // Admin API (service role) is the only way to resolve ids to emails.
  const serviceClient = createAdminClient();
  const { data: usersPage } = await serviceClient.auth.admin.listUsers();

  const admins: AdminRow[] = (usersPage?.users ?? [])
    .filter((u) => adminIds.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      lastSignInAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-slate-400 hover:text-indigo-400">
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-bold">Admins</h2>
        <p className="text-sm text-slate-400">
          Everyone listed here has full admin access — courses, sessions,
          students, everything.
        </p>
      </div>
      <AdminsListClient initialAdmins={admins} currentUserId={user?.id ?? ""} />
    </div>
  );
}
