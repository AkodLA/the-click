"use client";
/**
 * The signature card of Snakk: a phrase WITH its context:
 * register tag · meaning · example · ✅ use when · 🚫 avoid when · 💡 say instead.
 * Owner: T7. Reused on Home ("phrase of the day"), the phrasebook and in scenarios.
 * Combines T7 (audio, context, scenario links), T16 (layout) and T5 (pronunciation check).
 *
 *   <PhraseCard phrase={p} />                 full card
 *   <PhraseCard phrase={p} collapsible />     context hidden behind "When to use it" (phrasebook list)
 *   <PhraseCard phrase={p} compact />         no context at all
 */
import Link from "next/link";
import { useId, useState } from "react";
import { Badge, Button, Card, RegisterTag } from "@/components/ui";
import { scenarios } from "@/lib/content";
import type { Phrase } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";
import { SaveToNotes } from "@/features/notes/save-to-notes";
import { PronunciationCheck } from "@/features/pronunciation/pronunciation-check";
import { PlayButton } from "./play-button";
import { ExplainText } from "@/features/explain/explain-text";

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

  const safe = safeEverywhere(phrase.avoidWhen);

  return (
    <Card id={`phrase-${phrase.id}`} className={`flex scroll-mt-24 flex-col gap-4 ${highlight ? "ring-4 ring-brand/40" : ""}`}>
      {/* Layout matches T16's polish: tags on top, then the phrase. */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <RegisterTag register={phrase.register} withHint={!collapsible} />
          <Badge tone="muted">{phrase.level}</Badge>
          {phrase.region && <span className="text-xs text-muted">📍 {phrase.region}</span>}
          <SaveToNotes
            size="sm"
            className="ml-auto"
            text={phrase.text}
            meaning={phrase.meaning}
            soundsLike={phrase.soundsLike}
            register={phrase.register}
            source="phrasebook"
            href={`/phrases?id=${phrase.id}`}
          />
        </div>
        <div className="mt-2 flex items-start gap-3">
          <PlayButton phraseId={phrase.id} text={phrase.text} label={`Play «${phrase.text}»`} />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-black tracking-tight">{phrase.text}</p>
            {phrase.soundsLike && <SoundsLike text={phrase.soundsLike} />}
            <p className="text-muted">{phrase.meaning}</p>
          </div>
          {/* T25: the situation as a picture, same tile style as the word cards. */}
          {phrase.picture && (
            <span
              role="img"
              aria-label={`Picture: ${phrase.meaning}`}
              className="flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-2xl border-2 border-line bg-brand-soft text-3xl shadow-[0_3px_0_var(--line)] font-[family-name:var(--font-emoji)]"
            >
              {phrase.picture}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            «<ExplainText text={phrase.example.no} />»
          </p>
          {phrase.example.soundsLike && <SoundsLike text={phrase.example.soundsLike} small />}
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
          {safe ? (
            // A phrase that's fine everywhere shouldn't look like a warning (red «avoid» box saying «Never wrong»).
            <div className="rounded-2xl border border-line bg-surface-2 p-3">
              <dt className="font-bold">👍 {safe.title}</dt>
              {safe.rest && <dd>{safe.rest}</dd>}
            </div>
          ) : (
            <div className="rounded-2xl bg-danger-soft p-3">
              <dt className="font-bold text-danger">🚫 Avoid it when</dt>
              <dd>{phrase.avoidWhen}</dd>
            </div>
          )}
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
        </dl>
      )}

      {/* T5: say the example out loud (shown with the context, so long phrasebook lists stay short). */}
      {showDetails && <PronunciationCheck sentence={phrase.example.no} target={phrase.id} label="Say the example" />}

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

      {learned ? (
        <p className="flex h-11 items-center justify-center rounded-2xl border border-success bg-success-soft font-semibold text-success">
          ✓ In your vocabulary
        </p>
      ) : (
        <Button variant="secondary" onClick={markLearned} disabled={saving} aria-busy={saving}>
          {saving ? "Saving…" : "👍 I've got it · +5 XP"}
        </Button>
      )}
    </Card>
  );
}

/**
 * "Plan D" for pronunciation: the phrase spelled with plain English letters, stressed syllable in CAPS.
 * Deliberately faint (not bold) so it doesn't compete with the real word, but always there if the
 * voice, the audio and reading the Norwegian spelling all didn't help.
 */
function SoundsLike({ text, small = false }: { text: string; small?: boolean }) {
  return (
    <p
      className={`mt-0.5 font-normal italic tracking-wide text-muted opacity-60 transition-opacity hover:opacity-100 ${small ? "text-xs" : "text-sm"}`}
      title="How to say it, in plain letters. The CAPS part is stressed."
    >
      <span className="sr-only">Sounds like: </span>
      <span aria-hidden>🗣️ </span>
      {text}
    </p>
  );
}

/** «Never wrong. Add …» → { title: "Safe everywhere", rest: "Add …" }; null when there's a real «avoid». */
function safeEverywhere(avoidWhen: string): { title: string; rest: string } | null {
  const m = avoidWhen.match(/^(Never wrong|Never rude|Rarely wrong|Fine everywhere|Fine almost everywhere)[.!;]?\s*([\s\S]*)$/);
  if (!m) return null;
  const almost = m[1] === "Rarely wrong" || m[1] === "Fine almost everywhere";
  const rest = m[2].trim();
  return { title: almost ? "Safe almost everywhere" : "Safe everywhere", rest: rest && rest[0].toUpperCase() + rest.slice(1) };
}
