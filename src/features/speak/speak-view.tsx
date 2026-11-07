"use client";
/**
 * Speak (/speak): pick a real-life scenario → briefing → live voice tutor → result. Owner: T2.
 * Other screens deep-link here with ?scenario=<id> (Home, Phrasebook, Tolk, Events, League).
 * T5's pronunciation practice stays on this page (see src/app/(app)/speak/page.tsx).
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, RegisterTag, SectionTitle } from "@/components/ui";
import { CEFR_LEVELS, getPhrase, getScenario, REGISTER_STYLE, scenarios } from "@/lib/content";
import type { Scenario } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";
import { CorrectionCard, type SessionOutcome } from "./tutor-session";

// The voice SDK only loads when a session starts.
const TutorSession = dynamic(() => import("./tutor-session").then((m) => m.TutorSession), {
  ssr: false,
  loading: () => <Card className="py-10 text-center font-semibold text-muted">Starting the tutor…</Card>,
});

type Result = { outcome: SessionOutcome; status: "saving" | "saved" | "short" | "error"; message?: string };

function osloToday(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date());
}

export function SpeakView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const p = useProgress();
  const [live, setLive] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const selected = getScenario(params.get("scenario") ?? "") ?? null;
  const myIndex = p.cefr ? CEFR_LEVELS.indexOf(p.cefr) : -1;
  const doneToday = (id: string) => (p.daily.day && p.daily.counts[`scenario:${id}`] ? p.daily.day === osloToday() : false);

  function choose(id: string | null) {
    setLive(false);
    setError(null);
    setResult(null);
    router.replace(id ? `${pathname}?scenario=${id}` : pathname, { scroll: false });
    window.scrollTo({ top: 0 });
  }

  async function finished(s: Scenario, outcome: SessionOutcome) {
    setLive(false);
    if (outcome.learnerTurns < 2) {
      setResult({ outcome, status: "short", message: "Say a bit more next time: answer the tutor at least twice to finish the scenario." });
      return;
    }
    setResult({ outcome, status: "saving" });
    try {
      // The server checks this conversation with ElevenLabs and decides the XP.
      await progressActions.send({
        type: "scenario_completed",
        scenarioId: s.id,
        conversationId: outcome.conversationId ?? undefined,
        slangFlags: outcome.slangFlags,
      });
      setResult({ outcome, status: "saved" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({ outcome, status: "error", message: msg.includes(": ") ? msg.slice(msg.indexOf(": ") + 2) : "Couldn't save your result." });
    }
  }

  // ---------- one scenario: briefing, live session or result ----------
  if (selected) {
    const keyPhrases = selected.keyPhraseIds.map((id) => getPhrase(id)).filter((x) => x !== undefined);
    const nextScenario = scenarios[(scenarios.indexOf(selected) + 1) % scenarios.length];

    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={() => choose(null)} className="h-11 self-start text-sm font-semibold text-brand">
          ← All scenarios
        </button>

        {live ? (
          <TutorSession
            scenario={selected}
            onFinish={(o) => finished(selected, o)}
            onFail={(message, code) => {
              setLive(false);
              setError({ message, code });
            }}
          />
        ) : result ? (
          <ResultView scenario={selected} result={result} next={nextScenario} onAgain={() => { setResult(null); setLive(true); }} onNext={() => choose(nextScenario.id)} />
        ) : (
          <>
            <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
              <p className="text-sm font-semibold opacity-80">
                {selected.emoji} Scenario · {selected.level}
              </p>
              <h1 className="mt-1 text-3xl font-black leading-tight">{selected.title}</h1>
              <p className="mt-2 text-sm opacity-90">You talk to {selected.agentRole}.</p>
            </section>

            {error && (
              <Card className="flex flex-col gap-3 border-danger bg-danger-soft" role="alert">
                <p className="font-bold text-danger">⚠️ {error.message}</p>
                {error.code === "not_configured" ? (
                  <p className="text-sm">Meanwhile, practise saying the sentences below out loud, or chat in Tandem.</p>
                ) : (
                  <Button onClick={() => { setError(null); setLive(true); }}>Try again</Button>
                )}
              </Card>
            )}

            <Card className="flex flex-col gap-3">
              <p className="font-bold">🎯 Your goal</p>
              <p>{selected.goal}</p>
              <div className="flex flex-wrap items-center gap-2">
                <RegisterTag register={selected.register} withHint />
                <Badge tone="accent">+{selected.xpReward} XP</Badge>
                {doneToday(selected.id) && <Badge tone="success">✓ Done today (practice round)</Badge>}
              </div>
              {selected.register === "formal" && (
                <p className="rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn">🎩 Formal: the tutor will flag slang. Finish without any for a badge!</p>
              )}
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="font-bold">💬 The tutor starts with</p>
              <p lang="nb" className="text-xl font-semibold">
                «{selected.openingLine}»
              </p>
            </Card>

            {keyPhrases.length > 0 && (
              <section>
                <SectionTitle>Phrases to use</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {keyPhrases.map((ph) => (
                    <Link
                      key={ph.id}
                      href={`/phrases?id=${ph.id}`}
                      className={`inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${REGISTER_STYLE[ph.register].className}`}
                    >
                      {ph.text}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <Button size="lg" onClick={() => { setError(null); setLive(true); }}>
              🎙️ Start talking
            </Button>
            <p className="-mt-2 text-center text-xs text-muted">Uses your microphone. The conversation goes to our voice partner (ElevenLabs); Snakk doesn&apos;t store audio.</p>
          </>
        )}
      </div>
    );
  }

  // ---------- scenario list ----------
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Speak</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Talk to your tutor.</h1>
        <p className="mt-2 text-sm opacity-90">Real situations, out loud. The tutor answers in role and tells you when a word doesn&apos;t fit the room.</p>
      </section>

      {!p.cefr && (
        <Card className="flex items-center justify-between gap-3 border-brand bg-brand-soft">
          <p className="text-sm font-semibold">🧭 Find your level to get the right scenarios.</p>
          <Button href="/onboarding" className="shrink-0">
            Start
          </Button>
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {scenarios.map((s) => {
          const idx = CEFR_LEVELS.indexOf(s.level);
          const fits = myIndex >= 0 && Math.abs(idx - myIndex) <= 1;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => choose(s.id)}
                className="flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-3xl" aria-hidden>
                  {s.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{s.title}</span>
                    <Badge tone="brand">{s.level}</Badge>
                    {fits && <Badge tone="success">For you</Badge>}
                    {doneToday(s.id) && <Badge tone="muted">✓ Today</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{s.goal}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-accent">+{s.xpReward}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ResultView({
  scenario,
  result,
  next,
  onAgain,
  onNext,
}: {
  scenario: Scenario;
  result: Result;
  next: Scenario;
  onAgain: () => void;
  onNext: () => void;
}) {
  const { outcome, status, message } = result;
  const clean = outcome.corrections.length === 0;
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-brand p-6 text-center text-brand-ink shadow-md">
        <p className="text-5xl" aria-hidden>
          {status === "saved" ? "🎉" : status === "saving" ? "⏳" : "💪"}
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight">
          {status === "saved" ? "Bra jobba!" : status === "saving" ? "Checking your conversation…" : "Almost there"}
        </h1>
        <p className="mt-2 text-sm opacity-90">
          {status === "saved"
            ? `You finished «${scenario.title}».`
            : status === "saving"
              ? "The server checks it with our voice partner before giving XP."
              : message}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-black">{outcome.learnerTurns}</p>
          <p className="text-xs font-semibold text-muted">times you spoke</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-black">{clean ? "0 🎩" : outcome.corrections.length}</p>
          <p className="text-xs font-semibold text-muted">{clean ? "slang slips" : "corrections"}</p>
        </Card>
      </div>

      {outcome.corrections.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Remember for next time</SectionTitle>
          {outcome.corrections.map((c, i) => (
            <CorrectionCard key={i} c={c} />
          ))}
        </section>
      )}

      <div className="flex flex-col gap-2">
        <Button onClick={onNext}>
          Next: {next.emoji} {next.title}
        </Button>
        <Button variant="secondary" onClick={onAgain}>
          🔁 Practise again
        </Button>
        <Button variant="ghost" href="/profile">
          See your progress →
        </Button>
      </div>
    </div>
  );
}
