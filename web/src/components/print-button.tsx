"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
      style={{ fontFamily: "system-ui, sans-serif", boxShadow: "none" }}
    >
      Print
    </button>
  );
}
