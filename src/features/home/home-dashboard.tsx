"use client";
/**
 * Home screen (/learn): the learner's daily hub.
 * Owner: T1 (Akram). It shows what good Snakk UI looks like, so copy its patterns.
 */
import Link from "next/link";
import { Cloud, Mascot } from "@/components/mascot";
import { Badge, Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { DailyQuests } from "@/features/engagement/daily-quests";
import { ProgressTree } from "@/features/home/progress-tree";
import { PhraseCard } from "@/features/phrases/phrase-card";
import { openLanguagePicker } from "@/features/languages/language-picker";
import { CEFR_LEVELS, LANGUAGE_OPTIONS, phrases, scenarios } from "@/lib/content";
import { levelProgress } from "@/lib/progress/levels";
import { useProgress } from "@/lib/progress/store";

const DAILY_GOAL_XP = 50;

const langOf = (code: string) => LANGUAGE_OPTIONS.find((l) => l.code === code) ?? LANGUAGE_OPTIONS[0];

/** YYYY-MM-DD in Oslo, matching the server's day for daily counters. */
function osloToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(new Date());
}

const TILES = [
  { href: "/tolk", emoji: "🧑‍🤝‍🧑", title: "Tolk", text: "Live interpreter for real meetings" },
  { href: "/tandem", emoji: "🤝", title: "Tandem", text: "Swap languages with a buddy, anonymously" },
  { href: "/events", emoji: "🧇", title: "Språkkafé", text: "Practise in real life, earn XP" },
  { href: "/write", emoji: "✍️", title: "Write & notes", text: "Trace A to Å step by step, and keep your own notes" },
  { href: "/words", emoji: "🧠", title: "My words", text: "Words for your work and interests" }, // T20
];

