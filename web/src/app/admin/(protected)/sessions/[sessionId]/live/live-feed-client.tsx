"use client";

import { useEffect, useRef, useState } from "react";
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
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const { data } = await supabaseRef.current
        .from("answer_events")
        .select("*")
        .eq("session_id", sessionId)
        .order("answered_at", { ascending: false })
        .limit(50);
      if (!cancelled && data) {
        setEvents(data as AnswerEvent[]);
        setLoaded(true);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  const correctCount = events.filter((e) => e.correct).length;

  return (
    <div data-theme={theme} className="space-y-3">
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
