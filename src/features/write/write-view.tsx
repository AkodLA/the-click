"use client";
/**
 * Write (/write): trace æ, ø, å and short words. Owner: T12.
 * A good trace sends `writing_done`; the SERVER gives the XP (3 each, max 10 per day).
 * Which items you've traced is a per-device convenience in localStorage (display only, no XP).
 */
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { progressActions, useProgress } from "@/lib/progress/store";
import { TraceCanvas, type TraceHandle } from "./trace-canvas";
import { WRITE_ITEMS, type WriteItem } from "./write-items";

/** Mirrors RULES.writingPerDay / writingXp on the server (display only). */
const PER_DAY = 10;
const XP_EACH = 3;
const MIN_COVERAGE = 0.5;
const MIN_PRECISION = 0.55;

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
  const p = useProgress();
  const done = useDone();
  const [index, setIndex] = useState(() => 0);
  const [hasInk, setHasInk] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [saving, setSaving] = useState(false);
  const canvas = useRef<TraceHandle>(null);
  const item = WRITE_ITEMS[index];

  // XP-earning traces left today (the server enforces it; this only explains it).
  const usedToday = p.daily.day && p.daily.counts.writing ? (p.daily.day === osloToday() ? p.daily.counts.writing : 0) : 0;
  const xpLeft = Math.max(0, PER_DAY - usedToday);
  const doneCount = WRITE_ITEMS.filter((w) => done.has(w.id)).length;

  function go(i: number) {
    setIndex((i + WRITE_ITEMS.length) % WRITE_ITEMS.length);
    setResult(null);
  }

  async function check() {
    const s = canvas.current?.score();
    if (!s) return;
    if (s.coverage < MIN_COVERAGE) {
      setResult({ ok: false, stars: 0, message: `Trace the whole ${item.kind}. Follow every part of the grey shape.` });
      return;
    }
    if (s.precision < MIN_PRECISION) {
      setResult({ ok: false, stars: 0, message: "Nearly! Try to stay on the grey shape." });
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
        <h1 className="mt-1 text-3xl font-black leading-tight">Æ, ø, å and your first words.</h1>
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.round((doneCount / WRITE_ITEMS.length) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs opacity-80">
            {doneCount} of {WRITE_ITEMS.length} traced · {xpLeft > 0 ? `XP for ${xpLeft} more today` : "Today's writing XP done, keep practising!"}
          </p>
        </div>
      </section>

      {/* Item picker */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Choose a letter or word">
        {WRITE_ITEMS.map((w, i) => (
          <button
            key={w.id}
            type="button"
            onClick={() => go(i)}
            aria-pressed={i === index}
            aria-label={`${w.text}${done.has(w.id) ? ", traced" : ""}`}
            className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-full px-4 text-base font-bold transition ${
              i === index ? "bg-ink text-bg" : done.has(w.id) ? "border border-success bg-success-soft text-success" : "border border-line bg-surface"
            }`}
          >
            {w.text}
            {done.has(w.id) && i !== index && <span aria-hidden>✓</span>}
          </button>
        ))}
      </div>

      {/* Current item */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-black">{item.text}</p>
              <Badge tone={item.kind === "letter" ? "brand" : "accent"}>{item.kind === "letter" ? "Letter" : "Word"}</Badge>
            </div>
            <p className="text-muted">{item.meaning}</p>
          </div>
          <button
            type="button"
            onClick={() => speak(item.text)}
            aria-label={`Hear «${item.text}»`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xl transition hover:bg-surface-2"
          >
            <span aria-hidden>🔊</span>
          </button>
        </div>
        <p className="rounded-2xl bg-surface-2 p-3 text-sm">
          <span className="font-bold">How it sounds: </span>
          {item.sound}
        </p>

        <TraceCanvas
          ref={canvas}
          text={item.text}
          label={`Trace «${item.text}» with your finger or mouse`}
          onInk={(ink) => {
            setHasInk(ink);
            if (ink) setResult(null);
          }}
        />

        {result && <Feedback result={result} item={item} saving={saving} gotXp={result.ok && xpLeft > 0} />}

        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" onClick={() => { canvas.current?.clear(); setResult(null); }} disabled={!hasInk}>
            Clear
          </Button>
          {result?.ok ? (
            <Button className="col-span-2" onClick={() => go(index + 1)}>
              Next →
            </Button>
          ) : (
            <Button className="col-span-2" variant="accent" onClick={check} disabled={!hasInk || saving}>
              ✓ Done
            </Button>
          )}
        </div>
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
