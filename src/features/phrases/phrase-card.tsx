"use client";
/**
 * The signature card of Snakk: a phrase WITH its context:
 * register tag · meaning · example · ✅ use when · 🚫 avoid when · 💡 say instead.
 * Owner: T7. Reused on Home ("phrase of the day") and in scenarios.
 */
import { Card, RegisterTag } from "@/components/ui";
import type { Phrase } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";

export function PhraseCard({ phrase, compact = false }: { phrase: Phrase; compact?: boolean }) {
  const p = useProgress();
  const learned = p.learnedPhraseIds.includes(phrase.id);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-black tracking-tight">{phrase.text}</p>
          <p className="text-muted">{phrase.meaning}</p>
        </div>
        <RegisterTag register={phrase.register} withHint />
      </div>

      <div className="rounded-2xl bg-surface-2 p-3">
        <p className="font-semibold">«{phrase.example.no}»</p>
        <p className="text-sm text-muted">{phrase.example.en}</p>
      </div>

      {!compact && (
        <dl className="grid gap-3 text-sm">
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
        </dl>
      )}

      <button
        type="button"
        onClick={() => progressActions.send({ type: "phrase_learned", phraseId: phrase.id }).catch(() => {})}
        disabled={learned}
        className="h-11 rounded-2xl border border-line font-semibold transition hover:bg-surface-2 disabled:border-success disabled:bg-success-soft disabled:text-success"
      >
        {learned ? "✓ In your vocabulary" : "I've got it (+5 XP)"}
      </button>
    </Card>
  );
}
