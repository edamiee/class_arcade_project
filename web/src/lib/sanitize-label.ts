// AI-generated week labels sometimes come back with a numbering prefix
// ("Week 1: The Water Cycle", "Q3 - Photosynthesis", "1. Intro") even when
// the prompt asks it not to — relying on instruction-following alone isn't
// reliable, so strip it deterministically before it ever reaches the DB.
// These numbers would otherwise show up in the week/topic dropdown on the
// launch-session screen and anywhere else the week's label is displayed.
const LEADING_NUMBERING =
  /^(?:(?:week|unit|topic|module|section|chapter|lesson|q(?:uestion)?)\s*#?\s*\d+\s*[:.\-–—)]\s*|\d+\s*[:.\-–—)]\s*)/i;

export function stripLeadingNumbering(label: string): string {
  let out = label.trim();
  let prev: string;
  do {
    prev = out;
    out = out.replace(LEADING_NUMBERING, "").trim();
  } while (out !== prev && out.length > 0);
  return out || label.trim();
}
