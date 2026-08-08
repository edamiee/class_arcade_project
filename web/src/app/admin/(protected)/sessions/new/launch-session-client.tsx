"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateSessionCode } from "@/lib/session-code";
import JoinQrCode from "@/components/join-qr-code";
import type {
  Course,
  Week,
  Team,
  GameSession,
  SessionMode,
  SessionPacing,
} from "@/lib/types";

const THEMES: { value: string; label: string }[] = [
  { value: "pac", label: "PAC" },
  { value: "blocks", label: "BLOCKS" },
  { value: "plumber", label: "PLUMBER" },
];

export default function LaunchSessionClient({
  courses,
  weeks,
  initialTeams,
  questionCounts,
}: {
  courses: Course[];
  weeks: Week[];
  initialTeams: Team[];
  questionCounts: Record<string, number>;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const weeksForCourse = useMemo(
    () => weeks.filter((w) => w.course_id === courseId),
    [weeks, courseId]
  );
  const [weekId, setWeekId] = useState(weeksForCourse[0]?.id ?? "");
  const [theme, setTheme] = useState("pac");
  const [mode, setMode] = useState<SessionMode>("individual");
  const [pacing, setPacing] = useState<SessionPacing>("self");
  const [isPractice, setIsPractice] = useState(false);

  function togglePractice() {
    setIsPractice((prev) => {
      const next = !prev;
      if (next) {
        setMode("individual");
        setPacing("self");
      }
      return next;
    });
  }

  const weekTotal = questionCounts[weekId] ?? 0;
  const [questionCount, setQuestionCount] = useState(weekTotal);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [autoCloseMinutes, setAutoCloseMinutes] = useState(0);

  const [teams, setTeams] = useState(initialTeams);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    new Set()
  );
  const [newTeamName, setNewTeamName] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<GameSession | null>(null);

  function onCourseChange(id: string) {
    setCourseId(id);
    const first = weeks.find((w) => w.course_id === id);
    setWeekId(first?.id ?? "");
    setQuestionCount(questionCounts[first?.id ?? ""] ?? 0);
  }

  function onWeekChange(id: string) {
    setWeekId(id);
    setQuestionCount(questionCounts[id] ?? 0);
  }

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    setTeamBusy(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("teams")
      .insert({ name })
      .select()
      .single();
    setTeamBusy(false);
    if (insertError) {
      alert(insertError.message);
      return;
    }
    const team = data as Team;
    setTeams((prev) => [...prev, team]);
    setSelectedTeamIds((prev) => new Set(prev).add(team.id));
    setNewTeamName("");
  }

  async function launch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!courseId || !weekId) {
      setError("Pick a course and week.");
      return;
    }
    if (mode === "team" && selectedTeamIds.size === 0) {
      setError("Pick at least one team, or switch to individual mode.");
      return;
    }
    if (weekTotal === 0) {
      setError("This week has no questions yet.");
      return;
    }
    if (questionCount < 1 || questionCount > weekTotal) {
      setError(`Number of questions must be between 1 and ${weekTotal}.`);
      return;
    }

    setBusy(true);
    const supabase = createClient();

    let session: GameSession | null = null;
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 5 && !session; attempt++) {
      const code = generateSessionCode();
      const { data, error: insertError } = await supabase
        .from("sessions")
        .insert({
          course_id: courseId,
          week_id: weekId,
          theme,
          mode,
          pacing,
          is_practice: isPractice,
          session_code: code,
          question_count: questionCount,
          timer_seconds: timerSeconds,
          auto_close_at:
            autoCloseMinutes > 0
              ? new Date(Date.now() + autoCloseMinutes * 60_000).toISOString()
              : null,
        })
        .select()
        .single();
      if (!insertError) {
        session = data as GameSession;
      } else if (insertError.code === "23505") {
        lastError = insertError.message;
      } else {
        lastError = insertError.message;
        break;
      }
    }

    if (!session) {
      setBusy(false);
      setError(lastError ?? "Could not create a session. Try again.");
      return;
    }

    if (mode === "team" && selectedTeamIds.size > 0) {
      const rows = Array.from(selectedTeamIds).map((team_id) => ({
        session_id: session!.id,
        team_id,
      }));
      const { error: teamsError } = await supabase
        .from("session_teams")
        .insert(rows);
      if (teamsError) {
        setBusy(false);
        setError(
          `Session created, but linking teams failed: ${teamsError.message}`
        );
        setCreated(session);
        return;
      }
    }

    setBusy(false);
    setCreated(session);
  }

  function launchAnother() {
    setCreated(null);
    setError(null);
    setSelectedTeamIds(new Set());
  }

  if (created) {
    const courseName = courses.find((c) => c.id === created.course_id)?.name;
    const weekLabel = weeks.find((w) => w.id === created.week_id)?.label;
    return (
      <div className="arcade-bezel max-w-md space-y-4 p-6">
        <p className="text-sm text-slate-400">
          {courseName} — {weekLabel} · {created.mode} mode ·{" "}
          {created.pacing === "presenter" ? "presenter-paced" : "self-paced"}
          {created.is_practice ? " · practice" : ""} ·{" "}
          {THEMES.find((t) => t.value === created.theme)?.label} ·{" "}
          {created.question_count ?? "all"} question
          {created.question_count === 1 ? "" : "s"}
          {created.timer_seconds > 0
            ? ` · ${created.timer_seconds}s/question`
            : " · no timer"}
          {created.auto_close_at
            ? ` · auto-closes ${new Date(created.auto_close_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
            : ""}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <JoinQrCode
            url={`${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${created.session_code}`}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Session code
            </p>
            <p className="text-5xl font-black tracking-widest text-indigo-400">
              {created.session_code}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Students on phones/tablets can scan the QR code. On a laptop,
          they&apos;ll enter the code at{" "}
          <span className="text-slate-200">/join</span>.
        </p>
        <a
          href={`/admin/sessions/${created.id}/present`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-btn block rounded-md bg-indigo-600 px-4 py-2 text-center font-semibold text-[var(--bg)] transition hover:bg-indigo-500"
        >
          Present for class →
        </a>
        <p className="text-xs text-slate-500">
          Opens a clean full-screen code, safe to project — no admin
          buttons. Keep this tab to yourself for the links below.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/sessions/${created.id}/live`}
            className="link-btn rounded-md border-2 border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500"
          >
            {created.pacing === "presenter" ? "Watch live & start round" : "Watch live"}
          </Link>
          <Link
            href={`/admin/sessions/${created.id}`}
            className="link-btn rounded-md border-2 border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500"
          >
            View results
          </Link>
          {created.is_practice && (
            <a
              href={`/admin/sessions/${created.id}/flyer`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-btn rounded-md border-2 border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500"
            >
              Print flyer
            </a>
          )}
          <button
            onClick={launchAnother}
            className="rounded-md border-2 border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500"
          >
            Launch another session
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={launch} className="arcade-bezel max-w-md space-y-4 p-6">
      <div className="space-y-1">
        <label className="text-sm text-slate-300">Course</label>
        <select
          value={courseId}
          onChange={(e) => onCourseChange(e.target.value)}
          className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-300">Week / topic</label>
        <select
          value={weekId}
          onChange={(e) => onWeekChange(e.target.value)}
          className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        >
          {weeksForCourse.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-slate-300">
            Number of questions
          </label>
          <input
            type="number"
            min={1}
            max={weekTotal || undefined}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-slate-500">{weekTotal} available</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-300">
            Time per question, sec
          </label>
          <input
            type="number"
            min={0}
            value={timerSeconds}
            onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-slate-500">0 = no timer</p>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-300">
          Auto-close after, minutes
        </label>
        <input
          type="number"
          min={0}
          value={autoCloseMinutes}
          onChange={(e) => setAutoCloseMinutes(parseInt(e.target.value, 10) || 0)}
          className="w-full max-w-[120px] rounded-md border-2 border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
        />
        <p className="text-xs text-slate-500">
          0 = stays open until you end it manually
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-300">Theme</label>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                theme === t.value
                  ? "bg-indigo-600 text-[var(--bg)]"
                  : "border-2 border-slate-700 text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-300">Mode</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("individual")}
            disabled={isPractice}
            className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${
              mode === "individual"
                ? "bg-indigo-600 text-[var(--bg)]"
                : "border-2 border-slate-700 text-slate-300"
            }`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setMode("team")}
            disabled={isPractice}
            className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${
              mode === "team"
                ? "bg-indigo-600 text-[var(--bg)]"
                : "border-2 border-slate-700 text-slate-300"
            }`}
          >
            Team
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-300">Pacing</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPacing("self")}
            disabled={isPractice}
            className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${
              pacing === "self"
                ? "bg-indigo-600 text-[var(--bg)]"
                : "border-2 border-slate-700 text-slate-300"
            }`}
          >
            Self-paced
          </button>
          <button
            type="button"
            onClick={() => setPacing("presenter")}
            disabled={isPractice}
            className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${
              pacing === "presenter"
                ? "bg-indigo-600 text-[var(--bg)]"
                : "border-2 border-slate-700 text-slate-300"
            }`}
          >
            Presenter-paced
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {pacing === "presenter"
            ? "Everyone stays on the same question — advance the class from \"Watch live\"."
            : "Each student answers at their own speed."}
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-300">Practice / homework</label>
        <button
          type="button"
          onClick={togglePractice}
          className={`rounded-md px-3 py-1.5 text-sm ${
            isPractice
              ? "bg-indigo-600 text-[var(--bg)]"
              : "border-2 border-slate-700 text-slate-300"
          }`}
        >
          {isPractice ? "Practice session — on" : "Make this a practice session"}
        </button>
        <p className="text-xs text-slate-500">
          {isPractice
            ? "Locked to individual, self-paced. Students get a \"Play again\" button to retry anytime — leave this open and share the code/link for review before a test."
            : "A standing link students can revisit on their own time, not tied to a live class."}
        </p>
      </div>

      {mode === "team" && (
        <div className="space-y-2 rounded-md border-2 border-slate-800 p-3">
          <p className="text-sm text-slate-300">
            Teams available to join this session
          </p>
          <div className="space-y-1">
            {teams.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2 text-sm text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={selectedTeamIds.has(t.id)}
                  onChange={() => toggleTeam(t.id)}
                  className="accent-indigo-600"
                />
                {t.name}
              </label>
            ))}
            {teams.length === 0 && (
              <p className="text-xs text-slate-500">No teams yet.</p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="New team name"
              className="flex-1 rounded-md border-2 border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={addTeam}
              disabled={teamBusy}
              className="rounded-md border-2 border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 disabled:opacity-50"
            >
              Add team
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy || !courseId || !weekId || weekTotal === 0}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-[var(--bg)] transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {busy ? "Launching…" : "Launch session"}
      </button>
    </form>
  );
}
