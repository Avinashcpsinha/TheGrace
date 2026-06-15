/**
 * GET /api/admin/uploads/[name] — admin-only. Streams a logo uploaded with a
 * customization request from data/uploads/ (which lives outside /public, so it
 * is never publicly servable). The filename is reduced to its basename and
 * matched against the directory listing, so path traversal can't escape the
 * uploads folder.
 */
import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  const safe = path.basename(decodeURIComponent(name));
  const dir = path.join(process.cwd(), "data", "uploads");

  // Whitelist against the real directory listing — defence in depth.
  let listing: string[];
  try {
    listing = await fs.readdir(dir);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!listing.includes(safe)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let file: Buffer;
  try {
    file = await fs.readFile(path.join(dir, safe));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(safe).toLowerCase();
  const contentType = TYPES[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${safe}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
