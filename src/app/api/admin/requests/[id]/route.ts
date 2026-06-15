/**
 * PATCH /api/admin/requests/[id] — admin-only. Moves a customization request
 * through new → quoted → closed. Returns { request }.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { CustomRequest } from "@/lib/types";
import { requireAdmin } from "@/lib/admin-auth";
import { updateCollection } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({ status: z.enum(["new", "quoted", "closed"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let updated: CustomRequest | undefined;
  await updateCollection<CustomRequest[]>("custom-requests", [], (current) =>
    current.map((r) => {
      if (r.id.toUpperCase() !== id.toUpperCase()) return r;
      updated = { ...r, status: parsed.data.status };
      return updated;
    })
  );

  if (!updated) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  return NextResponse.json({ request: updated });
}
