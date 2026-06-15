/**
 * POST /api/admin/login — exchanges { password } for the httpOnly admin
 * session cookie. The token is a stateless HMAC of the password (see
 * @/lib/admin-auth), so changing ADMIN_PASSWORD invalidates every session.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  createSessionToken,
  verifyPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter the admin password." }, { status: 400 });
  }

  if (!verifyPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
