/** Player level from XP (gamification). Separate from the CEFR language level. */

const XP_STEP = 40;

/** Total XP needed to reach a given player level (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  return XP_STEP * (level - 1) ** 2;
}

export function playerLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / XP_STEP)) + 1;
}

/** Progress inside the current level, 0–1, plus the XP still needed for the next one. */
export function levelProgress(xp: number): { level: number; ratio: number; toNext: number } {
  const level = playerLevel(xp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return { level, ratio: (xp - start) / (end - start), toNext: end - xp };
}
