"use client";
/**
 * Onboarding + placement test (T4): nickname + native language → 9 questions, one per screen
 * (tap / listen / speak) → the SERVER scores the answers → animated level reveal → /learn.
 * The browser never knows the right answers (src/server/placement.ts) and never shows right/wrong.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { PronunciationCheck } from "@/features/pronunciation/pronunciation-check";
import { CEFR_LEVELS, LANGUAGE_NAMES, placementQuestions } from "@/lib/content";
import type { CefrLevel, PlacementQuestion } from "@/lib/content/types";
import { progressActions, useProgress } from "@/lib/progress/store";
import { canSpeak, speakNorwegian } from "@/lib/speech";

const NICK_RE = /^[\p{L}\p{N}_-]+( [\p{L}\p{N}_-]+)*$/u;
const NICK_IDEAS = ["FjordFox", "BrunostBear", "NordlysNinja", "TrikkTiger", "VaffelVenn", "SkiSkjære", "MoltebærMåke"];
const LANGUAGES = Object.entries(LANGUAGE_NAMES).filter(([code]) => code !== "nb");

const LEVEL_COPY: Record<CefrLevel, { emoji: string; title: string; text: string }> = {
  A0: { emoji: "🌱", title: "Fresh start", text: "Perfect place to begin. We start with sounds, greetings and «hei»." },
  A1: { emoji: "☕", title: "Beginner", text: "You know the basics. Next: ordering a coffee and saying hi like a local." },
  A2: { emoji: "🎉", title: "Elementary", text: "You handle everyday small talk. Time for slang, and when not to use it." },
  B1: { emoji: "🧭", title: "Intermediate", text: "You get by. Now we polish register: formal vs. informal." },
  B2: { emoji: "🚀", title: "Upper intermediate", text: "Strong! Next up: idioms and Norwegian that sounds natural." },
  C1: { emoji: "🏔️", title: "Advanced", text: "Impressive. Fine-tune with real conversations and dialects." },
  C2: { emoji: "👑", title: "Near-native", text: "Wow. Keep it sharp, and help others in Tandem." },
};

type Phase =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "submitting"; answers: Record<string, number>; error?: string }
  | { kind: "reveal"; level: CefrLevel };

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function errorText(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("invalid_input")) return msg.split(":").slice(1).join(":").trim() || "Check your answers.";
  if (msg.startsWith("rate_limited")) return "Too many tries. Wait a moment and try again.";
  return "Couldn't reach the server. Check your connection and try again.";
}

export function PlacementFlow() {
  const p = useProgress();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [answers, setAnswers] = useState<Record<string, number>>({});

  async function submit(final: Record<string, number>) {
    setPhase({ kind: "submitting", answers: final });
    try {
      const progress = await progressActions.send({ type: "placement_submitted", answers: final });
      setPhase({ kind: "reveal", level: progress.cefr ?? "A0" });
    } catch (err) {
      setPhase({ kind: "submitting", answers: final, error: errorText(err) });
    }
  }

  function answer(q: PlacementQuestion, option: number | null) {
    const next = { ...answers };
    if (option === null) delete next[q.id];
    else next[q.id] = option;
    setAnswers(next);
    if (phase.kind !== "question") return;
    if (phase.index + 1 < placementQuestions.length) setPhase({ kind: "question", index: phase.index + 1 });
    else void submit(next);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-10 pt-4">
      <header className="mb-6 flex h-11 items-center justify-between">
        {phase.kind === "question" ? (
          <button
            type="button"
            onClick={() => setPhase(phase.index === 0 ? { kind: "intro" } : { kind: "question", index: phase.index - 1 })}
            className="h-11 rounded-xl px-2 font-semibold text-muted hover:text-ink"
          >
            ← Back
          </button>
        ) : (
          <span className="text-xl font-black tracking-tight text-brand">
            snakk<span className="text-accent">.</span>
          </span>
        )}
        {phase.kind !== "reveal" && (
          <Link href="/learn" aria-label="Close the test" className="flex h-11 w-11 items-center justify-center rounded-xl text-xl text-muted hover:bg-surface-2">
            ✕
          </Link>
        )}
      </header>

      {phase.kind === "intro" && (
        <Intro
          savedNickname={p.nickname}
          savedLanguage={p.nativeLanguage}
          currentLevel={p.cefr}
          onStart={() => setPhase({ kind: "question", index: 0 })}
          onBeginner={() => submit({})}
        />
      )}

      {phase.kind === "question" && (
        <QuestionScreen
          key={placementQuestions[phase.index].id}
          index={phase.index}
          question={placementQuestions[phase.index]}
          chosen={answers[placementQuestions[phase.index].id]}
          onAnswer={answer}
        />
      )}

      {phase.kind === "submitting" &&
        (phase.error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="text-6xl" aria-hidden>
              📡
            </div>
            <p role="alert" className="max-w-sm text-lg font-semibold">
              {phase.error}
            </p>
            <p className="text-sm text-muted">Your answers are kept.</p>
            <Button size="lg" onClick={() => void submit(phase.answers)}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center" role="status">
            <div className="text-6xl motion-safe:animate-bounce" aria-hidden>
              🧭
            </div>
            <p className="text-xl font-bold">Finding your level…</p>
          </div>
        ))}

      {phase.kind === "reveal" && <Reveal level={phase.level} onContinue={() => router.push("/learn")} />}
    </div>
  );
}

// ---------- 1. Intro: nickname + native language ----------
function Intro({
  savedNickname,
  savedLanguage,
  currentLevel,
  onStart,
  onBeginner,
}: {
  savedNickname: string;
  savedLanguage: string;
  currentLevel: CefrLevel | null;
  onStart: () => void;
  onBeginner: () => void;
}) {
  // null = not edited yet → show what's saved
  const [nickInput, setNickInput] = useState<string | null>(null);
  const [langInput, setLangInput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nickname = (nickInput ?? savedNickname).trim();
  const language = langInput ?? savedLanguage;
  const nickProblem =
    nickname.length === 0
      ? null
      : nickname.length < 3
        ? "At least 3 characters."
        : nickname.length > 20
          ? "Max 20 characters."
          : !NICK_RE.test(nickname)
            ? "Use letters, numbers, spaces, _ or -."
            : null;
  const valid = nickname.length >= 3 && !nickProblem;

  async function go(then: () => void) {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await progressActions.send({ type: "profile_set", nickname, nativeLanguage: language });
      then();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-1 flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        void go(onStart);
      }}
    >
      <div>
        <p className="font-semibold text-accent">3 minutes · {placementQuestions.length} questions</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Let&apos;s find your Norwegian level</h1>
        <p className="mt-2 text-muted">Tap, listen and speak. No pressure: there&apos;s no wrong level, only a starting point.</p>
        {currentLevel && (
          <p className="mt-3">
            <Badge tone="brand">Current level: {currentLevel}</Badge> <span className="text-sm text-muted">Taking it again updates it.</span>
          </p>
        )}
      </div>

      <Card className="flex flex-col gap-3">
        <label htmlFor="nickname" className="font-bold">
          Pick a nickname
        </label>
        <div className="flex gap-2">
          <input
            id="nickname"
            value={nickInput ?? savedNickname}
            onChange={(e) => setNickInput(e.target.value)}
            maxLength={24}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="e.g. FjordFox"
            aria-invalid={Boolean(nickProblem)}
            aria-describedby="nickname-help"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-surface-2 px-4 text-lg font-semibold outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => setNickInput(NICK_IDEAS[Math.floor(Math.random() * NICK_IDEAS.length)])}
            aria-label="Suggest a nickname"
            className="h-12 w-12 shrink-0 rounded-2xl border border-line text-xl hover:bg-surface-2"
          >
            🎲
          </button>
        </div>
        <p id="nickname-help" className={`text-sm ${nickProblem ? "text-danger" : "text-muted"}`}>
          {nickProblem ?? "Never your real name. Other learners only see this."}
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <p id="lang-label" className="font-bold">
          Your first language
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="lang-label">
          {LANGUAGES.map(([code, name]) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={language === code}
              onClick={() => setLangInput(code)}
              className={`h-11 rounded-full border px-4 text-sm font-semibold transition ${
                language === code ? "border-brand bg-brand-soft text-brand" : "border-line hover:bg-surface-2"
              }`}
            >
              {language === code && "✓ "}
              {name}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm text-danger">
          ⚠️ {error}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <Button type="submit" size="lg" disabled={!valid || busy}>
          {busy ? "Saving…" : "Start the test →"}
        </Button>
        <Button type="button" variant="ghost" disabled={!valid || busy} onClick={() => void go(onBeginner)}>
          I&apos;m a total beginner, skip the test
        </Button>
        {!valid && <p className="text-center text-sm text-muted">Pick a nickname to continue.</p>}
      </div>
    </form>
  );
}

// ---------- 2. One question per screen ----------
function QuestionScreen({
  index,
  question: q,
  chosen,
  onAnswer,
}: {
  index: number;
  question: PlacementQuestion;
  chosen: number | undefined;
  onAnswer: (q: PlacementQuestion, option: number | null) => void;
}) {
  const total = placementQuestions.length;
  const [picked, setPicked] = useState<number | undefined>(chosen);
  const [showText, setShowText] = useState(false);
  const speechOk = canSpeak();

  // Play listen questions once when they appear.
  useEffect(() => {
    if (q.type === "listen" && q.norwegian) speakNorwegian(q.norwegian);
  }, [q]);

  function pick(i: number) {
    setPicked(i);
    // Short pause so the learner sees their choice, then move on.
    window.setTimeout(() => onAnswer(q, i), prefersReducedMotion() ? 0 : 280);
  }

  const typeLabel = { choice: "👆 Tap", listen: "👂 Listen", speak: "🎤 Speak" }[q.type];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm font-semibold text-muted">
          <span>
            Question {index + 1} of {total}
          </span>
          <span>{typeLabel}</span>
        </div>
        <ProgressBar value={(index + 1) / total} label="Test progress" />
      </div>

      <h1 className="text-2xl font-black leading-snug">{q.prompt}</h1>

      {q.type === "listen" && q.norwegian && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <Button size="lg" variant="accent" onClick={() => speakNorwegian(q.norwegian ?? "")} disabled={!speechOk}>
              🔊 Play
            </Button>
            <Button size="lg" variant="secondary" onClick={() => speakNorwegian(q.norwegian ?? "", { slow: true })} disabled={!speechOk}>
              🐢 Slower
            </Button>
          </div>
          {(showText || !speechOk) ? (
            <p className="text-lg font-semibold">«{q.norwegian}»</p>
          ) : (
            <button type="button" onClick={() => setShowText(true)} className="h-11 text-sm font-semibold text-muted underline">
              Can&apos;t play sound? Show the text
            </button>
          )}
        </div>
      )}

      {q.type === "speak" && q.norwegian && (
        <PronunciationCheck sentence={q.norwegian} target={q.norwegian} label="Say this sentence" />
      )}

      {q.options && (
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Answers">
          {q.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={picked === i}
              onClick={() => pick(i)}
              className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-lg font-semibold transition active:scale-[0.99] ${
                picked === i ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              {picked === i && "✓ "}
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {q.type === "speak" ? (
          <Button size="lg" onClick={() => onAnswer(q, null)}>
            {index + 1 === total ? "See my level →" : "Next →"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => onAnswer(q, null)}>
            I don&apos;t know, skip
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------- 3. Animated level reveal ----------
function Reveal({ level, onContinue }: { level: CefrLevel; onContinue: () => void }) {
  const target = CEFR_LEVELS.indexOf(level);
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? target : 0));

  // Climb through the levels A0 → A1 → … → result.
  useEffect(() => {
    if (shown >= target) return;
    const id = window.setTimeout(() => setShown((s) => s + 1), 420);
    return () => window.clearTimeout(id);
  }, [shown, target]);

  const done = shown >= target;
  const copy = LEVEL_COPY[level];

  return (
    <div className="flex flex-1 flex-col items-center gap-6 text-center">
      <p className="font-semibold text-muted">{done ? "Your level" : "Climbing…"}</p>

      <div
        className={`flex h-40 w-40 items-center justify-center rounded-full bg-brand text-6xl font-black text-brand-ink shadow-lg transition-transform duration-300 ${
          done ? "motion-safe:scale-110" : ""
        }`}
        aria-live="polite"
        aria-label={done ? `Your level is ${level}` : undefined}
      >
        {CEFR_LEVELS[shown]}
      </div>

      <div className="flex gap-1.5" aria-hidden>
        {CEFR_LEVELS.map((l, i) => (
          <span
            key={l}
            className={`rounded-full px-2 py-0.5 text-xs font-bold transition ${
              i <= shown ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted"
            }`}
          >
            {l}
          </span>
        ))}
      </div>

      {done && (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-black">
              {copy.emoji} {copy.title}
            </p>
            <p className="max-w-sm text-muted">{copy.text}</p>
          </div>
          <div className="mt-auto flex w-full flex-col gap-2">
            <Button size="lg" onClick={onContinue}>
              Start learning →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
