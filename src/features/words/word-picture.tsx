"use client";
/**
 * T24: word pictures.
 *  - <WordPicture word={w} />  the picture tile on word cards and in review (an emoji in a soft rounded tile,
 *    same look as the pack and scenario tiles; the English meaning is its accessible name).
 *  - <PictureQuiz pack={p} />  "What's this in Norwegian?": see a picture, pick the word, hear it. Practice only,
 *    no XP (XP comes from «I know it», which the server checks), nothing stored.
 */
import { useState } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";
import type { VocabPack, VocabWord } from "@/lib/content/types";
import { speakNorwegian } from "@/lib/speech";

const ROUNDS = 5;
const bare = (no: string) => no.replace(/^(en|ei|et|å) /, "");

export function WordPicture({ word, size = "md" }: { word: VocabWord; size?: "md" | "lg" }) {
  if (!word.picture) return null;
  return (
    <span
      role="img"
      aria-label={`Picture: ${word.en}`}
      className={`flex shrink-0 select-none items-center justify-center rounded-2xl border-2 border-line bg-brand-soft shadow-[0_3px_0_var(--line)] ${
        size === "lg" ? "h-24 w-24 text-6xl" : "h-16 w-16 text-4xl"
      }`}
    >
      {word.picture}
    </span>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Round {
  word: VocabWord;
  options: VocabWord[];
}

function makeRounds(words: VocabWord[]): Round[] {
  return shuffle(words)
    .slice(0, ROUNDS)
    .map((word) => ({ word, options: shuffle([word, ...shuffle(words.filter((x) => x.id !== word.id)).slice(0, 2)]) }));
}

export function PictureQuiz({ pack }: { pack: VocabPack }) {
  // Only words whose picture is unique in this pack (two 🧾 would make the quiz unfair).
  const words = pack.words.filter((w) => w.picture && pack.words.filter((x) => x.picture === w.picture).length === 1);
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);

  if (words.length < 4) return null;

  function start() {
    setRounds(makeRounds(words));
    setI(0);
    setPicked(null);
    setRight(0);
  }

  if (!rounds) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">🖼️ Picture quiz</p>
          <p className="text-sm text-muted">See a picture, pick the Norwegian word, hear it.</p>
        </div>
        <Button variant="accent" onClick={start} className="shrink-0">
          Play
        </Button>
      </Card>
    );
  }

  const round = rounds[i];
  if (!round) {
    const perfect = right === rounds.length;
    return (
      <Card className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <p className="text-5xl" aria-hidden>
          {perfect ? "🏆" : right >= 3 ? "🎉" : "💪"}
        </p>
        <p className="text-xl font-black">
          {right} of {rounds.length} right
        </p>
        <p className="max-w-xs text-sm text-muted">
          {perfect ? "Perfekt! Tap «I know it» on the words you're sure about." : "Look at the cards above once more, then play again."}
        </p>
        <div className="flex gap-2">
          <Button onClick={start}>🔁 Play again</Button>
          <Button variant="secondary" onClick={() => setRounds(null)}>
            Close
          </Button>
        </div>
      </Card>
    );
  }

  function choose(w: VocabWord) {
    if (picked) return;
    setPicked(w.id);
    if (w.id === round.word.id) setRight((r) => r + 1);
    speakNorwegian(bare(round.word.no), { slow: true });
  }

  const correct = picked === round.word.id;

  return (
    <Card className="flex flex-col gap-4" aria-labelledby="quiz-title">
      <div className="flex items-center justify-between">
        <p id="quiz-title" className="font-bold">
          🖼️ What&apos;s this in Norwegian?
        </p>
        <span className="text-sm font-semibold text-muted">
          {i + 1} / {rounds.length}
        </span>
      </div>
      <ProgressBar value={i / rounds.length} tone="accent" label="Quiz progress" />
      <div className="flex justify-center py-2">
        {/* The picture IS the question, so it has no text alternative that gives the answer away. */}
        <span role="img" aria-label="Picture to name" className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-line bg-brand-soft text-7xl shadow-[0_4px_0_var(--line)]">
          {round.word.picture}
        </span>
      </div>
      <div className="flex flex-col gap-2" role="group" aria-label="Pick the word">
        {round.options.map((o) => {
          const isAnswer = o.id === round.word.id;
          const state = !picked ? "idle" : isAnswer ? "right" : o.id === picked ? "wrong" : "idle";
          return (
            <button
              key={o.id}
              type="button"
              lang="nb"
              onClick={() => choose(o)}
              disabled={!!picked && state === "idle"}
              className={`flex min-h-12 items-center justify-between rounded-2xl border-2 px-4 text-left text-lg font-bold transition ${
                state === "right"
                  ? "border-success bg-success-soft text-success"
                  : state === "wrong"
                    ? "border-danger bg-danger-soft text-danger"
                    : "border-line bg-surface hover:bg-surface-2 disabled:opacity-50"
              }`}
            >
              {o.no}
              {state === "right" && <span aria-label="correct">✓</span>}
              {state === "wrong" && <span aria-label="wrong">✗</span>}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="flex flex-col gap-2" role="status">
          <p className="text-sm">
            {correct ? "✅ Riktig! " : "Not quite. "}
            <span className="font-bold" lang="nb">
              {round.word.no}
            </span>{" "}
            = {round.word.en}
          </p>
          <Button
            onClick={() => {
              setPicked(null);
              setI((x) => x + 1);
            }}
          >
            {i + 1 < rounds.length ? "Next →" : "See my score"}
          </Button>
        </div>
      )}
    </Card>
  );
}
