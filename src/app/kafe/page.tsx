"use client";
import { AppShell } from "@/components/AppShell";
import { MEETUPS } from "@/lib/content";
import { addXp, unlock, update, useProgress } from "@/lib/progress";

export default function KafePage() {
  const p = useProgress();

  function checkIn(id: string, xp: number, name: string) {
    if (p.checkins.includes(id)) return;
    update((s) => ({ ...s, checkins: [...s.checkins, id] }));
    addXp(xp, name);
    unlock("kafe", "Kaffe og kasus");
  }

  return (
    <AppShell title="Språkkafé" back="/">
      <p className="text-ink-soft">
        Ekte folk, ekte prat. Prat-agenten sjekker bibliotek og frivillige hver morgen og legger nye treff her.
      </p>

      <div className="mt-4 rounded-3xl bg-sol-soft p-4">
        <p className="font-bold">Jo mer du møter opp, jo mer får du</p>
        <p className="text-sm">
          1. treff +150 XP · 3 treff gir merke · 5 treff gir en gratis kaffe hos partnerkafé
        </p>
        <div className="mt-3 flex gap-1" aria-label={`${p.checkins.length} av 5 treff`}>
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-3 flex-1 rounded-full ${n < p.checkins.length ? "bg-sol" : "bg-white"}`} />
          ))}
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {MEETUPS.map((m) => {
          const done = p.checkins.includes(m.id);
          return (
            <li key={m.id} className="rounded-3xl bg-sheet p-5">
              <p className="text-sm font-bold text-ink-soft">{m.when}</p>
              <p className="display mt-1 text-xl font-bold">
                {m.name}, {m.host}
              </p>
              <p className="text-ink-soft">
                {m.where} · nivå {m.levels}
              </p>
              <button
                onClick={() => checkIn(m.id, m.xp, m.host)}
                disabled={done}
                className={`mt-4 w-full rounded-2xl py-3 font-bold ${done ? "bg-gran-soft text-gran-deep" : "bg-gran text-white"}`}
              >
                {done ? "Sjekket inn ✓" : `Jeg er her (+${m.xp} XP)`}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-ink-soft">
        Eksempeldata i demoen. I appen bekreftes innsjekk med en QR-kode hos arrangøren.
      </p>
    </AppShell>
  );
}
