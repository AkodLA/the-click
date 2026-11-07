"use client";
/**
 * T21 explain-a-word: Norwegian text where every word can be tapped.
 * The sheet shows meaning, register, level and an example from our content, a listen button,
 * on-device translation (T19) for words we don't have, and a link to learn it.
 *
 *   <ExplainText text="Pizzaen var skikkelig digg." />
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge, RegisterTag } from "@/components/ui";
import { TranslateButton } from "@/features/translate/translate-button";
import { useProgress } from "@/lib/progress/store";
import { speakNorwegian } from "@/lib/speech";
import { lookup, normWord } from "./dictionary";

export function ExplainText({ text, className = "" }: { text: string; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  // Split into words and the bits between them, keeping punctuation and spaces as they are.
  const parts = text.split(/([A-Za-zÆØÅæøåÉéÜüÖöÄä'-]+)/);
  // Keep punctuation glued to its word («meg?», «Hjelp!) so a line never starts with «?» or ends with «.
  // Each separator (even index) = [sticks to the word before, free part, sticks to the word after].
  const glue = parts.map((sep, i): [string, string, string] => {
    if (i % 2 === 1) return ["", "", ""];
    if (i === 0) return ["", sep.replace(/\S+$/, ""), sep.match(/\S*$/)?.[0] ?? ""];
    if (i === parts.length - 1) return [sep.match(/^\S*/)?.[0] ?? "", sep.replace(/^\S+/, ""), ""];
    const m = sep.match(/^(\S*)(\s[\s\S]*\s|\s)(\S*)$/);
    return m ? [m[1], m[2], m[3]] : [sep, "", ""]; // no space (e.g. «,» in «1,5»): glue it to the word before
  });
  return (
    <>
      <span className={className} lang="nb">
        {parts.map((part, i) => {
          if (i % 2 === 0) return glue[i][1] ? <span key={i}>{glue[i][1]}</span> : null;
          const word =
            normWord(part).length >= 2 ? (
              <button
                type="button"
                onClick={() => setOpen(part)}
                className="cursor-help rounded decoration-muted/60 decoration-dotted underline-offset-4 hover:underline focus-visible:underline"
                aria-label={`Explain «${part}»`}
              >
                {part}
              </button>
            ) : (
              part
            );
          return (
            <span key={i} className="whitespace-nowrap">
              {glue[i - 1][2]}
              {word}
              {glue[i + 1]?.[0]}
            </span>
          );
        })}
      </span>
      {/* Portal: the sheet is a <dialog>, which must not sit inside the <p> that holds the text. */}
      {open && createPortal(<ExplainSheet word={open} onClose={() => setOpen(null)} />, document.body)}
    </>
  );
}

function ExplainSheet({ word, onClose }: { word: string; onClose: () => void }) {
  const p = useProgress();
  const entry = lookup(word);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      aria-label={`About «${word}»`}
      className="mb-0 mt-auto w-full max-w-lg rounded-t-[2rem] border-2 border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-ink/30 sm:m-auto sm:rounded-[2rem]"
    >
      <div className="flex flex-col gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          {entry?.picture && (
            <span role="img" aria-label={`Picture: ${entry.en}`} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-brand-soft text-4xl shadow-[0_3px_0_var(--line)] font-[family-name:var(--font-emoji)]">
              {entry.picture}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-black" lang="nb">
              {word}
            </p>
            {entry && entry.headword.toLowerCase() !== word.toLowerCase() && (
              <p className="text-sm text-muted">
                from <span className="font-semibold" lang="nb">{entry.headword}</span>
              </p>
            )}
          </div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-lg">
            ✕
          </button>
        </div>

        {entry ? (
          <>
            <p className="text-lg font-bold">{entry.en}</p>
            <div className="flex flex-wrap gap-2">
              <RegisterTag register={entry.register} withHint />
              <Badge tone="muted">{entry.level}</Badge>
            </div>
            {entry.example && (
              <div className="rounded-2xl bg-surface-2 p-3 text-sm">
                <p className="font-semibold" lang="nb">
                  «{entry.example.no}»
                </p>
                <p className="text-muted">{entry.example.en}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Not in our phrasebook yet. Translate it on your device:</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => speakNorwegian(word, { slow: true })} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold">
            🔊 Listen
          </button>
          {entry && (
            <Link href={entry.href} onClick={() => dialog.current?.close()} className="inline-flex h-11 items-center rounded-full bg-brand-soft px-4 text-sm font-semibold text-brand">
              📖 Learn it
            </Link>
          )}
        </div>
        {(!entry || p.nativeLanguage !== "en") && <TranslateButton text={word} from="nb" to={p.nativeLanguage === "nb" ? "en" : p.nativeLanguage} />}
      </div>
    </dialog>
  );
}
