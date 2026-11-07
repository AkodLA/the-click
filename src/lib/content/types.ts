/**
 * SHARED CONTRACT: the data model every feature builds against.
 * Change this file only in a small, separate PR that Akram merges first (see CLAUDE.md).
 * Explained in docs/API.md.
 */

/** CEFR levels. A0 = absolute beginner (our addition), C2 = near-native. */
export const CEFR_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** BCP-47 language code: "nb" (Norwegian Bokmål), "en", "es", "ar", "pl", "uk"... */
export type LanguageCode = string;

/**
 * How "street" a phrase is. Every phrase card shows this as a colored tag.
 *  slang    : friends / social media only
 *  informal : everyday, relaxed (most of daily life in Norway)
 *  neutral  : safe everywhere
 *  formal   : job interviews, NAV, doctors, emails to school
 */
export type Register = "slang" | "informal" | "neutral" | "formal";

/** A phrase with context: the heart of "Norwegian people actually speak". */
export interface Phrase {
  id: string;
  /** The Norwegian phrase, e.g. "Digg!" */
  text: string;
  /**
   * How to say it, spelled with plain English letters so anyone can read it out.
   * Syllables split by "-", the stressed one in CAPS: «kjærlighet» → "SHAR-li-hayt".
   * Shown faintly under the phrase as a last-resort hint.
   */
  soundsLike?: string;
  /** Meaning in English. */
  meaning: string;
  register: Register;
  level: CefrLevel;
  /** Example sentence in Norwegian + English translation (+ optional sounds-like spelling, see soundsLike). */
  example: { no: string; en: string; soundsLike?: string };
  /** When it's natural to say it. */
  useWhen: string;
  /** When NOT to say it, and why. */
  avoidWhen: string;
  /** What to say instead in the situations above. */
  sayInstead: string[];
  /** Optional: where it's used (e.g. "Oslo, youth"). */
  region?: string;
  tags?: string[];
}

/** A real-life situation you practise speaking with the voice tutor. */
export interface Scenario {
  id: string;
  title: string;
  /** One emoji used as the scenario's icon. */
  emoji: string;
  level: CefrLevel;
  register: Register;
  /** What the learner should achieve, shown before starting. */
  goal: string;
  /** Who the agent plays, e.g. "a friendly kiosk worker in Oslo". */
  agentRole: string;
  /** The agent's first line, in Norwegian. */
  openingLine: string;
  /** Phrase ids worth using in this scenario. */
  keyPhraseIds: string[];
  xpReward: number;
  /** T20: work fields this scenario is for (recommended to learners in that field). */
  fields?: FieldId[];
}

export type PlacementQuestionType = "choice" | "listen" | "speak";

export interface PlacementQuestion {
  id: string;
  /** The level this question tests. */
  level: CefrLevel;
  type: PlacementQuestionType;
  /** Instruction shown to the learner (English). */
  prompt: string;
  /** Norwegian text to show, play (listen) or say (speak). */
  norwegian?: string;
  options?: string[];
  // NOTE: the correct answers are NOT here on purpose. They live server-side
  // in src/server/placement.ts so they never reach the browser.
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xp: number;
}

export type LeaguePeriod = "week" | "month";

export interface LeagueEntry {
  nickname: string;
  avatar: string;
  level: CefrLevel;
  xp: number;
}

/** A language event like a språkkafé. */
export interface LanguageEvent {
  id: string;
  title: string;
  place: string;
  area: string;
  /** ISO date-time. */
  startsAt: string;
  levels: CefrLevel[];
  xpReward: number;
  description: string;
  /** true = example data for the demo, not a verified real event. */
  isSample: boolean;
}

/** An anonymous tandem partner: nickname + avatar only, never real name or face. */
export interface TandemPartner {
  id: string;
  nickname: string;
  avatar: string;
  /** Language they speak natively (they teach this). */
  offers: LanguageCode;
  /** Language they want to learn. */
  wants: LanguageCode;
  level: CefrLevel;
  online: boolean;
  interests: string[];
}

export interface TandemMessage {
  id: string;
  from: "me" | "partner";
  text: string;
  /** Optional correction the partner (or AI) suggested for my message. */
  correction?: string;
  ts: string;
}

/** Result of the pronunciation check (T5). */
export interface PronunciationResult {
  target: string;
  /** What speech-to-text heard. */
  heard: string;
  words: { word: string; ok: boolean }[];
  /** 0–100 */
  score: number;
  tip?: string;
}

/**
 * The learner's progress. The SERVER computes it and signs it (src/server/progress-token.ts).
 * The browser stores the signed token and can display it, but can't change it.
 */
export interface Progress {
  nickname: string;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  /** null until the placement test is done. */
  cefr: CefrLevel | null;
  xp: number;
  weekXp: number;
  streakDays: number;
  /** YYYY-MM-DD of last activity (for streaks). */
  lastActiveDay: string | null;
  unlocked: string[];
  learnedPhraseIds: string[];
  /** T20: vocabulary words the learner marked as known (server-checked, once per word). */
  learnedWordIds?: string[];
  checkedInEventIds: string[];
  /** ISO week id of weekXp, e.g. "2026-W45" (server resets weekXp each week). */
  weekId: string | null;
  /** Per-day counters for anti-abuse caps, e.g. { "scenario:kiosk": 1, xp: 120 }. */
  daily: { day: string | null; counts: Record<string, number> };
}

// ---------- T20: personal learning (age group, field, interests) ----------

/** Age GROUP only, never an exact age (data minimisation). Changes tone and which packs are suggested. */
export type AgeGroup = "teen" | "young" | "adult" | "senior";

/** Field of work or study. */
export type FieldId = "health" | "construction" | "logistics" | "hospitality" | "it" | "education" | "cleaning" | "transport" | "student";

export type InterestId = "football" | "cooking" | "music" | "gaming" | "outdoors" | "family";

/** One word to learn, always with an example sentence (real spoken Norwegian). */
export interface VocabWord {
  /** Stable id, also the `word_learned` event id, e.g. "health-vakt". */
  id: string;
  /** The Norwegian word, with article for nouns where it helps: "en vakt". */
  no: string;
  /** English meaning. */
  en: string;
  level: CefrLevel;
  register: Register;
  example: { no: string; en: string };
}

export interface VocabPack {
  id: FieldId | InterestId;
  kind: "field" | "interest";
  title: string;
  /** Norwegian name of the pack, shown small. */
  titleNo: string;
  emoji: string;
  /** Only suggested to these age groups (undefined = everyone). */
  ageGroups?: AgeGroup[];
  words: VocabWord[];
}
