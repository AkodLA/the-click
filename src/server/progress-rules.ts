import "server-only";
import { achievements, getPhrase, getScenario, languageEvents } from "@/lib/content";
import type { Progress } from "@/lib/content/types";
import type { ProgressEvent, RewardNotice } from "@/lib/progress/events";
import { scorePlacement } from "./placement";
import { daysBetween, osloDay, osloWeek } from "./time";

/**
 * THE rules engine: the only place that decides XP, streaks, caps and achievements.
 * The browser sends "what happened" (ProgressEvent); this returns the new progress + toasts.
 * Owner: T6. Keep every number here, never in client code.
 */

export const RULES = {
  /** Max XP per learner per day, from all sources. Stops scripted farming. */
  dailyXpCap: 600,
  phraseXp: 5,
  writingXp: 3,
  writingPerDay: 10,
  tandemMessageXp: 2,
  tandemMessagesPerDay: 20,
  /** Each scenario gives XP once per day. */
  scenarioPerDay: 1,
  /** XP for pronunciation = score / 10, max `pronunciationMaxXp`, only when score ≥ `pronunciationMinScore`. */
  pronunciationPerDay: 15,
  pronunciationMinScore: 60,
  pronunciationMaxXp: 10,
  /** Score that unlocks "Native ears". */
  pronunciationPerfect: 90,
  /** Achievement thresholds. */
  streakShort: 3,
  streakLong: 7,
  streetPhrases: 5,
} as const;

export class RuleError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

/** Internal events that only server routes may apply (never accepted from the browser). */
export type InternalEvent = { type: "pronunciation_scored"; score: number };

interface Ctx {
  p: Progress;
  rewards: RewardNotice[];
}

function rollover(p: Progress): Progress {
  const day = osloDay();
  const week = osloWeek();
  let next = p;
  if (next.daily.day !== day) next = { ...next, daily: { day, counts: {} } };
  if (next.weekId !== week) next = { ...next, weekId: week, weekXp: 0 };
  return next;
}

function count(ctx: Ctx, key: string): number {
  return ctx.p.daily.counts[key] ?? 0;
}

function bump(ctx: Ctx, key: string, by = 1) {
  ctx.p = { ...ctx.p, daily: { ...ctx.p.daily, counts: { ...ctx.p.daily.counts, [key]: count(ctx, key) + by } } };
}

function touchStreak(ctx: Ctx) {
  const day = osloDay();
  const last = ctx.p.lastActiveDay;
  if (last === day) return;
  const streakDays = last && daysBetween(last, day) === 1 ? ctx.p.streakDays + 1 : 1;
  ctx.p = { ...ctx.p, lastActiveDay: day, streakDays };
  if (streakDays >= RULES.streakShort) unlock(ctx, "streak-3");
  if (streakDays >= RULES.streakLong) unlock(ctx, "streak-7");
}

function addXp(ctx: Ctx, amount: number, reason: string, emoji = "✨") {
  const room = Math.max(0, RULES.dailyXpCap - count(ctx, "xp"));
  const granted = Math.min(amount, room);
  if (granted <= 0) {
    ctx.rewards.push({ emoji: "🛑", title: "Daily XP limit reached", detail: "Great work today! Come back tomorrow." });
    return;
  }
  bump(ctx, "xp", granted);
  ctx.p = { ...ctx.p, xp: ctx.p.xp + granted, weekXp: ctx.p.weekXp + granted };
  ctx.rewards.push({ emoji, title: `+${granted} XP`, detail: reason });
  touchStreak(ctx);
}

function unlock(ctx: Ctx, achievementId: string) {
  if (ctx.p.unlocked.includes(achievementId)) return;
  const a = achievements.find((x) => x.id === achievementId);
  if (!a) return;
  ctx.p = { ...ctx.p, unlocked: [...ctx.p.unlocked, a.id] };
  // Achievement XP also counts toward the daily cap.
  const room = Math.max(0, RULES.dailyXpCap - count(ctx, "xp"));
  const granted = Math.min(a.xp, room);
  bump(ctx, "xp", granted);
  ctx.p = { ...ctx.p, xp: ctx.p.xp + granted, weekXp: ctx.p.weekXp + granted };
  // Show what was actually granted (can be less than a.xp when the daily cap is hit).
  ctx.rewards.push({ emoji: a.emoji, title: `Achievement: ${a.title}`, detail: granted > 0 ? `+${granted} XP` : "Daily XP limit reached" });
}

