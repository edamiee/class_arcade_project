import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

// Guards everything under /admin (except /admin/login, which lives outside
// this route group). Two checks: is there a logged-in Supabase Auth user at
// all (middleware.ts already redirects the obvious case, this is belt and
// suspenders for direct server-side hits), and is that user present in
// public.admins — being a valid Supabase Auth user is not enough on its own.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/admin/login?error=not_admin");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-lg font-bold">Penelope&apos;s Learning Arcade</h1>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
