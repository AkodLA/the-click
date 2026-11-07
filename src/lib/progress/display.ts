/**
 * Display-only helpers for the profile and other screens (T6).
 * Nothing here decides XP: the server (src/server/progress-rules.ts) does that.
 * These only make the stored token look right TODAY (e.g. a streak that already broke,
 * or weekXp from last week that the server will reset on the next event).
 */
import { achievements, getPhrase } from "@/lib/content";
import type { Achievement, Progress } from "@/lib/content/types";

/** Weekly XP goal shown on the profile (display only, not a rule). */
export const WEEKLY_GOAL_XP = 300;

const TZ = "Europe/Oslo";

/** YYYY-MM-DD in Oslo time (same math as src/server/time.ts, but safe in the browser). */
export function osloDayClient(date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function osloWeekClient(date = new Date()): string {
  const [y, m, d] = osloDayClient(date).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export type StreakState = "active" | "at-risk" | "broken" | "none";

/** The streak as it really is today: practised today (active), yesterday (at risk), or longer ago (broken). */
// The clock is only read when there is real progress, so prerendering the empty default never touches Date.
export function streakNow(p: Progress, today?: string): { days: number; state: StreakState } {
  if (!p.lastActiveDay || p.streakDays === 0) return { days: 0, state: "none" };
  const gap = daysBetween(p.lastActiveDay, today ?? osloDayClient());
  if (gap <= 0) return { days: p.streakDays, state: "active" };
  if (gap === 1) return { days: p.streakDays, state: "at-risk" };
  return { days: 0, state: "broken" };
}

/** XP earned this week (0 if the stored value is from an older week). */
export function weekXpNow(p: Progress, week?: string): number {
  if (!p.weekId || p.weekXp === 0) return 0;
  return p.weekId === (week ?? osloWeekClient()) ? p.weekXp : 0;
}

/** XP earned today (0 if the stored counters are from another day). */
export function todayXpNow(p: Progress, today?: string): number {
  if (!p.daily.day || !p.daily.counts.xp) return 0;
  return p.daily.day === (today ?? osloDayClient()) ? p.daily.counts.xp : 0;
}

/**
 * "3 of 5" hints on locked achievements. Targets mirror the thresholds in RULES (server).
 * Returns null when there's no meaningful count to show.
 */
export function achievementProgress(a: Achievement, p: Progress): { current: number; target: number } | null {
  const streak = streakNow(p).days;
  switch (a.id) {
    case "streak-3":
      return { current: Math.min(streak, 3), target: 3 };
    case "streak-7":
      return { current: Math.min(streak, 7), target: 7 };
    case "slang-5": {
      const street = p.learnedPhraseIds.filter((id) => {
        const reg = getPhrase(id)?.register;
        return reg === "slang" || reg === "informal";
      }).length;
      return { current: Math.min(street, 5), target: 5 };
    }
    default:
      return null;
  }
}

/** Achievements with their unlocked state, unlocked first (in the order they were earned). */
export function achievementList(p: Progress) {
  const unlocked = p.unlocked
    .map((id) => achievements.find((a) => a.id === id))
    .filter((a): a is Achievement => Boolean(a))
    .map((a) => ({ achievement: a, unlocked: true as const, progress: null }));
  const locked = achievements
    .filter((a) => !p.unlocked.includes(a.id))
    .map((a) => ({ achievement: a, unlocked: false as const, progress: achievementProgress(a, p) }));
  return [...unlocked, ...locked];
}
