import "server-only";
import crypto from "crypto";

// Signed, httpOnly cookie identifying a joined student — the closest thing
// students have to an "account." No Supabase Auth involved (see admin.ts):
// the payload is just trusted, HMAC-signed JSON. Anything reading this
// cookie (the /play route, attempt-writing API routes) must verify the
// signature before trusting the contents.
export interface StudentSessionPayload {
  studentId: string;
  studentName: string;
  sessionId: string;
  teamId: string | null;
  teamName: string | null;
}

export const STUDENT_SESSION_COOKIE = "student_session";

function sign(data: string) {
  const secret = process.env.STUDENT_SESSION_SECRET;
  if (!secret) {
    throw new Error("STUDENT_SESSION_SECRET is not configured on the server.");
  }
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createStudentSessionToken(
  payload: StudentSessionPayload
): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyStudentSessionToken(
  token: string
): StudentSessionPayload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}
