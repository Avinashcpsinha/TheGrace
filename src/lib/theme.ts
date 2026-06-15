/**
 * Mood themes — runtime-switchable colour palettes.
 *
 * The whole site is painted from CSS custom properties (see the @theme
 * block in globals.css). Each theme below just re-points those variables
 * via a `:root[data-theme="<id>"]` block, so switching is instant and
 * every component follows automatically. The choice is persisted to
 * localStorage and applied before paint by a small script in layout.tsx.
 */

export interface ThemeMeta {
  id: string;
  label: string;
  /** swatch hint colours for the picker */
  bg: string;
  gold: string;
}

export const THEMES = [
  { id: "onyx", label: "Onyx & Champagne", bg: "#0b0b0d", gold: "#d4af37" },
  { id: "ivory", label: "Ivory & Gold", bg: "#f7f3ea", gold: "#b8902e" },
  { id: "emerald", label: "Emerald & Gold", bg: "#0c2a22", gold: "#c5a253" },
  { id: "navy", label: "Royal Navy & Gold", bg: "#0e1a2b", gold: "#cba135" },
] as const satisfies readonly ThemeMeta[];

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "onyx";
export const THEME_KEY = "tg-theme";
export const EV_THEME = "tg:theme";

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && THEMES.some((t) => t.id === v);
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return isThemeId(v) ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Apply a theme everywhere: <html data-theme>, persist, and broadcast. */
export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  try {
    window.localStorage.setItem(THEME_KEY, id);
  } catch {
    /* storage may be unavailable (private mode) — theme still applies */
  }
  window.dispatchEvent(new CustomEvent(EV_THEME, { detail: { id } }));
}
