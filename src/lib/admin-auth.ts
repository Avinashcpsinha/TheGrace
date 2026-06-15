import "server-only";

/**
 * Admin session auth for The Grace dashboard.
 *
 * Session token = HMAC-SHA256 of the literal string "tg-admin", keyed by
 * ADMIN_PASSWORD (hex digest). Stateless: verifying simply recomputes the
 * HMAC and compares in constant time, so changing the password invalidates
 * every existing session. The token travels in the httpOnly "tg_admin"
 * cookie set by /api/admin/login.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "tg_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "grace-admin-2026";
}

/** HMAC-SHA256("tg-admin") keyed by the admin password, hex-encoded. */
export function createSessionToken(): string {
  return crypto.createHmac("sha256", adminPassword()).update("tg-admin").digest("hex");
}

/**
 * Constant-time equality. Both sides are hashed to a fixed length first so
 * timingSafeEqual never throws on attacker-controlled input lengths.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  return safeEqual(token, createSessionToken());
}

/** Used by /api/admin/login to check the submitted password. */
export function verifyPassword(input: string): boolean {
  return safeEqual(input, adminPassword());
}

/**
 * True when the current request carries a valid admin session cookie.
 * Usage in every admin page: `if (!(await requireAdmin())) redirect("/admin/login")`.
 * Usage in every /api/admin route: 401 when false.
 */
export async function requireAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}
