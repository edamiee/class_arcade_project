"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MascotHeader } from "@/components/mascot";
import ChaseStrip from "@/components/chase-strip";

interface LookupResult {
  valid: boolean;
  mode?: "individual" | "team";
  theme?: string;
  courseName?: string;
  weekLabel?: string;
  teams?: { id: string; name: string }[];
}

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<"code" | "details">("code");
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setBusy(true);
    const res = await fetch(
      `/api/join/lookup?code=${encodeURIComponent(trimmed)}`
    );
    const data: LookupResult = await res.json();
    setBusy(false);
    if (!data.valid) {
      setError("That code isn't open right now. Double-check with your teacher.");
      return;
    }
    setLookup(data);
    setTeamId(data.teams?.[0]?.id ?? "");
    setStep("details");
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }
    if (lookup?.mode === "team" && !teamId) {
      setError("Pick a team.");
      return;
    }
    setError(null);
    setBusy(true);
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: code.trim(),
        name: trimmedName,
        teamId: lookup?.mode === "team" ? teamId : null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Couldn't join. Try again.");
      return;
    }
    router.push("/play");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 py-8">
      <div className="w-full max-w-sm space-y-4 rounded-xl border-2 border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <MascotHeader />
          <h1 className="text-xl font-bold text-slate-100">
            Penelope&apos;s Learning Arcade
          </h1>
        </div>

        {step === "code" && (
          <form onSubmit={submitCode} className="space-y-4">
            <p className="text-sm text-slate-400">
              Enter the code your teacher gave you.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              autoFocus
              maxLength={8}
              className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-3 text-center text-2xl font-black tracking-widest text-slate-100 outline-none focus:border-indigo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? "Checking…" : "Continue"}
            </button>
          </form>
        )}

        {step === "details" && lookup && (
          <form onSubmit={submitDetails} className="space-y-4">
            <p className="text-sm text-slate-400">
              {lookup.courseName} — {lookup.weekLabel}
            </p>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={60}
                className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            {lookup.mode === "team" && (
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Your team</label>
                <div className="space-y-1">
                  {(lookup.teams ?? []).map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 text-sm text-slate-200"
                    >
                      <input
                        type="radio"
                        name="teamId"
                        checked={teamId === t.id}
                        onChange={() => setTeamId(t.id)}
                        className="accent-indigo-600"
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? "Joining…" : "Join"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("code");
                setError(null);
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
            >
              Wrong code? Go back
            </button>
          </form>
        )}
      </div>
      <div className="w-full max-w-sm">
        <ChaseStrip theme={lookup?.theme ?? "pac"} />
      </div>
    </div>
  );
}
