"use client";
/**
 * 🌐 Translate button: shows an on-device translation under a piece of text (T19).
 * Uses the browser's built-in Translator (Opera Web AI / Chrome). Nothing is sent to our server.
 *
 *   <TranslateButton text="Hei, hvordan går det?" from="nb" to={p.nativeLanguage} />
 */
import { useState } from "react";
import { LANGUAGE_NAMES } from "@/lib/content";
import Link from "next/link";
import type { GlossaryNote } from "@/lib/web-ai/memory";
import { checkTranslation, translateText, type Confidence } from "@/lib/web-ai/translator";

type State =
  | { kind: "idle" }
  | { kind: "working"; progress: number | null }
  | { kind: "done"; text: string; via: "memory" | "device" | "same"; notes: GlossaryNote[] }
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
  const [check, setCheck] = useState<{ back: string; confidence: Confidence } | "checking" | "unavailable" | null>(null);
  if (from === to) return null;
  const toName = LANGUAGE_NAMES[to] ?? to;

  async function run() {
    if (state.kind === "done") {
      setState({ kind: "idle" }); // tap again to hide
      return;
    }
    setState({ kind: "working", progress: null });
    setCheck(null);
    const r = await translateText(text, from, to, (loaded) => setState({ kind: "working", progress: loaded }));
    setState(r.ok ? { kind: "done", text: r.text, via: r.via, notes: r.notes } : { kind: "error", message: r.message });
  }

  /** Round trip: translate back and compare, so the learner knows how much to trust it. */
  async function runCheck(translated: string) {
    setCheck("checking");
    const c = await checkTranslation(text, translated, from, to);
    setCheck(c ? { back: c.back, confidence: c.confidence } : "unavailable");
  }

  const CONF = {
    high: { label: "✅ Meaning kept", cls: "text-success" },
    medium: { label: "🟡 Mostly kept: check key words", cls: "text-warn" },
    low: { label: "⚠️ May have changed: ask to be sure", cls: "text-danger" },
  } as const;

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
        <div className="flex max-w-full flex-col gap-1.5 rounded-2xl bg-surface-2 px-3 py-2 text-sm" aria-live="polite">
          <p lang={to} dir="auto">
            {state.text}
          </p>
          {state.notes.length > 0 && (
            <ul className="flex flex-col gap-0.5 border-t border-line pt-1.5 text-xs">
              {state.notes.map((n) => (
                <li key={n.term}>
                  <span className="font-bold" lang="nb">
                    {n.term}
                  </span>
                  : {n.explain}
                </li>
              ))}
            </ul>
          )}
          <span className="text-[11px] text-muted">
            {state.via === "memory" ? "✓ Checked translation from Snakk" : "On-device translation · may not be perfect"}
            {state.via === "device" && check === null && (
              <>
                {" · "}
                <button type="button" onClick={() => runCheck(state.text)} className="font-semibold text-brand underline">
                  Check it
                </button>
              </>
            )}
          </span>
          {check === "checking" && <span className="text-[11px] text-muted">Translating back to compare…</span>}
          {check === "unavailable" && <span className="text-[11px] text-muted">Couldn&apos;t check this one.</span>}
          {check && typeof check === "object" && (
            <span className="text-[11px]">
              <span className={`font-semibold ${CONF[check.confidence].cls}`}>{CONF[check.confidence].label}</span>
              <span className="block text-muted" dir="auto">
                Back-translated: «{check.back}»
              </span>
            </span>
          )}
        </div>
      )}
      {state.kind === "error" && (
        <p className="rounded-2xl bg-warn-soft px-3 py-2 text-xs font-semibold text-warn" role="status">
          {state.message}{" "}
          <Link href="/translator" className="underline">
            Check my browser →
          </Link>
        </p>
      )}
    </div>
  );
}
