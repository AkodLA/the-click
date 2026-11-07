"use client";
/**
 * A canvas with a faint letter or word to trace with a finger, pen or mouse. Owner: T12.
 * Letters with `strokes` get a handwriting-worksheet guide: lined paper, a "road" per stroke,
 * a numbered dot where each stroke starts (① first) and an arrow showing which way to go.
 * Words fall back to a faint font outline.
 * Tools: pen and eraser (rubs out only where you wipe); undo removes the last stroke or wipe.
 * score() compares your ink with the letter shape (in the browser, display only):
 *   coverage  = how much of the letter you traced
 *   precision = how much of your ink stayed on the letter
 */
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { THEME_EVENT } from "@/components/theme-toggle";

export type TraceTool = "pen" | "eraser";

export interface TraceHandle {
  clear(): void;
  undo(): void;
  score(): { coverage: number; precision: number };
}

type Point = { x: number; y: number }; // 0–1, relative to the canvas
type InkStroke = { erase: boolean; points: Point[] };

/** Width of the stroke "road" in guide units (the letter box is 100×100). */
const ROAD = 11;

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

/** Where the 100×100 letter box sits on a w×h canvas. */
function guideBox(w: number, h: number) {
  const s = Math.min(h * 0.94, w * 0.9);
  return { ox: (w - s) / 2, oy: (h - s) / 2, k: s / 100 };
}

/** Stroke the letter's paths in box units (call inside a transform). */
function strokePaths(ctx: CanvasRenderingContext2D, paths: string[], width: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  for (const d of paths) ctx.stroke(new Path2D(d));
}

function inBox(ctx: CanvasRenderingContext2D, w: number, h: number, draw: () => void) {
  const { ox, oy, k } = guideBox(w, h);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(k, k);
  draw();
  ctx.restore();
}

/** Start point and a direction arrow for each stroke, measured with an (invisible) SVG path. */
function strokeMarkers(paths: string[]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  document.body.appendChild(svg);
  try {
    return paths.map((d) => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("d", d);
      svg.appendChild(el);
      const len = el.getTotalLength();
      const start = el.getPointAtLength(0);
      // Fallback spots a little way along the stroke, for when another number already sits on the start.
      const along = [11, 18].map((d) => el.getPointAtLength(Math.min(len, d)));
      if (len < 3) return { start, along, arrow: null }; // a dot: no direction
      const t = Math.min(len * 0.45, Math.max(14, len * 0.3));
      const a = el.getPointAtLength(t - 1);
      const b = el.getPointAtLength(t + 1);
      return { start, along, arrow: { x: b.x, y: b.y, angle: Math.atan2(b.y - a.y, b.x - a.x) } };
    });
  } finally {
    svg.remove();
  }
}

function drawInk(ctx: CanvasRenderingContext2D, strokes: InkStroke[], w: number, h: number, pen: number, eraser: number, color: string) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  for (const s of strokes) {
    if (s.points.length === 0) continue;
    ctx.globalCompositeOperation = s.erase ? "destination-out" : "source-over";
    ctx.lineWidth = s.erase ? eraser : pen;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x * w, s.points[0].y * h);
    if (s.points.length === 1) ctx.lineTo(s.points[0].x * w + 0.1, s.points[0].y * h);
    for (const p of s.points.slice(1)) ctx.lineTo(p.x * w, p.y * h);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

