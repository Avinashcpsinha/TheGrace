"use client";

/**
 * ThemeSwitcher — a compact row of four colour swatches that re-skins the
 * whole site on click (see lib/theme.ts). Multiple instances stay in sync
 * via the tg:theme event, so the copies in the header, mobile menu and
 * landing intro all reflect the same choice.
 */

import { useEffect, useState } from "react";
import {
  THEMES,
  DEFAULT_THEME,
  EV_THEME,
  getStoredTheme,
  applyTheme,
  type ThemeId,
} from "@/lib/theme";

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  // start at the default so SSR and first client render match; the stored
  // choice is read in the effect below (and applied pre-paint in layout).
  const [active, setActive] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    setActive(getStoredTheme());
    const onTheme = (e: Event) => {
      const id = (e as CustomEvent<{ id: ThemeId }>).detail?.id;
      if (id) setActive(id);
    };
    window.addEventListener(EV_THEME, onTheme);
    return () => window.removeEventListener(EV_THEME, onTheme);
  }, []);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={`flex items-center gap-2 rounded-full border border-gold/20 bg-ink-2/70 px-2.5 py-1.5 backdrop-blur-md ${className}`}
    >
      {THEMES.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTheme(t.id)}
            aria-pressed={on}
            aria-label={t.label}
            title={t.label}
            className={`relative grid h-5 w-5 cursor-pointer place-items-center rounded-full transition-transform duration-200 hover:scale-110 ${
              on ? "ring-2 ring-gold" : "ring-1 ring-white/20 hover:ring-gold/50"
            }`}
            style={{ background: t.bg }}
          >
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{ background: t.gold }}
            />
          </button>
        );
      })}
    </div>
  );
}
