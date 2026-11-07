"use client";
/**
 * League (/league): weekly / monthly ranking against learners at the same CEFR level. Owner: T9.
 * Other players are TEST DATA (src/lib/content/community.ts). You are inserted with XP from your signed progress.
 * Display only: XP comes from the server-signed token, never from this screen.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { CEFR_LEVELS, leagueMonth, leagueWeek } from "@/lib/content";
import type { CefrLevel, LeaguePeriod } from "@/lib/content/types";
import { osloWeekClient, weekXpNow } from "@/lib/progress/display";
import { SeasonBanner } from "@/features/engagement/season-banner";
import { useProgress } from "@/lib/progress/store";
import { TeamLeague } from "./team-league";

/** Top N move up a division at the end of the period. */
const PROMOTION_SPOTS = 3;

interface Row {
  nickname: string;
  avatar: string;
  xp: number;
  me: boolean;
  rank: number;
}

/** Time left until the league resets: Monday 00:00 Oslo (week) or the 1st of next month 00:00 Oslo (month). */
function timeLeft(period: LeaguePeriod, now = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Oslo",
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const minutesToday = Number(parts.hour) * 60 + Number(parts.minute);
  let days: number;
  if (period === "week") {
    const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday);
    days = 6 - dow;
  } else {
    const y = Number(parts.year);
    const m = Number(parts.month);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    days = daysInMonth - Number(parts.day);
  }
  const mins = days * 1440 + (1440 - minutesToday);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${mins % 60}m`;
}

/** T21: People league (by level) or Team league (classes, workplaces), plus the seasonal challenge. */
export function LeagueView() {
  const [mode, setMode] = useState<"people" | "teams">("people");
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="tablist" aria-label="League type">
        {(["people", "teams"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`h-11 rounded-xl text-sm font-bold transition ${mode === m ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
          >
            {m === "people" ? "🙂 Learners" : "👥 Teams"}
          </button>
        ))}
      </div>
      <SeasonBanner compact />
      {mode === "people" ? <PeopleLeague /> : <TeamLeague />}
    </div>
  );
}

