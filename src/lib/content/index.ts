/**
 * All learning content in one import:  import { phrases, scenarios } from "@/lib/content";
 * Static data with no secrets, so it's safe in both server and "use client" files.
 */
export * from "./types";
export * from "./phrases";
export * from "./scenarios";
export * from "./placement";
export * from "./community";

import type { Register } from "./types";

/** Labels + Tailwind classes for the register tag on every phrase card. */
export const REGISTER_STYLE: Record<Register, { label: string; className: string; hint: string }> = {
  slang: { label: "Slang", className: "bg-reg-slang/15 text-reg-slang", hint: "Friends only" },
  informal: { label: "Informal", className: "bg-reg-informal/15 text-reg-informal", hint: "Everyday life" },
  neutral: { label: "Neutral", className: "bg-reg-neutral/15 text-reg-neutral", hint: "Safe everywhere" },
  formal: { label: "Formal", className: "bg-reg-formal/15 text-reg-formal", hint: "Work, doctor, school" },
};

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
