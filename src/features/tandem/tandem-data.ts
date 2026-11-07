/**
 * Tandem (T10) logic that runs in the browser: the scripted partner, gentle corrections and the safety check.
 * Partner replies are SCRIPTED for the demo (see docs/PLAN.md "Faked"). Real chat = T17 (Supabase Realtime).
 * Nothing here gives XP: sending a message reports `tandem_message_sent`, and the server decides the XP.
 */
import { phrases } from "@/lib/content";
import type { Phrase, TandemPartner } from "@/lib/content/types";

/** Language names IN NORWEGIAN, for the partner's lines ("Jeg vil lære spansk"). */
const NORWEGIAN_LANGUAGE_NAMES: Record<string, string> = {
  en: "engelsk",
  es: "spansk",
  ar: "arabisk",
  pl: "polsk",
  uk: "ukrainsk",
  so: "somali",
  fr: "fransk",
  nb: "norsk",
};

const INTEREST_NO: Record<string, string> = {
  football: "fotball",
  cooking: "matlaging",
  hiking: "fjellturer",
  music: "musikk",
  films: "film",
  coffee: "kaffe",
  gaming: "gaming",
  travel: "reising",
  skiing: "ski",
  podcasts: "podkaster",
  surfing: "surfing",
  food: "god mat",
  chess: "sjakk",
  baking: "baking",
  running: "løping",
  books: "bøker",
  cycling: "sykling",
  photography: "fotografering",
  dogs: "hunder",
};

export interface ScriptLine {
  no: string;
  en: string;
  /** Quick replies for beginners (tap to put in the message box). */
  suggestions: string[];
}

/** The partner's side of the chat. Line 0 opens the chat; each of your messages gets the next line. */
export function partnerScript(partner: TandemPartner, myLanguage: string): ScriptLine[] {
  const interest = INTEREST_NO[partner.interests[0]] ?? partner.interests[0];
  const myLang = NORWEGIAN_LANGUAGE_NAMES[myLanguage] ?? "språket ditt";
  return [
    {
      no: `Hei! Jeg heter ${partner.nickname} 😄 Hvor kommer du fra?`,
      en: `Hi! My name is ${partner.nickname} 😄 Where are you from?`,
      suggestions: ["Hei! Jeg kommer fra …", "Hei! Hyggelig å møte deg!"],
    },
    {
      no: "Så kult! Hvor lenge har du bodd i Norge?",
      en: "So cool! How long have you lived in Norway?",
      suggestions: ["Jeg har bodd i Norge i ett år.", "Jeg kom hit i sommer."],
    },
    {
      no: `Digg! Hva liker du å gjøre på fritiden? Jeg elsker ${interest}.`,
      en: `Nice! What do you like doing in your free time? I love ${partner.interests[0]}.`,
      suggestions: ["Jeg liker å lese og gå tur.", `Jeg liker også ${interest}!`],
    },
    {
      no: `Jeg vil lære ${myLang} 😅 Kan du lære meg et ord? Hvordan sier man «takk»?`,
      en: `I want to learn ${myLang === "språket ditt" ? "your language" : myLang} 😅 Can you teach me a word? How do you say "thanks"?`,
      suggestions: ["Man sier …", "Det er lett! Man sier …"],
    },
    {
      no: "Tusen takk! Det skal jeg huske. Du skriver kjempebra norsk, forresten!",
      en: "Thanks a lot! I'll remember that. You write really good Norwegian, by the way!",
      suggestions: ["Tusen takk! 😊", "Takk, jeg øver hver dag."],
    },
    {
      no: "Skal vi ta en kaffe på en språkkafé en dag? Snakkes! 👋",
      en: "Shall we grab a coffee at a language café one day? Talk soon! 👋",
      suggestions: ["Gjerne! Snakkes!", "Ja, det høres hyggelig ut!"],
    },
  ];
}

/** After the script ends, the partner keeps it friendly. */
export const PARTNER_FILLERS: ScriptLine[] = [
  { no: "Haha, enig! 😄", en: "Haha, agreed! 😄", suggestions: ["Snakkes!"] },
  { no: "Så hyggelig å prate med deg!", en: "So nice to chat with you!", suggestions: ["I like-måte!"] },
  { no: "Fortell mer!", en: "Tell me more!", suggestions: [] },
];

