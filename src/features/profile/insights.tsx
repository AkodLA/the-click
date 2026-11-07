"use client";
/**
 * T21 profile insights:
 *  - WhyLevel: which levels of the placement test you got right, and what to do for the next level.
 *  - WeekSummary: this week's practice, counted by the server, plus your most frequent mistake.
 *  - Certificates: passed field tests, downloadable as a picture.
 * Display only: every number comes from the server-signed progress (mistakes: device notebook).
 */
import Link from "next/link";
import { Badge, Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { downloadCertificate } from "@/features/engagement/share-image";
import { CEFR_LEVELS, getPack } from "@/lib/content";
import { topMistake, useMistakes } from "@/lib/personal/mistakes";
import { osloWeekClient, weekXpNow } from "@/lib/progress/display";
import { useProgress } from "@/lib/progress/store";

export function WhyLevel() {
  const p = useProgress();
  if (!p.placement || !p.cefr) return null;
  const next = CEFR_LEVELS[CEFR_LEVELS.indexOf(p.cefr) + 1];
  const firstMiss = p.placement.byLevel.find((l) => l.right / l.total < 0.5);
  return (
    <section id="why-level" className="scroll-mt-20">
      <SectionTitle action={<Link href="/onboarding" className="text-sm font-semibold text-brand">Retake</Link>}>Why {p.cefr}?</SectionTitle>
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          You got {p.placement.correct} of {p.placement.total} right. Your level is the highest one where you got at least half the questions right, with every level below it passed too.
        </p>
        <ul className="flex flex-col gap-2">
          {p.placement.byLevel.map((l) => {
            const ok = l.right / l.total >= 0.5;
            return (
              <li key={l.level} className="flex items-center gap-3 text-sm">
                <span className="w-8 font-bold">{l.level}</span>
                <span className="flex-1">
                  <ProgressBar value={l.right / l.total} tone={ok ? "success" : "accent"} label={`${l.level}: ${l.right} of ${l.total}`} />
                </span>
                <span className="w-16 text-right font-semibold text-muted">
                  {ok ? "✓" : "✗"} {l.right}/{l.total}
                </span>
              </li>
            );
          })}
        </ul>
        {next && (
          <p className="rounded-2xl bg-brand-soft p-3 text-sm">
            <span className="font-bold text-brand">To reach {next}: </span>
            {firstMiss
              ? `practise ${firstMiss.level} scenarios with the tutor and learn the ${firstMiss.level} words in your packs, then retake the test.`
              : "talk to the tutor at the next level and retake the test."}{" "}
            <Link href="/speak" className="font-semibold text-brand underline">
              Speak →
            </Link>
          </p>
        )}
        {p.cefr !== "A0" && (
          <p className="text-xs text-muted">
            This is Snakk&apos;s estimate, not an official result.{" "}
            <Link href="/resources" className="font-semibold text-brand underline">
              Official tests (Norskprøven) →
            </Link>
          </p>
        )}
      </Card>
    </section>
  );
}

const WEEK_ROWS: { key: string; emoji: string; one: string; many: string }[] = [
  { key: "scenarios", emoji: "🎙️", one: "conversation", many: "conversations" },
  { key: "words", emoji: "🧠", one: "new word", many: "new words" },
  { key: "phrases", emoji: "💬", one: "phrase", many: "phrases" },
  { key: "pronunciation", emoji: "🎯", one: "pronunciation check", many: "pronunciation checks" },
  { key: "writing", emoji: "✍️", one: "traced letter/word", many: "traced letters/words" },
  { key: "tandem", emoji: "🤝", one: "tandem message", many: "tandem messages" },
  { key: "events", emoji: "🧇", one: "språkkafé visit", many: "språkkafé visits" },
  { key: "tests", emoji: "🎓", one: "level-up test", many: "level-up tests" },
];

export function WeekSummary() {
  const p = useProgress();
  const mistakes = useMistakes();
  // Counters from an older week (token not updated since) don't count; the clock is read only when there are counters.
  const counts = p.weekStats?.week && p.weekStats.week === osloWeekClient() ? p.weekStats.counts : {};
  const rows = WEEK_ROWS.filter((r) => (counts[r.key] ?? 0) > 0);
  const top = topMistake(mistakes);
  const weekXp = weekXpNow(p);

  return (
    <section id="week" className="scroll-mt-20">
      <SectionTitle action={<Link href="/mistakes" className="text-sm font-semibold text-brand">📓 Mistakes →</Link>}>Your week in numbers</SectionTitle>
      <Card className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Nothing yet this week. One conversation or three words is a great start!</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-2 rounded-2xl bg-surface-2 p-3">
                <span className="text-xl" aria-hidden>
                  {r.emoji}
                </span>
                <span>
                  <span className="block text-lg font-black leading-none">{counts[r.key]}</span>
                  <span className="text-xs text-muted">{counts[r.key] === 1 ? r.one : r.many}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm">
          <span className="font-bold">{weekXp} XP</span> <span className="text-muted">this week</span>
          {(counts.slangFlags ?? 0) > 0 && <span className="text-muted"> · the tutor flagged slang {counts.slangFlags}×</span>}
        </p>
        {top && (
          <div className="rounded-2xl bg-warn-soft p-3 text-sm">
            <p className="font-bold text-warn">✏️ Your most common mistake{top.count > 1 ? ` (${top.count}×)` : ""}</p>
            <p>
              <span className="line-through opacity-70">«{top.said}»</span> → <span className="font-bold">«{top.better}»</span>
            </p>
            {top.note && <p className="text-xs text-muted">{top.note}</p>}
          </div>
        )}
      </Card>
    </section>
  );
}

export function Certificates() {
  const p = useProgress();
  const certs = p.certificates ?? [];
  return (
    <section id="certificates" className="scroll-mt-20">
      <SectionTitle action={<Link href="/words" className="text-sm font-semibold text-brand">Take a test →</Link>}>Certificates</SectionTitle>
      {certs.length === 0 ? (
        <Card className="text-sm text-muted">
          🎓 Pass a level-up test in one of your work packs (e.g. «Ready for warehouse work?») to get your first Snakk certificate. Looking for an official
          exam?{" "}
          <Link href="/resources" className="font-semibold text-brand underline">
            Exams & resources →
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {certs.map((c) => {
            const pack = getPack(c.packId);
            if (!pack) return null;
            return (
              <li key={c.packId}>
                <Card className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>
                    {pack.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">Ready for {pack.title.toLowerCase()}</span>
                    <span className="text-xs text-muted">
                      {c.score}/{c.total} right · {c.day}
                    </span>
                  </span>
                  <Badge tone="success">🎓</Badge>
                  <Button
                    variant="secondary"
                    aria-label={`Download the ${pack.title} certificate`}
                    onClick={() => downloadCertificate({ nickname: p.nickname, title: pack.title, emoji: pack.emoji, score: c.score, total: c.total, day: c.day })}
                  >
                    📸
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
