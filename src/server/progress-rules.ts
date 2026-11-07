import "server-only";
import { achievements, activeSeason, getPack, getPhrase, getScenario, getVocabWord, languageEvents, packOfWord, questsForDay } from "@/lib/content";
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
  /** T20: XP per vocabulary word (once per word, ever), max words with XP per day. */
  wordXp: 3,
  wordsPerDay: 30,
  wordCollector: 25,
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
  /** T21: streak freezes (earned every N streak days, max held), field tests. */
  freezeEvery: 7,
  maxFreezes: 2,
  fieldTestQuestions: 5,
  fieldTestPass: 0.8,
  fieldTestXp: 40,
  fieldTestsPerDay: 3,
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
  if (next.weekStats?.week !== week) next = { ...next, weekStats: { week, counts: {} } };
  return next;
}

function count(ctx: Ctx, key: string): number {
  return ctx.p.daily.counts[key] ?? 0;
}

function bump(ctx: Ctx, key: string, by = 1) {
  ctx.p = { ...ctx.p, daily: { ...ctx.p.daily, counts: { ...ctx.p.daily.counts, [key]: count(ctx, key) + by } } };
}

/** T21: count something the learner did (lifetime, this week, and today for quests). */
function stat(ctx: Ctx, key: string, by = 1) {
  const stats = ctx.p.stats ?? {};
  const week = ctx.p.weekStats ?? { week: null, counts: {} };
  ctx.p = {
    ...ctx.p,
    stats: { ...stats, [key]: (stats[key] ?? 0) + by },
    weekStats: { ...week, counts: { ...week.counts, [key]: (week.counts[key] ?? 0) + by } },
  };
  bump(ctx, `d:${key}`, by);
}

