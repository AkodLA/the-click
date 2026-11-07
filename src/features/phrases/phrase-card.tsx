"use client";
/**
 * The signature card of Snakk: a phrase WITH its context:
 * register tag · meaning · example · ✅ use when · 🚫 avoid when · 💡 say instead.
 * Owner: T7. Reused on Home ("phrase of the day") and in scenarios.
 */
import { useState } from "react";
import { Badge, Button, Card, RegisterTag } from "@/components/ui";
import type { Phrase } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";

export function PhraseCard({ phrase, compact = false }: { phrase: Phrase; compact?: boolean }) {
  const p = useProgress();
  const learned = p.learnedPhraseIds.includes(phrase.id);
  const [saving, setSaving] = useState(false);

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <RegisterTag register={phrase.register} withHint />
          <Badge tone="muted">{phrase.level}</Badge>
          {phrase.region && <span className="text-xs text-muted">📍 {phrase.region}</span>}
        </div>
        <p className="mt-2 text-2xl font-black tracking-tight">{phrase.text}</p>
        <p className="text-muted">{phrase.meaning}</p>
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

      {learned ? (
        <p className="flex h-11 items-center justify-center rounded-2xl border border-success bg-success-soft font-semibold text-success">
          ✓ In your vocabulary
        </p>
      ) : (
        <Button
          variant="secondary"
          disabled={saving}
          aria-busy={saving}
          onClick={() => {
            setSaving(true);
            progressActions
              .send({ type: "phrase_learned", phraseId: phrase.id })
              .catch(() => {})
              .finally(() => setSaving(false));
          }}
        >
          {saving ? "Saving…" : "👍 I've got it · +5 XP"}
        </Button>
      )}
    </Card>
  );
}
