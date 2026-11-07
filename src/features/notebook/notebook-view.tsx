"use client";
/**
 * Mistake notebook (/notebook), T21: every correction you got, from the tutor, Tandem and the
 * pronunciation check, with a practice mode on the same 1-3-7-14-30 day rhythm as My words.
 * Device-only, no XP (reviews are for you, not for points).
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { removeMistake, SOURCE_LABEL, useMistakes, type Mistake, type MistakeSource } from "@/lib/personal/mistakes";
import { answerReview, nextDueInDays, useReview } from "@/lib/personal/review";
import { speakNorwegian } from "@/lib/speech";

const FILTERS: (MistakeSource | "all")[] = ["all", "tutor", "tandem", "pronunciation"];

export function NotebookView() {
  const list = useMistakes();
  const review = useReview();
  const [filter, setFilter] = useState<MistakeSource | "all">("all");
  const [practising, setPractising] = useState<Mistake[] | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const shown = list.filter((m) => filter === "all" || m.source === filter);
  const due = now === null ? [] : list.filter((m) => !review[`m:${m.id}`] || review[`m:${m.id}`].due <= now);

  if (practising) return <Practice items={practising} onDone={() => setPractising(null)} />;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Mistake notebook</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Every mistake is a lesson.</h1>
        <p className="mt-2 text-sm opacity-90">Corrections from the tutor, Tandem and the pronunciation check land here. Practise them until they stick.</p>
        <p className="mt-3 text-xs opacity-80">🔒 Saved only on this device.</p>
      </section>

      {list.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-4xl" aria-hidden>
            📓
          </p>
          <p className="font-bold">No mistakes yet</p>
          <p className="max-w-xs text-sm text-muted">Talk to the tutor, chat in Tandem or check your pronunciation. Every correction you get is saved here.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button href="/speak">🎙️ Speak</Button>
            <Button href="/tandem" variant="secondary">
              🤝 Tandem
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="flex items-center justify-between gap-3 border-accent bg-accent-soft">
            <div>
              <p className="font-bold">{due.length ? `🔁 ${due.length} to practise` : "✅ All practised for now"}</p>
              <p className="text-sm text-muted">{list.length} saved in total</p>
            </div>
            <Button variant="accent" disabled={due.length === 0} onClick={() => setPractising(due)}>
              Practise
            </Button>
          </Card>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by source">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold ${
                  filter === f ? "bg-ink text-bg" : "border border-line bg-surface hover:bg-surface-2"
                }`}
              >
                {f === "all" ? "All" : SOURCE_LABEL[f]}
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-3">
            {shown.map((m) => {
              const next = now === null ? null : nextDueInDays(review[`m:${m.id}`], now);
              return (
                <li key={m.id}>
                  <Card className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="muted">{SOURCE_LABEL[m.source]}</Badge>
                      {m.count > 1 && <Badge tone="warn">{m.count}×</Badge>}
                      {next !== null && next > 0 && <Badge tone="success">next in {next} {next === 1 ? "day" : "days"}</Badge>}
                    </div>
                    <p className="text-sm">
                      <span className="line-through opacity-70" lang="nb">
                        «{m.said}»
                      </span>
                    </p>
                    <p className="flex items-center gap-2 font-bold" lang="nb">
                      → «{m.better}»
                      <button type="button" onClick={() => speakNorwegian(m.better)} aria-label="Hear the better version" className="h-11 w-11 shrink-0 rounded-full border border-line">
                        🔊
                      </button>
                    </p>
                    {m.note && <p className="text-xs text-muted">{m.note}</p>}
                    <button type="button" onClick={() => removeMistake(m.id)} className="h-11 self-start text-xs font-semibold text-muted underline">
                      Remove
                    </button>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="text-center text-xs text-muted">
        Your most common mistake also shows on your{" "}
        <Link href="/profile#week" className="font-semibold text-brand">
          profile
        </Link>
        .
      </p>
    </div>
  );
}

function Practice({ items, onDone }: { items: Mistake[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [right, setRight] = useState(0);
  const m = items[i];

  if (!m) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <p className="text-xl font-black">
          {right} of {items.length} remembered
        </p>
        <Button onClick={onDone}>Back to the notebook</Button>
      </Card>
    );
  }

  function answer(got: boolean) {
    answerReview(`m:${m.id}`, got);
    if (got) setRight((r) => r + 1);
    setShown(false);
    setI((x) => x + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDone} className="h-11 text-sm font-semibold text-brand">
          ← Stop
        </button>
        <span className="text-sm font-semibold text-muted">
          {i + 1} / {items.length}
        </span>
      </div>
      <ProgressBar value={i / items.length} tone="accent" label="Practice progress" />
      <Card className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
        <Badge tone="muted">{SOURCE_LABEL[m.source]}</Badge>
        <p className="text-sm text-muted">You said</p>
        <p className="text-2xl font-bold" lang="nb">
          «{m.said}»
        </p>
        {shown ? (
          <>
            <p className="text-sm text-muted">Better</p>
            <p className="text-2xl font-black text-success" lang="nb">
              «{m.better}»
            </p>
            {m.note && <p className="text-xs text-muted">{m.note}</p>}
          </>
        ) : (
          <p className="text-sm text-muted">How would you say it better? Say it out loud, then check.</p>
        )}
      </Card>
      {shown ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => answer(false)}>
            🔁 Again
          </Button>
          <Button onClick={() => answer(true)}>✓ I knew it</Button>
        </div>
      ) : (
        <Button size="lg" onClick={() => setShown(true)}>
          Show the better version
        </Button>
      )}
    </div>
  );
}
