"use client";

/**
 * Commerce-area localStorage helpers (client-only, device-scoped).
 *
 *  tg-addresses-v1 — delivery addresses saved at checkout / managed in /account
 *  tg-orders-v1    — order ids placed from this browser (newest first)
 */

export interface SavedAddress {
  id: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
}

export const ADDRESSES_KEY = "tg-addresses-v1";
export const ORDERS_KEY = "tg-orders-v1";

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) — degrade silently */
  }
}

export function readAddresses(): SavedAddress[] {
  const list = safeRead<SavedAddress[]>(ADDRESSES_KEY, []);
  return Array.isArray(list)
    ? list.filter(
        (a): a is SavedAddress =>
          !!a && typeof a.id === "string" && typeof a.line === "string"
      )
    : [];
}

export function writeAddresses(list: SavedAddress[]): void {
  safeWrite(ADDRESSES_KEY, list);
}

export function newAddressId(): string {
  return `addr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readOrderIds(): string[] {
  const list = safeRead<string[]>(ORDERS_KEY, []);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
}

/** Append an order id (newest first), deduped case-insensitively. */
export function rememberOrderId(id: string): void {
  const current = readOrderIds();
  const next = [id, ...current.filter((x) => x.toUpperCase() !== id.toUpperCase())].slice(0, 100);
  safeWrite(ORDERS_KEY, next);
}
