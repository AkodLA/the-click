// Languages the worker can pick. `code` must be a language ElevenLabs Agents
// supports, and must ALSO be added under "Additional languages" on the agent.

export interface WorkerLanguage {
  code: string;
  native: string; // shown to the worker
  norwegian: string; // shown to the manager
  firstMessage: string; // agent's greeting in that language ({{worker_name}} is filled in by ElevenLabs)
}

export const LANGUAGES: WorkerLanguage[] = [
  {
    code: "so",
    native: "Soomaali",
    norwegian: "somali",
    firstMessage:
      "Haye {{worker_name}}, waxaan ahay caawiyahaaga bakhaarka. Maxaan kaa caawin karaa?",
  },
  {
    code: "ar",
    native: "العربية",
    norwegian: "arabisk",
    firstMessage: "مرحبا {{worker_name}}، أنا مساعدك في المستودع. كيف يمكنني مساعدتك؟",
  },
  {
    code: "pl",
    native: "Polski",
    norwegian: "polsk",
    firstMessage: "Cześć {{worker_name}}, jestem twoim asystentem w magazynie. W czym mogę pomóc?",
  },
  {
    code: "uk",
    native: "Українська",
    norwegian: "ukrainsk",
    firstMessage: "Привіт, {{worker_name}}! Я твій помічник на складі. Чим можу допомогти?",
  },
  {
    code: "en",
    native: "English",
    norwegian: "engelsk",
    firstMessage: "Hi {{worker_name}}, I'm your warehouse assistant. What can I help you with?",
  },
  {
    code: "no",
    native: "Norsk",
    norwegian: "norsk",
    firstMessage: "Hei {{worker_name}}, jeg er lagerassistenten din. Hva kan jeg hjelpe deg med?",
  },
];

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.norwegian ?? code;
}
