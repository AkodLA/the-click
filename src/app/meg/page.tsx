"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ACHIEVEMENTS, LEARNER_LANGUAGES } from "@/lib/content";
import { resetProgress, useProgress, xpLevel } from "@/lib/progress";

const SOURCE = { tolk: "Fra et tolket møte", laerer: "Rettet av læreren", slang: "Slang-sjekk" } as const;

export default function MegPage() {
  const p = useProgress();
  const lv = xpLevel(p.xp);
  const lang = LEARNER_LANGUAGES.find((l) => l.code === p.homeLang);

  return (
    <AppShell title="Meg">
      <section className="flex items-center gap-4 rounded-3xl bg-sheet p-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-sol-soft text-3xl" aria-hidden>
          🦊
        </span>
        <div>
          <p className="display text-2xl font-bold">{p.nick || "Uten navn"}</p>
          <p className="text-ink-soft">
            {p.level ?? "Ikke testet"} · Nivå {lv.n} · {lang?.flag} {lang?.native}
          </p>
        </div>
      </section>

      <h2 className="mt-6 text-xl font-bold">Merker</h2>
      <ul className="mt-3 grid grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const got = p.achievements.includes(a.id);
          return (
            <li key={a.id} className={`rounded-3xl p-3 text-center ${got ? "bg-sheet" : "bg-frost outline-2 outline-dashed outline-line"}`}>
              <p className={`text-3xl ${got ? "" : "opacity-30 grayscale"}`} aria-hidden>
                {a.icon}
              </p>
              <p className="mt-1 text-sm font-bold leading-tight">{a.title}</p>
              {!got && <p className="mt-1 text-xs text-ink-soft">{a.how}</p>}
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-xl font-bold">Mine setninger</h2>
      {p.deck.length === 0 ? (
        <p className="mt-2 text-ink-soft">
          Tomt ennå. Bruk <Link href="/tolk" className="font-bold underline">tolken</Link> eller{" "}
          <Link href="/slang" className="font-bold underline">slang-sjekken</Link>, så havner setningene her.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {p.deck.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-sheet px-4 py-3">
              <div>
                <p className="font-bold">{c.no}</p>
                <p className="text-sm text-ink-soft">{SOURCE[c.source]}</p>
              </div>
              <span className={`text-sm font-bold ${c.practiced ? "text-gran" : "text-ink-soft"}`}>
                {c.practiced ? "Sagt selv ✓" : "Ikke øvd"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8 rounded-3xl bg-sheet p-5 text-sm text-ink-soft">
        <p className="font-bold text-ink">Personvern</p>
        <p className="mt-1">
          Fremgangen din ligger bare på denne telefonen. Vi lagrer ikke lydopptak. Andre ser kun kallenavnet ditt.
        </p>
        <button
          onClick={() => {
            if (confirm("Slette all fremgang på denne telefonen?")) resetProgress();
          }}
          className="mt-3 font-bold text-tytte underline"
        >
          Slett fremgangen min
        </button>
      </section>
    </AppShell>
  );
}
