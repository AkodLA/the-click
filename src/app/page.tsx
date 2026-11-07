"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LEVELS, LEVEL_TEXT, MEETUPS, SCENARIOS } from "@/lib/content";
import { nextCefr, useProgress, xpLevel } from "@/lib/progress";

export default function Home() {
  const p = useProgress();
  const router = useRouter();

  // First visit: send the learner to the level test. Wait a tick so stored progress has loaded.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!p.level) router.replace("/start");
    }, 50);
    return () => clearTimeout(t);
  }, [p.level, router]);

  if (!p.level) return null;

  const lv = xpLevel(p.xp);
  const fromTolk = p.deck.filter((c) => c.source === "tolk");
  const todo = fromTolk.filter((c) => !c.practiced);
  const scenario = SCENARIOS.find((s) => LEVELS.indexOf(s.level) <= LEVELS.indexOf(p.level!)) ?? SCENARIOS[0];
  const meetup = MEETUPS[0];

  return (
    <AppShell>
      <section className="mt-2">
        <p className="text-ink-soft">Hei, {p.nick}</p>
        <h1 className="mt-1 text-4xl font-extrabold leading-tight">Hva vil du klare i dag?</h1>
      </section>

      {/* The core loop: what you needed an interpreter for becomes today's lesson */}
      <section className="mt-6 rounded-3xl bg-gran p-5 text-white">
        <p className="font-bold text-gran-soft">Fra tolk til egen stemme</p>
        {todo.length > 0 ? (
          <>
            <p className="mt-2 text-2xl font-bold leading-snug">
              {todo.length} {todo.length === 1 ? "setning" : "setninger"} fra møtet ditt venter.
            </p>
            <p className="mt-1 text-gran-soft">Neste gang sier du dem selv.</p>
            <ul className="mt-4 space-y-2">
              {todo.slice(0, 3).map((c) => (
                <li key={c.id} className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="font-bold">{c.no}</p>
                  {c.home && (
                    <p dir="auto" className="text-sm text-gran-soft">
                      {c.home}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/snakk?ov=tolk" className="mt-4 block rounded-2xl bg-sol py-3 text-center font-bold text-ink">
              Øv på dem høyt
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-2xl font-bold leading-snug">Har du et viktig møte snart?</p>
            <p className="mt-1 text-gran-soft">
              Bruk tolken i stedet for barna. Etterpå blir det du trengte hjelp med til leksjonene dine.
            </p>
            <Link href="/tolk" className="mt-4 block rounded-2xl bg-sol py-3 text-center font-bold text-ink">
              Åpne tolken
            </Link>
          </>
        )}
      </section>

      <Link href={`/snakk?s=${scenario.id}`} className="mt-4 flex items-center gap-4 rounded-3xl bg-sheet p-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-frost text-3xl">{scenario.icon}</span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-ink-soft">Dagens samtale</span>
          <span className="block text-lg font-bold">{scenario.title}</span>
          <span className="block text-sm text-ink-soft">{scenario.goal}</span>
        </span>
        <span className="text-2xl" aria-hidden>
          🎙
        </span>
      </Link>

      <section className="mt-4 rounded-3xl bg-sheet p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-bold">Nivå {lv.n}</p>
          <p className="text-sm text-ink-soft">
            {lv.into} / {lv.per} XP
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-frost">
          <div className="h-full rounded-full bg-sol" style={{ width: `${(lv.into / lv.per) * 100}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          Du er på {p.level}: {LEVEL_TEXT[p.level].toLowerCase()} Neste mål er {nextCefr(p.level)}.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Mer å gjøre</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Tile href="/slang" icon="🎚" title="Slang-sjekk" sub="Når passer det?" />
          <Tile href="/skriv" icon="✍️" title="Skriv" sub="Æ, ø og å for hånd" />
          <Tile href="/tandem" icon="🔁" title="Tandem" sub="Bytt språk anonymt" />
          <Tile href="/konkurranse" icon="🏆" title="Ukesliga" sub={`${p.level}-ligaen`} />
        </div>
      </section>

      <Link href="/kafe" className="mt-4 block rounded-3xl border-2 border-dashed border-line p-5">
        <p className="text-sm font-bold text-ink-soft">I nærheten denne uka</p>
        <p className="mt-1 text-lg font-bold">
          ☕ {meetup.name}, {meetup.host}
        </p>
        <p className="text-ink-soft">
          {meetup.when}. Sjekk inn for +{meetup.xp} XP.
        </p>
      </Link>
    </AppShell>
  );
}

function Tile({ href, icon, title, sub }: { href: string; icon: string; title: string; sub: string }) {
  return (
    <Link href={href} className="rounded-3xl bg-sheet p-4">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-2 font-bold">{title}</p>
      <p className="text-sm text-ink-soft">{sub}</p>
    </Link>
  );
}
