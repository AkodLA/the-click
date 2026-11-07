"use client";
/**
 * T21 team league: a class, workplace, introduction programme or library learns together.
 * Join with a code (saved on this device); your XP this week counts for your team.
 * Teams are SAMPLE DATA for the demo; real team accounts need a database (roadmap, T17).
 */
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { getTeam, sampleTeams } from "@/lib/content";
import { savePrefs, usePrefs } from "@/lib/personal/prefs";
import { weekXpNow } from "@/lib/progress/display";
import { useProgress } from "@/lib/progress/store";

export function TeamLeague() {
  const p = useProgress();
  const prefs = usePrefs();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const myTeam = prefs.teamCode ? getTeam(prefs.teamCode) : undefined;
  const mine = weekXpNow(p);

  // Your XP is added to your team's sample total (you are one of its members).
  const rows = sampleTeams
    .map((t) => ({ ...t, total: t.weekXp + (t.code === myTeam?.code ? mine : 0) }))
    .sort((a, b) => b.total - a.total);

  function join(e: FormEvent) {
    e.preventDefault();
    const t = getTeam(code);
    if (!t) {
      setError("No team with that code. Ask your teacher or manager for it (try LAGER-OSLO in the demo).");
      return;
    }
    savePrefs({ ...prefs, teamCode: t.code });
    setCode("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-brand p-6 text-brand-ink shadow-md">
        <p className="text-sm font-semibold opacity-80">Team league · this week</p>
        <h1 className="mt-1 text-3xl font-black leading-tight">{myTeam ? `${myTeam.emoji} ${myTeam.name}` : "Learn together"}</h1>
        <p className="mt-2 text-sm opacity-90">
          {myTeam
            ? `You're #${rows.findIndex((r) => r.code === myTeam.code) + 1} of ${rows.length} teams. Your ${mine} XP this week counts for the team.`
            : "Classes, workplaces and introduction programmes compete together. Every learner's XP counts."}
        </p>
      </section>

      {!myTeam ? (
        <Card className="flex flex-col gap-3">
          <p className="font-bold">Join your team</p>
          <form onSubmit={join} className="flex gap-2">
            <label htmlFor="team-code" className="sr-only">
              Team code
            </label>
            <input
              id="team-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={24}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Team code, e.g. LAGER-OSLO"
              className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-base uppercase focus:border-brand focus:outline-none"
            />
            <Button type="submit" disabled={!code.trim()}>
              Join
            </Button>
          </form>
          {error && (
            <p className="text-sm font-semibold text-warn" role="status">
              {error}
            </p>
          )}
          <p className="text-xs text-muted">Only your nickname and XP are shared with the team. No names, no emails.</p>
        </Card>
      ) : (
        <button type="button" onClick={() => savePrefs({ ...prefs, teamCode: null })} className="h-11 self-start text-sm font-semibold text-muted underline">
          Leave {myTeam.name}
        </button>
      )}

      <section>
        <SectionTitle action={<Badge tone="muted">Sample teams</Badge>}>Standings</SectionTitle>
        <ol className="flex flex-col gap-2">
          {rows.map((t, i) => {
            const me = t.code === myTeam?.code;
            return (
              <li
                key={t.code}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${me ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
                aria-current={me ? "true" : undefined}
              >
                <span className="w-6 text-center font-black text-muted">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                <span className="text-2xl" aria-hidden>
                  {t.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-semibold ${me ? "text-brand" : ""}`}>
                    {t.name}
                    {me && " (your team)"}
                  </span>
                  <span className="text-xs text-muted">
                    {t.kind} · {t.members + (me ? 1 : 0)} learners · {Math.round(t.total / (t.members + (me ? 1 : 0)))} XP each
                  </span>
                </span>
                <span className="font-bold text-accent">{t.total} XP</span>
              </li>
            );
          })}
        </ol>
      </section>

      <Card className="flex flex-col gap-2 bg-surface-2 text-sm">
        <p className="font-bold">🏢 For organisations</p>
        <p className="text-muted">
          Schools, employers and introduction programmes get a team code and a progress overview with no personal data. See the{" "}
          <Link href="/#organisations" className="font-semibold text-brand underline">
            organisations page
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
