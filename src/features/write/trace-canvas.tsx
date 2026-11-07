"use client";
/**
 * A canvas with a faint letter or word to trace with a finger, pen or mouse. Owner: T12.
 * score() compares your ink with the letter shape (in the browser, display only):
 *   coverage  = how much of the letter you traced
 *   precision = how much of your ink stayed on the letter
 */
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export interface TraceHandle {
  clear(): void;
  score(): { coverage: number; precision: number };
}

type Point = { x: number; y: number }; // 0–1, relative to the canvas

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Font size that makes `text` fill the box nicely. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): number {
  let size = h * (text.length === 1 ? 0.78 : 0.6);
  ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
  const width = ctx.measureText(text).width;
  if (width > w * 0.86) size *= (w * 0.86) / width;
  return size;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, size: number) {
  ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + size * 0.04);
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Point[][], w: number, h: number, width: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  for (const s of strokes) {
    if (s.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(s[0].x * w, s[0].y * h);
    if (s.length === 1) ctx.lineTo(s[0].x * w + 0.1, s[0].y * h);
    for (const p of s.slice(1)) ctx.lineTo(p.x * w, p.y * h);
    ctx.stroke();
  }
}

export function TraceCanvas({
  text,
  label,
  onInk,
  ref,
}: {
  text: string;
  label: string;
  /** Called when the canvas goes from empty to inked or back. */
  onInk?: (hasInk: boolean) => void;
  ref?: Ref<TraceHandle>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const drawing = useRef(false);
  const size = useRef({ w: 0, h: 0, font: 0 });

  function brush() {
    return Math.max(10, size.current.font * 0.11);
  }

  function redrawInk() {
    const c = inkRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { w, h } = size.current;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = cssVar("--brand", "#1f4fd8");
    drawStrokes(ctx, strokes.current, w, h, brush());
  }

  function layout() {
    const box = boxRef.current;
    const guide = guideRef.current;
    const ink = inkRef.current;
    if (!box || !guide || !ink) return;
    const w = box.clientWidth;
    const h = Math.round(Math.min(w * 0.7, 360));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [guide, ink]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const g = guide.getContext("2d");
    if (!g) return;
    const font = fitFont(g, text, w, h);
    size.current = { w, h, font };
    g.clearRect(0, 0, w, h);
    // Baseline helper line, then the faint letter.
    g.strokeStyle = cssVar("--line", "#e2e6ef");
    g.lineWidth = 2;
    g.setLineDash([8, 8]);
    g.beginPath();
    g.moveTo(16, h / 2 + font * 0.32);
    g.lineTo(w - 16, h / 2 + font * 0.32);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = cssVar("--surface-2", "#eef1f8");
    drawText(g, text, w, h, font);
    g.lineWidth = 2;
    g.strokeStyle = cssVar("--line", "#e2e6ef");
    g.strokeText(text, w / 2, h / 2 + font * 0.04);
    redrawInk();
  }

  // New letter: clear the ink and redraw the guide. Also on resize.
  useEffect(() => {
    strokes.current = [];
    onInk?.(false);
    layout();
    const ro = new ResizeObserver(() => layout());
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relayout per text
  }, [text]);

  useImperativeHandle(ref, () => ({
    clear() {
      strokes.current = [];
      redrawInk();
      onInk?.(false);
    },
    score() {
      // Compare on a small offscreen grid: fast and forgiving.
      const scale = 0.25;
      const { w, h, font } = size.current;
      const W = Math.max(1, Math.round(w * scale));
      const H = Math.max(1, Math.round(h * scale));
      const mk = () => {
        const c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const ctx = c.getContext("2d")!;
        ctx.scale(scale, scale);
        ctx.fillStyle = "#000";
        ctx.strokeStyle = "#000";
        return ctx;
      };
      const letter = mk();
      drawText(letter, text, w, h, font);
      const nearLetter = mk(); // letter grown by a brush width: ink here counts as "on the letter"
      drawText(nearLetter, text, w, h, font);
      nearLetter.lineWidth = brush() * 1.6;
      nearLetter.lineJoin = "round";
      nearLetter.strokeText(text, w / 2, h / 2 + font * 0.04);
      const ink = mk();
      drawStrokes(ink, strokes.current, w, h, brush() * 1.3);

      const a = letter.getImageData(0, 0, W, H).data;
      const n = nearLetter.getImageData(0, 0, W, H).data;
      const k = ink.getImageData(0, 0, W, H).data;
      let letterPx = 0, covered = 0, inkPx = 0, onLetter = 0;
      for (let i = 3; i < a.length; i += 4) {
        const isLetter = a[i] > 128;
        const isInk = k[i] > 128;
        if (isLetter) {
          letterPx++;
          if (isInk) covered++;
        }
        if (isInk) {
          inkPx++;
          if (n[i] > 128) onLetter++;
        }
      }
      return { coverage: letterPx ? covered / letterPx : 0, precision: inkPx ? onLetter / inkPx : 0 };
    },
  }));

  function point(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  }

  return (
    <div ref={boxRef} className="relative w-full overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <canvas ref={guideRef} className="block" aria-hidden />
      <canvas
        ref={inkRef}
        role="img"
        aria-label={label}
        className="absolute inset-0 block cursor-crosshair touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const first = strokes.current.length === 0;
          strokes.current.push([point(e)]);
          redrawInk();
          if (first) onInk?.(true);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
          const r = e.currentTarget.getBoundingClientRect();
          const s = strokes.current[strokes.current.length - 1];
          for (const ev of events) s.push({ x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height });
          redrawInk();
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
      />
    </div>
  );
}
