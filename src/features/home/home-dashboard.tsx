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

/** YYYY-MM-DD in Oslo, matching the server's day for daily counters. */
function osloToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(new Date());
}

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
  // The server counts today's XP in daily.counts.xp (Oslo day); a stale day means nothing earned yet today.
  const todayXp = p.daily.day && p.daily.day === osloToday() ? (p.daily.counts.xp ?? 0) : 0;
  const goalRatio = Math.min(1, todayXp / DAILY_GOAL_XP);
  const goalDone = todayXp >= DAILY_GOAL_XP;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + level */}
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Hei{p.nickname ? `, ${p.nickname}` : ""}! 👋</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">Let&apos;s speak some real Norwegian today.</h1>
        {p.cefr ? (
          <span className="mt-5 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-bold">Your level: {p.cefr}</span>
        ) : (
          <Link href="/onboarding" className="mt-5 inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 text-sm font-bold text-brand shadow-sm transition hover:brightness-95 active:scale-[0.98]">
            🧭 Find your level · 3 min →
          </Link>
        )}
        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-xs font-semibold">
            <span>Player level {level}</span>
            <span className="opacity-80">{toNext} XP to level {level + 1}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25" role="progressbar" aria-label="Progress to next player level" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
        </div>
      </section>

      {/* Daily goal + streak */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Daily goal</p>
          <p className="text-2xl font-black tabular-nums">
            {Math.min(todayXp, DAILY_GOAL_XP)}/{DAILY_GOAL_XP} <span className="text-base font-semibold text-muted">XP</span>
          </p>
          <ProgressBar value={goalRatio} tone={goalDone ? "success" : "accent"} label="Daily goal" />
          <p className="text-xs text-muted">{goalDone ? "✅ Goal reached. Nice!" : todayXp === 0 ? "Learn one phrase to start." : `${DAILY_GOAL_XP - todayXp} XP to go today.`}</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Streak</p>
          <p className="text-2xl font-black">🔥 {p.streakDays} {p.streakDays === 1 ? "day" : "days"}</p>
          <p className="text-xs text-muted">{p.streakDays === 0 ? "Practise today to start one." : "Practise every day to keep it."}</p>
        </Card>
      </div>

      {/* Continue speaking */}
      <section>
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
