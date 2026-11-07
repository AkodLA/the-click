"use client";
/**
 * Notes (/notes): the learner's notebooks. Words saved anywhere in the app with "📒 Save" are filed
 * automatically (Everyday, Formal, Slang, Corrections, Writing); "My own" holds what they write themselves.
 * The open notebook lives in the URL hash (/notes#slang) so "Saved in …" links land in the right place.
 * Everything is stored only in this browser (see notes-store.ts).
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button, Card, RegisterTag, SectionTitle } from "@/components/ui";
import { NOTEBOOKS, SOURCE_LABEL, notesActions, useNotes, type Note, type NotebookId } from "./notes-store";

const MAX_LENGTH = 500;
const SPECIAL = ["æ", "ø", "å", "Æ", "Ø", "Å", "«", "»"];

// ---- open notebook = URL hash ----
function readHash(): string {
  return window.location.hash.slice(1);
}
function subscribeHash(l: () => void) {
  window.addEventListener("hashchange", l);
  return () => window.removeEventListener("hashchange", l);
}
function useOpenNotebook(): NotebookId | "all" {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  return NOTEBOOKS.some((b) => b.id === hash) ? (hash as NotebookId) : "all";
}
function openNotebook(id: NotebookId | "all") {
  // pushState keeps the scroll position (setting location.hash would jump to an element with that id).
  history.pushState(null, "", id === "all" ? window.location.pathname : `#${id}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function NotesView() {
  const notes = useNotes();
  const open = useOpenNotebook();
  const [query, setQuery] = useState("");
  const [lastDeleted, setLastDeleted] = useState<{ note: Note; index: number } | null>(null);

  const book = NOTEBOOKS.find((b) => b.id === open);
  const q = query.trim().toLowerCase();
  const shown = notes.filter(
    (n) => (open === "all" || n.notebook === open) && (!q || [n.text, n.meaning ?? "", n.soundsLike ?? ""].join(" ").toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[2rem] border-2 border-brand-deep bg-brand p-6 text-brand-ink shadow-[0_5px_0_var(--brand-deep)]">
        <p className="font-display text-lg font-medium opacity-90">📒 Notes</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">Your notebooks</h1>
        <p className="mt-2 text-sm opacity-90">
          Tap <b>📒 Save</b> on any word in Snakk and it lands in the right notebook. Or write your own below.
        </p>
        <p className="mt-3 text-xs font-semibold opacity-80">
          {notes.length} {notes.length === 1 ? "note" : "notes"} · 🔒 saved only on this device
        </p>
      </section>

      {/* The shelf */}
      <section aria-label="Notebooks">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ShelfButton active={open === "all"} onClick={() => openNotebook("all")} emoji="📚" name="All notes" count={notes.length} color="bg-ink" />
          {NOTEBOOKS.map((b) => (
            <ShelfButton
              key={b.id}
              active={open === b.id}
              onClick={() => openNotebook(b.id)}
              emoji={b.emoji}
              name={b.name}
              hint={b.hint}
              count={notes.filter((n) => n.notebook === b.id).length}
              color={b.color}
            />
          ))}
        </div>
      </section>

      <Composer defaultNotebook={book?.id ?? "mine"} />

      {/* Open notebook */}
      <section aria-labelledby="notebook-title">
        <SectionTitle action={<span className="text-sm font-semibold text-muted">{shown.length} shown</span>}>
          <span id="notebook-title">{book ? `${book.emoji} ${book.name}` : "📚 All notes"}</span>
        </SectionTitle>
        <label className="relative mb-4 block">
          <span className="sr-only">Search your notes</span>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" aria-hidden>
            🔎
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a word or meaning…"
            className="h-12 w-full rounded-full border-2 border-line bg-surface pl-11 pr-4 outline-none transition focus:border-brand"
          />
        </label>

        {lastDeleted && (
          <p role="status" className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-2 text-sm font-semibold">
            Note deleted.
            <button
              type="button"
              onClick={() => {
                notesActions.restore(lastDeleted);
                setLastDeleted(null);
              }}
              className="h-9 rounded-full px-3 font-bold text-brand hover:bg-brand-soft"
            >
              ↩️ Undo
            </button>
          </p>
        )}

        {shown.length === 0 ? (
          <EmptyState searching={!!q} notebook={book?.id} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {shown.map((n, i) => (
              <NoteCard key={n.id} note={n} tilt={i % 2 === 1} onDelete={() => setLastDeleted(notesActions.remove(n.id))} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ShelfButton({ active, onClick, emoji, name, hint, count, color }: { active: boolean; onClick: () => void; emoji: string; name: string; hint?: string; count: number; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex min-h-24 flex-col gap-1 overflow-hidden rounded-2xl border-2 py-3 pl-5 pr-3 text-left transition ${
        active ? "border-brand bg-brand-soft shadow-[0_4px_0_var(--brand-deep)]" : "border-line bg-surface shadow-[0_4px_0_var(--line)] hover:-translate-y-0.5"
      }`}
    >
      {/* Notebook spine */}
      <span className={`absolute inset-y-0 left-0 w-2 ${color}`} aria-hidden />
      <span className="flex items-center justify-between gap-2">
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-sm font-bold tabular-nums">
          {count}
          <span className="sr-only"> notes</span>
        </span>
      </span>
      <span className="block font-display text-lg font-semibold leading-tight">{name}</span>
      {hint && <span className="hidden text-xs text-muted sm:block">{hint}</span>}
    </button>
  );
}

/** Write your own note, into any notebook. */
function Composer({ defaultNotebook }: { defaultNotebook: NotebookId }) {
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<NotebookId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  // Where to put the cursor after a letter button inserted text (applied once React has updated the box).
  const caret = useRef<number | null>(null);
  const id = useId();
  const notebook = picked ?? defaultNotebook;

  useEffect(() => {
    if (caret.current === null) return;
    input.current?.focus();
    input.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [draft]);

  function save() {
    const text = draft.trim();
    if (!text) return;
    if (notesActions.add({ text, source: "manual", notebook })) {
      setDraft("");
      setError(null);
      if (window.location.hash.slice(1) !== notebook) openNotebook(notebook);
    } else {
      setError("Couldn't save on this device (private browsing?). Copy your note somewhere safe.");
    }
  }

  function insert(ch: string) {
    const el = input.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    caret.current = start + ch.length;
    setDraft((draft.slice(0, start) + ch + draft.slice(end)).slice(0, MAX_LENGTH));
  }

  return (
    <Card className="flex flex-col gap-3">
      <label htmlFor={id} className="font-display text-lg font-semibold">
        ✍️ Write your own note
      </label>
      <textarea
        id={id}
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
      <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        Save in
        <select
          value={notebook}
          onChange={(e) => setPicked(e.target.value as NotebookId)}
          className="h-10 rounded-full border-2 border-line bg-surface px-3 font-semibold outline-none focus:border-brand"
        >
          {NOTEBOOKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.emoji} {b.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm font-semibold text-danger">
          ⚠️ {error}
        </p>
      )}
      <Button onClick={save} disabled={!draft.trim()}>
        📌 Save note
      </Button>
    </Card>
  );
}

function NoteCard({ note, tilt, onDelete }: { note: Note; tilt: boolean; onDelete: () => void }) {
  const isWord = note.source !== "manual";
  return (
    <li className={`flex flex-col gap-2 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_3px_0_var(--line)] ${tilt ? "rotate-[0.4deg]" : "-rotate-[0.4deg]"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {note.register && <RegisterTag register={note.register} />}
        <span className="text-xs font-semibold text-muted">{SOURCE_LABEL[note.source]}</span>
      </div>
      {isWord ? (
        <div>
          <p className="font-display text-2xl font-bold leading-tight" lang="nb">
            {note.text}
          </p>
          {note.soundsLike && (
            <p className="text-sm italic tracking-wide text-muted opacity-70">
              <span className="sr-only">Sounds like: </span>🗣️ {note.soundsLike}
            </p>
          )}
          {note.meaning && <p className="mt-1">{note.meaning}</p>}
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words">{note.text}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <time dateTime={note.createdAt} className="text-xs font-semibold text-muted">
          {new Date(note.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
        </time>
        {note.href && (
          <Link href={note.href} className="text-xs font-bold text-brand hover:underline">
            Open →
          </Link>
        )}
        <label className="ml-auto">
          <span className="sr-only">Move «{note.text.slice(0, 30)}» to another notebook</span>
          <select
            value={note.notebook}
            onChange={(e) => notesActions.move(note.id, e.target.value as NotebookId)}
            className="h-9 max-w-36 rounded-full border-2 border-line bg-surface px-2 text-xs font-semibold outline-none focus:border-brand"
          >
            {NOTEBOOKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {b.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete this note"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger"
        >
          <span aria-hidden>🗑️</span>
        </button>
      </div>
    </li>
  );
}

function EmptyState({ searching, notebook }: { searching: boolean; notebook?: NotebookId }) {
  const where: Partial<Record<NotebookId, { href: string; text: string }>> = {
    everyday: { href: "/phrases", text: "Find words in the Phrasebook" },
    formal: { href: "/phrases", text: "Find formal phrases in the Phrasebook" },
    slang: { href: "/phrases", text: "Find slang in the Phrasebook" },
    corrections: { href: "/speak", text: "Talk with your tutor" },
    writing: { href: "/write", text: "Practise writing" },
  };
  const tip = notebook ? where[notebook] : { href: "/phrases", text: "Open the Phrasebook" };
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line p-6 text-center">
      <p className="text-3xl" aria-hidden>
        {searching ? "🔎" : "✨"}
      </p>
      <p className="text-sm text-muted">
        {searching ? "No notes match that search." : "Nothing here yet. Tap 📒 Save next to any word and it shows up here."}
      </p>
      {!searching && tip && (
        <Button href={tip.href} variant="secondary">
          {tip.text} →
        </Button>
      )}
    </div>
  );
}