export function applyEvent(progress: Progress, event: ProgressEvent | InternalEvent): { progress: Progress; rewards: RewardNotice[] } {
  const ctx: Ctx = { p: rollover(progress), rewards: [] };

  switch (event.type) {
    case "profile_set": {
      ctx.p = { ...ctx.p, nickname: event.nickname, nativeLanguage: event.nativeLanguage };
      break;
    }

    case "placement_submitted": {
      const { level, correct, total } = scorePlacement(event.answers);
      ctx.p = { ...ctx.p, cefr: level };
      ctx.rewards.push({ emoji: "🧭", title: `Your level: ${level}`, detail: `${correct} of ${total} correct` });
      unlock(ctx, "placement-done");
      break;
    }

    case "phrase_learned": {
      const phrase = getPhrase(event.phraseId);
      if (!phrase) throw new RuleError("not_found", "Unknown phrase");
      if (ctx.p.learnedPhraseIds.includes(phrase.id)) break; // idempotent
      ctx.p = { ...ctx.p, learnedPhraseIds: [...ctx.p.learnedPhraseIds, phrase.id] };
      addXp(ctx, RULES.phraseXp, `Learned «${phrase.text}»`);
      const street = ctx.p.learnedPhraseIds.filter((id) => {
        const reg = getPhrase(id)?.register;
        return reg === "slang" || reg === "informal";
      }).length;
      if (street >= RULES.streetPhrases) unlock(ctx, "slang-5");
      break;
    }

    case "scenario_completed": {
      const scenario = getScenario(event.scenarioId);
      if (!scenario) throw new RuleError("not_found", "Unknown scenario");
      const key = `scenario:${scenario.id}`;
      if (count(ctx, key) >= RULES.scenarioPerDay) {
        ctx.rewards.push({ emoji: "🔁", title: "Practice round", detail: "XP for this scenario is once per day." });
        break;
      }
      bump(ctx, key);
      addXp(ctx, scenario.xpReward, `Finished: ${scenario.title}`, scenario.emoji);
      unlock(ctx, "first-talk");
      if (scenario.register === "formal" && event.slangFlags === 0) unlock(ctx, "register-pro");
      break;
    }

    case "event_checkin": {
      const ev = languageEvents.find((e) => e.id === event.eventId);
      if (!ev) throw new RuleError("not_found", "Unknown event");
      if (ctx.p.checkedInEventIds.includes(ev.id)) break;
      // Roadmap: verify presence with a QR code shown at the café.
      ctx.p = { ...ctx.p, checkedInEventIds: [...ctx.p.checkedInEventIds, ev.id] };
      addXp(ctx, ev.xpReward, `Checked in: ${ev.title}`, "📍");
      unlock(ctx, "sprakkafe");
      break;
    }

    case "writing_done": {
      if (count(ctx, "writing") >= RULES.writingPerDay) break;
      bump(ctx, "writing");
      addXp(ctx, RULES.writingXp, "Writing practice", "✍️");
      break;
    }

    case "tandem_message_sent": {
      unlock(ctx, "tandem-first");
      if (count(ctx, "tandem") >= RULES.tandemMessagesPerDay) break;
      bump(ctx, "tandem");
      addXp(ctx, RULES.tandemMessageXp, "Tandem message", "🤝");
      break;
    }

    case "pronunciation_scored": {
      if (count(ctx, "pronunciation") >= RULES.pronunciationPerDay) break;
      bump(ctx, "pronunciation");
      if (event.score >= RULES.pronunciationMinScore) {
        addXp(ctx, Math.min(RULES.pronunciationMaxXp, Math.round(event.score / 10)), `Pronunciation ${event.score}/100`, "🎯");
      }
      if (event.score >= RULES.pronunciationPerfect) unlock(ctx, "perfect-pron");
      break;
    }
  }

  return { progress: ctx.p, rewards: ctx.rewards };
}
