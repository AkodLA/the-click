"use client";
/**
 * T21 daily quests: 3 small goals per Oslo day, the same for everyone (questsForDay).
 * Progress and bonus XP are decided by the SERVER (daily counters `d:<stat>` and `quest:<id>` in the signed token);
 * this card only shows them.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, ProgressBar } from "@/components/ui";
import { questsForDay } from "@/lib/content";
import { useProgress } from "@/lib/progress/store";

function osloToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date());
}

export function DailyQuests() {
  const p = useProgress();
  // The day is read in the browser only (the page is prerendered).
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDay(osloToday()), 0);
    return () => clearTimeout(t);
  }, []);
  if (!day) return null;

  const counts = p.daily.day === day ? p.daily.counts : {};
  const quests = questsForDay(day);
  const done = quests.filter((q) => (counts[`quest:${q.id}`] ?? 0) > 0).length;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-bold">🗺️ Daily quests</p>
        <span className="text-sm font-semibold text-muted">
          {done}/{quests.length} {done === quests.length && "· 🎉"}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {quests.map((q) => {
          const have = Math.min(q.target, counts[`d:${q.stat}`] ?? 0);
          const complete = (counts[`quest:${q.id}`] ?? 0) > 0;
          return (
            <li key={q.id}>
              <Link
                href={q.href}
                className={`flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2 transition ${
                  complete ? "border-success bg-success-soft" : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {complete ? "✅" : q.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${complete ? "text-success" : ""}`}>{q.title}</span>
                  {!complete && <ProgressBar value={have / q.target} tone="accent" label={`${q.title}: ${have} of ${q.target}`} />}
                </span>
                <span className="shrink-0 text-xs font-bold text-accent">{complete ? "Done" : `${have}/${q.target} · +${q.xp}`}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted">New quests every day at midnight (Oslo time). All 3 → 🗺️ Quest master.</p>
    </Card>
  );
}
