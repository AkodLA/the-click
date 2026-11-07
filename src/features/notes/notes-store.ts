"use client";
/**
 * My notes: words and notes the learner wants to keep, sorted into notebooks.
 * Saved only in this browser (localStorage), never on our server: notes can be personal.
 *
 *   const notes = useNotes();
 *   notesActions.add({ text: "Digg!", meaning: "Nice!", register: "informal", source: "phrasebook" });
 *   // → lands in the right notebook automatically (see notebookFor)
 */
import { useSyncExternalStore } from "react";
import type { Register } from "@/lib/content/types";

export type NotebookId = "everyday" | "formal" | "slang" | "corrections" | "writing" | "mine";

/** The notebooks, in shelf order. */
export const NOTEBOOKS: { id: NotebookId; emoji: string; name: string; hint: string; color: string }[] = [
  { id: "everyday", emoji: "🏠", name: "Everyday", hint: "Casual and neutral words for daily life", color: "bg-reg-neutral" },
  { id: "formal", emoji: "🎩", name: "Formal", hint: "Work, doctor, school, NAV", color: "bg-reg-formal" },
  { id: "slang", emoji: "😎", name: "Slang", hint: "Friends only", color: "bg-reg-slang" },
  { id: "corrections", emoji: "✏️", name: "Corrections", hint: "Fixes from your tutor and tandem", color: "bg-warn" },
  { id: "writing", emoji: "🔤", name: "Writing", hint: "Words from the Write section", color: "bg-success" },
  { id: "mine", emoji: "📝", name: "My own", hint: "Anything you wrote yourself", color: "bg-accent" },
];

/** Where a note came from, shown as a small label. */
export type NoteSource = "phrasebook" | "speak" | "correction" | "tandem" | "write" | "manual";
export const SOURCE_LABEL: Record<NoteSource, string> = {
  phrasebook: "📖 Phrasebook",
  speak: "🎙️ Speak",
  correction: "✏️ Tutor fix",
  tandem: "🤝 Tandem",
  write: "✍️ Write",
  manual: "📝 Written by you",
};

export interface Note {
  id: string;
  notebook: NotebookId;
  /** The word / phrase, or the free text of a note you wrote. */
  text: string;
  meaning?: string;
  /** Plain-letter pronunciation, e.g. "SHAIR-ah". */
  soundsLike?: string;
  register?: Register;
  source: NoteSource;
  /** Where to go to see it again, e.g. "/phrases?id=digg". */
  href?: string;
  createdAt: string;
}

export type NewNote = Omit<Note, "id" | "notebook" | "createdAt"> & { notebook?: NotebookId };

/** Auto-sorting: corrections and writing get their own notebooks, everything else follows the register. */
export function notebookFor(note: Pick<NewNote, "source" | "register" | "notebook">): NotebookId {
  if (note.notebook) return note.notebook;
  if (note.source === "correction" || note.source === "tandem") return "corrections";
  if (note.source === "write") return "writing";
  if (note.source === "manual") return "mine";
  if (note.register === "formal") return "formal";
  if (note.register === "slang") return "slang";
  return "everyday";
}

// ---------- storage ----------
const KEY = "snakk.notes.v2";
const OLD_KEY = "snakk.notes.v1"; // plain notes from the first version: moved into "My own"
const EMPTY = "[]";
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== null) return raw;
    const old = window.localStorage.getItem(OLD_KEY);
    if (!old) return EMPTY;
    const migrated = (JSON.parse(old) as { id: string; text: string; createdAt: string }[]).map<Note>((n) => ({
      ...n,
      notebook: "mine",
      source: "manual",
    }));
    const json = JSON.stringify(migrated);
    window.localStorage.setItem(KEY, json);
    window.localStorage.removeItem(OLD_KEY);
    return json;
  } catch {
    return EMPTY;
  }
}

function parse(raw: string): Note[] {
  try {
    const list = JSON.parse(raw) as Note[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Cache the parsed list per raw string so useSyncExternalStore gets a stable snapshot.
let cache: { raw: string; notes: Note[] } = { raw: EMPTY, notes: [] };
function snapshot(): Note[] {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, notes: parse(raw) };
  return cache.notes;
}
const SERVER_SNAPSHOT: Note[] = [];

function save(notes: Note[]): boolean {
  let ok = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    ok = false; // private mode or storage full
  }
  listeners.forEach((l) => l());
  return ok;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useNotes(): Note[] {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAPSHOT);
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The saved note for this word, if any (to show "✓ Saved"). */
export function findNote(notes: Note[], text: string): Note | undefined {
  return notes.find((n) => n.source !== "manual" && same(n.text, text));
}

export const notesActions = {
  /** Add a note; a word that's already saved isn't added twice. Returns the note, or null if it couldn't be stored. */
  add(input: NewNote): Note | null {
    const notes = snapshot();
    if (input.source !== "manual") {
      const existing = findNote(notes, input.text);
      if (existing) return existing;
    }
    const note: Note = {
      ...input,
      text: input.text.trim(),
      notebook: notebookFor(input),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return save([note, ...notes]) ? note : null;
  },
  remove(id: string): { note: Note; index: number } | null {
    const notes = snapshot();
    const index = notes.findIndex((n) => n.id === id);
    if (index < 0) return null;
    save(notes.filter((n) => n.id !== id));
    return { note: notes[index], index };
  },
  restore(removed: { note: Note; index: number }) {
    const next = [...snapshot()];
    next.splice(Math.min(removed.index, next.length), 0, removed.note);
    save(next);
  },
  move(id: string, notebook: NotebookId) {
    save(snapshot().map((n) => (n.id === id ? { ...n, notebook } : n)));
  },
};
