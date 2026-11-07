"use client";
/**
 * T21 field level-up test: «Ready for warehouse work?» 5 questions from one field pack:
 * pick the meaning of each word. The SERVER checks the answers, gives the certificate (+XP once) and the
 * «Certified» badge (event `field_test_submitted`). Max 3 tries a day.
 */
import { useState } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";
import { downloadCertificate } from "@/features/engagement/share-image";
import type { VocabPack } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";

const QUESTIONS = 5;

interface Q {
  wordId: string;
  no: string;
  options: string[];
}

function shuffle<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

function makeTest(pack: VocabPack): Q[] {
  return shuffle(pack.words)
    .slice(0, QUESTIONS)
    .map((w) => ({
      wordId: w.id,
      no: w.no,
      options: shuffle([w.en, ...shuffle(pack.words.filter((o) => o.id !== w.id)).slice(0, 3).map((o) => o.en)]),
    }));
}

export function FieldTest({ pack }: { pack: VocabPack }) {
  const p = useProgress();
  const [test, setTest] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const cert = p.certificates?.find((c) => c.packId === pack.id);

  function start() {
    setTest(makeTest(pack)); // random choices happen in the click, not during render
    setI(0);
    setAnswers({});
    setState("idle");
    setError(null);
  }

  async function submit(final: Record<string, string>) {
    setState("sending");
    try {
      await progressActions.send({ type: "field_test_submitted", packId: pack.id, answers: final }); // the server checks it
      setState("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes(": ") ? msg.slice(msg.indexOf(": ") + 2) : "Couldn't check your test. Try again.");
      setState("error");
    }
  }

  function pick(option: string) {
    if (!test) return;
    const next = { ...answers, [test[i].wordId]: option };
    setAnswers(next);
    if (i + 1 < test.length) setI(i + 1);
    else void submit(next);
  }

  if (!test || state === "done" || state === "error") {
    const passedNow = state === "done" && Boolean(cert);
    return (
      <Card className={`flex flex-col gap-3 ${cert ? "border-success bg-success-soft" : ""}`}>
        <p className="font-bold">
          🎓 {cert ? `Certified: ready for ${pack.title.toLowerCase()}` : `Ready for ${pack.title.toLowerCase()}?`}
        </p>
        <p className="text-sm text-muted">
          {state === "error"
            ? error
            : state === "done" && !cert
              ? "Not this time. Review the words above and try again."
              : cert
                ? `${cert.score}/${cert.total} right on ${cert.day}.${passedNow ? " 🎉" : ""}`
                : `${QUESTIONS} quick questions. Get 4 right for a certificate you can share (+40 XP).`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={start} variant={cert ? "secondary" : "primary"}>
            {cert ? "Take it again" : state === "done" || state === "error" ? "Try again" : "Start the test"}
          </Button>
          {cert && (
            <Button
              variant="accent"
              onClick={() => downloadCertificate({ nickname: p.nickname, title: pack.title, emoji: pack.emoji, score: cert.score, total: cert.total, day: cert.day })}
            >
              📸 Download certificate
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const q = test[i];
  return (
    <Card className="flex flex-col gap-4" aria-live="polite">
      <div className="flex items-center justify-between text-sm font-semibold text-muted">
        <span>🎓 Level-up test</span>
        <span>
          {i + 1} / {test.length}
        </span>
      </div>
      <ProgressBar value={i / test.length} tone="accent" label="Test progress" />
      <p className="text-center text-sm text-muted">What does this mean?</p>
      <p className="text-center text-3xl font-black" lang="nb">
        {q.no}
      </p>
      <div className="grid gap-2" role="group" aria-label="Answers">
        {q.options.map((o) => (
          <Button key={o} variant="secondary" onClick={() => pick(o)} disabled={state === "sending"}>
            {o}
          </Button>
        ))}
      </div>
      {state === "sending" && <p className="text-center text-sm text-muted">Checking…</p>}
    </Card>
  );
}
