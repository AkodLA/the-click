"use client";
/**
 * Write (/write): trace the whole alphabet (A–Å, capitals and small letters) and short words. Owner: T12.
 * Letters show a worksheet guide: numbered start dots and arrows. Tools: pen, eraser, undo, clear.
 * A good trace sends `writing_done`; the SERVER gives the XP (3 each, max 10 per day).
 * Which items you've traced is a per-device convenience in localStorage (display only, no XP).
 */
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { SaveToNotes } from "@/features/notes/save-to-notes";
import { progressActions, useProgress } from "@/lib/progress/store";
import { TraceCanvas, type TraceHandle, type TraceTool } from "./trace-canvas";
import { usePrefs } from "@/lib/personal/prefs";
import { WRITE_GROUPS, WRITE_ITEMS as ALL_ITEMS, type WriteGroup, type WriteItem } from "./write-items";

/** Mirrors RULES.writingPerDay / writingXp on the server (display only). */
const PER_DAY = 10;
const XP_EACH = 3;
const MIN_COVERAGE = 0.5;
const MIN_PRECISION = 0.55;
const NUMBERS = ["①", "②", "③", "④", "⑤", "⑥"];

// ---- traced items (localStorage, per device) ----
const KEY = "snakk.write.done.v1";
const listeners = new Set<() => void>();
function readDone(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function markDone(id: string) {
  const ids = new Set<string>(JSON.parse(readDone()) as string[]);
  ids.add(id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // private mode: fine, it's only a checkmark
  }
  listeners.forEach((l) => l());
}
function useDone(): Set<string> {
  const raw = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readDone,
    () => "[]",
  );
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function osloToday(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date());
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "nb-NO";
  u.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

type Result = { ok: boolean; stars: number; message: string } | null;

export function WriteView() {
  // T20: age-appropriate items (no alcohol words for 13–17).
  const prefs = usePrefs();
  const WRITE_ITEMS = ALL_ITEMS.filter((w) => !(w.adultOnly && prefs.ageGroup === "teen"));
  const p = useProgress();
  const done = useDone();
  const [index, setIndex] = useState(() => 0);
  const [ink, setInk] = useState({ hasInk: false, canUndo: false });
  const [tool, setTool] = useState<TraceTool>("pen");
  const [result, setResult] = useState<Result>(null);
  const [saving, setSaving] = useState(false);
  const canvas = useRef<TraceHandle>(null);
  const item = WRITE_ITEMS[index] ?? WRITE_ITEMS[0];
  const groupItems = WRITE_ITEMS.filter((w) => w.group === item.group);

  // XP-earning traces left today (the server enforces it; this only explains it).
  const usedToday = p.daily.day && p.daily.counts.writing ? (p.daily.day === osloToday() ? p.daily.counts.writing : 0) : 0;
  const xpLeft = Math.max(0, PER_DAY - usedToday);
  const doneCount = WRITE_ITEMS.filter((w) => done.has(w.id)).length;

  function go(i: number) {
    setIndex((i + WRITE_ITEMS.length) % WRITE_ITEMS.length);
    setResult(null);
    setTool("pen");
  }
  function pickGroup(group: WriteGroup) {
    const first = WRITE_ITEMS.findIndex((w) => w.group === group && !done.has(w.id));
    go(first >= 0 ? first : WRITE_ITEMS.findIndex((w) => w.group === group));
  }

  async function check() {
    const s = canvas.current?.score();
    if (!s) return;
    if (s.coverage < MIN_COVERAGE) {
      setResult({ ok: false, stars: 0, message: `Trace the whole ${item.kind}. Follow every part of the grey ${item.strokes ? "road" : "shape"}.` });
      return;
    }
    if (s.precision < MIN_PRECISION) {
      setResult({ ok: false, stars: 0, message: `Nearly! Try to stay on the grey ${item.strokes ? "road" : "shape"}. Use 🧽 to rub out the bits outside.` });
      return;
    }
    const stars = s.coverage > 0.8 && s.precision > 0.8 ? 3 : s.coverage > 0.65 ? 2 : 1;
    setResult({ ok: true, stars, message: ["", "Good start!", "Nice writing!", "Perfekt! 🤩"][stars] });
    markDone(item.id);
    if (xpLeft > 0) {
      setSaving(true);
      try {
        await progressActions.send({ type: "writing_done", itemId: item.id });
      } catch {
        // toast already shown by the store
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Write</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">The Norwegian alphabet, A to Å.</h1>
        <p className="mt-1 text-sm opacity-90">Follow the numbers and arrows, like in school. Then try short words.</p>
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.round((doneCount / WRITE_ITEMS.length) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs opacity-80">
            {doneCount} of {WRITE_ITEMS.length} traced · {xpLeft > 0 ? `XP for ${xpLeft} more today` : "Today's writing XP done, keep practising!"}
          </p>
        </div>
      </section>

      {/* Group tabs: capitals, small letters, words */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="What to write">
        {WRITE_GROUPS.map((g) => {
          const items = WRITE_ITEMS.filter((w) => w.group === g.id);
          const traced = items.filter((w) => done.has(w.id)).length;
          const active = g.id === item.group;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pickGroup(g.id)}
              className={`flex flex-col items-center rounded-2xl border-2 px-2 py-2 transition ${active ? "border-brand bg-brand-soft shadow-[0_3px_0_var(--brand-deep)]" : "border-line bg-surface shadow-[0_3px_0_var(--line)] hover:-translate-y-0.5"}`}
            >
              <span className="font-display text-xl font-bold">{g.label}</span>
              <span className="text-xs font-semibold text-muted">
                {g.hint} · {traced}/{items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Item picker for the current group */}
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10" role="group" aria-label="Choose a letter or word">
        {groupItems.map((w) => {
          const i = WRITE_ITEMS.indexOf(w);
          const active = i === index;
          const traced = done.has(w.id);
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => go(i)}
              aria-pressed={active}
              aria-label={`${w.text}${traced ? ", traced" : ""}`}
              className={`relative flex h-11 items-center justify-center rounded-xl font-display text-lg font-semibold transition ${
                w.group === "word" ? "col-span-2" : ""
              } ${active ? "bg-ink text-bg" : traced ? "border-2 border-success bg-success-soft text-success" : "border-2 border-line bg-surface hover:bg-surface-2"}`}
            >
              {w.text}
              {traced && !active && (
                <span className="absolute -right-1 -top-1 text-xs" aria-hidden>
                  ✅
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current item */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-4xl font-bold">{item.text}</p>
              <Badge tone={item.kind === "letter" ? "brand" : "accent"}>{item.kind === "letter" ? "Letter" : "Word"}</Badge>
            </div>
            <p className="text-muted">{item.meaning}</p>
            {item.kind === "word" && <SaveToNotes size="sm" className="mt-2" text={item.text} meaning={item.meaning} source="write" href="/write" />}
          </div>
          <button
            type="button"
            onClick={() => speak(item.text)}
            aria-label={`Hear «${item.text}»`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface text-xl transition hover:bg-surface-2"
          >
            <span aria-hidden>🔊</span>
          </button>
        </div>
        <p className="rounded-2xl bg-surface-2 p-3 text-sm">
          <span className="font-bold">How it sounds: </span>
          {item.sound}
        </p>

        {item.strokes && (
          <p className="rounded-2xl bg-brand-soft p-3 text-sm">
            <span className="font-bold">How to write it: </span>
            put your pen on the blue dot <b>①</b> and follow the orange arrow.
            {item.strokes.length > 1 && (
              <>
                {" "}Lift your pen, then do {NUMBERS.slice(1, item.strokes.length).join(", ")}. {item.strokes.length} strokes in total.
              </>
            )}
          </p>
        )}

        <TraceCanvas
          ref={canvas}
          text={item.text}
          strokes={item.strokes}
          tool={tool}
          label={`Trace «${item.text}» with your finger or mouse`}
          onChange={(state) => {
            setInk(state);
            if (state.hasInk) setResult(null);
          }}
        />

        {/* Tools: pen, eraser (rub out a mistake), undo (last stroke), clear (start over) */}
        <div className="grid grid-cols-4 gap-2" role="toolbar" aria-label="Writing tools">
          <ToolButton active={tool === "pen"} onClick={() => setTool("pen")} emoji="✏️" label="Pen" pressed />
          <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} emoji="🧽" label="Eraser" pressed />
          <ToolButton onClick={() => canvas.current?.undo()} emoji="↩️" label="Undo" disabled={!ink.canUndo} />
          <ToolButton
            onClick={() => {
              canvas.current?.clear();
              setResult(null);
              setTool("pen");
            }}
            emoji="🗑️"
            label="Clear"
            disabled={!ink.canUndo}
          />
        </div>

        {result && <Feedback result={result} item={item} saving={saving} gotXp={result.ok && xpLeft > 0} />}

        {result?.ok ? (
          <Button onClick={() => go(index + 1)}>Next →</Button>
        ) : (
          <Button variant="accent" onClick={check} disabled={!ink.hasInk || saving}>
            ✓ Done
          </Button>
        )}
        {!result?.ok && (
          <button type="button" onClick={() => go(index + 1)} className="h-11 text-sm font-semibold text-muted">
            Skip this one
          </button>
        )}
      </Card>

      {doneCount === WRITE_ITEMS.length && (
        <Card className="flex flex-col items-center gap-2 text-center">
          <p className="text-4xl" aria-hidden>
            🎉
          </p>
          <p className="font-bold">You can write all of them!</p>
          <p className="text-sm text-muted">Now say them out loud.</p>
          <Button href="/speak">🎙️ Speak with the tutor</Button>
        </Card>
      )}
    </div>
  );
}

function ToolButton({
  emoji,
  label,
  onClick,
  active = false,
  pressed = false,
  disabled = false,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  /** Toggle tools (pen, eraser) report their on/off state. */
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed ? active : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 text-xs font-bold transition disabled:opacity-40 ${
        active ? "border-brand bg-brand-soft text-brand shadow-[0_3px_0_var(--brand-deep)]" : "border-line bg-surface shadow-[0_3px_0_var(--line)] hover:bg-surface-2"
      }`}
    >
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      {label}
    </button>
  );
}

function Feedback({ result, item, saving, gotXp }: { result: NonNullable<Result>; item: WriteItem; saving: boolean; gotXp: boolean }) {
  if (!result.ok) {
    return (
      <p className="rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn" role="status">
        ✏️ {result.message}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-success-soft p-3" role="status">
      <p className="font-bold text-success">
        <span aria-label={`${result.stars} of 3 stars`}>{"⭐".repeat(result.stars)}</span> {result.message}
      </p>
      <p className="text-sm">{saving ? "Saving…" : gotXp ? `+${XP_EACH} XP` : "No more writing XP today, but practice still counts!"}</p>
      <ProgressBar value={result.stars / 3} tone="success" label="Trace score" />
      {item.phraseId && (
        <Link href={`/phrases?id=${item.phraseId}`} className="text-sm font-semibold text-brand">
          📖 When to say «{item.text}» →
        </Link>
      )}
    </div>
  );
}
