/**
 * POST /api/testimonial — receives a submitted client testimonial as JSON,
 * zod-validates it and emails it to the workshop.
 *
 * Nothing is stored. The JSON file store used elsewhere in this app does not
 * survive on a serverless host, and a testimonial that lands in a file nobody
 * can read is worse than one that was never accepted — so email is the single
 * delivery path, and a failure to send is reported as a failure (503) rather
 * than swallowed. The form falls back to WhatsApp on that response.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendTestimonialEmail } from "@/lib/mail";

export const runtime = "nodejs";

function normalizePhone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional()
  );

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80, "Name is too long"),
  role: optionalText(80),
  organisation: optionalText(120),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z
    .string()
    .trim()
    .min(20, "A line or two more, so it reads as a testimonial")
    .max(1200, "That is longer than we can publish — please trim it"),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("Enter a valid email address, or leave it blank").max(120).optional()
  ),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .transform(normalizePhone)
      .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"))
      .optional()
  ),
  consent: z.literal(true, {
    errorMap: () => ({ message: "We need your permission before we can publish it" }),
  }),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid submission",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const delivered = await sendTestimonialEmail({
    name: parsed.data.name,
    role: parsed.data.role ?? "",
    organisation: parsed.data.organisation ?? "",
    rating: parsed.data.rating,
    quote: parsed.data.quote,
    email: parsed.data.email ?? "",
    phone: parsed.data.phone ?? "",
    consent: parsed.data.consent,
  });

  if (!delivered) {
    return NextResponse.json(
      {
        error:
          "We could not deliver your testimonial just now. Please send it on WhatsApp so it is not lost.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
