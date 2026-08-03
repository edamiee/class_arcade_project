"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EndSessionButton({
  sessionId,
  isOpen,
}: {
  sessionId: string;
  isOpen: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (isOpen && !confirm("End this session? Students won't be able to join with this code anymore.")) {
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ is_open: !isOpen })
      .eq("id", sessionId);
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-md border-2 px-3 py-1.5 text-sm disabled:opacity-50 ${
        isOpen
          ? "border-red-900 text-red-400 hover:border-red-600"
          : "border-slate-700 text-slate-300 hover:border-slate-500"
      }`}
    >
      {isOpen ? "End session" : "Reopen session"}
    </button>
  );
}
