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
    title: "Parent-teacher meeting",
    agentContext: "a parent-teacher meeting (foreldremøte / utviklingssamtale) at a Norwegian school",
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
    practiseScenarioId: "work-lunch",
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
 * Offline demo (no ElevenLabs key, no Wi-Fi on stage): a parent-teacher meeting, English ↔ Norwegian.
 * SAMPLE DATA: written for the demo, not a real conversation.
 */
export const DEMO_TURNS: Omit<TolkTurn, "id">[] = [
  {
    speaker: "b",
    original: "Hei, og velkommen! Takk for at du kom. Jeg heter Kari, og jeg er kontaktlæreren til Amina.",
    translation: "Hi, and welcome! Thank you for coming. My name is Kari, and I'm Amina's form teacher.",
  },
  {
    speaker: "a",
    original: "Thank you. How is Amina doing at school?",
    translation: "Takk. Hvordan går det med Amina på skolen?",
  },
  {
    speaker: "b",
    original: "Hun gjør det kjempebra i matte, og hun har fått mange venner. Hun kan bli enda bedre i norsk.",
    translation: "She's doing really well in maths, and she has made lots of friends. She can get even better at Norwegian.",
  },
  {
    speaker: "a",
    original: "What can we do at home to help her with Norwegian?",
    translation: "Hva kan vi gjøre hjemme for å hjelpe henne med norsk?",
  },
  {
    speaker: "b",
    original: "Les gjerne en bok sammen hver kveld, ti minutter er nok. Og hun kan gå på leksehjelp på tirsdager.",
    translation: "Feel free to read a book together every evening, ten minutes is enough. And she can go to homework help on Tuesdays.",
  },
  {
    speaker: "a",
    original: "That's great. Thank you so much.",
    translation: "Så fint. Tusen takk.",
  },
  {
    speaker: "b",
    original: "Bare hyggelig! Takk for praten, og ha en fin kveld.",
    translation: "You're welcome! Thanks for the chat, and have a nice evening.",
  },
];
