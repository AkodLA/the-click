"use client";
/**
 * "📒 Save" button for any word or phrase the learner meets (phrase cards, tutor, tandem, write).
 * One tap files it in the right notebook (see notebookFor); afterwards it shows where it went.
 *   <SaveToNotes text="Digg!" meaning="Nice!" register="informal" source="phrasebook" href="/phrases?id=digg" />
 */
import Link from "next/link";
import { useState } from "react";
import { findNote, NOTEBOOKS, notesActions, useNotes, type NewNote } from "./notes-store";

export function SaveToNotes({ size = "md", className = "", ...note }: NewNote & { size?: "sm" | "md"; className?: string }) {
  const notes = useNotes();
  const saved = findNote(notes, note.text);
  const [failed, setFailed] = useState(false);
  const book = saved ? NOTEBOOKS.find((b) => b.id === saved.notebook) : undefined;
  const sm = size === "sm";

  if (saved && book) {
    return (
      <Link
        href={`/notes#${book.id}`}
        aria-label={`«${note.text}» is saved in your ${book.name} notebook. Open it`}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-success bg-success-soft font-bold text-success transition hover:brightness-95 ${sm ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm"} ${className}`}
      >
        ✓ <span aria-hidden>{book.emoji}</span> {sm ? "Saved" : `Saved in ${book.name}`}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setFailed(notesActions.add(note) === null)}
      aria-label={`Save «${note.text}» to my notes`}
      title={failed ? "Couldn't save on this device (private browsing?)" : "Save to my notes"}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border-2 font-bold transition hover:-translate-y-0.5 ${
        failed ? "border-danger bg-danger-soft text-danger" : "border-line bg-surface text-ink shadow-[0_3px_0_var(--line)] hover:bg-surface-2"
      } ${sm ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm"} ${className}`}
    >
      <span aria-hidden>📒</span> {failed ? "Couldn't save" : "Save"}
    </button>
  );
}
