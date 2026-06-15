/**
 * POST /api/custom-request — receives the customization form as multipart
 * FormData, zod-validates the fields, optionally stores an uploaded logo
 * under ./data/uploads/<id>-<sanitized-name> (4 MB cap, image/PDF only),
 * appends a CustomRequest to the "custom-requests" collection and returns
 * { id } (e.g. CR-7F3K2A).
 */
import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { updateCollection } from "@/lib/db";
import type { CustomRequest } from "@/lib/types";
import {
  MAX_LOGO_BYTES,
  PRODUCT_TYPES,
} from "@/components/pdp/customization-constants";

export const runtime = "nodejs";

/** local CR-XXXXXX id helper — same alphabet style as lib/db's generateOrderId */
function generateRequestId(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let id = "";
  for (let i = 0; i < 6; i++) id += alphabet[bytes[i] % alphabet.length];
  return `CR-${id}`;
}

function normalizePhone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("Enter a valid email address").max(120).optional()
  ),
  productType: z.enum(PRODUCT_TYPES, {
    errorMap: () => ({ message: "Choose a product type" }),
  }),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(100000, "For orders this large, please call us directly"),
  message: z.string().trim().max(2000, "Message is too long").optional().default(""),
});

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const text = (key: string): string => {
    const v = form.get(key);
    return typeof v === "string" ? v : "";
  };

  const parsed = schema.safeParse({
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    productType: text("productType"),
    quantity: text("quantity"),
    message: text("message"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const id = generateRequestId();

  /* optional logo upload — duck-typed (global File is not guaranteed on Node 18) */
  const isFile = (v: FormDataEntryValue | null): v is File =>
    typeof v === "object" && v !== null && typeof (v as File).arrayBuffer === "function";

  let logoFilename: string | undefined;
  const logo = form.get("logo");
  if (isFile(logo) && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      return NextResponse.json(
        { error: "Logo file is larger than 4 MB — please compress it or share it on WhatsApp" },
        { status: 413 }
      );
    }
    const looksValid =
      logo.type.startsWith("image/") ||
      logo.type === "application/pdf" ||
      /\.pdf$/i.test(logo.name);
    if (!looksValid) {
      return NextResponse.json(
        { error: "Logo must be an image or a PDF" },
        { status: 415 }
      );
    }
    const safeName =
      path
        .basename(logo.name)
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .replace(/^[_.]+/, "")
        .slice(0, 80) || "logo";
    logoFilename = `${id}-${safeName}`;
    try {
      const dir = path.join(process.cwd(), "data", "uploads");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, logoFilename), Buffer.from(await logo.arrayBuffer()));
    } catch {
      return NextResponse.json(
        { error: "Could not store the uploaded logo — please retry, or share it on WhatsApp" },
        { status: 500 }
      );
    }
  }

  const request: CustomRequest = {
    id,
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email,
    productType: parsed.data.productType,
    quantity: parsed.data.quantity,
    message: parsed.data.message,
    logoFilename,
    createdAt: new Date().toISOString(),
    status: "new",
  };

  try {
    await updateCollection<CustomRequest[]>("custom-requests", [], (current) => [
      request,
      ...current,
    ]);
  } catch {
    return NextResponse.json(
      { error: "Could not save your request — please retry in a moment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
