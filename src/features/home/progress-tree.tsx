"use client";
/**
 * "Your tree": a small tree that grows with the learner's total XP.
 * Seed → sprout → sapling → … → blossoming tree. Between stages it keeps growing a little,
 * so every phrase or conversation makes a visible difference.
 * Left alone it gets thirsty, then wilts and shrinks; one practice brings it straight back.
 * Display only: XP and lastActiveDay come from the server-signed progress, and no XP is ever taken away.
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
/** Days without practice before the tree gets thirsty, and before it starts to shrink (one stage per extra day). */
const THIRSTY_AFTER_DAYS = 2;
const SHRINK_AFTER_DAYS = 3;

export type TreeHealth = "healthy" | "thirsty" | "wilted";

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

/** YYYY-MM-DD in Oslo, the same day the server uses for lastActiveDay. */
function osloToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(new Date());
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** How the tree looks after `daysAway` days without practice. Never shrinks below a sprout. */
export function treeState(xp: number, daysAway: number) {
  const grown = stageFor(xp);
  const health: TreeHealth = daysAway >= SHRINK_AFTER_DAYS ? "wilted" : daysAway >= THIRSTY_AFTER_DAYS ? "thirsty" : "healthy";
  const lost = health === "wilted" ? Math.min(grown - 1, daysAway - SHRINK_AFTER_DAYS + 1) : 0;
  const stage = Math.max(0, grown - Math.max(0, lost));
  return { grown, stage, lost: grown - stage, health, shownXp: stage < grown ? STAGES[stage].min : xp };
}

export function TreeArt({ xp, health = "healthy", className }: { xp: number; health?: TreeHealth; className?: string }) {
  const stage = stageFor(xp);
  // From sapling on, the whole tree scales up smoothly towards full size.
  const scale = 0.45 + 0.55 * Math.min(1, Math.max(0, (xp - STAGES[2].min) / (FULL_XP - STAGES[2].min)));
  // A thirsty or wilted tree leans over a little.
  const lean = health === "wilted" ? -8 : health === "thirsty" ? -3 : 0;
  const grow = { transformBox: "view-box", transformOrigin: "60px 108px", transform: `rotate(${lean}deg) scale(${scale})` } as const;
  const leaf = health === "wilted" ? "fill-warn" : "fill-leaf";
  const leafOpacity = health === "thirsty" ? "opacity-60" : "";

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <ellipse cx="60" cy="109" rx="34" ry="5" className={health === "healthy" ? "fill-leaf-soft" : "fill-warn-soft"} />

      {/* Faint outline of the fully grown tree: shows what you're growing towards, even as a seed. */}
      {stage < STAGES.length - 1 && (
        <g className="fill-leaf opacity-20">
          <path d="M55 108 C57 90 57 75 58 56 L62 56 C63 75 63 90 65 108 Z" />
          {CANOPY.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
          ))}
        </g>
      )}

      {stage === 0 && (
        <g style={{ ...grow, transform: "scale(1.7)" }}>
          <path d="M48 109 Q60 98 72 109 Z" className="fill-wood opacity-40" />
          <ellipse cx="60" cy="103" rx="5" ry="3.5" className="fill-wood" />
        </g>
      )}

      {stage === 1 && (
        <g style={{ ...grow, transform: `rotate(${lean * 2}deg) scale(1.6)` }} className={`transition-transform duration-700 ${leafOpacity}`}>
          <path d="M60 108 C60 102 60 97 60 92" className={health === "wilted" ? "stroke-warn" : "stroke-leaf"} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M60 97 C54 95 50 91 50 86 C56 86 60 90 60 97 Z" className={leaf} />
          <path d="M60 94 C66 92 70 88 70 83 C64 83 60 87 60 94 Z" className={`${leaf} opacity-80`} />
        </g>
      )}

      {stage >= 2 && (
        <g style={grow} className="transition-transform duration-700 ease-out">
          <path d="M55 108 C57 90 57 75 58 56 L62 56 C63 75 63 90 65 108 Z" className="fill-wood" />
          <path d="M59 80 C52 74 46 70 40 67" className={`stroke-wood transition-opacity duration-700 ${stage >= 3 ? "opacity-100" : "opacity-0"}`} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M61 72 C68 66 74 63 80 61" className={`stroke-wood transition-opacity duration-700 ${stage >= 3 ? "opacity-100" : "opacity-0"}`} strokeWidth="3" strokeLinecap="round" fill="none" />
          <g className={`transition-opacity duration-700 ${leafOpacity}`}>
            {CANOPY.map((c, i) => (
              <circle
                key={i}
                cx={c.cx}
                cy={c.cy}
                r={c.r}
                className={`${leaf} transition-opacity duration-700 ${stage >= c.stage ? (i % 2 ? "opacity-85" : "opacity-100") : "opacity-0"}`}
              />
            ))}
          </g>
          {BLOSSOMS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.2" className={`fill-accent transition-opacity duration-700 ${stage >= 6 && health === "healthy" ? "opacity-100" : "opacity-0"}`} />
          ))}
        </g>
      )}
    </svg>
  );
}

export function ProgressTree() {
  const { xp, lastActiveDay } = useProgress();
  // lastActiveDay is null for new learners (and during server render), so Date is only read in the browser.
  const daysAway = lastActiveDay ? Math.max(0, daysBetween(lastActiveDay, osloToday())) : 0;
  const { grown, stage, lost, health, shownXp } = treeState(xp, daysAway);
  const current = STAGES[stage];
  const next = STAGES[grown + 1];
  const ratio = next ? (xp - STAGES[grown].min) / (next.min - STAGES[grown].min) : 1;

  const hint =
    health === "wilted" && lost > 0
      ? `It shrank ${lost === 1 ? "a stage" : `${lost} stages`} while you were away. Practise once and it grows straight back to a ${STAGES[grown].name.toLowerCase()}.`
      : health === "wilted"
        ? "It's wilting. Practise once to bring it back to life."
        : health === "thirsty"
          ? `It's thirsty: ${daysAway} days without practice. Learn one phrase to water it.`
          : current.hint;

  return (
    <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left lg:flex-col lg:text-center">
      <div className={`flex h-32 w-32 shrink-0 items-end justify-center rounded-2xl md:h-36 md:w-36 ${health === "healthy" ? "bg-leaf-soft" : "bg-warn-soft/60"}`}>
        <TreeArt xp={shownXp} health={health} className="h-full w-full" />
      </div>
      <div className="w-full min-w-0 flex-1">
        <p className="text-sm font-semibold text-muted">Your tree</p>
        <p className="text-xl font-black">
          {health === "healthy" ? current.emoji : health === "thirsty" ? "💧" : "🥀"} {current.name}
          {health !== "healthy" && <span className="ml-2 align-middle text-sm font-bold text-warn">{health === "thirsty" ? "Thirsty" : "Wilting"}</span>}
        </p>
        <p className={`text-sm ${health === "healthy" ? "text-muted" : "font-semibold text-warn"}`}>{hint}</p>
        <div className="mt-3">
          <ProgressBar value={ratio} tone="brand" label={next ? `Growth to ${next.name}` : "Fully grown"} />
          <p className="mt-1 text-xs font-semibold text-muted">
            {next ? `${next.min - xp} XP until it becomes a ${next.name.toLowerCase()}` : "🌸 Fully grown"} · Stage {grown + 1} of {STAGES.length}
          </p>
        </div>
      </div>
    </Card>
  );
}
