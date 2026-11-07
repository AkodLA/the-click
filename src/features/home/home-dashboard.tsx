"use client";
/**
 * Home screen (/learn): the learner's daily hub.
 * Owner: T1 (Akram). It shows what good Snakk UI looks like, so copy its patterns.
 */
import Link from "next/link";
import { Badge, Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { PhraseCard } from "@/features/phrases/phrase-card";
import { CEFR_LEVELS, phrases, scenarios } from "@/lib/content";
import { levelProgress } from "@/lib/progress/levels";
import { useProgress } from "@/lib/progress/store";

const DAILY_GOAL_XP = 50;

const TILES = [
  { href: "/tolk", emoji: "🧑‍🤝‍🧑", title: "Tolk", text: "Live interpreter for real meetings" },
  { href: "/tandem", emoji: "🤝", title: "Tandem", text: "Swap languages with a buddy, anonymously" },
  { href: "/events", emoji: "🧇", title: "Språkkafé", text: "Practise in real life, earn XP" },
  { href: "/write", emoji: "✍️", title: "Write", text: "Draw æ, ø, å and new words" },
];

export function HomeDashboard() {
  const p = useProgress();
  const { level, ratio, toNext } = levelProgress(p.xp);
  const cefrIndex = p.cefr ? CEFR_LEVELS.indexOf(p.cefr) : 0;

  const nextScenario =
    scenarios.find((s) => CEFR_LEVELS.indexOf(s.level) >= cefrIndex) ?? scenarios[0];
  const nextPhrase = phrases.find((ph) => !p.learnedPhraseIds.includes(ph.id)) ?? phrases[0];
  const goalRatio = Math.min(1, p.weekXp / DAILY_GOAL_XP);

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + level */}
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Hei{p.nickname ? `, ${p.nickname}` : ""}! 👋</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Let&apos;s speak some real Norwegian today.</h1>
        <div className="mt-5 flex items-center gap-3">
          {p.cefr ? (
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">Your level: {p.cefr}</span>
          ) : (
            <Link href="/onboarding" className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-brand">
              Find your level (3 min) →
            </Link>
          )}
          <span className="text-sm font-semibold opacity-90">Player level {level}</span>
        </div>
        <div className="mt-3">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs opacity-80">{toNext} XP to level {level + 1}</p>
        </div>
      </section>

      {/* Daily goal + streak */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Daily goal</p>
          <p className="text-2xl font-black">
            {Math.min(p.weekXp, DAILY_GOAL_XP)}/{DAILY_GOAL_XP} <span className="text-base font-semibold text-muted">XP</span>
          </p>
          <ProgressBar value={goalRatio} tone="accent" label="Daily goal" />
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Streak</p>
          <p className="text-2xl font-black">🔥 {p.streakDays} {p.streakDays === 1 ? "day" : "days"}</p>
          <p className="text-xs text-muted">Practise every day to keep it.</p>
        </Card>
      </div>

      {/* Continue speaking */}
      <section>
        <SectionTitle action={<Link href="/speak" className="text-sm font-semibold text-brand">All scenarios →</Link>}>
          Speak now
        </SectionTitle>
        <Card className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-4xl" aria-hidden>
            {nextScenario.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold">{nextScenario.title}</p>
              <Badge tone="brand">{nextScenario.level}</Badge>
            </div>
            <p className="truncate text-sm text-muted">{nextScenario.goal}</p>
          </div>
          <Button href={`/speak?scenario=${nextScenario.id}`} variant="accent" aria-label={`Start ${nextScenario.title}`}>
            🎙️
          </Button>
        </Card>
      </section>

      {/* Phrase of the moment */}
      <section>
        <SectionTitle action={<Link href="/phrases" className="text-sm font-semibold text-brand">Phrasebook →</Link>}>
          Say it like a local
        </SectionTitle>
        <PhraseCard phrase={nextPhrase} />
      </section>

      {/* More ways to learn */}
      <section>
        <SectionTitle>More ways to practise</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-3xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-3xl" aria-hidden>
                {t.emoji}
              </div>
              <p className="mt-2 font-bold">{t.title}</p>
              <p className="text-sm text-muted">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
