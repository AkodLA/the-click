"use client";
/**
 * The "table" layout: the phone lies flat between two people.
 * Top half is upside-down for the person across the table (B), bottom half is for the phone owner (A).
 * Each side shows the conversation in ITS OWN language. Owner: T8.
 */
import { useEffect, useRef, type ReactNode } from "react";
import type { TolkLanguage, TolkTurn } from "./tolk-data";

const VISIBLE_TURNS = 3;

export function TolkTable({
  langA,
  langB,
  turns,
  status,
  controls,
  banner,
}: {
  langA: TolkLanguage;
  langB: TolkLanguage;
  turns: TolkTurn[];
  /** Short status, e.g. "Listening…". Shown on both sides. */
  status: { text: string; tone: "idle" | "listening" | "speaking" | "error" };
  controls: ReactNode;
  /** Optional strip above the controls, e.g. "Demo: sample conversation". */
  banner?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Tolk interpreter">
      {/* Both people read their own side the right way up: side by side on a laptop, stacked on a phone. */}
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-line md:flex-row md:divide-x md:divide-y-0">
        <Side lang={langA} side="a" turns={turns} status={status} />
        <Side lang={langB} side="b" turns={turns} status={status} />
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-sm">
        {banner}
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-3">{controls}</div>
      </div>
    </div>
  );
}

function Side({
  lang,
  side,
  turns,
  status,
  flipped = false,
}: {
  lang: TolkLanguage;
  side: "a" | "b";
  turns: TolkTurn[];
  status: { text: string; tone: "idle" | "listening" | "speaking" | "error" };
  flipped?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const recent = turns.slice(-VISIBLE_TURNS);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length]);

  const dot = {
    idle: "bg-muted",
    listening: "bg-success animate-pulse",
    speaking: "bg-accent animate-pulse",
    error: "bg-danger",
  }[status.tone];

  return (
    <section
      className={`flex min-h-0 flex-1 flex-col ${flipped ? "rotate-180" : ""}`}
      aria-label={`${lang.name} side`}
      lang={lang.code}
      dir={lang.rtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 pt-3">
        <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand" dir="auto">
          {lang.native}
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold text-muted" lang="en" dir="ltr">
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
          {status.text}
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-3" aria-live={side === "a" ? "polite" : "off"}>
        {recent.length === 0 ? (
          <p className="pb-6 text-center text-lg font-semibold text-muted" lang="en" dir="ltr">
            {side === "a" ? "Speak in your language. Tolk translates out loud." : "Snakk norsk eller ditt språk. Tolk oversetter høyt."}
          </p>
        ) : (
          recent.map((t, i) => <Bubble key={t.id} turn={t} side={side} latest={i === recent.length - 1} />)
        )}
        <div ref={endRef} />
      </div>
    </section>
  );
}

function Bubble({ turn, side, latest }: { turn: TolkTurn; side: "a" | "b"; latest: boolean }) {
  // Unknown speaker (agent didn't call the tool): show both texts.
  if (turn.speaker === "unknown") {
    return (
      <div className={`rounded-3xl border border-line bg-surface p-4 ${latest ? "" : "opacity-60"}`}>
        <p className="text-sm text-muted" dir="auto">
          {turn.original}
        </p>
        <p className="mt-1 text-xl font-bold" dir="auto">
          {turn.translation}
        </p>
      </div>
    );
  }
  const mine = turn.speaker === side;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-3xl p-4 ${
          mine ? "bg-surface-2 text-muted" : "border border-line bg-surface shadow-sm"
        } ${latest ? "" : "opacity-60"}`}
      >
        <p className={mine ? "text-base" : latest ? "text-2xl font-bold leading-snug" : "text-lg font-semibold"} dir="auto">
          {mine ? turn.original : turn.translation}
        </p>
      </div>
    </div>
  );
}
