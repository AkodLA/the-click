"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { addXp, unlock, useProgress } from "@/lib/progress";

// Trace a letter or word over a faint guide. We score how much of the guide your strokes cover.
const ITEMS = [
  { text: "æ", word: "bær", hint: "Som «a» i engelske «cat»" },
  { text: "ø", word: "øl", hint: "Si «e» med runde lepper" },
  { text: "å", word: "båt", hint: "Som «o» i engelske «more»" },
  { text: "hei", word: "hei", hint: "Den første hilsenen" },
  { text: "takk", word: "takk", hint: "Det viktigste ordet" },
];

const SIZE = 320;

export default function SkrivPage() {
  const p = useProgress();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const guide = useRef<Uint8ClampedArray | null>(null);
  const drawing = useRef(false);
  const item = ITEMS[idx];

  const fontFor = (t: string) => `700 ${t.length === 1 ? 220 : t.length <= 3 ? 130 : 100}px "Atkinson Hyperlegible", sans-serif`;

  // Build the guide mask off-screen so we can compare it with the learner's strokes.
  const reset = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const off = document.createElement("canvas");
    off.width = off.height = SIZE;
    const o = off.getContext("2d")!;
    o.font = fontFor(item.text);
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillStyle = "#000";
    o.fillText(item.text, SIZE / 2, SIZE / 2 + 10);
    guide.current = o.getImageData(0, 0, SIZE, SIZE).data;
    setScore(null);
  }, [item]);

  useEffect(() => {
    // Wait for the web font so the guide matches what the learner sees.
    void document.fonts?.ready.then(reset);
    reset();
  }, [reset]);

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  };
  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    canvas.current!.setPointerCapture(e.pointerId);
    const ctx = canvas.current!.getContext("2d")!;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f6e5a";
    ctx.lineWidth = 16;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.stroke();
  };
  const up = () => (drawing.current = false);

  function check() {
    const ink = canvas.current!.getContext("2d")!.getImageData(0, 0, SIZE, SIZE).data;
    const g = guide.current;
    if (!g) return;
    let inGuide = 0;
    let covered = 0;
    let stray = 0;
    for (let i = 3; i < g.length; i += 16) {
      const isGuide = g[i] > 100;
      const isInk = ink[i] > 100;
      if (isGuide) {
        inGuide++;
        if (isInk) covered++;
      } else if (isInk) stray++;
    }
    const pct = Math.max(0, Math.round((covered / Math.max(inGuide, 1)) * 100 - (stray / Math.max(inGuide, 1)) * 25));
    setScore(pct);
    if (pct >= 60 && !done.includes(item.text)) {
      const next = [...done, item.text];
      setDone(next);
      addXp(15, `skrev «${item.text}»`);
      if (["æ", "ø", "å"].every((l) => next.includes(l))) unlock("aeoa", "Æ, ø og å");
    }
  }

  return (
    <AppShell title="Skriv" back="/">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ITEMS.map((it, i) => (
          <button
            key={it.text}
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            className={`shrink-0 rounded-full px-4 py-2 text-lg font-bold ${i === idx ? "bg-ink text-white" : "bg-sheet"}`}
          >
            {it.text} {done.includes(it.text) && "✓"}
          </button>
        ))}
      </div>

      <p className="mt-4 text-ink-soft">
        Følg den lyse bokstaven med fingeren. {item.hint}, som i <b className="text-ink">{item.word}</b>.
      </p>

      <div className="relative mx-auto mt-4 aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl bg-sheet">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center text-line"
          style={{ font: fontFor(item.text), transform: "translateY(10px)" }}
        >
          {item.text}
        </span>
        <canvas
          ref={canvas}
          width={SIZE}
          height={SIZE}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="absolute inset-0 h-full w-full touch-none"
          aria-label={`Tegneflate for «${item.text}»`}
        />
      </div>

      {score !== null && (
        <p className={`pop mt-4 text-center text-xl font-bold ${score >= 60 ? "text-gran" : "text-tytte"}`}>
          {score >= 60 ? `Fint! ${score} % treff.` : `${score} % treff. Prøv å følge formen tettere.`}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={reset} className="rounded-2xl bg-sheet py-3 font-bold">
          Visk ut
        </button>
        <button onClick={check} className="rounded-2xl bg-gran py-3 font-bold text-white">
          Sjekk
        </button>
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">{p.achievements.includes("aeoa") ? "Du har merket «Æ, ø og å» 🏅" : "Skriv æ, ø og å for å få et merke."}</p>
    </AppShell>
  );
}
