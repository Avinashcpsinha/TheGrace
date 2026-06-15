"use client";

/**
 * PDP details accordion (client) — smooth height via the grid-template-rows
 * 0fr→1fr technique (compositor-friendly, no JS measurement), gold plus
 * rotating to a cross (transform only). Closed panels are `invisible` so
 * their content leaves the focus order and accessibility tree. Global
 * prefers-reduced-motion CSS collapses all transitions to instant.
 */

import { useId, useState, type ReactNode } from "react";

export interface AccordionItem {
  title: string;
  content: ReactNode;
}

export function Accordion({
  items,
  className = "",
}: {
  items: AccordionItem[];
  className?: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className={`divide-y divide-line border-y border-line ${className}`}>
      {items.map((item, i) => {
        const open = openIdx === i;
        const btnId = `${baseId}-acc-btn-${i}`;
        const panelId = `${baseId}-acc-panel-${i}`;
        return (
          <div key={item.title}>
            <h3>
              <button
                type="button"
                id={btnId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-sm font-medium tracking-wide text-ivory transition-colors duration-300 hover:text-champagne"
              >
                {item.title}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className={`shrink-0 text-gold transition-transform duration-500 ease-[var(--ease-lux)] will-change-transform ${
                    open ? "rotate-45" : ""
                  }`}
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-lux)]"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className={`overflow-hidden ${open ? "visible" : "invisible"}`}>
                <div
                  className={`pb-5 text-sm leading-relaxed text-muted transition-opacity duration-500 ease-[var(--ease-lux)] ${
                    open ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
