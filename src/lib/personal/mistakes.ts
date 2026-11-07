"use client";
/**
 * T21 mistake notebook: every correction the learner got, in one place, to review later.
 * Sources: the voice tutor's correction cards (flag_register), Tandem «small fixes», and words the
 * pronunciation check didn't hear. Stored only in this browser (like My words review); no XP.
 *
 *   recordMistake({ source: "tutor", said: "sykt bra", better: "veldig bra", note: "slang in a formal room" });
 *   const list = useMistakes();
 */
import { useSyncExternalStore } from "react";

export type MistakeSource = "tutor" | "tandem" | "pronunciation";

export interface Mistake {
  id: string;
  source: MistakeSource;
  said: string;
  better: string;
  note?: string;
  /** How many times it happened (same said → better). */
  count: number;
  last: number;
}

const KEY = "snakk.mistakes.v1";
const MAX = 200;
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Mistake[] = [];
const EMPTY: Mistake[] = [];

function read(): Mistake[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // private mode
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as Mistake[]) : [];
    } catch {
      cached = [];
    }
  }
  return cached;
}

function write(list: Mistake[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // private mode
  }
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[«».,!?]/g, "");

/** Add (or count again) a correction. Ignores empty ones. */
export function recordMistake(m: { source: MistakeSource; said: string; better: string; note?: string }) {
  if (typeof window === "undefined") return;
  const said = m.said.trim().slice(0, 200);
  const better = m.better.trim().slice(0, 200);
  if (!said || !better || norm(said) === norm(better)) return;
  const id = `${m.source}:${norm(said)}→${norm(better)}`;
  const list = read();
  const existing = list.find((x) => x.id === id);
  const next: Mistake = existing
    ? { ...existing, count: existing.count + 1, last: Date.now(), note: m.note ?? existing.note }
    : { id, source: m.source, said, better, note: m.note, count: 1, last: Date.now() };
  write([next, ...list.filter((x) => x.id !== id)]);
}

export function removeMistake(id: string) {
  write(read().filter((x) => x.id !== id));
}

export function useMistakes(): Mistake[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

/** The correction that happened most often (for the weekly summary). */
export function topMistake(list: Mistake[]): Mistake | undefined {
  return [...list].sort((a, b) => b.count - a.count || b.last - a.last)[0];
}

export const SOURCE_LABEL: Record<MistakeSource, string> = {
  tutor: "🎙️ Tutor",
  tandem: "🤝 Tandem",
  pronunciation: "🎯 Pronunciation",
};
