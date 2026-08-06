"use client";

import { useState } from "react";

export interface AdminRow {
  id: string;
  email: string;
  lastSignInAt: string | null;
}

export default function AdminsListClient({
  initialAdmins,
  currentUserId,
}: {
  initialAdmins: AdminRow[];
  currentUserId: string;
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send invite.");
      setAdmins((prev) =>
        [...prev, { id: data.id, email: data.email, lastSignInAt: null }].sort(
          (a, b) => a.email.localeCompare(b.email)
        )
      );
      setStatus(`Invite sent to ${data.email}.`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(admin: AdminRow) {
    if (!confirm(`Remove admin access for ${admin.email}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: admin.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove admin.");
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove admin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={invite} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="new-admin@example.com"
          className="flex-1 rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "…" : "Send invite"}
        </button>
      </form>
      {status && <p className="text-sm text-emerald-400">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <ul className="arcade-bezel divide-y divide-slate-800">
        {admins.map((a) => {
          const isSelf = a.id === currentUserId;
          const isLast = admins.length <= 1;
          return (
            <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <span className="text-slate-100">{a.email}</span>
                {isSelf && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                <p className="text-xs text-slate-500">
                  {a.lastSignInAt
                    ? `last signed in ${new Date(a.lastSignInAt).toLocaleDateString()}`
                    : "invited, hasn't signed in yet"}
                </p>
              </div>
              <button
                onClick={() => remove(a)}
                disabled={busy || isSelf || isLast}
                title={
                  isSelf
                    ? "You can't remove your own admin access"
                    : isLast
                      ? "Can't remove the last admin"
                      : undefined
                }
                className="shrink-0 rounded-md border-2 border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-600 disabled:opacity-30"
              >
                Remove
              </button>
            </li>
          );
        })}
        {admins.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            No admins found.
          </li>
        )}
      </ul>
    </div>
  );
}
