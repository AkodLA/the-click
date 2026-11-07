"use client";
/**
 * Light / dark / auto switch. The choice is saved in localStorage ("snakk.theme") and applied as
 * data-theme on <html>; public/theme-init.js applies it before the page paints, so there's no flash.
 * Canvases that read colors (e.g. Write) listen for the "snakk:theme" event to redraw.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Choice = "light" | "dark" | "system";
const KEY = "snakk.theme";
export const THEME_EVENT = "snakk:theme";

const OPTIONS: { id: Choice; emoji: string; label: string }[] = [
  { id: "light", emoji: "☀️", label: "Light" },
  { id: "dark", emoji: "🌙", label: "Dark" },
  { id: "system", emoji: "🖥️", label: "Auto" },
];

function readChoice(): Choice {
  try {
    const t = window.localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** "light" | "dark" (what you see) + the saved choice, as one string for a stable snapshot. */
function snapshot(): string {
  const choice = readChoice();
  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return `${choice}:${dark ? "dark" : "light"}`;
}

function apply(choice: Choice) {
  try {
    if (choice === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, choice);
  } catch {
    // private mode: works for this page only
  }
  if (choice === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", choice);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [choice, seen] = useSyncExternalStore(subscribe, snapshot, () => "system:light").split(":") as [Choice, "light" | "dark"];
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Close the little menu when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Colour theme: ${OPTIONS.find((o) => o.id === choice)?.label}. Change`}
        title="Light or dark mode"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-line bg-surface text-base transition hover:bg-surface-2"
      >
        <span aria-hidden>{seen === "dark" ? "🌙" : "☀️"}</span>
      </button>
      {open && (
        <div role="group" aria-label="Colour theme" className="absolute right-0 top-11 z-40 flex w-40 flex-col gap-1 rounded-2xl border-2 border-line bg-surface p-1.5 shadow-[0_4px_0_var(--line)]">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={choice === o.id}
              onClick={() => {
                apply(o.id);
                setOpen(false);
              }}
              className={`flex h-10 items-center gap-2 rounded-xl px-3 text-left text-sm font-bold transition ${choice === o.id ? "bg-brand-soft text-brand" : "hover:bg-surface-2"}`}
            >
              <span aria-hidden>{o.emoji}</span>
              {o.label}
              {choice === o.id && (
                <span className="ml-auto" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
