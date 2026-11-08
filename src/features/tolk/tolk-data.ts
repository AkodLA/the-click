/**
 * Static data for Tolk (T8): languages, settings and the offline demo conversation.
 * Public content, no secrets.
 */

export interface TolkLanguage {
  code: string;
  /** English name (shown to the learner). */
  name: string;
  /** The language's own name, so the person across the table recognises it. */
  native: string;
  rtl?: boolean;
}

/** Most common languages among newcomers in Norway. Keep in sync with agent/tolk-prompt.md. */
export const TOLK_LANGUAGES: TolkLanguage[] = [
  { code: "nb", name: "Norwegian", native: "Norsk" },
  { code: "en", name: "English", native: "English" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "ar", name: "Arabic", native: "العربية", rtl: true },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "so", name: "Somali", native: "Soomaali" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "ur", name: "Urdu", native: "اردو", rtl: true },
  { code: "fa", name: "Dari / Persian", native: "دری / فارسی", rtl: true },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "zh", name: "Chinese (Mandarin)", native: "中文" },
  { code: "ru", name: "Russian", native: "Русский" },
];

export function tolkLanguage(code: string): TolkLanguage {
  return TOLK_LANGUAGES.find((l) => l.code === code) ?? TOLK_LANGUAGES[1];
}

export interface TolkSetting {
  id: string;
  emoji: string;
  title: string;
  /** Sent to the agent as the `setting` dynamic variable. */
  agentContext: string;
  /** Scenario to practise afterwards, so next time you can try without Tolk. */
  practiseScenarioId?: string;
}

export const TOLK_SETTINGS: TolkSetting[] = [
  {
    id: "school",
    emoji: "🏫",
    title: "School: quick chat",
    agentContext: "a short, informal chat with a teacher at a Norwegian school, e.g. at pickup time",
    practiseScenarioId: "parent-meeting",
  },
  {
    id: "health",
    emoji: "🩺",
    title: "Doctor or health",
    agentContext: "a visit to the GP (fastlege) or another health service in Norway",
    practiseScenarioId: "doctor",
  },
  {
    id: "nav",
    emoji: "🏛️",
    title: "NAV or municipality",
    agentContext: "a meeting at NAV or the municipality (kommunen) about public services",
    practiseScenarioId: "job-interview",
  },
  {
    id: "work",
    emoji: "📦",
    title: "Workplace",
    agentContext: "a conversation at work between a manager and an employee (e.g. in a warehouse)",
    practiseScenarioId: "warehouse-first-day",
  },
  {
    id: "everyday",
    emoji: "☕",
    title: "Everyday talk",
    agentContext: "an everyday conversation between neighbours or new friends",
    practiseScenarioId: "party",
  },
];

export function tolkSetting(id: string): TolkSetting {
  return TOLK_SETTINGS.find((s) => s.id === id) ?? TOLK_SETTINGS[0];
}

/** One interpreted utterance. `speaker` "a" = the learner's language, "b" = Norwegian side (or unknown). */
export interface TolkTurn {
  id: number;
  speaker: "a" | "b" | "unknown";
  original: string;
  translation: string;
}

/**
 * Offline demo (no ElevenLabs key, no Wi-Fi on stage): a quick chat with the teacher at pickup, English ↔ Norwegian.
 * An everyday moment on purpose: for formal meetings the school must book a qualified interpreter (tolkeloven, see docs/PITCH.md).
 * SAMPLE DATA: written for the demo, not a real conversation.
 */
export const DEMO_TURNS: Omit<TolkTurn, "id">[] = [
  {
    speaker: "b",
    original: "Hei! Har du to minutter? Jeg er Kari, kontaktlæreren til Amina.",
    translation: "Hi! Do you have two minutes? I'm Kari, Amina's form teacher.",
  },
  {
    speaker: "a",
    original: "Of course. Is everything okay with Amina?",
    translation: "Selvfølgelig. Er alt i orden med Amina?",
  },
  {
    speaker: "b",
    original: "Ja da, hun gjør det kjempebra! Vi skal på tur til skogen på fredag. Hun trenger varme klær og matpakke.",
    translation: "Yes, she's doing really well! We're going on a trip to the forest on Friday. She needs warm clothes and a packed lunch.",
  },
  {
    speaker: "a",
    original: "Okay. What time will they be back?",
    translation: "Greit. Når er de tilbake?",
  },
  {
    speaker: "b",
    original: "Rundt klokka to. Og husk foreldremøtet neste uke, da bestiller skolen tolk til deg.",
    translation: "Around two o'clock. And remember the parent-teacher meeting next week, the school will book an interpreter for you.",
  },
  {
    speaker: "a",
    original: "Thank you, that's very helpful.",
    translation: "Tusen takk, det var veldig nyttig.",
  },
  {
    speaker: "b",
    original: "Bare hyggelig! Ha en fin dag.",
    translation: "You're welcome! Have a nice day.",
  },
];
