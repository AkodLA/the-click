"use client";
/**
 * A short list of sentences to say out loud (T5). Shown on /speak next to the voice tutor (T2).
 * Uses real lines from our content, so the server accepts them as targets.
 */
import { useState } from "react";
import { SectionTitle } from "@/components/ui";
import { placementQuestions, scenarios } from "@/lib/content";
import { PronunciationCheck } from "./pronunciation-check";

const SENTENCES = [
  ...scenarios.map((s) => ({ id: s.id, emoji: s.emoji, title: s.title, text: s.openingLine })),
  ...placementQuestions
    .filter((q) => q.type === "speak" && q.norwegian)
    .map((q) => ({ id: q.id, emoji: "🗣️", title: "Introduce yourself", text: q.norwegian as string })),
];

export function PronunciationPractice() {
  const [index, setIndex] = useState(0);
  if (SENTENCES.length === 0) return null;
  const current = SENTENCES[index];

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Pronunciation practice</SectionTitle>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Pick a sentence">
        {SENTENCES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={`h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
              i === index ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-surface-2"
            }`}
          >
            <span aria-hidden>{s.emoji}</span> {s.title}
          </button>
        ))}
      </div>
      {/* key: a new sentence starts a fresh check */}
      <PronunciationCheck key={current.id} sentence={current.text} target={current.text} />
      <p className="text-xs text-muted">We send your recording to speech-to-text to check it and never store the audio.</p>
    </section>
  );
}
