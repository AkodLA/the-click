"use client";
/**
 * T20: the learner's personal settings: age GROUP, field of work/study, interests.
 * Stored only in this browser (localStorage): it never affects XP and never reaches our server,
 * except as a few words the voice tutor gets so it can talk about your world.
 *
 *   const prefs = usePrefs();          // { ageGroup, field, interests } or EMPTY_PREFS
 *   savePrefs({ ...prefs, field: "it" });
 */
import { useSyncExternalStore } from "react";
import type { AgeGroup, FieldId, InterestId } from "@/lib/content/types";

export interface Prefs {
  ageGroup: AgeGroup | null;
  field: FieldId | null;
  interests: InterestId[];
  /** T21: team code for the team league (a class or workplace). */
  teamCode?: string | null;
}

export const EMPTY_PREFS: Prefs = { ageGroup: null, field: null, interests: [] };
export const MAX_INTERESTS = 3;

export const AGE_GROUPS: { id: AgeGroup; label: string; hint: string }[] = [
  { id: "teen", label: "13–17", hint: "School, friends, slang that fits" },
  { id: "young", label: "18–29", hint: "Studies, first jobs, social life" },
  { id: "adult", label: "30–59", hint: "Work, family, everyday life" },
  { id: "senior", label: "60+", hint: "Calm pace, polite forms first" },
];

const KEY = "snakk.prefs.v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Prefs = EMPTY_PREFS;

function parse(raw: string | null): Prefs {
  if (!raw) return EMPTY_PREFS;
  try {
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      ageGroup: p.ageGroup ?? null,
      field: p.field ?? null,
      interests: Array.isArray(p.interests) ? p.interests.slice(0, MAX_INTERESTS) : [],
      teamCode: typeof p.teamCode === "string" ? p.teamCode : null,
    };
  } catch {
    return EMPTY_PREFS;
  }
}

function read(): Prefs {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // private mode: settings last for this tab only
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

export function savePrefs(p: Prefs) {
  const raw = JSON.stringify({ ...p, interests: p.interests.slice(0, MAX_INTERESTS) });
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    // private mode
  }
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      const onStorage = (e: StorageEvent) => e.key === KEY && l();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(l);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => EMPTY_PREFS,
  );
}

export function hasPrefs(p: Prefs): boolean {
  return Boolean(p.ageGroup || p.field || p.interests.length);
}