function touchStreak(ctx: Ctx) {
  const day = osloDay();
  const last = ctx.p.lastActiveDay;
  if (last === day) return;
  const gap = last ? daysBetween(last, day) : null;
  let streakDays = gap === 1 ? ctx.p.streakDays + 1 : 1;
  // T21: a streak freeze saves exactly one missed day.
  const freezes = ctx.p.streakFreezes ?? 0;
  if (gap === 2 && freezes > 0 && ctx.p.streakDays > 0) {
    streakDays = ctx.p.streakDays + 1;
    ctx.p = { ...ctx.p, streakFreezes: freezes - 1 };
    ctx.rewards.push({ emoji: "🧊", title: "Streak freeze used", detail: `Your ${streakDays}-day streak is safe.` });
  }
  ctx.p = { ...ctx.p, lastActiveDay: day, streakDays };
  if (streakDays % RULES.freezeEvery === 0 && (ctx.p.streakFreezes ?? 0) < RULES.maxFreezes) {
    ctx.p = { ...ctx.p, streakFreezes: (ctx.p.streakFreezes ?? 0) + 1 };
    ctx.rewards.push({ emoji: "🧊", title: "Streak freeze earned", detail: "It saves your streak if you miss a day." });
  }
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

    case "languages_set": {
      // A preference, not practice: no XP, no streak.
      if (event.nativeLanguage === event.targetLanguage) throw new RuleError("invalid", "Pick two different languages");
      ctx.p = { ...ctx.p, nativeLanguage: event.nativeLanguage, targetLanguage: event.targetLanguage };
      break;
    }

    case "placement_submitted": {
      const { level, correct, total, byLevel } = scorePlacement(event.answers);
      ctx.p = { ...ctx.p, cefr: level, placement: { correct, total, byLevel } };
      ctx.rewards.push({ emoji: "🧭", title: `Your level: ${level}`, detail: `${correct} of ${total} correct` });
      unlock(ctx, "placement-done");
      break;
    }

    case "phrase_learned": {
      const phrase = getPhrase(event.phraseId);
      if (!phrase) throw new RuleError("not_found", "Unknown phrase");
      if (ctx.p.learnedPhraseIds.includes(phrase.id)) break; // idempotent
      ctx.p = { ...ctx.p, learnedPhraseIds: [...ctx.p.learnedPhraseIds, phrase.id] };
      stat(ctx, "phrases");
      addXp(ctx, RULES.phraseXp, `Learned «${phrase.text}»`);
      const street = ctx.p.learnedPhraseIds.filter((id) => {
        const reg = getPhrase(id)?.register;
        return reg === "slang" || reg === "informal";
      }).length;
      if (street >= RULES.streetPhrases) unlock(ctx, "slang-5");
      break;
    }

    case "word_learned": {
      const word = getVocabWord(event.wordId);
      if (!word) throw new RuleError("not_found", "Unknown word");
      const known = ctx.p.learnedWordIds ?? [];
      if (known.includes(word.id)) break; // idempotent
      ctx.p = { ...ctx.p, learnedWordIds: [...known, word.id] };
      stat(ctx, "words");
      // T21: seasonal words count only while their season runs (server date).
      const season = activeSeason(osloDay());
      if (season && getPack(season.packId)?.words.some((x) => x.id === word.id)) {
        const n = (ctx.p.seasons?.[season.id] ?? 0) + 1;
        ctx.p = { ...ctx.p, seasons: { ...ctx.p.seasons, [season.id]: n } };
        if (n >= season.goal) unlock(ctx, season.achievementId);
      }
      if (count(ctx, "words") < RULES.wordsPerDay) {
        bump(ctx, "words");
        addXp(ctx, RULES.wordXp, `New word: «${word.no}»`, "🧠");
      }
      const learned = ctx.p.learnedWordIds ?? [];
      if (learned.length >= RULES.wordCollector) unlock(ctx, "words-25");
      const pack = packOfWord(word.id);
      if (pack?.kind === "field" && pack.words.every((x) => learned.includes(x.id))) unlock(ctx, "field-ready");
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
      stat(ctx, "scenarios");
      if (event.slangFlags) stat(ctx, "slangFlags", event.slangFlags);
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
      stat(ctx, "events");
      addXp(ctx, ev.xpReward, `Checked in: ${ev.title}`, "📍");
      unlock(ctx, "sprakkafe");
      break;
    }

    case "writing_done": {
      if (count(ctx, "writing") >= RULES.writingPerDay) break;
      bump(ctx, "writing");
      stat(ctx, "writing");
      addXp(ctx, RULES.writingXp, "Writing practice", "✍️");
      break;
    }

    case "tandem_message_sent": {
      unlock(ctx, "tandem-first");
      if (count(ctx, "tandem") >= RULES.tandemMessagesPerDay) break;
      bump(ctx, "tandem");
      stat(ctx, "tandem");
      addXp(ctx, RULES.tandemMessageXp, "Tandem message", "🤝");
      break;
    }

    case "field_test_submitted": {
      const pack = getPack(event.packId);
      if (!pack || pack.kind !== "field") throw new RuleError("not_found", "Unknown field pack");
      const ids = Object.keys(event.answers);
      if (ids.length < RULES.fieldTestQuestions || ids.some((id) => !pack.words.some((x) => x.id === id))) {
        throw new RuleError("invalid", `Answer ${RULES.fieldTestQuestions} questions from this pack`);
      }
      if (count(ctx, "fieldTests") >= RULES.fieldTestsPerDay) throw new RuleError("invalid", "That's enough tests for today. Try again tomorrow!");
      bump(ctx, "fieldTests");
      stat(ctx, "tests");
      const right = ids.filter((id) => pack.words.find((x) => x.id === id)?.en === event.answers[id]).length;
      const passed = right / ids.length >= RULES.fieldTestPass;
      if (!passed) {
        ctx.rewards.push({ emoji: "📚", title: `${right} of ${ids.length} right`, detail: "Review the words and try again." });
        break;
      }
      const certs = ctx.p.certificates ?? [];
      if (!certs.some((c) => c.packId === pack.id)) {
        ctx.p = { ...ctx.p, certificates: [...certs, { packId: pack.id, day: osloDay(), score: right, total: ids.length }] };
        addXp(ctx, RULES.fieldTestXp, `Passed: ${pack.title}`, "🎓");
        unlock(ctx, "certified");
      } else {
        ctx.rewards.push({ emoji: "🎓", title: `${right} of ${ids.length} right`, detail: "You already have this certificate. Nice refresher!" });
      }
      break;
    }

    case "pronunciation_scored": {
      if (count(ctx, "pronunciation") >= RULES.pronunciationPerDay) break;
      bump(ctx, "pronunciation");
      stat(ctx, "pronunciation");
      if (event.score >= RULES.pronunciationMinScore) {
        addXp(ctx, Math.min(RULES.pronunciationMaxXp, Math.round(event.score / 10)), `Pronunciation ${event.score}/100`, "🎯");
      }
      if (event.score >= RULES.pronunciationPerfect) unlock(ctx, "perfect-pron");
      break;
    }
  }

  checkQuests(ctx);
  return { progress: ctx.p, rewards: ctx.rewards };
}

/** T21: daily quests (same 3 for everyone per Oslo day). Bonus XP once per quest per day; all 3 → Quest master. */
function checkQuests(ctx: Ctx) {
  const quests = questsForDay(osloDay());
  for (const q of quests) {
    if (count(ctx, `quest:${q.id}`) > 0 || count(ctx, `d:${q.stat}`) < q.target) continue;
    bump(ctx, `quest:${q.id}`);
    addXp(ctx, q.xp, `Quest done: ${q.title}`, "🗺️");
  }
  if (quests.every((q) => count(ctx, `quest:${q.id}`) > 0)) unlock(ctx, "quest-master");
}
