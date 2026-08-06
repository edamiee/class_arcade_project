"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnswerEvent } from "@/lib/types";

const POLL_MS = 2000;

export default function LiveFeedClient({
  sessionId,
  theme,
}: {
  sessionId: string;
  theme: string;
}) {
  const [events, setEvents] = useState<AnswerEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const [{ data }, { data: removedRows }] = await Promise.all([
        supabaseRef.current
          .from("answer_events")
          .select("*")
          .eq("session_id", sessionId)
          .order("answered_at", { ascending: false })
          .limit(50),
        supabaseRef.current
          .from("session_removed_students")
          .select("student_id")
          .eq("session_id", sessionId),
      ]);
      if (!cancelled) {
        if (data) {
          setEvents(data as AnswerEvent[]);
          setLoaded(true);
        }
        if (removedRows) {
          setRemovedIds(new Set(removedRows.map((r) => r.student_id as string)));
        }
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  const participants = useMemo(() => {
    const byId = new Map<string, { studentId: string; name: string; teamName: string | null }>();
    for (const e of events) {
      if (!byId.has(e.student_id)) {
        byId.set(e.student_id, {
          studentId: e.student_id,
          name: e.student_name,
          teamName: e.team_name,
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [events]);

  async function removeStudent(studentId: string, name: string) {
    if (
      !confirm(
        `Remove ${name} from this session? Their answers won't be recorded from now on.`
      )
    ) {
      return;
    }
    setRemovingId(studentId);
    const { error } = await supabaseRef.current
      .from("session_removed_students")
      .insert({ session_id: sessionId, student_id: studentId });
    setRemovingId(null);
    if (error && error.code !== "23505") {
      alert(error.message);
      return;
    }
    setRemovedIds((prev) => new Set(prev).add(studentId));
  }

  const correctCount = events.filter((e) => e.correct).length;

  return (
    <div data-theme={theme} className="space-y-4">
      {participants.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Students who&apos;ve answered — remove someone who joined by
            mistake or needs to be pulled from this session.
          </p>
          <ul className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const isRemoved = removedIds.has(p.studentId);
              return (
                <li
                  key={p.studentId}
                  className="flex items-center gap-2 rounded-md border-2 border-slate-800 px-2 py-1 text-xs"
                >
                  <span className={isRemoved ? "text-slate-500 line-through" : "text-slate-200"}>
                    {p.name}
                    {p.teamName ? ` · ${p.teamName}` : ""}
                  </span>
                  {isRemoved ? (
                    <span className="text-red-400">Removed</span>
                  ) : (
                    <button
                      onClick={() => removeStudent(p.studentId, p.name)}
                      disabled={removingId === p.studentId}
                      className="text-red-400 underline hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">
        {loaded
          ? `${events.length} recent answer(s) · ${correctCount} correct · updates every ${POLL_MS / 1000}s`
          : "Loading…"}
      </p>

      <ul className="divide-y-2 divide-slate-800 rounded-lg border-2 border-slate-800">
        {events.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-100">
                <span className="font-semibold">{e.student_name}</span>
                {e.team_name && (
                  <span className="ml-2 text-xs text-slate-500">{e.team_name}</span>
                )}
              </p>
              <p className="truncate text-xs text-slate-500">{e.prompt}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              <span
                className={
                  e.correct
                    ? "font-bold text-[var(--green)]"
                    : "font-bold text-[var(--red)]"
                }
              >
                {e.correct ? "✓" : "✗"}
              </span>
              <span className="text-slate-500">
                {new Date(e.answered_at).toLocaleTimeString()}
              </span>
            </div>
          </li>
        ))}
        {loaded && events.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            Waiting for answers…
          </li>
        )}
      </ul>
    </div>
  );
}
