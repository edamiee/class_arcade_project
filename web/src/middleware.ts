import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on every request, and gates
// /admin/* behind a logged-in session. Whether that logged-in user is
// actually the admin (present in public.admins) is checked separately in
// the protected layout, since that needs a DB read this middleware
// shouldn't have to do on every single request.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /admin/accept-invite must stay reachable without a cookie session: the
  // invite link's session-establishing token arrives in the URL hash
  // fragment, which the server never sees, only the browser — so on the
  // very first request there's no cookie yet, only after client-side JS
  // parses the hash and syncs a session to cookies.
  const path = request.nextUrl.pathname;
  const publicAdminPaths = [
    "/admin/login",
    "/admin/accept-invite",
    "/admin/reset-password",
  ];
  if (!user && path.startsWith("/admin") && !publicAdminPaths.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
