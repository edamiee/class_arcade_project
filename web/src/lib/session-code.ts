// Kahoot-style join codes: short, spoken-aloud-friendly. Excludes visually
// ambiguous characters (0/O, 1/I/L) since a teacher reads this off a
// projector and students type it on a phone.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateSessionCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}
