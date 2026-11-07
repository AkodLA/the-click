"use client";
/**
 * T21 seasonal challenge banner: shows the running season (e.g. «Cosy autumn week»), progress from the
 * server-signed token, and a link to the season's words. Hidden when no season runs.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui";
import { activeSeason } from "@/lib/content";
import { useProgress } from "@/lib/progress/store";

function osloToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date());
}

export function SeasonBanner({ compact = false }: { compact?: boolean }) {
  const p = useProgress();
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDay(osloToday()), 0);
    return () => clearTimeout(t);
  }, []);
  const season = day ? activeSeason(day) : undefined;
  if (!season || !day) return null;

  const have = Math.min(season.goal, p.seasons?.[season.id] ?? 0);
  const won = p.unlocked.includes(season.achievementId);
  const daysLeft = Math.round((Date.parse(season.end) - Date.parse(day)) / 86_400_000) + 1;

  return (
    <Link
      href={`/words?pack=${season.packId}`}
      className="flex items-center gap-4 rounded-3xl border-2 border-accent bg-accent-soft p-4 shadow-sm transition hover:-translate-y-0.5"
    >
      <span className="text-4xl" aria-hidden>
        {season.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-wide text-accent">Seasonal challenge · {daysLeft} {daysLeft === 1 ? "day" : "days"} left</span>
        <span className="block font-bold">{won ? `${season.title}: badge won! 🏅` : season.title}</span>
        {!compact && <span className="block text-sm text-muted">{won ? "Keep learning the season's words." : `Learn ${season.goal} season words for a limited badge.`}</span>}
        <span className="mt-1.5 block">
          <ProgressBar value={have / season.goal} tone="accent" label={`${season.title}: ${have} of ${season.goal} words`} />
        </span>
      </span>
      <span className="shrink-0 text-sm font-bold text-accent">
        {have}/{season.goal}
      </span>
    </Link>
  );
}
