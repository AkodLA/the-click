"use client";
/**
 * Profile (/profile): level ring, XP, streak, weekly XP and the achievement grid.
 * Owner: T6. Display only: every number comes from the server-signed progress token.
 */
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { achievements, LANGUAGE_NAMES } from "@/lib/content";
import type { Achievement } from "@/lib/content/types";
import {
  achievementList,
  streakNow,
  todayXpNow,
  weekXpNow,
  WEEKLY_GOAL_XP,
  type StreakState,
} from "@/lib/progress/display";
import { levelProgress } from "@/lib/progress/levels";
import { AboutYou } from "@/features/personal/about-you";
import { Certificates, WeekSummary, WhyLevel } from "./insights";
import { progressActions, useProgress } from "@/lib/progress/store";

const STREAK_COPY: Record<StreakState, string> = {
  active: "You practised today. Nice!",
  "at-risk": "Practise today to keep it alive.",
  broken: "Your streak ended. Start a new one today!",
  none: "Practise today to start a streak.",
};

export function ProfileView() {
  const p = useProgress();
  const { level, ratio, toNext } = levelProgress(p.xp);
  const streak = streakNow(p);
  const weekXp = weekXpNow(p);
  const todayXp = todayXpNow(p);
  const list = achievementList(p);
  const unlockedCount = list.filter((x) => x.unlocked).length;
  const isNew = p.xp === 0 && p.unlocked.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header: level ring + identity */}
      <section className="flex items-center gap-5 rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <LevelRing level={level} ratio={ratio} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold opacity-80">Your progress</p>
          <h1 className="break-words text-2xl font-black leading-tight sm:text-3xl">{p.nickname || "New learner"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
            {p.cefr ? (
              <span className="rounded-full bg-white/20 px-3 py-1">Norwegian {p.cefr}</span>
            ) : (
              <Link href="/onboarding" className="rounded-full bg-white px-3 py-1 text-brand">
                Find your level →
              </Link>
            )}
            {p.nickname && (
              <span className="opacity-90">Speaks {LANGUAGE_NAMES[p.nativeLanguage] ?? p.nativeLanguage}</span>
            )}
          </div>
          <p className="mt-3 text-xs opacity-80">
            {p.xp} XP total · {toNext} XP to level {level + 1}
          </p>
        </div>
      </section>

      {isNew && (
        <Card className="flex flex-col gap-3 text-center">
          <div className="text-4xl" aria-hidden>
            🌱
          </div>
          <p className="font-bold">Nothing here yet</p>
          <p className="text-sm text-muted">Finish the placement test or your first conversation to earn XP and unlock achievements.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {!p.cefr && <Button href="/onboarding">Find your level</Button>}
            <Button href="/speak" variant={p.cefr ? "primary" : "secondary"}>
              Start speaking
            </Button>
          </div>
        </Card>
      )}

      {/* Streak + weekly XP */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Streak</p>
          <p className="text-2xl font-black">
            <span aria-hidden>{streak.state === "broken" ? "🧊" : "🔥"}</span> {streak.days} {streak.days === 1 ? "day" : "days"}
          </p>
          <p className="text-xs text-muted">{STREAK_COPY[streak.state]}</p>
          <p className="text-xs font-semibold text-brand" title="A streak freeze saves your streak if you miss one day. Earn one every 7 days in a row (max 2).">
            🧊 {p.streakFreezes ?? 0} streak {(p.streakFreezes ?? 0) === 1 ? "freeze" : "freezes"}
          </p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Today</p>
          <p className="text-2xl font-black">
            {todayXp} <span className="text-base font-semibold text-muted">XP</span>
          </p>
          <p className="text-xs text-muted">{todayXp > 0 ? "Keep going!" : "Earn XP by speaking or learning phrases."}</p>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">This week</p>
            <p className="text-2xl font-black">
              {weekXp}/{WEEKLY_GOAL_XP} <span className="text-base font-semibold text-muted">XP</span>
            </p>
          </div>
          {weekXp >= WEEKLY_GOAL_XP ? <Badge tone="success">✅ Goal reached</Badge> : <Badge tone="accent">{WEEKLY_GOAL_XP - weekXp} XP to go</Badge>}
        </div>
        <ProgressBar value={weekXp / WEEKLY_GOAL_XP} tone="accent" label="Weekly XP goal" />
        <Link href="/league" className="text-sm font-semibold text-brand">
          See your league →
        </Link>
      </Card>

      {/* T21: week in numbers + most common mistake */}
      <WeekSummary />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat emoji="💬" value={p.learnedPhraseIds.length} label="Phrases" href="/phrases?show=learned" />
        <Stat emoji="🏅" value={unlockedCount} label="Badges" href="#achievements" />
        <Stat emoji="🧇" value={p.checkedInEventIds.length} label="Cafés" href="/events" />
        <Stat emoji="🧠" value={(p.learnedWordIds ?? []).length} label="Words" href="/words" />
      </div>

      {/* Achievements */}
      <section id="achievements" className="scroll-mt-20">
        <SectionTitle action={<span className="text-sm font-semibold text-muted">{unlockedCount}/{achievements.length}</span>}>
          Achievements
        </SectionTitle>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map(({ achievement, unlocked, progress }) => (
            <AchievementTile key={achievement.id} a={achievement} unlocked={unlocked} progress={progress} />
          ))}
        </ul>
      </section>

      {/* T20: age group, field and interests (device-only) shape words, scenarios and the tutor. */}
      <WhyLevel />
      <Certificates />

      <section id="about-you" className="scroll-mt-20">
        <SectionTitle action={<Link href="/words" className="text-sm font-semibold text-brand">My words →</Link>}>About you</SectionTitle>
        <AboutYou compact />
      </section>

      {!isNew && <StartOver />}
    </div>
  );
}

