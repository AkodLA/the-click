"use client";
// Learner progress, kept in the browser for the demo (no account needed).
// In production this moves to Supabase behind a login.
import { useSyncExternalStore } from "react";
import { LEVELS, type Level } from "./content";

export interface DeckCard {
  id: string;
  no: string; // the Norwegian phrase
  home?: string; // same phrase in the learner's language
  source: "tolk" | "laerer" | "slang";
  practiced: boolean;
}

export interface Progress {
  nick: string;
  homeLang: string; // e.g. "so"
  level: Level | null;
  xp: number;
  streak: number;
  lastDay: string | null; // YYYY-MM-DD
  achievements: string[];
  deck: DeckCard[];
  seenPhrases: string[];
  checkins: string[];
}

const KEY = "prat-progress-v1";
const EMPTY: Progress = {
  nick: "",
  homeLang: "so",
  level: null,
  xp: 0,
  streak: 0,
  lastDay: null,
  achievements: [],
  deck: [],
  seenPhrases: [],
  checkins: [],
};

let state: Progress = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    // Private mode or blocked storage: keep going in memory.
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* in-memory only */
  }
  listeners.forEach((l) => l());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function update(fn: (p: Progress) => Progress) {
  load();
  state = fn(state);
  save();
}

/** Toast queue for "+XP" and achievement pops. */
export type Toast = { id: number; text: string; icon: string };
let toasts: Toast[] = [];
const toastListeners = new Set<() => void>();
function pushToast(text: string, icon: string) {
  const t = { id: Date.now() + Math.random(), text, icon };
  toasts = [...toasts, t];
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l());
  }, 2600);
}
export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => (toastListeners.add(cb), () => toastListeners.delete(cb)),
    () => toasts,
    () => [],
  );
}

export function addXp(amount: number, reason: string) {
  update((p) => {
    const d = today();
    let streak = p.streak;
    if (p.lastDay !== d) {
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = p.lastDay === y ? p.streak + 1 : 1;
    }
    return { ...p, xp: p.xp + amount, lastDay: d, streak };
  });
  pushToast(`+${amount} XP · ${reason}`, "⭐");
}

export function unlock(id: string, title: string) {
  load();
  if (state.achievements.includes(id)) return;
  update((p) => ({ ...p, achievements: [...p.achievements, id] }));
  pushToast(title, "🏅");
}

export function addCard(card: Omit<DeckCard, "id" | "practiced">) {
  update((p) =>
    p.deck.some((c) => c.no.toLowerCase() === card.no.toLowerCase())
      ? p
      : { ...p, deck: [{ ...card, id: crypto.randomUUID(), practiced: false }, ...p.deck] },
  );
}

export function resetProgress() {
  state = EMPTY;
  save();
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (load(), state),
    () => EMPTY,
  );
}

/** XP needed per in-app level ("Nivå 1, 2, 3…"), separate from CEFR. */
export function xpLevel(xp: number) {
  const per = 500;
  return { n: Math.floor(xp / per) + 1, into: xp % per, per };
}

export function nextCefr(l: Level | null): Level {
  const i = l ? LEVELS.indexOf(l) : 0;
  return LEVELS[Math.min(i + 1, LEVELS.length - 1)];
}
