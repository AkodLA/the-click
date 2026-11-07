"use client";
/**
 * My notes: a little notebook for things the learner wants to remember («digg» = nice, a tricky sound…).
 * Saved only in this browser (localStorage), never on our server: notes can be personal.
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

const KEY = "snakk.notes.v1";
const MAX_LENGTH = 500;
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function writeNotes(notes: Note[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false; // private mode or storage full
  } finally {
    listeners.forEach((l) => l());
  }
}

function useNotes(): Note[] {
  const raw = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readRaw,
    () => "[]",
  );
  try {
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const SPECIAL = ["æ", "ø", "å", "Æ", "Ø", "Å", "«", "»"];

export function NotesBoard() {
  const notes = useNotes();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ note: Note; index: number } | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  // Where to put the cursor after a letter button inserted text (applied once React has updated the box).
  const caret = useRef<number | null>(null);
  const inputId = useId();

  useEffect(() => {
    if (caret.current === null) return;
    input.current?.focus();
    input.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [draft]);

  function save() {
    const text = draft.trim();
    if (!text) return;
    const note: Note = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
    if (writeNotes([note, ...notes])) {
      setDraft("");
      setError(null);
    } else {
      setError("Couldn't save on this device (private browsing?). Copy your note somewhere safe.");
    }
  }

  function remove(id: string) {
    const index = notes.findIndex((n) => n.id === id);
    if (index < 0) return;
    setLastDeleted({ note: notes[index], index });
    writeNotes(notes.filter((n) => n.id !== id));
  }

  function undoDelete() {
    if (!lastDeleted) return;
    const next = [...notes];
    next.splice(lastDeleted.index, 0, lastDeleted.note);
    writeNotes(next);
    setLastDeleted(null);
  }

  /** Insert a special letter where the cursor is. */
  function insert(ch: string) {
    const el = input.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = (draft.slice(0, start) + ch + draft.slice(end)).slice(0, MAX_LENGTH);
    caret.current = start + ch.length;
    setDraft(next);
  }

  return (
    <section id="notes" aria-labelledby={`${inputId}-title`} className="scroll-mt-20">
      <SectionTitle action={<span className="text-sm font-semibold text-muted">🔒 Only on this device</span>}>
        <span id={`${inputId}-title`}>📝 My notes</span>
      </SectionTitle>

      <Card className="flex flex-col gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-muted">
          Write down anything you want to remember: a new word, a tricky sound, when to say what.
        </label>
        <textarea
          id={inputId}
          ref={input}
          value={draft}
          maxLength={MAX_LENGTH}
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          }}
          placeholder="e.g. «koselig» = cosy, nice. Say it: KOO-seh-lee"
          className="w-full resize-y rounded-2xl border-2 border-line bg-surface-2 p-3 text-base outline-none transition focus:border-brand"
        />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Add a Norwegian letter">
          {SPECIAL.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => insert(ch)}
              aria-label={`Add ${ch}`}
              className="flex h-10 min-w-10 items-center justify-center rounded-xl border-2 border-line bg-surface px-2 font-display text-lg font-semibold transition hover:bg-surface-2"
            >
              {ch}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted tabular-nums">
            {draft.length}/{MAX_LENGTH}
          </span>
        </div>
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm font-semibold text-danger">
            ⚠️ {error}
          </p>
        )}
        <Button onClick={save} disabled={!draft.trim()}>
          📌 Save note
        </Button>
      </Card>

      {lastDeleted && (
        <p role="status" className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-2 text-sm font-semibold">
          Note deleted.
          <button type="button" onClick={undoDelete} className="h-9 rounded-full px-3 font-bold text-brand hover:bg-brand-soft">
            ↩️ Undo
          </button>
        </p>
      )}

      {notes.length === 0 ? (
        <p className="mt-4 rounded-2xl border-2 border-dashed border-line p-5 text-center text-sm text-muted">
          No notes yet. Your first one will appear here. ✨
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {notes.map((n, i) => (
            <li
              key={n.id}
              className={`flex flex-col gap-2 rounded-2xl border-2 border-line bg-sun/25 p-4 shadow-[0_3px_0_var(--line)] ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}
            >
              <p className="whitespace-pre-wrap break-words">{n.text}</p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <time dateTime={n.createdAt} className="text-xs font-semibold text-muted">
                  {new Date(n.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </time>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  aria-label="Delete this note"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger"
                >
                  <span aria-hidden>🗑️</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
