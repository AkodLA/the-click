"use client";
/**
 * The signature card of Snakk: a phrase WITH its context:
 * register tag · meaning · example · ✅ use when · 🚫 avoid when · 💡 say instead.
 * Owner: T7. Reused on Home ("phrase of the day"), the phrasebook and in scenarios.
 *
 *   <PhraseCard phrase={p} />                 full card
 *   <PhraseCard phrase={p} collapsible />     context hidden behind "When to use it" (phrasebook list)
 *   <PhraseCard phrase={p} compact />         no context at all
 */
import Link from "next/link";
import { useId, useState } from "react";
import { Badge, Card, RegisterTag } from "@/components/ui";
import { scenarios } from "@/lib/content";
import type { Phrase } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";
import { PlayButton } from "./play-button";

export function PhraseCard({
  phrase,
  compact = false,
  collapsible = false,
  defaultOpen = false,
  highlight = false,
}: {
  phrase: Phrase;
  compact?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Ring around the card, e.g. when another screen deep-linked to it (/phrases?id=digg). */
  highlight?: boolean;
}) {
  const p = useProgress();
  const learned = p.learnedPhraseIds.includes(phrase.id);
  const [open, setOpen] = useState(defaultOpen || !collapsible);
  const [saving, setSaving] = useState(false);
  const detailsId = useId();
  const usedIn = scenarios.filter((s) => s.keyPhraseIds.includes(phrase.id));
  const showDetails = !compact && open;

  async function markLearned() {
    setSaving(true);
    try {
      await progressActions.send({ type: "phrase_learned", phraseId: phrase.id });
    } catch {
      // The store already showed a toast; let the learner try again.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id={`phrase-${phrase.id}`} className={`flex scroll-mt-24 flex-col gap-4 ${highlight ? "ring-4 ring-brand/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PlayButton phraseId={phrase.id} text={phrase.text} label={`Play «${phrase.text}»`} />
          <div className="min-w-0">
            <p className="text-2xl font-black tracking-tight">{phrase.text}</p>
            <p className="text-muted">{phrase.meaning}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <RegisterTag register={phrase.register} withHint={!collapsible} />
          <Badge tone="brand">{phrase.level}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">«{phrase.example.no}»</p>
          <p className="text-sm text-muted">{phrase.example.en}</p>
        </div>
        <PlayButton phraseId={phrase.id} text={phrase.example.no} part="example" size="sm" label="Play the example sentence" />
      </div>

      {!compact && collapsible && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="-my-1 flex h-11 items-center justify-between rounded-2xl px-1 text-sm font-semibold text-brand"
        >
          {open ? "Hide context" : "When to use it (and when not)"}
          <span aria-hidden className={`transition ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
      )}

      {showDetails && (
        <dl id={detailsId} className="grid gap-3 text-sm">
          <div className="rounded-2xl bg-success-soft p-3">
            <dt className="font-bold text-success">✅ Use it when</dt>
            <dd>{phrase.useWhen}</dd>
          </div>
          <div className="rounded-2xl bg-danger-soft p-3">
            <dt className="font-bold text-danger">🚫 Avoid it when</dt>
            <dd>{phrase.avoidWhen}</dd>
          </div>
          <div className="rounded-2xl bg-brand-soft p-3">
            <dt className="font-bold text-brand">💡 Say instead</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {phrase.sayInstead.map((s) => (
                <span key={s} className="rounded-full bg-surface px-3 py-1 font-semibold">
                  {s}
                </span>
              ))}
            </dd>
          </div>
          {phrase.region && (
            <div className="px-1 text-xs text-muted">
              <dt className="inline font-semibold">📍 Where: </dt>
              <dd className="inline">{phrase.region}</dd>
            </div>
          )}
        </dl>
      )}

      {showDetails && usedIn.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">🎙️ Practise it out loud</p>
          <div className="flex flex-wrap gap-2">
            {usedIn.map((s) => (
              <Link
                key={s.id}
                href={`/speak?scenario=${s.id}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-semibold transition hover:bg-surface-2"
              >
                <span aria-hidden>{s.emoji}</span> {s.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={markLearned}
        disabled={learned || saving}
        className={`h-11 rounded-2xl border font-semibold transition ${learned ? "border-success bg-success-soft text-success" : "border-line hover:bg-surface-2 disabled:opacity-60"}`}
      >
        {learned ? "✓ In your vocabulary" : saving ? "Saving…" : "I've got it (+5 XP)"}
      </button>
    </Card>
  );
}