function PeopleLeague() {
  const p = useProgress();
  const [period, setPeriod] = useState<LeaguePeriod>("week");
  const [browseLevel, setBrowseLevel] = useState<CefrLevel | null>(null);
  const [clock, setClock] = useState<{ left: string; week: string } | null>(null);

  // The clock is read after mount only (the page is prerendered without a time).
  useEffect(() => {
    const tick = () => setClock({ left: timeLeft(period), week: osloWeekClient() });
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [period]);

  const myLevel = p.cefr;
  const level: CefrLevel = browseLevel ?? myLevel ?? "A1";
  const inMyLeague = myLevel !== null && level === myLevel;
  const myXp = period === "week" ? weekXpNow(p) : p.xp;
  const source = period === "week" ? leagueWeek : leagueMonth;

  const players = source.filter((e) => e.level === level).map((e) => ({ nickname: e.nickname, avatar: e.avatar, xp: e.xp, me: false }));
  if (inMyLeague) players.push({ nickname: p.nickname || "You", avatar: "🙂", xp: myXp, me: true });
  // Ties: the other player stays ahead (you have to beat them).
  const rows: Row[] = players
    .sort((a, b) => b.xp - a.xp || Number(a.me) - Number(b.me))
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const me = rows.find((r) => r.me);
  const ahead = me && me.rank > 1 ? rows[me.rank - 2] : null;
  const toNextRank = ahead ? ahead.xp - (me?.xp ?? 0) + 1 : 0;
  const toPromotion =
    me && me.rank > PROMOTION_SPOTS && rows.length > PROMOTION_SPOTS ? rows[PROMOTION_SPOTS - 1].xp - me.xp + 1 : 0;
  const podium = rows.slice(0, 3);
  const levelsWithPlayers = CEFR_LEVELS.filter((l) => source.some((e) => e.level === l) || l === myLevel);
  const nextLevel = CEFR_LEVELS[CEFR_LEVELS.indexOf(level) + 1];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">League · {level} division</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">
          {me ? (me.rank === 1 ? "You're on top! 👑" : `You're #${me.rank} of ${rows.length}`) : "Compete with learners at your level"}
        </h1>
        <p className="mt-2 text-sm opacity-90">
          {me
            ? me.rank <= PROMOTION_SPOTS
              ? `You're in the promotion zone. Hold it until the ${period} ends!`
              : `${toPromotion} XP to reach the promotion zone.`
            : "Beginners play against beginners, so everyone has a fair chance."}
        </p>
        <p className="mt-3 text-xs font-semibold opacity-80">
          ⏳ {clock ? `Ends in ${clock.left}` : "…"}
          {period === "week" && clock && ` · ${clock.week}`}
        </p>
      </section>

      {/* Period toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="tablist" aria-label="League period">
        {(["week", "month"] as const).map((per) => (
          <button
            key={per}
            type="button"
            role="tab"
            aria-selected={period === per}
            onClick={() => setPeriod(per)}
            className={`h-11 rounded-xl text-sm font-bold transition ${period === per ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
          >
            {per === "week" ? "This week" : "This month"}
          </button>
        ))}
      </div>

      {!myLevel && (
        <Card className="flex flex-col gap-3 border-brand bg-brand-soft">
          <p className="font-bold">🧭 Find your level to join a league</p>
          <p className="text-sm text-muted">The 3-minute placement test puts you in the right division. Until then you can look around.</p>
          <Button href="/onboarding">Find your level</Button>
        </Card>
      )}

      {/* Podium */}
      {podium.length > 0 && (
        <section aria-label="Top 3">
          <div className="grid grid-cols-3 items-end gap-2">
            {[podium[1], podium[0], podium[2]].map((r, i) =>
              r ? <PodiumSpot key={r.nickname + r.rank} row={r} height={["h-24", "h-32", "h-20"][i]} /> : <div key={`empty-${i}`} />,
            )}
          </div>
        </section>
      )}

      {/* Ranking */}
      <section>
        <SectionTitle action={<Badge tone="muted">Sample players</Badge>}>Ranking</SectionTitle>
        <ol className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.nickname + r.rank}>
              {r.rank === PROMOTION_SPOTS + 1 && rows.length > PROMOTION_SPOTS && <PromotionLine nextLevel={nextLevel} />}
              <RankRow row={r} promoted={r.rank <= PROMOTION_SPOTS} />
            </li>
          ))}
          {rows.length <= PROMOTION_SPOTS && rows.length > 0 && <PromotionLine nextLevel={nextLevel} />}
        </ol>
        {rows.length === 0 && (
          <Card className="py-8 text-center text-sm text-muted">Nobody in the {level} division yet. Be the first!</Card>
        )}
        {period === "month" && me && (
          <p className="mt-3 text-xs text-muted">Monthly XP uses your total XP for now (per-month tracking comes with accounts).</p>
        )}
      </section>

      {/* How to climb: connects the league to the rest of the app */}
      {me && (
        <Card className="flex flex-col gap-3">
          <p className="font-bold">
            {ahead ? `📈 ${toNextRank} XP to pass ${ahead.nickname}` : "🛡️ Defend your spot"}
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <ClimbLink href="/speak" emoji="🎙️" title="Speak" detail="Finish a scenario" />
            <ClimbLink href="/phrases?show=new" emoji="💬" title="Phrases" detail="+5 XP each" />
            <ClimbLink href="/events" emoji="🧇" title="Språkkafé" detail="Check in for XP" />
            <ClimbLink href="/write" emoji="✍️" title="Write" detail="Trace æ ø å" />
          </div>
          <Link href="/profile" className="text-sm font-semibold text-brand">
            Your progress and achievements →
          </Link>
        </Card>
      )}

      {/* Browse other divisions */}
      <section>
        <SectionTitle>Other divisions</SectionTitle>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Division">
          {levelsWithPlayers.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={l === level}
              onClick={() => setBrowseLevel(l === myLevel ? null : l)}
              className={`inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold transition ${
                l === level ? "bg-ink text-bg" : "border border-line bg-surface hover:bg-surface-2"
              }`}
            >
              {l}
              {l === myLevel && <span aria-label="your division"> ⭐</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PodiumSpot({ row, height }: { row: Row; height: string }) {
  const medal = ["🥇", "🥈", "🥉"][row.rank - 1];
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-3xl" aria-hidden>
        {row.avatar}
      </span>
      <p className={`w-full truncate text-sm font-bold ${row.me ? "text-brand" : ""}`}>{row.me ? `${row.nickname} (you)` : row.nickname}</p>
      <p className="text-xs font-semibold text-accent">{row.xp} XP</p>
      <div className={`flex w-full items-start justify-center rounded-t-2xl pt-2 text-2xl ${height} ${row.me ? "bg-brand text-brand-ink" : "bg-brand-soft"}`}>
        <span aria-label={`Rank ${row.rank}`}>{medal}</span>
      </div>
    </div>
  );
}

function RankRow({ row, promoted }: { row: Row; promoted: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        row.me ? "border-brand bg-brand-soft" : "border-line bg-surface"
      }`}
      aria-current={row.me ? "true" : undefined}
    >
      <span className="w-6 text-center font-black text-muted">{row.rank}</span>
      <span className="text-2xl" aria-hidden>
        {row.avatar}
      </span>
      <span className={`min-w-0 flex-1 truncate font-semibold ${row.me ? "text-brand" : ""}`}>
        {row.nickname}
        {row.me && " (you)"}
      </span>
      {promoted && (
        <span className="text-sm" aria-label="promotion zone" title="Promotion zone">
          ⬆️
        </span>
      )}
      <span className="font-bold text-accent">{row.xp} XP</span>
    </div>
  );
}

function PromotionLine({ nextLevel }: { nextLevel?: CefrLevel }) {
  return (
    <div className="my-2 flex items-center gap-2 text-xs font-bold text-success">
      <span className="h-px flex-1 bg-success" aria-hidden />
      ⬆️ Promotion zone{nextLevel ? `: top ${PROMOTION_SPOTS} move up to ${nextLevel}` : `: top ${PROMOTION_SPOTS}`}
      <span className="h-px flex-1 bg-success" aria-hidden />
    </div>
  );
}

function ClimbLink({ href, emoji, title, detail }: { href: string; emoji: string; title: string; detail: string }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface p-3 transition hover:bg-surface-2">
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <span className="leading-tight">
        <span className="block font-bold">{title}</span>
        <span className="text-xs text-muted">{detail}</span>
      </span>
    </Link>
  );
}
