import "server-only";
import { CEFR_LEVELS, placementQuestions } from "@/lib/content";
import type { CefrLevel } from "@/lib/content/types";

/**
 * Placement ANSWER KEY: server-only, never sent to the browser.
 * question id -> index of the correct option. "speak" questions aren't scored here (see T5).
 */
const ANSWER_KEY: Record<string, number> = {
  q1: 2,
  q2: 1,
  q3: 3,
  q5: 2,
  q6: 1,
  q7: 3,
  q8: 0,
  q9: 2,
};

/**
 * Level = walk up from A1 while at least half the questions of that level are right.
 * Nothing right = A0. (T4 may tune this; keep it server-side.)
 */
export function scorePlacement(answers: Record<string, number>): { level: CefrLevel; correct: number; total: number } {
  let reached: CefrLevel = "A0";
  let correct = 0;
  let total = 0;
  let stillClimbing = true;

  for (const level of CEFR_LEVELS.slice(1)) {
    const qs = placementQuestions.filter((q) => q.level === level && q.id in ANSWER_KEY);
    if (qs.length === 0) continue;
    const right = qs.filter((q) => answers[q.id] === ANSWER_KEY[q.id]).length;
    correct += right;
    total += qs.length;
    if (stillClimbing && right / qs.length >= 0.5) reached = level;
    else stillClimbing = false;
  }
  return { level: reached, correct, total };
}