function LevelRing({ level, ratio }: { level: number; ratio: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`Player level ${level}, ${pct}% to the next level`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="opacity-25" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Level</span>
        <span className="text-3xl font-black leading-none">{level}</span>
      </div>
    </div>
  );
}

function Stat({ emoji, value, label, href }: { emoji: string; value: number; label: string; href: string }) {
  return (
    <Link
      href={href}
      aria-label={`${value} ${label}`}
      className="flex flex-col items-center gap-1 rounded-3xl border border-line bg-surface p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span className="text-xl font-black">{value}</span>
      <span className="text-xs font-semibold text-muted">{label}</span>
    </Link>
  );
}

function AchievementTile({
  a,
  unlocked,
  progress,
}: {
  a: Achievement;
  unlocked: boolean;
  progress: { current: number; target: number } | null;
}) {
  return (
    <li
      className={`flex flex-col gap-2 rounded-3xl border p-4 shadow-sm ${unlocked ? "border-line bg-surface" : "border-dashed border-line bg-surface-2"}`}
      aria-label={`${a.title}, ${unlocked ? "unlocked" : "locked"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-3xl ${unlocked ? "" : "opacity-40 grayscale"}`} aria-hidden>
          {a.emoji}
        </span>
        {unlocked ? <Badge tone="success">✓ Unlocked</Badge> : <Badge tone="muted">🔒 Locked</Badge>}
      </div>
      <p className={`font-bold leading-tight ${unlocked ? "" : "text-muted"}`}>{a.title}</p>
      <p className="text-xs text-muted">{a.description}</p>
      {!unlocked && progress && (
        <div className="flex flex-col gap-1">
          <ProgressBar value={progress.current / progress.target} label={`${a.title} progress`} />
          <p className="text-xs font-semibold text-muted">
            {progress.current} of {progress.target}
          </p>
        </div>
      )}
      <p className={`mt-auto text-xs font-bold ${unlocked ? "text-accent" : "text-muted"}`}>+{a.xp} XP</p>
    </li>
  );
}

/** Start over on this device (also the demo reset before the pitch). Asks first: progress can't be recovered. */
function StartOver() {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="h-11 self-center text-sm font-semibold text-muted underline">
        Start over on this device
      </button>
    );
  }
  return (
    <Card className="flex flex-col gap-3 border-danger" role="alertdialog" aria-label="Start over">
      <p className="font-bold">Delete your progress on this device?</p>
      <p className="text-sm text-muted">Your XP, level, streak and badges are only saved in this browser. This can&apos;t be undone.</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="accent"
          onClick={() => {
            progressActions.reset();
            setAsking(false);
            window.scrollTo({ top: 0 });
          }}
        >
          Yes, start over
        </Button>
        <Button variant="secondary" onClick={() => setAsking(false)}>
          Keep my progress
        </Button>
      </div>
    </Card>
  );
}
