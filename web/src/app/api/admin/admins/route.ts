import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// public.admins only has an admin-readable SELECT policy (see 0001_init.sql
// — any admin can see every row, but there's no INSERT/DELETE policy for
// the regular RLS-bound client), so both invite and removal go through the
// service-role client here rather than a direct client-side table call.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json();
  const email: string = (body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const serviceClient = createAdminClient();

  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/admin/accept-invite`,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Could not send invite." },
      { status: 500 }
    );
  }

  const { error: insertError } = await serviceClient
    .from("admins")
    .insert({ id: data.user.id });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.user.id, email });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json();
  const id: string = body.id;
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  if (id === admin.user.id) {
    return NextResponse.json(
      { error: "You can't remove your own admin access." },
      { status: 400 }
    );
  }

  const serviceClient = createAdminClient();
  const { count } = await serviceClient
    .from("admins")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Can't remove the last remaining admin." },
      { status: 400 }
    );
  }

  const { error } = await serviceClient.from("admins").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
