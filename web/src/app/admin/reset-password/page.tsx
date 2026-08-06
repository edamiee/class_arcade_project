"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MascotHeader } from "@/components/mascot";

// Reached via the link in a "reset your password" email. Same hash-fragment
// session pattern as accept-invite: Supabase puts a recovery token in the
// URL hash, which only the browser (not the server) ever sees, so this page
// has to be a client component and is excluded from middleware.ts's
// cookie-based auth check the same way accept-invite is.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <p className="text-sm text-slate-400">Checking your reset link…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border-2 border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-slate-100">Reset link expired</h1>
          <p className="text-sm text-slate-400">
            This password reset link is invalid or has already been used.
            Request a new one from the login page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border-2 border-slate-800 bg-slate-900 p-8 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <MascotHeader />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Reset password</h1>
            <p className="text-sm text-slate-400">Choose a new password.</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-300">New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-300">Confirm password</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Set password & continue"}
        </button>
      </form>
    </div>
  );
}
