"use client";
/**
 * "Your tree": a small tree that grows with the learner's total XP.
 * Seed → sprout → sapling → … → blossoming tree. Between stages it keeps growing a little,
 * so every phrase or conversation makes a visible difference. Display only: XP comes from the server.
 */
import { Card, ProgressBar } from "@/components/ui";
import { useProgress } from "@/lib/progress/store";

const STAGES = [
  { min: 0, name: "Seed", emoji: "🌰", hint: "Learn a phrase to plant it." },
  { min: 5, name: "Sprout", emoji: "🌱", hint: "It's alive! Keep practising." },
  { min: 30, name: "Sapling", emoji: "🌿", hint: "Growing roots in Norwegian." },
  { min: 80, name: "Young tree", emoji: "🪴", hint: "Branching out nicely." },
  { min: 160, name: "Tree", emoji: "🌳", hint: "Strong and steady." },
  { min: 300, name: "Grand tree", emoji: "🌲", hint: "Almost in full bloom." },
  { min: 500, name: "Blossoming tree", emoji: "🌸", hint: "Fully grown. Keep your streak to keep it blooming!" },
] as const;

const FULL_XP = STAGES[STAGES.length - 1].min;

// Leaf clusters of the fully grown tree; each appears at its stage.
const CANOPY = [
  { cx: 60, cy: 44, r: 20, stage: 2 },
  { cx: 44, cy: 54, r: 13, stage: 3 },
  { cx: 76, cy: 54, r: 13, stage: 3 },
  { cx: 48, cy: 34, r: 14, stage: 4 },
  { cx: 72, cy: 34, r: 14, stage: 4 },
  { cx: 60, cy: 24, r: 14, stage: 5 },
  { cx: 36, cy: 44, r: 10, stage: 5 },
  { cx: 84, cy: 44, r: 10, stage: 5 },
];
const BLOSSOMS = [
  [50, 40],
  [68, 30],
  [78, 50],
  [42, 56],
  [62, 52],
  [56, 22],
  [36, 42],
  [84, 42],
];

function stageFor(xp: number) {
  let i = 0;
  while (i < STAGES.length - 1 && xp >= STAGES[i + 1].min) i++;
  return i;
}

export function TreeArt({ xp, className }: { xp: number; className?: string }) {
  const stage = stageFor(xp);
  // From sapling on, the whole tree scales up smoothly towards full size.
  const scale = 0.45 + 0.55 * Math.min(1, Math.max(0, (xp - STAGES[2].min) / (FULL_XP - STAGES[2].min)));
  const grow = { transformBox: "view-box", transformOrigin: "60px 108px", transform: `scale(${scale})` } as const;

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <ellipse cx="60" cy="109" rx="34" ry="5" className="fill-success-soft" />

      {stage === 0 && (
        <g style={{ ...grow, transform: "scale(1.7)" }}>
          <path d="M48 109 Q60 98 72 109 Z" className="fill-wood opacity-40" />
          <ellipse cx="60" cy="103" rx="5" ry="3.5" className="fill-wood" />
        </g>
      )}

      {stage === 1 && (
        <g style={{ ...grow, transform: "scale(1.6)" }}>
          <path d="M60 108 C60 102 60 97 60 92" className="stroke-success" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M60 97 C54 95 50 91 50 86 C56 86 60 90 60 97 Z" className="fill-success" />
          <path d="M60 94 C66 92 70 88 70 83 C64 83 60 87 60 94 Z" className="fill-success opacity-80" />
        </g>
      )}

      {stage >= 2 && (
        <g style={grow} className="transition-transform duration-700 ease-out">
          <path d="M55 108 C57 90 57 75 58 56 L62 56 C63 75 63 90 65 108 Z" className="fill-wood" />
          <path d="M59 80 C52 74 46 70 40 67" className={`stroke-wood transition-opacity duration-700 ${stage >= 3 ? "opacity-100" : "opacity-0"}`} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M61 72 C68 66 74 63 80 61" className={`stroke-wood transition-opacity duration-700 ${stage >= 3 ? "opacity-100" : "opacity-0"}`} strokeWidth="3" strokeLinecap="round" fill="none" />
          {CANOPY.map((c, i) => (
            <circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              className={`fill-success transition-opacity duration-700 ${stage >= c.stage ? (i % 2 ? "opacity-85" : "opacity-100") : "opacity-0"}`}
            />
          ))}
          {BLOSSOMS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.2" className={`fill-accent transition-opacity duration-700 ${stage >= 6 ? "opacity-100" : "opacity-0"}`} />
          ))}
        </g>
      )}
    </svg>
  );
}

export function ProgressTree() {
  const { xp } = useProgress();
  const stage = stageFor(xp);
  const current = STAGES[stage];
  const next = STAGES[stage + 1];
  const ratio = next ? (xp - current.min) / (next.min - current.min) : 1;

  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-28 w-28 shrink-0 items-end justify-center rounded-2xl bg-success-soft/60">
        <TreeArt xp={xp} className="h-28 w-28" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-muted">Your tree</p>
        <p className="text-xl font-black">
          {current.emoji} {current.name}
        </p>
        <p className="text-sm text-muted">{current.hint}</p>
        <div className="mt-3">
          <ProgressBar value={ratio} tone="success" label={next ? `Growth to ${next.name}` : "Fully grown"} />
          <p className="mt-1 text-xs font-semibold text-muted">
            {next ? `${next.min - xp} XP until it becomes a ${next.name.toLowerCase()}` : "🌸 Fully grown"} · Stage {stage + 1} of {STAGES.length}
          </p>
        </div>
      </div>
    </Card>
  );
}
