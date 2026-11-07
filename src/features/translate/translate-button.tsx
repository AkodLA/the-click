"use client";
/**
 * 🌐 Translate button: shows an on-device translation under a piece of text (T19).
 * Uses the browser's built-in Translator (Opera Web AI / Chrome). Nothing is sent to our server.
 *
 *   <TranslateButton text="Hei, hvordan går det?" from="nb" to={p.nativeLanguage} />
 */
import { useState } from "react";
import { LANGUAGE_NAMES } from "@/lib/content";
import { translateText } from "@/lib/web-ai/translator";

type State =
  | { kind: "idle" }
  | { kind: "working"; progress: number | null }
  | { kind: "done"; text: string }
  | { kind: "error"; message: string };

export function TranslateButton({
  text,
  from,
  to,
  className = "",
}: {
  text: string;
  from: string;
  to: string;
  className?: string;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  if (from === to) return null;
  const toName = LANGUAGE_NAMES[to] ?? to;

  async function run() {
    if (state.kind === "done") {
      setState({ kind: "idle" }); // tap again to hide
      return;
    }
    setState({ kind: "working", progress: null });
    const r = await translateText(text, from, to, (loaded) => setState({ kind: "working", progress: loaded }));
    setState(r.ok ? { kind: "done", text: r.text } : { kind: "error", message: r.message });
  }

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={run}
        disabled={state.kind === "working"}
        aria-expanded={state.kind === "done"}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted underline disabled:no-underline"
      >
        <span aria-hidden>🌐</span>
        {state.kind === "working"
          ? state.progress !== null && state.progress < 1
            ? `Getting the translator… ${Math.round(state.progress * 100)}%`
            : "Translating…"
          : state.kind === "done"
            ? "Hide translation"
            : `Translate to ${toName}`}
      </button>
      {state.kind === "done" && (
        <p className="rounded-2xl bg-surface-2 px-3 py-2 text-sm" lang={to} dir="auto" aria-live="polite">
          {state.text}
          <span className="mt-0.5 block text-[11px] text-muted">On-device translation · may not be perfect</span>
        </p>
      )}
      {state.kind === "error" && (
        <p className="rounded-2xl bg-warn-soft px-3 py-2 text-xs font-semibold text-warn" role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
