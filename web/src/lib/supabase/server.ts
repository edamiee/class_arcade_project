import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side, cookie-aware client — reads/refreshes the admin's Supabase Auth
// session from cookies. Use this in server components, route handlers, and
// middleware that need to know "is the current request the logged-in admin?"
// Still respects RLS (anon/authenticated role), so it can only read/write
// admin-owned tables once a real admin session is present.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore if
            // middleware is refreshing the session.
          }
        },
      },
    }
  );
}