/**
 * Gentle corrections for common learner mistakes (display only, like a tandem partner would).
 * Each rule returns the corrected sentence and a short English reason.
 */
const RULES: { test: RegExp; fix: (s: string) => string; why: string }[] = [
  {
    // "Jeg er bor" -> "Jeg bor"
    test: /\b(jeg|du|han|hun|vi|dere|de) er (bor|heter|kommer|liker|har|snakker|jobber|studerer|lærer|elsker)\b/i,
    fix: (s) => s.replace(/\b(jeg|du|han|hun|vi|dere|de) er (bor|heter|kommer|liker|har|snakker|jobber|studerer|lærer|elsker)\b/gi, "$1 $2"),
    why: "no «er» before another verb",
  },
  {
    // "I dag jeg spiser" -> "I dag spiser jeg" (verb second)
    test: /\b(i dag|i går|i morgen|nå|i helga|om kvelden) (jeg|du|vi|han|hun) (\p{L}+)/iu,
    fix: (s) => s.replace(/\b(i dag|i går|i morgen|nå|i helga|om kvelden) (jeg|du|vi|han|hun) (\p{L}+)/giu, "$1 $3 $2"),
    why: "the verb comes second in Norwegian (V2)",
  },
  {
    // Languages and nationalities are lowercase in Norwegian.
    test: /(?<!^|[.!?]\s)\b(Norsk|Engelsk|Spansk|Arabisk|Polsk|Ukrainsk|Fransk)\b/u,
    fix: (s) => s.replace(/(?<!^|[.!?]\s)\b(Norsk|Engelsk|Spansk|Arabisk|Polsk|Ukrainsk|Fransk)\b/gu, (w) => w.toLowerCase()),
    why: "languages are written in lowercase",
  },
  {
    // Place names are capitalised.
    test: /\b(oslo|norge|bergen|trondheim|stavanger|tromsø|spania|polen|ukraina|syria|somalia|frankrike)\b/u,
    fix: (s) => s.replace(/\b(oslo|norge|bergen|trondheim|stavanger|tromsø|spania|polen|ukraina|syria|somalia|frankrike)\b/gu, (w) => w[0].toUpperCase() + w.slice(1)),
    why: "place names start with a capital letter",
  },
  {
    // "Jeg har bo" style: "har bodd"
    test: /\bhar bo\b/i,
    fix: (s) => s.replace(/\bhar bo\b/gi, "har bodd"),
    why: "after «har» use «bodd»",
  },
];

export function correct(text: string): { corrected: string; why: string } | null {
  let out = text;
  const reasons: string[] = [];
  for (const r of RULES) {
    if (r.test.test(out)) {
      out = r.fix(out);
      reasons.push(r.why);
    }
  }
  return reasons.length && out !== text ? { corrected: out, why: reasons.join(" · ") } : null;
}

/** Privacy: stop people sharing contact details with strangers (it's nicknames only). */
export function contactInfoWarning(text: string): string | null {
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) return "an email address";
  if (/(\+?\d[\d\s-]{6,}\d)/.test(text)) return "a phone number";
  if (/\b(https?:\/\/|www\.)\S+/i.test(text) || /\b(snap(chat)?|insta(gram)?|whatsapp|telegram|facebook|tiktok)\b/i.test(text))
    return "a link or social media account";
  return null;
}

/** Phrasebook phrases used in a message, so the learner can look them up. */
export function phrasesUsed(text: string): Phrase[] {
  const lower = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ")} `;
  return phrases.filter((ph) => {
    const variants = ph.text.replace(/\([^)]*\)/g, "").replace(/…/g, "").split("/");
    return variants.some((v) => {
      const raw = v.trim().toLowerCase();
      const prefix = raw.endsWith("-");
      const w = raw.replace(/-$/, "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
      if (w.length < 3) return false;
      return prefix ? new RegExp(`\\s${w}\\p{L}+`, "u").test(lower) : lower.includes(` ${w} `);
    });
  });
}
