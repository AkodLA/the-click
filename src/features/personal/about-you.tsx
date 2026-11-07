"use client";
/**
 * "About you" (T20): age group, field of work/study and up to 3 interests.
 * Saved only on this device. Used on /words (first visit) and on the profile.
 */
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { fieldPacks, interestPacks, packFitsAge } from "@/lib/content";
import type { AgeGroup, FieldId, InterestId } from "@/lib/content/types";
import { AGE_GROUPS, MAX_INTERESTS, savePrefs, usePrefs, type Prefs } from "@/lib/personal/prefs";

export function AboutYou({ onDone, compact = false }: { onDone?: () => void; compact?: boolean }) {
  const saved = usePrefs();
  const [draft, setDraft] = useState<Prefs | null>(null);
  const p = draft ?? saved;
  const set = (patch: Partial<Prefs>) => setDraft({ ...p, ...patch });

  const fields = fieldPacks.filter((f) => packFitsAge(f, p.ageGroup));
  const interests = interestPacks.filter((i) => packFitsAge(i, p.ageGroup));

  function toggleInterest(id: InterestId) {
    const has = p.interests.includes(id);
    if (!has && p.interests.length >= MAX_INTERESTS) return;
    set({ interests: has ? p.interests.filter((x) => x !== id) : [...p.interests, id] });
  }

  function save() {
    // Drop a field/interest that doesn't fit the chosen age group (e.g. "student" for 60+).
    const okField = p.field && fields.some((f) => f.id === p.field) ? p.field : null;
    const okInterests = p.interests.filter((i) => interests.some((x) => x.id === i));
    savePrefs({ ...p, field: okField, interests: okInterests });
    setDraft(null);
    onDone?.();
  }

  return (
    <Card className="flex flex-col gap-5">
      {!compact && (
        <div>
          <p className="text-lg font-black">Make Snakk yours</p>
          <p className="text-sm text-muted">We pick words, scenarios and the tutor&apos;s style for you. Saved only on this device; we never ask your exact age.</p>
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">How old are you?</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Age group">
          {AGE_GROUPS.map((a) => {
            const active = p.ageGroup === a.id;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ ageGroup: active ? null : (a.id as AgeGroup) })}
                className={`flex min-h-11 flex-col items-start rounded-2xl border px-3 py-2 text-left transition ${
                  active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="font-bold">{a.label}</span>
                <span className="text-xs text-muted">{a.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">What do you do (or want to do)?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Field of work or study">
          {fields.map((f) => {
            const active = p.field === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ field: active ? null : (f.id as FieldId) })}
                className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                  active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {f.emoji}
                </span>
                <span className="leading-tight">{f.title}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">
          What do you like? <span className="font-normal text-muted">(up to {MAX_INTERESTS})</span>
        </legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Interests">
          {interests.map((i) => {
            const active = p.interests.includes(i.id as InterestId);
            const full = !active && p.interests.length >= MAX_INTERESTS;
            return (
              <button
                key={i.id}
                type="button"
                aria-pressed={active}
                disabled={full}
                onClick={() => toggleInterest(i.id as InterestId)}
                className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition disabled:opacity-40 ${
                  active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span aria-hidden>{i.emoji}</span> {i.title}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={draft === null && !onDone}>
          {draft === null && onDone ? "Continue" : "Save"}
        </Button>
        {draft !== null && (
          <Button variant="secondary" onClick={() => setDraft(null)}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
