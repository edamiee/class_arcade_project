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
          <label htmlFor="password" className="text-sm text-slate-300">
            Password
          </label>
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
