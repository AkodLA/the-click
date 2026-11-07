"use client";
/**
 * T20: spaced review for vocabulary (a simple Leitner system).
 * A word you know comes back after 1, 3, 7, 14 and 30 days; "again" sends it back to the start.
 * Stored only in this browser. Display only: reviews give no XP (first-time learning does, on the server).
 */
import { useSyncExternalStore } from "react";

const INTERVAL_DAYS = [1, 3, 7, 14, 30];
const DAY = 86_400_000;
const KEY = "snakk.review.v1";

export interface ReviewCard {
  box: number; // 0..INTERVAL_DAYS.length-1
  due: number; // epoch ms
}
type Store = Record<string, ReviewCard>;

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Store = {};
const EMPTY: Store = {};

function read(): Store {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // private mode
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as Store) : {};
    } catch {
      cached = {};
    }
  }
  return cached;
}

function write(s: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // private mode
  }
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

export function useReview(): Store {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

/** First time you know a word: it comes back tomorrow. */
export function startReview(wordId: string, now = Date.now()) {
  const s = read();
  if (s[wordId]) return;
  write({ ...s, [wordId]: { box: 0, due: now + INTERVAL_DAYS[0] * DAY } });
}

/** After a review: "got it" moves the word up a box, "again" starts over (back tomorrow). */
export function answerReview(wordId: string, gotIt: boolean, now = Date.now()) {
  const s = read();
  const card = s[wordId] ?? { box: 0, due: now };
  const box = gotIt ? Math.min(card.box + 1, INTERVAL_DAYS.length - 1) : 0;
  write({ ...s, [wordId]: { box, due: now + INTERVAL_DAYS[box] * DAY } });
}

export function dueIds(store: Store, now: number): string[] {
  return Object.entries(store)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export function nextDueInDays(card: ReviewCard | undefined, now: number): number | null {
  // round, not ceil: "now" can be a few seconds old, which must not turn 1 day into 2
  return card ? Math.max(0, Math.round((card.due - now) / DAY)) : null;
}
