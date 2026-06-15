import "server-only";

/**
 * Tiny JSON-file database for orders, customization requests and product
 * overrides. Lives in ./data (gitignored). Writes are serialized through
 * an in-process queue and use write-to-temp + rename for atomicity —
 * appropriate for a single-instance deployment (Vercel users should swap
 * this module for a hosted DB; the function signatures are the contract).
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");

let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}

const fileFor = (name: string) => path.join(DATA_DIR, `${name}.json`);

export async function readCollection<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(fileFor(name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeCollection<T>(name: string, value: T): Promise<void> {
  return serialized(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = fileFor(name) + `.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 1), "utf8");
    await fs.rename(tmp, fileFor(name)).catch(async () => {
      // Windows rename can fail if target is locked — fall back to direct write
      await fs.writeFile(fileFor(name), JSON.stringify(value, null, 1), "utf8");
      await fs.unlink(tmp).catch(() => {});
    });
  });
}

export async function updateCollection<T>(
  name: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>
): Promise<T> {
  return serialized(async () => {
    const current = await readCollection<T>(name, fallback);
    const next = await mutate(current);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = fileFor(name) + `.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 1), "utf8");
    await fs.rename(tmp, fileFor(name)).catch(async () => {
      await fs.writeFile(fileFor(name), JSON.stringify(next, null, 1), "utf8");
      await fs.unlink(tmp).catch(() => {});
    });
    return next;
  });
}

/** human-friendly order id, e.g. TG-7F3K2A */
export function generateOrderId(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let id = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) id += alphabet[bytes[i] % alphabet.length];
  return `TG-${id}`;
}