export function HomeDashboard() {
  const p = useProgress();
  const { level, ratio, toNext } = levelProgress(p.xp);
  const cefrIndex = p.cefr ? CEFR_LEVELS.indexOf(p.cefr) : 0;

  const nextScenario =
    scenarios.find((s) => CEFR_LEVELS.indexOf(s.level) >= cefrIndex) ?? scenarios[0];
  const nextPhrase = phrases.find((ph) => !p.learnedPhraseIds.includes(ph.id)) ?? phrases[0];
  // The server counts today's XP in daily.counts.xp (Oslo day); a stale day means nothing earned yet today.
  const todayXp = p.daily.day && p.daily.day === osloToday() ? (p.daily.counts.xp ?? 0) : 0;
  const goalRatio = Math.min(1, todayXp / DAILY_GOAL_XP);
  const goalDone = todayXp >= DAILY_GOAL_XP;

  const startSteps = [
    { emoji: "🧭", title: "Find your level", text: "3-minute test, A0 to C2", href: "/onboarding", done: p.cefr !== null },
    { emoji: "💬", title: "Learn your first phrase", text: "Real Norwegian, with when to use it", href: "#phrase", done: p.learnedPhraseIds.length > 0 },
    { emoji: "🎙️", title: "Have your first conversation", text: "Talk out loud with your AI tutor", href: `/speak?scenario=${nextScenario.id}`, done: p.unlocked.includes("first-talk") },
  ];

  return (
    // Phones/tablets: one column in the order-* sequence. Desktop (lg): lessons on the left,
    // a sticky sidebar with tree + goals on the right. The wrappers are `contents` below lg so order-* works.
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
      <div className="contents lg:flex lg:flex-col lg:gap-6">
      {/* Greeting + level */}
      <section className="relative order-1 overflow-hidden rounded-[2rem] border-2 border-brand-deep bg-brand p-6 text-brand-ink shadow-[0_5px_0_var(--brand-deep)] lg:order-none">
        <Cloud className="pointer-events-none absolute -right-4 -top-2 w-24 opacity-25" />
        <Cloud className="pointer-events-none absolute bottom-10 right-28 w-14 opacity-20" />
        <div className="relative flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-medium opacity-90">Hei{p.nickname ? `, ${p.nickname}` : ""}! 👋</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">Let&apos;s speak some real Norwegian today.</h1>
          </div>
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-brand-deep bg-surface shadow-[0_4px_0_var(--brand-deep)] sm:h-24 sm:w-24">
            <Mascot className="h-14 w-14 sm:h-16 sm:w-16" />
          </span>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {/* Shows the chosen pair; tapping it reopens the language picker. */}
          <button
            type="button"
            onClick={openLanguagePicker}
            aria-label={`Languages: you speak ${langOf(p.nativeLanguage).name}, learning ${langOf(p.targetLanguage).name}. Change`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-bold transition hover:bg-white/30"
          >
            {langOf(p.nativeLanguage).flag} → {langOf(p.targetLanguage).flag}
            <span className="font-semibold opacity-90">{langOf(p.targetLanguage).name}</span>
            <span className="text-xs font-semibold underline opacity-80">change</span>
          </button>
          {p.cefr && <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-bold">Your level: {p.cefr}</span>}
        </div>
        <div className="relative mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-xs font-semibold">
            <span>Player level {level}</span>
            <span className="opacity-80">{toNext} XP to level {level + 1}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25" role="progressbar" aria-label="Progress to next player level" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
        </div>
      </section>

      {/* First-time guide: tells a new learner exactly what to do, then disappears. */}
      {startSteps.some((s) => !s.done) && (
        <section aria-labelledby="start-here" className="order-2 lg:order-none">
          <SectionTitle action={<span className="text-sm font-semibold text-muted">{startSteps.filter((s) => s.done).length} of {startSteps.length} done</span>}>
            <span id="start-here">Start here</span>
          </SectionTitle>
          <ol className="flex flex-col gap-2">
            {startSteps.map((s, i) => {
              const next = !s.done && startSteps.slice(0, i).every((x) => x.done);
              return (
                <li key={s.title}>
                  <Link
                    href={s.href}
                    className={`flex min-h-16 items-center gap-4 rounded-2xl border-2 p-4 transition ${s.done ? "border-line bg-surface-2" : next ? "border-brand bg-surface shadow-[0_4px_0_var(--brand-deep)] hover:-translate-y-0.5" : "border-line bg-surface shadow-[0_4px_0_var(--line)] hover:bg-surface-2"}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold ${s.done ? "bg-success text-white" : next ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted"}`} aria-hidden>
                      {s.done ? "✓" : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-bold ${s.done ? "text-muted line-through" : ""}`}>
                        <span className="mr-1.5" aria-hidden>{s.emoji}</span>
                        {s.title}
                        <span className="sr-only">{s.done ? " (done)" : ""}</span>
                      </span>
                      {!s.done && <span className="block text-sm text-muted">{s.text}</span>}
                    </span>
                    {!s.done && <span className={`text-xl ${next ? "text-brand" : "text-muted"}`} aria-hidden>→</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Continue speaking */}
      <section className="order-5 lg:order-none">
        <SectionTitle action={<Link href="/speak" className="text-sm font-semibold text-brand">All scenarios →</Link>}>
          Speak now
        </SectionTitle>
        <Card className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-4xl" aria-hidden>
              {nextScenario.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-snug">{nextScenario.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{nextScenario.level}</Badge>
                <Badge tone="accent">+{nextScenario.xpReward} XP</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{nextScenario.goal}</p>
            </div>
          </div>
          <Button href={`/speak?scenario=${nextScenario.id}`} variant="accent" className="w-full">
            🎙️ Start talking
          </Button>
        </Card>
      </section>

      {/* Phrase of the moment */}
      <section id="phrase" className="order-6 scroll-mt-20 lg:order-none">
        <SectionTitle action={<Link href="/phrases" className="text-sm font-semibold text-brand">Phrasebook →</Link>}>
          Say it like a local
        </SectionTitle>
        <PhraseCard phrase={nextPhrase} />
      </section>

      {/* More ways to learn */}
      <section className="order-7 lg:order-none">
        <SectionTitle>More ways to practise</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-3xl border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--line)] transition hover:-translate-y-1 hover:-rotate-1">
              <div className="text-3xl" aria-hidden>
                {t.emoji}
              </div>
              <p className="mt-2 font-display text-lg font-semibold">{t.title}</p>
              <p className="text-sm text-muted">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>
      </div>

      {/* Sidebar on desktop */}
      <div className="contents lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-6">
      {/* Grows with total XP: a visible reward for every bit of practice. */}
      <div className="order-3 lg:order-none">
        <ProgressTree />
      </div>

      {/* T21: daily quests (the server decides the bonus XP) */}
      <div className="order-4 lg:order-none">
        <DailyQuests />
      </div>

      {/* Daily goal + streak */}
      <div className="order-4 grid grid-cols-2 gap-3 lg:order-none">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Daily goal</p>
          <p className="font-display text-3xl font-bold tabular-nums">
            {Math.min(todayXp, DAILY_GOAL_XP)}/{DAILY_GOAL_XP} <span className="text-base font-semibold text-muted">XP</span>
          </p>
          <ProgressBar value={goalRatio} tone={goalDone ? "success" : "accent"} label="Daily goal" />
          <p className="text-xs text-muted">{goalDone ? "✅ Goal reached. Nice!" : todayXp === 0 ? "Learn one phrase to start." : `${DAILY_GOAL_XP - todayXp} XP to go today.`}</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Streak</p>
          <p className="font-display text-3xl font-bold">🔥 {p.streakDays} {p.streakDays === 1 ? "day" : "days"}</p>
          <p className="text-xs text-muted">{p.streakDays === 0 ? "Practise today to start one." : "Practise every day to keep it."}</p>
        </Card>
      </div>
      </div>
    </div>
  );
}