export function TraceCanvas({
  text,
  strokes: guide,
  label,
  tool = "pen",
  onChange,
  ref,
}: {
  text: string;
  /** Stroke-by-stroke guide for letters; without it the text is drawn as a faint outline. */
  strokes?: string[];
  label: string;
  tool?: TraceTool;
  /** Called whenever the ink changes: is there pen ink, and is there anything to undo. */
  onChange?: (state: { hasInk: boolean; canUndo: boolean }) => void;
  ref?: Ref<TraceHandle>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<InkStroke[]>([]);
  const drawing = useRef(false);
  const size = useRef({ w: 0, h: 0, font: 0 });

  function brush() {
    const { w, h, font } = size.current;
    return guide ? Math.max(8, ROAD * guideBox(w, h).k * 0.75) : Math.max(10, font * 0.11);
  }
  const eraserWidth = () => brush() * 2.4;

  function notify() {
    onChange?.({ hasInk: strokes.current.some((s) => !s.erase), canUndo: strokes.current.length > 0 });
  }

  function redrawInk() {
    const c = inkRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;
    const { w, h } = size.current;
    ctx.clearRect(0, 0, w, h);
    drawInk(ctx, strokes.current, w, h, brush(), eraserWidth(), cssVar("--brand", "#1f7acc"));
  }

  function drawGuide(g: CanvasRenderingContext2D, w: number, h: number, paths: string[]) {
    const line = cssVar("--line", "#c3def3");
    const muted = cssVar("--muted", "#56677f");
    const road = cssVar("--surface-2", "#eef7ff");
    const brand = cssVar("--brand", "#1f7acc");
    const brandInk = cssVar("--brand-ink", "#ffffff");
    const accent = cssVar("--accent", "#e0522b");
    const { ox, oy, k } = guideBox(w, h);
    const Y = (y: number) => oy + y * k;

    // School paper: top line, dotted middle line for small letters, solid baseline.
    g.strokeStyle = line;
    g.lineWidth = 2;
    for (const [y, dash] of [[12, [10, 8]], [45, [3, 7]], [80, []]] as const) {
      g.setLineDash([...dash]);
      g.beginPath();
      g.moveTo(12, Y(y));
      g.lineTo(w - 12, Y(y));
      g.stroke();
    }
    g.setLineDash([]);

    inBox(g, w, h, () => {
      // The "road" for each stroke: outlined, then filled, then a dashed centre line to follow.
      g.strokeStyle = line;
      strokePaths(g, paths, ROAD + 2.5);
      g.strokeStyle = road;
      strokePaths(g, paths, ROAD);
      g.strokeStyle = muted;
      g.globalAlpha = 0.45;
      g.setLineDash([2.5, 3]);
      strokePaths(g, paths, 0.9);
      g.setLineDash([]);
      g.globalAlpha = 1;
    });

    // Arrows (which way to go) and numbered start dots (where to put the pen down).
    const markers = strokeMarkers(paths);
    const placed: { x: number; y: number }[] = [];
    markers.forEach(({ arrow }) => {
      if (!arrow) return;
      g.save();
      g.translate(ox + arrow.x * k, oy + arrow.y * k);
      g.rotate(arrow.angle);
      g.fillStyle = accent;
      g.beginPath();
      g.moveTo(4.5 * k, 0);
      g.lineTo(-3 * k, -3.5 * k);
      g.lineTo(-3 * k, 3.5 * k);
      g.closePath();
      g.fill();
      g.restore();
    });
    markers.forEach(({ start, along }, i) => {
      // Two strokes starting at the same spot (A, B, E…): move the later number a bit along its own stroke.
      const free = (p: { x: number; y: number }) => !placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 9);
      const { x, y } = [start, ...along].find(free) ?? start;
      placed.push({ x, y });
      const cx = ox + x * k;
      const cy = oy + y * k;
      const r = 5.6 * k;
      g.fillStyle = brand;
      g.strokeStyle = cssVar("--surface", "#ffffff");
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = brandInk;
      g.font = `700 ${7 * k}px ui-rounded, ui-sans-serif, system-ui, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(i + 1), cx, cy + 0.4 * k);
    });
  }

  function layout() {
    const box = boxRef.current;
    const guideCanvas = guideRef.current;
    const ink = inkRef.current;
    if (!box || !guideCanvas || !ink) return;
    const w = box.clientWidth;
    const h = Math.round(Math.min(w * 0.75, 380));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [guideCanvas, ink]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const g = guideCanvas.getContext("2d");
    if (!g) return;
    const font = fitFont(g, text, w, h);
    size.current = { w, h, font };
    g.clearRect(0, 0, w, h);
    if (guide) {
      drawGuide(g, w, h, guide);
    } else {
      // Words: baseline helper line, then the faint text.
      g.strokeStyle = cssVar("--line", "#c3def3");
      g.lineWidth = 2;
      g.setLineDash([8, 8]);
      g.beginPath();
      g.moveTo(16, h / 2 + font * 0.32);
      g.lineTo(w - 16, h / 2 + font * 0.32);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = cssVar("--surface-2", "#eef7ff");
      drawText(g, text, w, h, font);
      g.lineWidth = 2;
      g.strokeStyle = cssVar("--line", "#c3def3");
      g.strokeText(text, w / 2, h / 2 + font * 0.04);
    }
    redrawInk();
  }

  // New letter: clear the ink and redraw the guide. Also on resize.
  useEffect(() => {
    strokes.current = [];
    notify();
    layout();
    const ro = new ResizeObserver(() => layout());
    if (boxRef.current) ro.observe(boxRef.current);
    // Light/dark switch or device theme change: redraw with the new colors.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const relayout = () => layout();
    window.addEventListener(THEME_EVENT, relayout);
    media.addEventListener("change", relayout);
    return () => {
      ro.disconnect();
      window.removeEventListener(THEME_EVENT, relayout);
      media.removeEventListener("change", relayout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relayout per text
  }, [text]);

  useImperativeHandle(ref, () => ({
    clear() {
      strokes.current = [];
      redrawInk();
      notify();
    },
    undo() {
      strokes.current = strokes.current.slice(0, -1);
      redrawInk();
      notify();
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
      const nearLetter = mk(); // letter grown by a brush width: ink here counts as "on the letter"
      if (guide) {
        const k = guideBox(w, h).k;
        inBox(letter, w, h, () => strokePaths(letter, guide, ROAD));
        inBox(nearLetter, w, h, () => strokePaths(nearLetter, guide, ROAD + (brush() * 1.6) / k));
      } else {
        drawText(letter, text, w, h, font);
        drawText(nearLetter, text, w, h, font);
        nearLetter.lineWidth = brush() * 1.6;
        nearLetter.lineJoin = "round";
        nearLetter.strokeText(text, w / 2, h / 2 + font * 0.04);
      }
      const ink = mk();
      drawInk(ink, strokes.current, w, h, brush() * 1.3, eraserWidth(), "#000");

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
    <div ref={boxRef} className="relative w-full overflow-hidden rounded-3xl border-2 border-line bg-surface shadow-[0_4px_0_var(--line)]">
      <canvas ref={guideRef} className="block" aria-hidden />
      <canvas
        ref={inkRef}
        role="img"
        aria-label={label}
        className={`absolute inset-0 block touch-none ${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          strokes.current.push({ erase: tool === "eraser", points: [point(e)] });
          redrawInk();
          notify();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
          const r = e.currentTarget.getBoundingClientRect();
          const s = strokes.current[strokes.current.length - 1];
          for (const ev of events) s.points.push({ x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height });
          redrawInk();
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
      />
    </div>
  );
}
