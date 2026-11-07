import type { Progress } from "@/lib/content/types";

/** A brand-new learner. Shared by the browser (display before first save) and the server. */
export const DEFAULT_PROGRESS: Progress = {
  nickname: "",
  nativeLanguage: "en",
  targetLanguage: "nb",
  cefr: null,
  xp: 0,
  weekXp: 0,
  streakDays: 0,
  lastActiveDay: null,
  unlocked: [],
  learnedPhraseIds: [],
  learnedWordIds: [],
  checkedInEventIds: [],
  weekId: null,
  daily: { day: null, counts: {} },
};
