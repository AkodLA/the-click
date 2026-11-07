"use client";
import { AppShell } from "@/components/AppShell";
import { LEAGUE } from "@/lib/content";
import { useProgress } from "@/lib/progress";

export default function KonkurransePage() {
  const p = useProgress();
  const me = { nick: p.nick || "Deg", avatar: "⭐", xp: p.xp, me: true };
  const rows = [...LEAGUE.map((r) => ({ ...r, me: false })), me].sort((a, b) => b.xp - a.xp);
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7) - 1;

  return (
    <AppShell title="Ukesliga" back="/">
      <p className="text-ink-soft">
        Du konkurrerer bare mot folk på ditt nivå ({p.level ?? "A1"}). Topp 3 rykker opp, og månedens vinner får merke.
      </p>
      <p className="mt-3 font-bold">{daysLeft === 0 ? "Siste dag!" : `${daysLeft} dager igjen`}</p>

      <ol className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.nick + i}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${r.me ? "bg-sol" : "bg-sheet"} ${i === 3 ? "mt-4" : ""}`}
          >
            <span className="w-6 text-center font-bold">{i + 1}</span>
            <span className="text-2xl" aria-hidden>
              {r.avatar}
            </span>
            <span className="flex-1 font-bold">{r.nick}</span>
            <span className="font-bold">{r.xp} XP</span>
            {i < 3 && <span aria-label="Rykker opp">⬆️</span>}
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-3xl bg-sheet p-5">
        <p className="font-bold">Månedens utfordring</p>
        <p className="mt-1 text-ink-soft">Ha tre samtaler på jobb eller skole uten tolk. Læreren hjelper deg å øve først.</p>
      </section>
    </AppShell>
  );
}
