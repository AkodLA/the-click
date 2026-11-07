/**
 * All learning content in one import:  import { phrases, scenarios } from "@/lib/content";
 * Static data with no secrets, so it's safe in both server and "use client" files.
 */
export * from "./types";
export * from "./phrases";
export * from "./scenarios";
export * from "./placement";
export * from "./community";
export * from "./vocab";

import type { Register } from "./types";

/** Labels + Tailwind classes for the register tag on every phrase card. */
export const REGISTER_STYLE: Record<Register, { label: string; className: string; hint: string }> = {
  slang: { label: "Slang", className: "bg-reg-slang/15 text-reg-slang", hint: "Friends only" },
  informal: { label: "Informal", className: "bg-reg-informal/15 text-reg-informal", hint: "Everyday life" },
  neutral: { label: "Neutral", className: "bg-reg-neutral/15 text-reg-neutral", hint: "Safe everywhere" },
  formal: { label: "Formal", className: "bg-reg-formal/15 text-reg-formal", hint: "Work, doctor, school" },
};

/** Languages a learner can pick right now (as "I speak" and "I want to learn"). The rest show as coming soon. */
export const AVAILABLE_LANGUAGES = ["en", "nb"] as const;
export type AvailableLanguage = (typeof AVAILABLE_LANGUAGES)[number];

/** Language picker options: flag + name in that language, so people recognise their own. */
export const LANGUAGE_OPTIONS: { code: string; flag: string; name: string; nativeName: string; available: boolean }[] = [
  { code: "en", flag: "🇬🇧", name: "English", nativeName: "English", available: true },
  { code: "nb", flag: "🇳🇴", name: "Norwegian", nativeName: "Norsk", available: true },
  { code: "es", flag: "🇪🇸", name: "Spanish", nativeName: "Español", available: false },
  { code: "ar", flag: "🇸🇦", name: "Arabic", nativeName: "العربية", available: false },
  { code: "pl", flag: "🇵🇱", name: "Polish", nativeName: "Polski", available: false },
  { code: "uk", flag: "🇺🇦", name: "Ukrainian", nativeName: "Українська", available: false },
  { code: "so", flag: "🇸🇴", name: "Somali", nativeName: "Soomaali", available: false },
  { code: "fr", flag: "🇫🇷", name: "French", nativeName: "Français", available: false },
];

export const LANGUAGE_NAMES: Record<string, string> = {
  nb: "Norwegian",
  en: "English",
  es: "Spanish",
  ar: "Arabic",
  pl: "Polish",
  uk: "Ukrainian",
  so: "Somali",
  fr: "French",
};
