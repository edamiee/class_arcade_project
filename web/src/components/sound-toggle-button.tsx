"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/sound";

export default function SoundToggleButton({
  borderColor,
  color,
}: {
  borderColor: string;
  color: string;
}) {
  const [muted, setMutedState] = useState(false);

  // Read the persisted preference after mount only — avoids an SSR/client
  // markup mismatch, since localStorage isn't available on the server.
  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      aria-pressed={muted}
      className="flex h-7 w-7 items-center justify-center rounded-md border-2 transition"
      style={{ borderColor, color }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="3 9 3 15 8 15 13 20 13 4 8 9 3 9" fill="currentColor" stroke="none" />
        {muted ? (
          <>
            <line x1="16" y1="9" x2="22" y2="15" />
            <line x1="22" y1="9" x2="16" y2="15" />
          </>
        ) : (
          <path d="M16.5 8a5 5 0 0 1 0 8" />
        )}
      </svg>
    </button>
  );
}
