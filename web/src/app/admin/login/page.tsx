"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MascotHeader } from "@/components/mascot";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetBusy(true);

    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      { redirectTo: `${window.location.origin}/admin/reset-password` }
    );
    setResetBusy(false);
    if (resetErr) {
      setResetError(resetErr.message);
      return;
    }
    setResetSent(true);
  }

  if (mode === "reset") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border-2 border-slate-800 bg-slate-900 p-8 shadow-xl">
          <div className="flex items-center gap-3">
            <MascotHeader />
            <div>
              <h1 className="text-xl font-bold text-slate-100">Reset password</h1>
              <p className="text-sm text-slate-400">
                We&apos;ll email you a link to set a new one.
              </p>
            </div>
          </div>

          {resetSent ? (
            <p className="text-sm text-slate-300">
              If that email has an admin account, a reset link is on its way.
              Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="reset-email" className="text-sm text-slate-300">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              {resetError && <p className="text-sm text-red-400">{resetError}</p>}

              <button
                type="submit"
                disabled={resetBusy}
                className="w-full rounded-md bg-indigo-600 px-3 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {resetBusy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setResetSent(false);
              setResetError(null);
            }}
            className="text-sm text-slate-400 underline hover:text-slate-300"
          >
            Back to sign in
          </button>
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
            <h1 className="text-xl font-bold text-slate-100">Admin Login</h1>
            <p className="text-sm text-slate-400">
              <span className="brand-marquee">Penelope&apos;s Learning Arcade</span> —
              admin only.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm text-slate-300">
              Password
            </label>
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-xs text-slate-400 underline hover:text-slate-300"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
